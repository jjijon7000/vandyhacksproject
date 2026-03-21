"use client";

import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { sendIncidentChat } from "@/lib/api";

export type ChatBotProps = {
  incidentSummary: {
    threat: string;
    severity: string;
    confidence: number;
    explanation: string;
  };
  anomaly: Record<string, any>;
  historicalContext?: Array<{
    incident_id: string;
    attack_type: string;
    resolution: string;
  }>;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: number;
};

const WELCOME_MESSAGE = "Need help understanding this alert? Ask me anything about the attack, severity, or recommended actions.";

export default function IncidentChatbot({ 
  incidentSummary, 
  anomaly, 
  historicalContext = [] 
}: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: WELCOME_MESSAGE,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare payload for backend
      const payload = {
        incident_summary: incidentSummary,
        anomaly,
        historical_context: historicalContext,
        chat_history: messages
          .filter((m) => m.role !== "assistant" || m.id !== "welcome")
          .slice(-6) // Keep last 6 messages for context
          .map((m) => ({
            role: m.role,
            message: m.text,
          })),
        user_message: input,
      };

      // Call backend
      const response = await sendIncidentChat(payload);

      // Add assistant response
      const assistantMsg: Message = {
        id: `assist-${Date.now()}`,
        role: "assistant",
        text: response.answer,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      // Add error message
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        text: `Sorry, I encountered an error. Please try again. ${error instanceof Error ? error.message : ""}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 text-white cursor-pointer transition-all duration-300 hover:bg-indigo-500 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/50 active:scale-95"
            title="Open SentinelAI Chat"
          >
            <MessageCircle size={24} />
            <span className="absolute inset-0 rounded-full bg-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse" />
          </button>
        )}

        {/* Chat Panel */}
        {isOpen && (
          <div className="fixed bottom-6 right-6 w-96 max-h-96 rounded-xl shadow-2xl shadow-zinc-950/80 border border-zinc-700 bg-zinc-900/95 backdrop-blur-sm flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle size={18} className="text-white" />
                <span className="text-sm font-semibold text-white">SentinelAI Assistant</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-0.5 hover:bg-indigo-500 rounded transition-colors duration-200"
                title="Close chat"
              >
                <X size={18} className="text-white" />
              </button>
            </div>

            {/* Messages Container */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-zinc-900/50"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} gap-1`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-zinc-800 text-zinc-100 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-xs text-zinc-600 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-1 text-zinc-600">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-2 h-2 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form
              onSubmit={handleSend}
              className="bg-zinc-800/50 border-t border-zinc-700 px-3 py-2 flex gap-2 flex-shrink-0"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isLoading}
                className="flex-1 bg-zinc-700 text-zinc-100 text-xs px-3 py-2 rounded border border-zinc-600 focus:border-indigo-500 focus:outline-none transition-colors duration-200 disabled:opacity-50 placeholder-zinc-500"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 bg-indigo-600 text-white rounded transition-all duration-200 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
