import os
import snowflake.connector
from pathlib import Path
from dotenv import load_dotenv
from typing import List, Dict, Any

# Load .env
env_path = Path(__file__).resolve().parent / ".env"
print(f"Loading .env from: {env_path}")
load_dotenv(dotenv_path=env_path, override=True)


def get_snowflake_connection():
    required = [
        "SNOWFLAKE_ACCOUNT",
        "SNOWFLAKE_USER",
        "SNOWFLAKE_PASSWORD",
        "SNOWFLAKE_WAREHOUSE",
        "SNOWFLAKE_DATABASE",
        "SNOWFLAKE_SCHEMA",
    ]

    missing = [k for k in required if not os.getenv(k)]

    print("SNOWFLAKE_ACCOUNT =", os.getenv("SNOWFLAKE_ACCOUNT"))
    print("SNOWFLAKE_USER =", os.getenv("SNOWFLAKE_USER"))
    print("SNOWFLAKE_WAREHOUSE =", os.getenv("SNOWFLAKE_WAREHOUSE"))
    print("SNOWFLAKE_DATABASE =", os.getenv("SNOWFLAKE_DATABASE"))
    print("SNOWFLAKE_SCHEMA =", os.getenv("SNOWFLAKE_SCHEMA"))

    if missing:
        raise EnvironmentError(
            f"Missing Snowflake environment variables: {', '.join(missing)}"
        )

    return snowflake.connector.connect(
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
        role=os.getenv("SNOWFLAKE_ROLE"),
    )


def execute_query(query: str, params=None) -> List[Dict[str, Any]]:
    conn = get_snowflake_connection()
    cur = conn.cursor()

    try:
        if params:
            cur.execute(query, params)
        else:
            cur.execute(query)

        rows = cur.fetchall()

        # Convert to JSON-friendly format
        columns = [col[0].lower() for col in cur.description]
        results = [dict(zip(columns, row)) for row in rows]

        return results

    finally:
        cur.close()
        conn.close()


def fetch_alerts():
    query = """
    SELECT
        alert_type,
        severity,
        username,
        src_ip,
        description,
        recommended_action,
        created_at
    FROM AUTONOMOUS_SOC_DB.SECURITY.UNIFIED_ALERTS_VIEW
    ORDER BY created_at DESC
    """
    return execute_query(query)


def fetch_logs_by_user(username: str):
    query = """
    SELECT *
    FROM AUTONOMOUS_SOC_DB.SECURITY.SECURITY_LOGS
    WHERE username = %s
    ORDER BY event_time DESC
    """
    return execute_query(query, (username,))


def fetch_logs_by_ip(src_ip: str):
    query = """
    SELECT *
    FROM AUTONOMOUS_SOC_DB.SECURITY.SECURITY_LOGS
    WHERE src_ip = %s
    ORDER BY event_time DESC
    """
    return execute_query(query, (src_ip,))