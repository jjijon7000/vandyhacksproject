export type IncidentPayload = {
  logs: Array<Record<string, any>>;
  anomaly: Record<string, any>;
  historical_context?: Array<Record<string, any>>;
};

export async function analyzeIncident(payload: IncidentPayload) {
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const res = await fetch(`${base}/analyze-incident`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Backend error ${res.status}: ${txt}`);
  }

  return res.json();
}
