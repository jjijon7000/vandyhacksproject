import os
import json
from pathlib import Path
from dotenv import load_dotenv
import google.genai as genai

from .schemas import ThreatAnalysis

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY not found in backend/.env")

client = genai.Client(api_key=api_key)


def get_gemini_response(system_prompt: str, user_prompt: str) -> dict:
    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=full_prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": ThreatAnalysis,
            "temperature": 0.2,
        },
    )

    if response.parsed is not None:
        parsed = response.parsed
        if hasattr(parsed, "model_dump"):
            return parsed.model_dump()
        return parsed

    text = (response.text or "").strip()
    if not text:
        raise ValueError("Gemini returned an empty response")

    return json.loads(text)