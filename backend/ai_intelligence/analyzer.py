from typing import Any, Dict, List
from .prompts import SYSTEM_PROMPT
from .formatter import format_incident_input
from .gemini_client import get_gemini_response
from .schemas import ThreatAnalysis


def analyze_incident(
    logs: List[Dict[str, Any]],
    anomaly: Dict[str, Any],
    historical_context: List[Dict[str, Any]]
) -> Dict[str, Any]:
    formatted_input = format_incident_input(
        logs=logs,
        anomaly=anomaly,
        historical_context=historical_context
    )

    user_prompt = f"""
Analyze this suspicious security incident and return valid JSON only.

Incident data:
{formatted_input}
"""

    raw_result = get_gemini_response(SYSTEM_PROMPT, user_prompt)
    validated = ThreatAnalysis(**raw_result)

    return validated.model_dump()