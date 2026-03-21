import json
from typing import Any, Dict, List


def format_incident_input(
    logs: List[Dict[str, Any]],
    anomaly: Dict[str, Any],
    historical_context: List[Dict[str, Any]]
) -> str:
    payload = {
        "current_anomaly": anomaly,
        "recent_logs": logs,
        "historical_similar_incidents": historical_context
    }

    return json.dumps(payload, indent=2)