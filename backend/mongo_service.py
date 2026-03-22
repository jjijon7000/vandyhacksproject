"""
mongo_service.py — MongoDB Memory Layer for Cyber AI
"""

import os
from copy import deepcopy
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient, DESCENDING

load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env", override=True)

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "cyber_ai")
MONGODB_COLLECTION_NAME = os.getenv("MONGODB_COLLECTION_NAME", "incidents")


@lru_cache(maxsize=1)
def _get_client() -> MongoClient:
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI is not set in .env")
    return MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)


def _col():
    return _get_client()[MONGODB_DB_NAME][MONGODB_COLLECTION_NAME]


def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    if isinstance(doc.get("timestamp"), datetime):
        doc["timestamp"] = doc["timestamp"].isoformat()
    return doc


# ── Public API ────────────────────────────────────────────────────────────────

def test_connection() -> dict:
    try:
        _get_client().admin.command("ping")
        return {"success": True, "message": "MongoDB connected successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


def store_incident(incident_data: dict) -> str:
    doc = deepcopy(incident_data)
    doc["timestamp"] = datetime.now(timezone.utc)
    result = _col().insert_one(doc)
    return str(result.inserted_id)


def get_all_incidents(limit: int = 50) -> list[dict]:
    cursor = _col().find().sort("timestamp", DESCENDING).limit(limit)
    return [_serialize(doc) for doc in cursor]


# ── Occurrence Tracking ───────────────────────────────────────────────────────

def get_occurrence_count(ip: str, attack_type: str) -> int:
    """Count how many times this IP has triggered the same attack type."""
    query = {}
    if ip and ip != "—":
        query["ip"] = ip
    if attack_type:
        query["attack_type"] = attack_type
    if not query:
        return 0
    return _col().count_documents(query)


def find_similar_incidents(new_event: dict, limit: int = 5) -> list[dict]:
    """Find incidents matching ip, attack_type, or username."""
    conditions = [
        {"attack_type": new_event["attack_type"]} if new_event.get("attack_type") else None,
        {"ip": new_event["ip"]} if new_event.get("ip") and new_event["ip"] != "—" else None,
        {"username": new_event["username"]} if new_event.get("username") else None,
    ]
    or_conditions = [c for c in conditions if c]

    if not or_conditions:
        return []

    cursor = _col().find({"$or": or_conditions}).sort("timestamp", DESCENDING).limit(limit)
    return [_serialize(doc) for doc in cursor]


def find_similar_with_score(new_event: dict, limit: int = 5) -> list[dict]:
    scored = []
    for doc in find_similar_incidents(new_event, limit=50):
        score = (
            (5 if doc.get("attack_type") == new_event.get("attack_type") else 0)
            + (3 if doc.get("ip") == new_event.get("ip") else 0)
            + (2 if doc.get("username") == new_event.get("username") else 0)
            + (1 if doc.get("severity") == new_event.get("severity") else 0)
        )
        if score > 0:
            scored.append({**doc, "similarity_score": score})

    return sorted(scored, key=lambda x: x["similarity_score"], reverse=True)[:limit]


# ── Memory Context (used by /analyze-incident) ────────────────────────────────

def get_memory_context(new_event: dict) -> dict:
    """
    Returns occurrence count, similar incidents, and a memory summary.
    This is what gets passed to Gemini as historical context.
    """
    ip = new_event.get("ip", "")
    attack_type = new_event.get("attack_type", "")

    count = get_occurrence_count(ip, attack_type)
    similar = find_similar_with_score(new_event)

    if count > 1:
        summary = f"This IP has triggered {count} {attack_type.replace('_', ' ')} attacks. Persistent threat detected."
    elif count == 1:
        summary = f"One prior {attack_type.replace('_', ' ')} incident from this IP."
    else:
        summary = "No similar past incidents found."

    return {
        "occurrence_count": count,
        "similar_incidents_found": len(similar),
        "similar_incidents": similar,
        "memory_summary": summary,
    }
