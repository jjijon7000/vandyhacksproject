"use client";

import { useState } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import BorderGlow from "@/components/BorderGlow";
import CountUp from "@/components/CountUp";
import Plasma from "@/components/Plasma";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

const alerts = [
  {
    id: 1,
    severity: "critical",
    title: "Brute Force Detected",
    source: "auth_logs",
    ip: "192.168.4.21",
    time: "2 min ago",
    risk: 94,
    aiExplanation:
      "17 failed SSH login attempts from a single IP within 60 seconds. Pattern matches known credential-stuffing campaign. Previous incident logged in MongoDB (2024-11-12).",
    rootCause: "Automated credential stuffing via leaked password list.",
    recommendation: "Block IP, enforce MFA, alert SOC analyst.",
    status: "open",
  },
  {
    id: 2,
    severity: "high",
    title: "Unusual API Exfiltration",
    source: "api_logs",
    ip: "10.0.0.88",
    time: "11 min ago",
    risk: 77,
    aiExplanation:
      "API endpoint /export/data called 312 times in 3 minutes by a low-privilege service account. Snowflake time-series analysis shows 40× spike above baseline.",
    rootCause: "Possible insider threat or compromised service account token.",
    recommendation: "Revoke token, audit recent exports, notify data team.",
    status: "open",
  },
  {
    id: 3,
    severity: "medium",
    title: "Lateral Movement Attempt",
    source: "network_logs",
    ip: "10.0.1.14",
    time: "34 min ago",
    risk: 55,
    aiExplanation:
      "Internal host scanned 48 ports across the subnet within 5 minutes. Gemini cross-referenced MongoDB — similar pattern observed in Q3 2024 ransomware precursor event.",
    rootCause: "Potentially compromised internal workstation performing recon.",
    recommendation: "Isolate host, run EDR scan, escalate to IR team.",
    status: "investigating",
  },
  {
    id: 4,
    severity: "low",
    title: "Off-Hours Login",
    source: "auth_logs",
    ip: "203.0.113.5",
    time: "1 hr ago",
    risk: 28,
    aiExplanation:
      "Admin account logged in at 02:14 AM from an unrecognized geographic location (Eastern Europe). No prior incidents for this user.",
    rootCause: "Anomalous login time and location for this user profile.",
    recommendation: "Verify with user, consider geo-blocking policy.",
    status: "resolved",
  },
];

const severityConfig: Record<string, { badge: string; glowColor: string; colors: string[] }> = {
  critical: {
    badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
    glowColor: "80 20 20",
    colors: ["#f87171", "#ef4444", "#dc2626"],
  },
  high: {
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    glowColor: "80 45 10",
    colors: ["#fb923c", "#f97316", "#ea580c"],
  },
  medium: {
    badge: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    glowColor: "70 60 10",
    colors: ["#facc15", "#eab308", "#ca8a04"],
  },
  low: {
    badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    glowColor: "10 60 30",
    colors: ["#4ade80", "#22c55e", "#16a34a"],
  },
};

