from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class IOC(BaseModel):
    source_ip: str = ""
    target_accounts: List[str] = Field(default_factory=list)
    attack_type: str = ""


class ThreatAnalysis(BaseModel):
    threat: str
    severity: str
    confidence: float
    explanation: str
    root_cause: str
    recommended_action: List[str]
    ioc: IOC


# Chat request/response schemas
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    message: str


class IncidentSummary(BaseModel):
    threat: str
    severity: str
    confidence: float
    explanation: str


class HistoricalIncident(BaseModel):
    incident_id: str
    attack_type: str
    resolution: str


class IncidentChatRequest(BaseModel):
    incident_summary: IncidentSummary
    anomaly: Dict[str, Any]
    historical_context: List[HistoricalIncident] = Field(default_factory=list)
    chat_history: List[ChatMessage] = Field(default_factory=list)
    user_message: str


class IncidentChatResponse(BaseModel):
    answer: str