from dotenv import load_dotenv
load_dotenv()

import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List

# use local package import when running from the backend folder
from ai_intelligence.analyzer import analyze_incident

app = FastAPI(title="SentinelAI Backend")

# Allow requests from the frontend (Next.js)
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


@app.get("/")
def root():
    return {"message": "SentinelAI backend is running"}


@app.post("/analyze-incident")
async def analyze_incident_route(payload: IncidentRequest):
    try:
        result = analyze_incident(
            logs=payload.logs,
            anomaly=payload.anomaly,
            historical_context=payload.historical_context
        )
        return result
    except Exception:
        logging.exception("analyze_incident failed")
        # Return a graceful fallback so frontend fetches succeed during local dev / missing Gemini key
        return {
            "error": "analysis_unavailable",
            "message": "AI analysis unavailable; returning fallback summary.",
            "fallback": {
                "summary": "Unable to contact Gemini — please check server logs or set GEMINI_API_KEY. Meanwhile, review the raw logs and alerts.",
                "confidence": 0.0,
                "recommendations": [
                    "Verify GEMINI_API_KEY in backend/.env",
                    "Restart the backend without --reload on Windows",
                    "If running locally, use the mock analysis or wait for the AI service to be available"
                ]
            }
        }