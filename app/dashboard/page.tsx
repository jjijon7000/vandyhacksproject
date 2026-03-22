"use client";

import { useState, useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import BorderGlow from "@/components/BorderGlow";
import CountUp from "@/components/CountUp";
import Plasma from "@/components/Plasma";
import IncidentChatbot from "@/components/IncidentChatbot";
import { analyzeIncident, getIncidents, getSnowflakeAlerts, type MongoIncident } from "@/lib/api";
import { supabase } from "@/lib/supabase";


const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

type Alert = {
  id: string | number;
  severity: string;
  title: string;
  source: string;
  ip: string;
  time: string;
  risk: number;
  aiExplanation: string;
  rootCause: string;
  recommendation: string;
  status: string;
};

function formatTitle(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function relativeTime(ts: string) {
  if (!ts) return "just now";
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function riskFromSeverity(severity: string, attempts: number) {
  const base: Record<string, number> = { critical: 90, high: 70, medium: 50, low: 25 };
  return Math.min((base[severity] ?? 50) + Math.min(attempts, 10), 100);
}

function mongoToAlert(doc: MongoIncident): Alert {
  return {
    id: doc._id,
    severity: doc.severity || "medium",
    title: formatTitle(doc.attack_type || "Unknown Incident"),
    source: doc.source || "unknown",
    ip: doc.ip || "—",
    time: relativeTime(doc.timestamp),
    risk: riskFromSeverity(doc.severity, doc.failed_attempts || 0),
    aiExplanation: doc.ai_explanation || "No AI explanation available yet.",
    rootCause: doc.root_cause || "Pending analysis.",
    recommendation: doc.recommended_action || "Review incident manually.",
    status: doc.status || "open",
  };
}

const fallbackAlerts: Alert[] = [
  { id: 1, severity: "critical", title: "Brute Force Detected", source: "auth_logs", ip: "192.168.4.21", time: "2 min ago", risk: 94, aiExplanation: "17 failed SSH login attempts from a single IP within 60 seconds.", rootCause: "Automated credential stuffing via leaked password list.", recommendation: "Block IP, enforce MFA, alert SOC analyst.", status: "open" },
  { id: 2, severity: "high", title: "Unusual API Exfiltration", source: "api_logs", ip: "10.0.0.88", time: "11 min ago", risk: 77, aiExplanation: "API endpoint /export/data called 312 times in 3 minutes.", rootCause: "Possible insider threat or compromised service account token.", recommendation: "Revoke token, audit recent exports, notify data team.", status: "open" },
  { id: 3, severity: "medium", title: "Lateral Movement Attempt", source: "network_logs", ip: "10.0.1.14", time: "34 min ago", risk: 55, aiExplanation: "Internal host scanned 48 ports across the subnet within 5 minutes.", rootCause: "Potentially compromised internal workstation performing recon.", recommendation: "Isolate host, run EDR scan, escalate to IR team.", status: "investigating" },
  { id: 4, severity: "low", title: "Off-Hours Login", source: "auth_logs", ip: "203.0.113.5", time: "1 hr ago", risk: 28, aiExplanation: "Admin account logged in at 02:14 AM from Eastern Europe.", rootCause: "Anomalous login time and location for this user profile.", recommendation: "Verify with user, consider geo-blocking policy.", status: "resolved" },
];

const severityConfig: Record<string, { badge: string; glowColor: string; colors: string[] }> = {
  critical: { badge: "bg-red-900/40 text-red-400", glowColor: "80 20 20", colors: ["#f87171", "#ef4444", "#dc2626"] },
  high:     { badge: "bg-orange-900/40 text-orange-400", glowColor: "80 45 10", colors: ["#fb923c", "#f97316", "#ea580c"] },
  medium:   { badge: "bg-yellow-900/40 text-yellow-400", glowColor: "70 60 10", colors: ["#facc15", "#eab308", "#ca8a04"] },
  low:      { badge: "bg-green-900/40 text-green-400", glowColor: "10 60 30", colors: ["#4ade80", "#22c55e", "#16a34a"] },
};

const statusBadge: Record<string, string> = {
  open:          "bg-red-900/30 text-red-400",
  investigating: "bg-yellow-900/30 text-yellow-400",
  resolved:      "bg-emerald-900/30 text-emerald-400",
};

function RiskBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-red-500" : score >= 60 ? "bg-orange-400" : score >= 40 ? "bg-yellow-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-zinc-500 w-6 text-right">{score}</span>
    </div>
  );
}

function AlertCard({ alert, onSelect }: { alert: Alert; onSelect?: (a: Alert) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [actioned, setActioned] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const cfg = severityConfig[alert.severity] ?? severityConfig.medium;

  const explanation = loadingAI
    ? null
    : aiResult?.explanation ?? alert.aiExplanation;
  const rootCause = loadingAI
    ? null
    : aiResult?.root_cause ?? alert.rootCause;
  const recommendation = loadingAI
    ? null
    : Array.isArray(aiResult?.recommended_action)
      ? aiResult.recommended_action.join("; ")
      : aiResult?.recommended_action ?? alert.recommendation;

  return (
    <div className="transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.005]">
      <BorderGlow
        edgeSensitivity={40} glowColor={cfg.glowColor} backgroundColor="#09090b"
        borderRadius={14} glowRadius={50} glowIntensity={0.85} coneSpread={30}
        animated={false} colors={cfg.colors}
      >
        <div className="p-5 flex flex-col gap-3">

          {/* Clickable header */}
          <div
            className="flex items-start justify-between gap-4 cursor-pointer"
            onClick={async () => {
              const opening = !expanded;
              setExpanded(opening);
              if (opening) {
                onSelect?.(alert);
                if (!aiResult && !loadingAI) {
                  setLoadingAI(true);
                  setAiError(null);
                  try {
                    const res = await analyzeIncident({
                      logs: [{ source: alert.source, ip: alert.ip, message: alert.aiExplanation }],
                      anomaly: { title: alert.title, ip: alert.ip, attack_type: alert.title.toLowerCase().replace(/ /g, "_"), severity: alert.severity },
                    } as any);
                    setAiResult(res);
                  } catch (err: any) {
                    setAiError(err?.message || "AI analysis failed");
                  } finally {
                    setLoadingAI(false);
                  }
                }
              }
            }}
          >
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.badge}`}>{alert.severity}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge[alert.status] ?? statusBadge.open}`}>{alert.status}</span>
                <span className="text-[10px] text-zinc-600">{alert.time}</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-100">{alert.title}</h3>
              <p className={`text-[11px] text-zinc-600 ${geistMono.className}`}>{alert.source} · {alert.ip}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <RiskBar score={alert.risk} />
              <span className="text-[10px] text-indigo-500 font-medium">
                {expanded ? "▲ hide" : "▼ analyze"}
              </span>
            </div>
          </div>

          {/* Expanded panel */}
          {expanded && (
            <div className="rounded-xl border border-zinc-800/80 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 cursor-default">

              {/* Loading skeleton */}
              {loadingAI && (
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs text-indigo-400 animate-pulse">
                    <span>🤖</span>
                    <span>Gemini is analyzing this incident...</span>
                  </div>
                  {[80, 60, 72].map((w, i) => (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="h-2 bg-zinc-800 rounded animate-pulse" style={{ width: `${w}%` }} />
                      <div className="h-2 bg-zinc-800/60 rounded animate-pulse" style={{ width: `${w - 15}%` }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {!loadingAI && aiError && (
                <div className="p-4 text-xs text-red-400">{aiError}</div>
              )}

              {/* Results */}
              {!loadingAI && !aiError && (
                <div className="divide-y divide-zinc-800/80">
                  <div className="p-4">
                    <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider mb-1.5">🤖 Gemini Explanation</p>
                    <p className="text-xs text-zinc-400 leading-5">{explanation}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-1.5">🔍 Root Cause</p>
                    <p className="text-xs text-zinc-400">{rootCause}</p>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1.5">✅ Recommended Action</p>
                    <p className="text-xs text-zinc-400">{recommendation}</p>
                  </div>
                  {aiResult?.occurrence_count > 1 && (
                    <div className="p-4 bg-red-950/20">
                      <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1.5">⚠️ Repeated Attack — {aiResult.occurrence_count}x</p>
                      <p className="text-xs text-zinc-400">{aiResult.memory_summary}</p>
                    </div>
                  )}
                  <div className="p-3 flex gap-2 flex-wrap bg-zinc-900/40">
                    <button
                      onClick={() => setActioned(true)}
                      disabled={actioned}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 active:scale-95 ${
                        actioned
                          ? "bg-emerald-900/40 text-emerald-400 cursor-default"
                          : "bg-indigo-600 text-white hover:bg-indigo-500 hover:-translate-y-px cursor-pointer"
                      }`}
                    >
                      {actioned ? "✓ Executed" : "⚡ Execute Response"}
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all duration-150 active:scale-95 cursor-pointer">
                      📋 Assign
                    </button>
                    <button className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all duration-150 active:scale-95 cursor-pointer">
                      🔕 Suppress
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </BorderGlow>
    </div>
  );
}

const statsConfig = [
  { label: "Active Threats",  suffix: "", sub: "open incidents",         color: "text-red-400",    glowColor: "80 20 20", colors: ["#f87171", "#ef4444"] },
  { label: "Critical Alerts", suffix: "", sub: "needs immediate action", color: "text-orange-400", glowColor: "80 45 10", colors: ["#fb923c", "#f97316"] },
  { label: "Total Alerts",    suffix: "", sub: "from Snowflake",         color: "text-indigo-400", glowColor: "30 20 80", colors: ["#818cf8", "#6366f1"] },
  { label: "Avg Risk Score",  suffix: "", sub: "across all alerts",      color: "text-emerald-400",glowColor: "10 60 30", colors: ["#4ade80", "#22c55e"] },
];

const archComponents = [
  { name: "Snowflake", role: "Data Brain",      desc: "Stores auth, network & API logs. Runs SQL anomaly detection and time-series analysis.", tag: "What is happening right now?", glowColor: "10 50 80", colors: ["#38bdf8", "#0ea5e9", "#0284c7"] },
  { name: "Gemini API", role: "Reasoning Engine", desc: "Analyzes logs + MongoDB context to produce threat explanations, root cause & recommended actions.", tag: "What does this mean?", glowColor: "30 20 80", colors: ["#818cf8", "#6366f1", "#c084fc"] },
  { name: "MongoDB",   role: "Memory Layer",    desc: "Stores past incidents, known attack patterns, and previous AI decisions for context-aware reasoning.", tag: "Have we seen this before?", glowColor: "10 60 30", colors: ["#4ade80", "#22c55e", "#34d399"] },
  { name: "FastAPI",   role: "Control Layer",   desc: "Python backend orchestrating Snowflake queries, Gemini calls, and MongoDB reads/writes.", tag: "Orchestration hub", glowColor: "70 60 10", colors: ["#facc15", "#fbbf24", "#f59e0b"] },
];

export default function Home() {
  const [filter, setFilter] = useState("all");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dataSource, setDataSource] = useState<"loading" | "mongo" | "snowflake" | "fallback">("loading");
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await getSnowflakeAlerts(20);
        if (!cancelled && rows?.length) {
          setAlerts(rows.map((row: any) => ({
            id: row.ALERT_ID ?? row.alert_id ?? crypto.randomUUID(),
            severity: (row.SEVERITY || row.severity || "medium").toLowerCase(),
            title: formatTitle(row.ALERT_TYPE || row.alert_type || "Snowflake Alert"),
            source: "Snowflake",
            ip: row.SRC_IP || row.src_ip || "—",
            time: relativeTime(row.CREATED_AT || row.created_at),
            risk: riskFromSeverity((row.SEVERITY || row.severity || "medium").toLowerCase(), row.SUPPORTING_EVENT_COUNT || 0),
            aiExplanation: row.DESCRIPTION || row.description || "No explanation.",
            rootCause: row.DESCRIPTION || row.description || "See Snowflake.",
            recommendation: row.RECOMMENDED_ACTION || row.recommended_action || "Review alert.",
            status: (row.STATUS || row.status || "open").toLowerCase(),
          })));
          setDataSource("snowflake");
          return;
        }
      } catch {}
      try {
        const docs = await getIncidents(50);
        if (!cancelled && docs?.length) { setAlerts(docs.map(mongoToAlert)); setDataSource("mongo"); return; }
      } catch {}
      if (!cancelled) { setAlerts(fallbackAlerts); setDataSource("fallback"); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const liveStats = [
    { ...statsConfig[0], to: alerts.filter((a) => a.status === "open").length },
    { ...statsConfig[1], to: alerts.filter((a) => a.severity === "critical").length },
    { ...statsConfig[2], to: alerts.length },
    { ...statsConfig[3], to: alerts.length > 0 ? Math.round(alerts.reduce((s, a) => s + a.risk, 0) / alerts.length) : 0 },
  ];

  const filtered = (filter === "all" ? alerts : alerts.filter((a) => a.severity === filter || a.status === filter))
    .slice().sort((a, b) => b.risk - a.risk);

  return (
    <div className={`relative min-h-screen text-zinc-100 ${geist.className}`}>
      <div className="fixed inset-0 z-0 bg-black">
        <Plasma color="#ffffff" speed={0.4} direction="forward" scale={1.2} opacity={1} mouseInteractive={true} />
      </div>
      <div className="fixed inset-0 z-[1] bg-zinc-950/50" />

      <header className="sticky top-0 z-20 bg-zinc-950/60 backdrop-blur-md border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 group">
          <img src="/sentinelailogo.png" alt="SentinelAI Logo" className="w-8 h-8 rounded shadow-md bg-zinc-900 border border-zinc-800" />
          <div>
            <h1 className="text-sm font-semibold text-zinc-50">SentinelAI</h1>
            <p className="text-xs text-zinc-500 font-light">Powered by Gemini · Snowflake · MongoDB</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {dataSource === "snowflake" ? "Live — Snowflake" : dataSource === "mongo" ? "Live — MongoDB" : dataSource === "loading" ? "Connecting..." : "Demo Mode"}
          </span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="ml-4 text-xs px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-all cursor-pointer"
          >
            Sign Out
          </button>

        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 flex flex-col gap-10">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {liveStats.map((s) => (
            <div key={s.label} className="transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.03]">
              <BorderGlow edgeSensitivity={35} glowColor={s.glowColor} backgroundColor="#09090b" borderRadius={14} glowRadius={45} glowIntensity={0.85} coneSpread={28} animated={false} colors={s.colors}>
                <div className="p-5 flex flex-col gap-1">
                  <span className={`text-3xl font-bold tracking-tight ${s.color}`}>
                    <CountUp key={`${s.label}-${s.to}`} from={0} to={s.to} separator="," direction="up" duration={1.5} />
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
          <h2 className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-3">System Architecture</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {archComponents.map((c) => (
              <div key={c.name} className="transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02]">
                <BorderGlow edgeSensitivity={40} glowColor={c.glowColor} backgroundColor="#09090b" borderRadius={14} glowRadius={55} glowIntensity={0.8} coneSpread={30} animated={false} colors={c.colors}>
                  <div className="p-4 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-zinc-100">{c.name}</span>
                      <span className="text-[10px] text-zinc-600 ml-auto">— {c.role}</span>
                    </div>
                    <p className="text-xs text-zinc-500 leading-5">{c.desc}</p>
                    <span className={`text-[10px] text-zinc-700 ${geistMono.className}`}>// {c.tag}</span>
                  </div>
                </BorderGlow>
              </div>
            ))}
          </div>
        </section>

        {/* Alerts */}
        <section>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest">
              Live Threat Alerts
              {dataSource === "snowflake" && <span className="ml-2 text-sky-500 normal-case font-normal">(Snowflake)</span>}
              {dataSource === "mongo" && <span className="ml-2 text-emerald-500 normal-case font-normal">(MongoDB)</span>}
            </h2>
            <div className="flex gap-1.5 flex-wrap">
              {["all", "critical", "high", "medium", "low", "open", "resolved"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all duration-150 border active:scale-95 ${
                    filter === f
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-zinc-800 text-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {dataSource === "loading" ? (
              <p className="text-xs text-zinc-600 text-center py-8 animate-pulse">Connecting to data sources...</p>
            ) : filtered.length > 0 ? (
              filtered.map((alert) => <AlertCard key={alert.id} alert={alert} onSelect={setSelectedAlert} />)
            ) : (
              <p className="text-xs text-zinc-600 text-center py-8">No alerts match this filter.</p>
            )}
          </div>
        </section>

        <p className={`text-center text-[10px] text-zinc-700 pb-4 ${geistMono.className}`}>
          AI · Gemini · Snowflake · MongoDB · FastAPI
        </p>
      </main>

      <IncidentChatbot
        incidentSummary={selectedAlert ? {
          threat: selectedAlert.title,
          severity: selectedAlert.severity,
          confidence: selectedAlert.risk / 100,
          explanation: selectedAlert.aiExplanation
        } : {
          threat: "No alert selected",
          severity: "info",
          confidence: 0,
          explanation: "You can ask SentinelAI about any alert or general security questions."
        }}
        anomaly={selectedAlert ? {
          type: selectedAlert.title.toLowerCase().replace(/ /g, "_"),
          source_ip: selectedAlert.ip,
          severity: selectedAlert.severity
        } : {}}
        historicalContext={selectedAlert ? [{
          incident_id: `INC-${selectedAlert.id}`,
          attack_type: selectedAlert.title,
          resolution: selectedAlert.recommendation
        }] : []}
      />
    </div>
  );
}
