"""
Chat helper for incident follow-up questions.
Reuses the existing Gemini client to provide context-aware answers.
"""
from typing import Dict, Any, List
import json
from .gemini_client import get_gemini_response
from .schemas import (
    IncidentSummary,
    HistoricalIncident,
    ChatMessage,
)


CHAT_SYSTEM_PROMPT = """You are SentinelAI, a helpful security assistant explaining incidents in plain language for non-experts.

Your role:
- Answer follow-up questions about the current incident
- Explain security concepts and attack types in simple, clear terms
- Provide actionable next steps
- Reference historical context when relevant
- Always be concise and beginner-friendly
- If the answer is not supported by the provided context, clearly say so

RULES:
- Keep responses to 2-3 sentences maximum
- Use simple analogies when explaining technical concepts
- Focus on what the user needs to do, not just what happened
- If unsure, recommend escalating to the SOC team
- Do NOT make up information
- Do NOT include markdown, just plain text
- Return ONLY the answer text, no JSON wrapper"""


def build_chat_prompt(
    incident_summary: IncidentSummary,
    anomaly: Dict[str, Any],
    historical_context: List[HistoricalIncident],
    chat_history: List[ChatMessage],
    user_message: str,
) -> str:
    """
    Build a formatted prompt for Gemini that includes all context.
    """
    prompt = f"""## Current Incident
Threat: {incident_summary.threat}
Severity: {incident_summary.severity}
Confidence: {incident_summary.confidence * 100:.0f}%
Explanation: {incident_summary.explanation}

## Anomaly Details
{json.dumps(anomaly, indent=2)}

## Historical Context
"""
    if historical_context:
        for hist in historical_context:
            prompt += f"- {hist.incident_id}: {hist.attack_type} (resolved: {hist.resolution})\n"
    else:
        prompt += "- No similar incidents found.\n"

    # Add chat history for context
    if chat_history:
        prompt += "\n## Conversation So Far\n"
        for msg in chat_history:
            role = "User" if msg.role == "user" else "SentinelAI"
            prompt += f"{role}: {msg.message}\n"

    prompt += f"\n## New Question from User\n{user_message}"
    return prompt


def get_incident_chat_response(
    incident_summary: IncidentSummary,
    anomaly: Dict[str, Any],
    historical_context: List[HistoricalIncident],
    chat_history: List[ChatMessage],
    user_message: str,
) -> str:
    """
    Get a chat response from Gemini about the current incident.
    Returns plain text answer.
    """
    prompt = build_chat_prompt(
        incident_summary,
        anomaly,
        historical_context,
        chat_history,
        user_message,
    )

    # Use the existing Gemini client but without strict JSON schema
    # since we want plain text response
    try:
        full_prompt = f"{CHAT_SYSTEM_PROMPT}\n\n{prompt}"
        response = get_gemini_response_text(full_prompt)
        return response.strip()
    except Exception as e:
        return f"I encountered an issue analyzing your question. Please try again or contact your SOC team. (Error: {str(e)[:50]})"


def get_gemini_response_text(prompt: str) -> str:
    """
    Call Gemini and get plain text response (not JSON).
    """
    import os
    from pathlib import Path
    from dotenv import load_dotenv
    from google import genai

    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(dotenv_path=env_path)
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY not found")

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt,
        config={
            "temperature": 0.5,
            "max_output_tokens": 300,
        },
    )

    return response.text or "No response from Gemini"
