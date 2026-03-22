import os
import snowflake.connector
from dotenv import load_dotenv

# Ensure .env is loaded
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# Utility to get Snowflake connection

def get_snowflake_connection():
    return snowflake.connector.connect(
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database=os.getenv("SNOWFLAKE_DATABASE"),
        schema=os.getenv("SNOWFLAKE_SCHEMA"),
        role=os.getenv("SNOWFLAKE_ROLE"),
    )

# Example: fetch latest alerts from UNIFIED_ALERTS_VIEW

def fetch_unified_alerts(limit=20):
    conn = get_snowflake_connection()
    try:
        cur = conn.cursor()
        cur.execute(f"""
            SELECT * FROM UNIFIED_ALERTS_VIEW
            ORDER BY created_at DESC
            LIMIT {limit}
        """)
        columns = [col[0] for col in cur.description]
        results = [dict(zip(columns, row)) for row in cur.fetchall()]
        return results
    finally:
        conn.close()
