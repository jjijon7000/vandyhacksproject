"""
mongo_service.py — MongoDB Memory Layer for Cyber AI

Stores security incidents and retrieves similar past incidents
to provide memory context for the AI and backend systems.
"""

import os
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient, DESCENDING

# Load .env from the project root (one level above backend/)
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "cyber_ai")
MONGODB_COLLECTION_NAME = os.getenv("MONGODB_COLLECTION_NAME", "incidents")

if not MONGODB_URI:
    raise ValueError(
        "MONGODB_URI is not set. "
        "Add it to your .env file (see .env.example)."
    )

client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB_NAME]
collection = db[MONGODB_COLLECTION_NAME]


def _make_serializable(doc: dict) -> dict:
    """Convert ObjectId and datetime fields so the dict is JSON-safe."""
    doc["_id"] = str(doc["_id"])
    if isinstance(doc.get("timestamp"), datetime):
        doc["timestamp"] = doc["timestamp"].isoformat()
    return doc


def test_connection():
    """Ping MongoDB and return a success/failure dict."""
    try:
        client.admin.command("ping")
        return {"success": True, "message": "MongoDB connected successfully"}
    except Exception as e:
        return {"success": False, "message": f"Connection failed: {e}"}


def store_incident(incident_data: dict) -> str:
    """
    Store a security incident in MongoDB.

    Makes a safe copy, adds a UTC timestamp, inserts it,
    and returns the inserted document's ID as a string.
    """
    doc = deepcopy(incident_data)
    doc["timestamp"] = datetime.now(timezone.utc)

    result = collection.insert_one(doc)
    return str(result.inserted_id)


def get_all_incidents(limit: int = 50) -> list[dict]:
    """
    Return the most recent incidents, newest first.
    ObjectId is converted to a plain string so the result is JSON-safe.
    """
    cursor = collection.find().sort("timestamp", DESCENDING).limit(limit)

    incidents = []
    for doc in cursor:
        incidents.append(_make_serializable(doc))
    return incidents


def find_similar_incidents(new_event: dict, limit: int = 5) -> list[dict]:
    """
    Find incidents that share an attack_type, ip, OR username with new_event.
    Uses a MongoDB $or query and returns results newest-first.
    """
    or_conditions = []

    if new_event.get("attack_type"):
        or_conditions.append({"attack_type": new_event["attack_type"]})
    if new_event.get("ip"):
        or_conditions.append({"ip": new_event["ip"]})
    if new_event.get("username"):
        or_conditions.append({"username": new_event["username"]})

    if not or_conditions:
        return []

    query = {"$or": or_conditions}
    cursor = collection.find(query).sort("timestamp", DESCENDING).limit(limit)

    results = []
    for doc in cursor:
        results.append(_make_serializable(doc))
    return results


def find_similar_with_score(new_event: dict, limit: int = 5) -> list[dict]:
    """
    Retrieve similar incidents and assign each a similarity score.

    Scoring: attack_type +5, ip +3, username +2, severity +1.
    Only incidents with score > 0 are returned, highest first.
    """
    candidates = find_similar_incidents(new_event, limit=50)

    scored = []
    for doc in candidates:
        score = 0
        if doc.get("attack_type") == new_event.get("attack_type"):
            score += 5
        if doc.get("ip") == new_event.get("ip"):
            score += 3
        if doc.get("username") == new_event.get("username"):
            score += 2
        if doc.get("severity") == new_event.get("severity"):
            score += 1

        if score > 0:
            doc["similarity_score"] = score
            scored.append(doc)

    scored.sort(key=lambda x: x["similarity_score"], reverse=True)
    return scored[:limit]


def get_memory_context(new_event: dict) -> dict:
    """
    Build a memory-context payload that the AI and backend can consume.

    Returns a dict with:
        - similar_incidents_found  (int)
        - similar_incidents        (list)
        - memory_summary           (str)
    """
    similar = find_similar_with_score(new_event)
    count = len(similar)

    if count > 0:
        summary = f"Found {count} similar past incidents."
    else:
        summary = "No similar past incidents found."

    return {
        "similar_incidents_found": count,
        "similar_incidents": similar,
        "memory_summary": summary,
    }
