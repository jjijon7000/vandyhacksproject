"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import BorderGlow from "@/components/BorderGlow";
import Plasma from "@/components/Plasma";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className={`relative min-h-screen text-zinc-100 ${geist.className}`}>
      <div className="fixed inset-0 z-0 bg-black">
        <Plasma color="#ffffff" speed={0.4} direction="forward" scale={1.2} opacity={1} mouseInteractive={true} />
      </div>
      <div className="fixed inset-0 z-[1] bg-zinc-950/50" />

      <main className="relative z-10 max-w-2xl mx-auto px-4 flex flex-col gap-8 items-center min-h-screen justify-center">

        {/* Back to landing */}
        <button
          onClick={() => router.push("/")}
          className="self-start flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
        >
          ← Back to home
        </button>

        {/* Branding — above the card */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-4xl font-bold text-zinc-50 tracking-tight">Sentinel AI</h1>
          <p className={`text-[10px] text-zinc-600 ${geistMono.className}`}>// secure access portal</p>
        </div>

        {/* Card */}
        <BorderGlow
          borderRadius={24}
          glowRadius={60}
          glowIntensity={0.9}
          edgeSensitivity={40}
          glowColor="30 20 80"
          backgroundColor="#09090b"
          coneSpread={30}
          animated={false}
          colors={["#818cf8", "#6366f1", "#c084fc"]}
          className="w-full"
        >
          <form onSubmit={handleSubmit} className="p-10 flex flex-col gap-6">

            {/* Form title */}
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-zinc-50">
                {mode === "login" ? "Analyst Sign In" : "Analyst Sign Up"}
              </h2>
              <p className={`text-[10px] text-zinc-600 ${geistMono.className}`}>
                {mode === "login"
                  ? "// enter your credentials to access the dashboard"
                  : "// create an account to get started"}
              </p>
            </div>

            <div className="border-t border-zinc-800" />

            {/* Fields */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.com"
                  className={`bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-600 transition-colors w-full ${geistMono.className}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={`bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-indigo-600 transition-colors w-full ${geistMono.className}`}
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-base font-semibold py-2.5 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer hover:-translate-y-px mt-1"
              >
                {loading ? "Please wait..." : mode === "login" ? "⚡ Sign In" : "⚡ Create Account"}
              </button>

              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="w-full text-sm px-3 py-2 rounded-lg border border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all duration-150 active:scale-95 cursor-pointer"
              >
                {mode === "login" ? "Create an account" : "Back to sign in"}
              </button>
            </div>

            <p className={`text-center text-[10px] text-zinc-700 ${geistMono.className}`}>
              AI · Gemini · Snowflake · MongoDB · FastAPI
            </p>

          </form>
        </BorderGlow>
      </main>
    </div>
  );
}
