from ai_intelligence.analyzer import analyze_incident


logs = [
    {
        "timestamp": "2026-03-21T10:15:00Z",
        "event_type": "login_failed",
        "username": "admin",
        "source_ip": "185.220.101.45"
    },
    {
        "timestamp": "2026-03-21T10:15:10Z",
        "event_type": "login_failed",
        "username": "admin",
        "source_ip": "185.220.101.45"
    },
    {
        "timestamp": "2026-03-21T10:15:22Z",
        "event_type": "login_failed",
        "username": "jsmith",
        "source_ip": "185.220.101.45"
    }
]

anomaly = {
    "type": "brute_force",
    "failed_attempt_count": 17,
    "window_minutes": 2,
    "source_ip": "185.220.101.45"
}

historical_context = [
    {
        "incident_id": "INC-104",
        "attack_type": "credential_attack",
        "source_ip": "185.220.101.45",
        "resolution": "IP blocked and MFA enforced"
    }
]


result = analyze_incident(
    logs=logs,
    anomaly=anomaly,
    historical_context=historical_context
)

print(result)