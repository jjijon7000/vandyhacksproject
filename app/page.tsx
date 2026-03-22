"use client";

import { useRouter } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import BorderGlow from "@/components/BorderGlow";
import Plasma from "@/components/Plasma";
import Image from "next/image";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

const features = [
  {
    title: "Real-time Detection",
    desc: "Ingest and analyze auth, network, and API logs from Snowflake with zero latency.",
    icon: "❄️",
    glowColor: "10 50 80",
    colors: ["#38bdf8", "#0ea5e9"],
  },
  {
    title: "AI Incident Analysis",
    desc: "Gemini reads anomalies and generates human-readable root cause explanations instantly.",
    icon: "🤖",
    glowColor: "30 20 80",
    colors: ["#818cf8", "#6366f1"],
  },
  {
    title: "Context Memory",
    desc: "Cross-references live threats against historical attack patterns via MongoDB.",
    icon: "🧠",
    glowColor: "10 60 30",
    colors: ["#4ade80", "#22c55e"],
  },
  {
    title: "Autonomous Response",
    desc: "Execute runbooks and containment actions directly from the dashboard.",
    icon: "⚡",
    glowColor: "70 60 10",
    colors: ["#facc15", "#f59e0b"],
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className={`relative min-h-screen text-zinc-100 ${geist.className}`}>
      {/* Background */}
      <div className="fixed inset-0 z-0 bg-black">
        <Plasma color="#ffffff" speed={0.4} direction="forward" scale={1.2} opacity={1} mouseInteractive={true} />
      </div>
      <div className="fixed inset-0 z-[1] bg-zinc-950/60" />

      <main className="relative z-10 max-w-5xl mx-auto px-4 flex flex-col gap-28 items-center pb-24">

        {/* Hero */}
        <section className="flex flex-col items-center text-center gap-8 max-w-3xl pt-28">



          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-indigo-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Powered by Gemini · Snowflake · MongoDB
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-3">
            <h1 className="text-6xl sm:text-7xl font-bold tracking-tight leading-[1.05] text-zinc-50">
              Sentinel AI
            </h1>
            <p className="text-xl sm:text-2xl font-light text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
              The autonomous SOC platform
            </p>
          </div>

          {/* Description */}
          <p className="text-base text-zinc-500 leading-relaxed max-w-xl">
            Unify your security data and power it with advanced AI reasoning. Instantly triage threats, understand root causes, and execute responses — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap justify-center mt-2">
            <button
              onClick={() => router.push("/login")}
              className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all duration-150 active:scale-95 cursor-pointer shadow-xl shadow-indigo-900/30 text-sm hover:-translate-y-px"
            >
              Get started free
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-8 py-3 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 font-medium transition-all duration-150 active:scale-95 cursor-pointer text-sm"
            >
              Sign in
            </button>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="w-full flex flex-col gap-4">
          <p className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest text-center mb-2">
            Platform Capabilities
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.01]">
                <BorderGlow
                  borderRadius={16}
                  glowRadius={45}
                  glowIntensity={0.75}
                  edgeSensitivity={35}
                  glowColor={f.glowColor}
                  backgroundColor="#09090b"
                  coneSpread={25}
                  animated={false}
                  colors={f.colors}
                >
                  <div className="p-6 flex flex-col gap-3">
                    <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg">
                      {f.icon}
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-100">{f.title}</h3>
                    <p className="text-xs text-zinc-500 leading-5">{f.desc}</p>
                  </div>
                </BorderGlow>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="w-full max-w-2xl flex flex-col items-center gap-6 pt-8 border-t border-zinc-800/60">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold text-zinc-50">Ready to secure your network?</h2>
            <p className="text-sm text-zinc-600">Join your team on Sentinel AI and start triaging threats in minutes.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold transition-all duration-150 active:scale-95 cursor-pointer text-sm hover:-translate-y-px"
            >
              Create your account
            </button>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-2.5 rounded-xl border border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 font-medium transition-all duration-150 active:scale-95 cursor-pointer text-sm"
            >
              Sign in instead
            </button>
          </div>
          <p className={`text-[10px] text-zinc-700 mt-6 ${geistMono.className}`}>
            AI · Gemini · Snowflake · MongoDB · FastAPI
          </p>
        </section>

      </main>
    </div>
  );
}
