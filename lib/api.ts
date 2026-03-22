// Fetch alerts from Snowflake UNIFIED_ALERTS_VIEW
export async function getSnowflakeAlerts(limit = 20) {
  const res = await fetch(`${BACKEND}/snowflake/alerts?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch Snowflake alerts");
  const data = await res.json();
  return data.alerts;
}
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

export type IncidentPayload = {
  logs: Array<Record<string, any>>;
  anomaly: Record<string, any>;
  historical_context?: Array<Record<string, any>>;
};

export type MongoIncident = {
  _id: string;
  ip: string;
  attack_type: string;
  severity: string;
  username: string;
  failed_attempts: number;
  source: string;
  ai_explanation: string;
  root_cause: string;
  recommended_action: string;
  status: string;
  timestamp: string;
  similarity_score?: number;
};

export async function getIncidents(limit = 50): Promise<MongoIncident[]> {
  try {
    const res = await fetch(`${BACKEND}/incidents?limit=${limit}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function storeIncident(
  incident: Partial<MongoIncident>,
): Promise<{ inserted_id: string } | null> {
  try {
    const res = await fetch(`${BACKEND}/incidents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(incident),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function analyzeIncident(payload: IncidentPayload) {
  const res = await fetch(`${BACKEND}/analyze-incident`, {
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

export type IncidentChatPayload = {
  incident_summary: {
    threat: string;
    severity: string;
    confidence: number;
    explanation: string;
  };
  anomaly: Record<string, any>;
  historical_context: Array<{
    incident_id: string;
    attack_type: string;
    resolution: string;
  }>;
  chat_history: Array<{
    role: "user" | "assistant";
    message: string;
  }>;
  user_message: string;
};

export async function sendIncidentChat(payload: IncidentChatPayload) {
  const res = await fetch(`${BACKEND}/incident-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Chat request failed ${res.status}: ${txt}`);
  }

  return res.json();
}
