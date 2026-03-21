import React, { useState } from "react";
import { analyzeIncident } from "../lib/api";

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchAnalysis(examplePayload: any) {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    const result = await analyzeIncident(examplePayload);
    setLoading(false);
    if (!result.ok) {
      setError(result.reason || "Analysis failed");
      setAnalysis(result.analysis);
      return;
    }
    setAnalysis(result.analysis);
  }

  return (
    <div>
      {/* ...existing UI... */}
      {loading && <div>Loading analysis…</div>}
      {error && <div style={{ color: "orange" }}>{error}</div>}
      {analysis && (
        <div>
          <h3>AI Analysis</h3>
          <p>{analysis.summary}</p>
        </div>
      )}
    </div>
  );
}