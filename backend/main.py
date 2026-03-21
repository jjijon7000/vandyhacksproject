# 1. Load .env FIRST before anything else
from pathlib import Path
from dotenv import load_dotenv

# Force-load .env from backend folder
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# 2. Standard imports
import logging
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# 3. Local imports
from ai_intelligence.analyzer import analyze_incident
from ai_intelligence.chat_helper import get_incident_chat_response
from ai_intelligence.schemas import IncidentChatRequest, IncidentChatResponse
from mongo_service import (
    test_connection,
    store_incident,
    get_all_incidents,
    get_memory_context,
)
from snowflake_service import fetch_unified_alerts

# 4. Create app BEFORE any routes
app = FastAPI(title="SentinelAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Models
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


# 6. Routes

@app.get("/")
def root():
    return {"message": "SentinelAI backend is running"}


@app.get("/health/mongo")
def health_mongo():
    return test_connection()


@app.get("/snowflake/alerts")
def get_snowflake_alerts(limit: int = 20):
    try:
        alerts = fetch_unified_alerts(limit=limit)
        return {"alerts": alerts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/incidents")
def list_incidents(limit: int = Query(50, ge=1, le=200)):
    return get_all_incidents(limit=limit)


@app.post("/incidents")
def create_incident(body: IncidentBody):
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
    event: Dict[str, Any] = {}
    if attack_type:
        event["attack_type"] = attack_type
    if ip:
        event["ip"] = ip
    if username:
        event["username"] = username
    if severity:
        event["severity"] = severity
    return get_memory_context(event)


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
                ],
            },
        }


@app.post("/incident-chat")
async def incident_chat_route(request: IncidentChatRequest) -> IncidentChatResponse:
    """
    Answer follow-up questions about the current incident.
    Uses Gemini to provide context-aware, beginner-friendly responses.
    """
    try:
        answer = get_incident_chat_response(
            incident_summary=request.incident_summary,
            anomaly=request.anomaly,
            historical_context=request.historical_context,
            chat_history=request.chat_history,
            user_message=request.user_message,
        )
        return IncidentChatResponse(answer=answer)
    except Exception as e:
        logging.exception("incident_chat failed")
        raise HTTPException(
            status_code=500,
            detail=f"Chat service unavailable: {str(e)[:100]}"
        )


@app.get("/debug")
def debug():
    import os

    return {
        "MONGODB_URI": os.getenv("MONGODB_URI"),
        "MONGODB_DB_NAME": os.getenv("MONGODB_DB_NAME"),
        "SNOWFLAKE_ACCOUNT": os.getenv("SNOWFLAKE_ACCOUNT"),
        "SNOWFLAKE_USER": os.getenv("SNOWFLAKE_USER"),
    }
