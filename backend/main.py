from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

import logging
from typing import Any, Dict, List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.ai_intelligence.analyzer import analyze_incident
from backend import snowflake_client

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="SentinelAI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class IncidentRequest(BaseModel):
    logs: List[Dict[str, Any]]
    anomaly: Dict[str, Any]
    historical_context: List[Dict[str, Any]] = []


class AlertAnalysisRequest(BaseModel):
    username: str | None = None
    src_ip: str | None = None
    alert_type: str | None = None
    severity: str | None = None
    description: str | None = None
    recommended_action: str | None = None
    created_at: str | None = None


@app.get("/")
def root():
    return {"message": "SentinelAI backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/alerts")
def get_alerts():
    try:
        alerts = snowflake_client.fetch_alerts()
        return {"count": len(alerts), "alerts": alerts}
    except Exception as e:
        logging.exception("fetch_alerts failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/logs/user/{username}")
def get_logs_for_user(username: str):
    try:
        logs = snowflake_client.fetch_logs_by_user(username)
        return {"count": len(logs), "logs": logs}
    except Exception as e:
        logging.exception("fetch_logs_by_user failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/logs/ip/{src_ip}")
def get_logs_for_ip(src_ip: str):
    try:
        logs = snowflake_client.fetch_logs_by_ip(src_ip)
        return {"count": len(logs), "logs": logs}
    except Exception as e:
        logging.exception("fetch_logs_by_ip failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/simulate-attack")
def simulate_attack():
    try:
        snowflake_client.insert_demo_attack()
        return {"message": "Demo attack inserted successfully"}
    except Exception as e:
        logging.exception("simulate_attack failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-incident")
async def analyze_incident_route(payload: IncidentRequest):
    try:
        return analyze_incident(
            logs=payload.logs,
            anomaly=payload.anomaly,
            historical_context=payload.historical_context
        )
    except Exception:
        logging.exception("analyze_incident failed")
        return {
            "error": "analysis_unavailable",
            "message": "AI analysis unavailable."
        }


@app.post("/analyze-alert")
def analyze_alert(payload: AlertAnalysisRequest):
    try:
        anomaly = payload.model_dump()
        logs: List[Dict[str, Any]] = []

        if payload.username:
            logs = snowflake_client.fetch_logs_by_user(payload.username)
        elif payload.src_ip:
            logs = snowflake_client.fetch_logs_by_ip(payload.src_ip)

        analysis = analyze_incident(
            logs=logs,
            anomaly=anomaly,
            historical_context=[]
        )

        return {
            "anomaly": anomaly,
            "log_count": len(logs),
            "logs": logs,
            "analysis": analysis
        }

    except Exception:
        logging.exception("analyze_alert failed")
        return {
            "error": "analysis_unavailable",
            "anomaly": payload.model_dump(),
            "log_count": 0,
            "logs": []
        }