const statusBadge: Record<string, string> = {
  open: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  investigating: "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  resolved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

function RiskBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-red-500" : score >= 60 ? "bg-orange-400" : score >= 40 ? "bg-yellow-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-2 rounded-full ${color} transition-all duration-300`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-zinc-400">{score}</span>
    </div>
  );
}

function AlertCard({ alert }: { alert: (typeof alerts)[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [actioned, setActioned] = useState(false);
  const cfg = severityConfig[alert.severity];

  return (
    <div className="transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.01]">
      <BorderGlow
        edgeSensitivity={40}
        glowColor={cfg.glowColor}
        backgroundColor="#09090b"
        borderRadius={16}
        glowRadius={50}
        glowIntensity={0.9}
        coneSpread={30}
        animated={false}
        colors={cfg.colors}
      >
        <div className="p-5 flex flex-col gap-3">

          {/* Clickable top section only */}
          <div
            className="flex flex-col gap-3 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>
                    {alert.severity}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge[alert.status]}`}>
                    {alert.status}
                  </span>
                  <span className="text-xs text-zinc-500">{alert.time}</span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">{alert.title}</h3>
                <p className={`text-xs text-zinc-500 ${geistMono.className}`}>
                  {alert.source} · {alert.ip}
                </p>
              </div>
              <RiskBar score={alert.risk} />
            </div>

            <span className="text-xs text-indigo-400 font-medium self-start">
              {expanded ? "▲ Hide AI Analysis" : "▼ Click to View AI Analysis"}
            </span>
          </div>

          {/* Expanded panel — no cursor-pointer, stops propagation */}
          {expanded && (
            <div className="bg-zinc-900/70 rounded-xl p-4 flex flex-col gap-3 text-xs text-zinc-300 border border-zinc-800 animate-in fade-in slide-in-from-top-1 duration-200 cursor-default">
              <div>
                <span className="font-semibold text-indigo-400 tracking-wide">🤖 Gemini Explanation</span>
                <p className="mt-1.5 leading-5 text-zinc-400">{alert.aiExplanation}</p>
              </div>
              <div className="border-t border-zinc-800 pt-3">
                <span className="font-semibold text-orange-400 tracking-wide">🔍 Root Cause</span>
                <p className="mt-1.5 text-zinc-400">{alert.rootCause}</p>
              </div>
              <div className="border-t border-zinc-800 pt-3">
                <span className="font-semibold text-emerald-400 tracking-wide">✅ Recommended Action</span>
                <p className="mt-1.5 text-zinc-400">{alert.recommendation}</p>
              </div>
              <div className="flex gap-2 mt-1 flex-wrap border-t border-zinc-800 pt-3">
                <button
                  onClick={() => setActioned(true)}
                  disabled={actioned}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 ${
                    actioned
                      ? "bg-emerald-900/40 text-emerald-400 cursor-default"
                      : "bg-indigo-600 text-white hover:bg-indigo-500 hover:-translate-y-px hover:shadow-lg hover:shadow-indigo-900/40 cursor-pointer"
                  }`}
                >
                  {actioned ? "✓ Response Executed" : "⚡ Execute Response"}
                </button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:-translate-y-px transition-all duration-150 active:scale-95 cursor-pointer">
                  📋 Assign to Analyst
                </button>
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 hover:-translate-y-px transition-all duration-150 active:scale-95 cursor-pointer">
                  🔕 Suppress
                </button>
              </div>
            </div>
          )}
        </div>
      </BorderGlow>
    </div>
  );
}



const stats = [
  { label: "Active Threats", to: 3, suffix: "", sub: "2 critical", color: "text-red-400", glowColor: "80 20 20", colors: ["#f87171", "#ef4444"] },
  { label: "Incidents Today", to: 14, suffix: "", sub: "+3 vs yesterday", color: "text-orange-400", glowColor: "80 45 10", colors: ["#fb923c", "#f97316"] },
  { label: "AI Decisions", to: 38, suffix: "", sub: "Last 24 hrs", color: "text-indigo-400", glowColor: "30 20 80", colors: ["#818cf8", "#6366f1"] },
  { label: "Avg Response Time", to: 1.4, suffix: "s", sub: "Gemini + FastAPI", color: "text-emerald-400", glowColor: "10 60 30", colors: ["#4ade80", "#22c55e"] },
];

const archComponents = [
  {
    icon: "❄️",
    name: "Snowflake",
    role: "Data Brain",
    desc: "Stores auth, network & API logs. Runs SQL anomaly detection and time-series analysis.",
    tag: "What is happening right now?",
    glowColor: "10 50 80",
    colors: ["#38bdf8", "#0ea5e9", "#0284c7"],
  },
  {
    icon: "🤖",
    name: "Gemini API",
    role: "Reasoning Engine",
    desc: "Analyzes logs + MongoDB context to produce threat explanations, root cause & recommended actions.",
    tag: "What does this mean?",
    glowColor: "30 20 80",
    colors: ["#818cf8", "#6366f1", "#c084fc"],
  },
  {
    icon: "🗂️",
    name: "MongoDB",
    role: "Memory Layer",
    desc: "Stores past incidents, known attack patterns, and previous AI decisions for context-aware reasoning.",
    tag: "Have we seen this before?",
    glowColor: "10 60 30",
    colors: ["#4ade80", "#22c55e", "#34d399"],
  },
  {
    icon: "⚙️",
    name: "FastAPI",
    role: "Control Layer",
    desc: "Python backend orchestrating Snowflake queries, Gemini calls, and MongoDB reads/writes.",
    tag: "Orchestration hub",
    glowColor: "70 60 10",
    colors: ["#facc15", "#fbbf24", "#f59e0b"],
  },
];

export default function Home() {
  const [filter, setFilter] = useState("all");

  const filtered =
    filter === "all" ? alerts : alerts.filter((a) => a.severity === filter || a.status === filter);

  return (
    <div className={`relative min-h-screen text-zinc-100 ${geist.className}`}>

      {/* Plasma background */}
      <div className="fixed inset-0 z-0 bg-black">
        <Plasma
          color="#ffffff"
          speed={0.4}
          direction="forward"
          scale={1.2}
          opacity={1}
          mouseInteractive={true}
        />
      </div>

      {/* Dark overlay */}
      <div className="fixed inset-0 z-[1] bg-zinc-950/50" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-zinc-950/60 backdrop-blur-md border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 group">
          <span className="text-xl transition-transform duration-300 group-hover:rotate-12">🛡️</span>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-zinc-50">Autonomous AI SOC Agent</h1>
            <p className="text-xs text-zinc-500 font-light">Powered by Gemini · Snowflake · MongoDB</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          System Live
        </span>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 flex flex-col gap-10">

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.03]"
            >
              <BorderGlow
                edgeSensitivity={35}
                glowColor={s.glowColor}
                backgroundColor="#09090b"
                borderRadius={16}
                glowRadius={45}
                glowIntensity={0.85}
                coneSpread={28}
                animated={false}
                colors={s.colors}
              >
                <div className="p-5 flex flex-col gap-1">
                  <span className={`text-3xl font-bold tracking-tight ${s.color}`}>
                    <CountUp
                      from={0}
                      to={s.to}
                      separator=","
                      direction="up"
                      duration={1.5}
                      startCounting={true}
                    />
                    {s.suffix}
                  </span>
                  <span className="text-xs font-medium text-zinc-300">{s.label}</span>
                  <span className="text-xs text-zinc-600">{s.sub}</span>
                </div>
              </BorderGlow>
            </div>
          ))}
        </div>

        {/* Architecture */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            System Architecture
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {archComponents.map((c) => (
              <div
                key={c.name}
                className="transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02]"
              >
                <BorderGlow
                  edgeSensitivity={40}
                  glowColor={c.glowColor}
                  backgroundColor="#09090b"
                  borderRadius={16}
                  glowRadius={55}
                  glowIntensity={0.8}
                  coneSpread={30}
                  animated={false}
                  colors={c.colors}
                >
                  <div className="p-5 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base transition-transform duration-300 hover:scale-125">{c.icon}</span>
                      <span className="font-semibold text-sm text-zinc-100 tracking-tight">{c.name}</span>
                      <span className="text-xs text-zinc-600 ml-auto font-light">— {c.role}</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-5">{c.desc}</p>
                    <span className={`text-xs text-zinc-600 mt-0.5 ${geistMono.className}`}>// {c.tag}</span>
                  </div>
                </BorderGlow>
              </div>
            ))}
          </div>
        </section>

        {/* Alerts */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
              Live Threat Alerts
            </h2>
            <div className="flex gap-2 flex-wrap">
              {["all", "critical", "high", "medium", "low", "open", "resolved"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all duration-150 border active:scale-95 ${
                    filter === f
                      ? "bg-indigo-600 text-white border-indigo-600 scale-105"
                      : "border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 hover:-translate-y-px"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {filtered.length > 0 ? (
              filtered.map((alert) => <AlertCard key={alert.id} alert={alert} />)
            ) : (
              <p className="text-sm text-zinc-600 text-center py-8">No alerts match this filter.</p>
            )}
          </div>
        </section>

        <p className={`text-center text-xs text-zinc-700 pb-4 ${geistMono.className}`}>
          AI analysis by Gemini · Data from Snowflake · Memory via MongoDB · Orchestrated by FastAPI
        </p>
      </main>
    </div>
  );
}
