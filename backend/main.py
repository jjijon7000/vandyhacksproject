from pathlib import Path
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

import logging
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional

from ai_intelligence.analyzer import analyze_incident
from mongo_service import (
    test_connection,
    store_incident,
    get_all_incidents,
    get_memory_context,
)

app = FastAPI(title="SentinelAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class IncidentRequest(BaseModel):
    logs: List[Dict[str, Any]]
    anomaly: Dict[str, Any]
    historical_context: List[Dict[str, Any]] = []


class IncidentBody(BaseModel):
    ip: str = ""
    attack_type: str = ""
    severity: str = "medium"
    username: str = ""
    failed_attempts: int = 0
    source: str = ""
    ai_explanation: str = ""
    root_cause: str = ""
    recommended_action: str = ""
    status: str = "open"


# ---------- Health ----------

@app.get("/")
def root():
    return {"message": "SentinelAI backend is running"}


@app.get("/health/mongo")
def health_mongo():
    return test_connection()


# ---------- Incidents (MongoDB) ----------

@app.get("/incidents")
def list_incidents(limit: int = Query(50, ge=1, le=200)):
    """Return recent incidents from MongoDB, newest first."""
    return get_all_incidents(limit=limit)


@app.post("/incidents")
def create_incident(body: IncidentBody):
    """Store a new incident in MongoDB and return its ID."""
    doc = body.model_dump()
    inserted_id = store_incident(doc)
    return {"inserted_id": inserted_id}


@app.get("/memory-context")
def memory_context(
    attack_type: Optional[str] = None,
    ip: Optional[str] = None,
    username: Optional[str] = None,
    severity: Optional[str] = None,
):
    """Return similar past incidents and a memory summary."""
    event = {}
    if attack_type:
        event["attack_type"] = attack_type
    if ip:
        event["ip"] = ip
    if username:
        event["username"] = username
    if severity:
        event["severity"] = severity
    return get_memory_context(event)


# ---------- AI Analysis (with MongoDB memory) ----------

@app.post("/analyze-incident")
async def analyze_incident_route(payload: IncidentRequest):
    try:
        # Pull memory context from MongoDB for the anomaly
        context = get_memory_context(payload.anomaly)
        historical = context.get("similar_incidents", [])

        result = analyze_incident(
            logs=payload.logs,
            anomaly=payload.anomaly,
            historical_context=historical,
        )

        # Store the incident + AI result into MongoDB
        store_doc = {
            **payload.anomaly,
            "source": payload.logs[0].get("source", "") if payload.logs else "",
            "ai_explanation": result.get("explanation", ""),
            "root_cause": result.get("root_cause", ""),
            "recommended_action": (
                "; ".join(result["recommended_action"])
                if isinstance(result.get("recommended_action"), list)
                else result.get("recommended_action", "")
            ),
            "severity": result.get("severity", "medium"),
            "status": "open",
        }
        store_incident(store_doc)

        return result
    except Exception:
        logging.exception("analyze_incident failed")
        return {
            "error": "analysis_unavailable",
            "message": "AI analysis unavailable; returning fallback summary.",
            "fallback": {
                "summary": "Unable to contact Gemini. Check server logs or set GEMINI_API_KEY.",
                "confidence": 0.0,
                "recommendations": [
                    "Verify GEMINI_API_KEY in .env",
                    "Restart the backend",
                ]
            }
        }
