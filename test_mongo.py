"""
test_mongo.py — Manual test script for the MongoDB memory layer.

Runs each mongo_service function in order and prints the results.
Usage:  python test_mongo.py
"""

from mongo_service import (
    test_connection,
    store_incident,
    get_all_incidents,
    find_similar_incidents,
    find_similar_with_score,
    get_memory_context,
)


def print_header(title: str):
    """Print a visible section divider."""
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}")


def main():
    # ── 1. Test connection ────────────────────────────
    print_header("1. Testing MongoDB Connection")
    result = test_connection()
    print(result)

    if not result["success"]:
        print("Cannot continue — MongoDB is not reachable.")
        return

    # ── 2. Store a sample incident ────────────────────
    print_header("2. Storing a Sample Incident")

    sample_incident = {
        "ip": "45.22.11.90",
        "attack_type": "brute_force",
        "severity": "high",
        "username": "admin",
        "failed_attempts": 20,
        "source": "snowflake_detection",
        "status": "open",
    }

    inserted_id = store_incident(sample_incident)
    print(f"Inserted incident ID: {inserted_id}")

    # ── 3. Retrieve all incidents ─────────────────────
    print_header("3. Retrieving All Incidents (limit 10)")

    all_incidents = get_all_incidents(limit=10)
    print(f"Total returned: {len(all_incidents)}")
    for inc in all_incidents:
        print(f"  - {inc['_id']}  |  {inc.get('attack_type', 'N/A')}  |  {inc.get('ip', 'N/A')}")

    # ── 4. Find similar incidents ─────────────────────
    print_header("4. Finding Similar Incidents")

    lookup_event = {
        "attack_type": "brute_force",
        "ip": "45.22.11.90",
        "username": "admin",
    }

    similar = find_similar_incidents(lookup_event, limit=5)
    print(f"Similar incidents found: {len(similar)}")
    for inc in similar:
        print(f"  - {inc['_id']}  |  {inc.get('attack_type')}  |  {inc.get('ip')}")

    # ── 5. Find similar with score ────────────────────
    print_header("5. Finding Similar Incidents (with scores)")

    scored = find_similar_with_score(lookup_event, limit=5)
    for inc in scored:
        print(f"  - score={inc['similarity_score']}  |  {inc.get('attack_type')}  |  {inc.get('ip')}")

    # ── 6. Get memory context ─────────────────────────
    print_header("6. Memory Context")

    context = get_memory_context(lookup_event)
    print(f"Summary : {context['memory_summary']}")
    print(f"Count   : {context['similar_incidents_found']}")

    print_header("Done")


if __name__ == "__main__":
    main()
