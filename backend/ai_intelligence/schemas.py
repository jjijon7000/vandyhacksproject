from pydantic import BaseModel, Field
from typing import List


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