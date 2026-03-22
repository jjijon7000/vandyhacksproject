export type IncidentPayload = {
    logs: Record<string, any>[];
    anomaly: Record<string, any>;
    historical_context?: Record<string, any>[];
};

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8001";

export async function analyzeIncident(payload: IncidentPayload) {
    try {
        const res = await fetch(`${BACKEND}/analyze-incident`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const text = await res.text();
        let data: any = null;
        try { data = text ? JSON.parse(text) : null; } catch {}

        if (!res.ok || data?.error) {
            return {
                ok: false,
                reason: data?.message || `backend_error_${res.status}`,
                analysis: data?.fallback || { summary: "Analysis unavailable", confidence: 0 },
            };
        }

        return { ok: true, analysis: data };
    } catch (err) {
        return {
            ok: false,
            reason: (err as Error).message,
            analysis: { summary: "Network error contacting backend", confidence: 0 },
        };
    }
}