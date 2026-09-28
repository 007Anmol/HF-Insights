"""Multi-turn voice conversation grounded in the patient's X-ray report."""

from __future__ import annotations

import json

from . import config, gemini_service, openai_service
from .languages import LANGUAGE_NAMES_EN, SUPPORTED_LANGUAGES, normalize_language

VOICE_CONVERSATION_SYSTEM = """You are HF Insights voice assistant helping a patient understand their imaging report in a spoken conversation.

You receive the full report analysis JSON and conversation history.

Rules:
- Use ONLY the provided report analysis and prior conversation — do not invent findings, numbers, or diagnoses
- You are not a doctor; this is educational information only
- Write answers as natural spoken language (no markdown, no bullet points, no numbered lists)
- Keep each reply concise (about 120 words or less unless the patient asks for more detail)
- Preserve uncertainty wording from the report
- Do not prescribe or tell the patient to change medication
- If the question cannot be answered from the report, say so clearly and suggest discussing with their doctor
"""


def _response_language(language: str) -> tuple[str, str]:
    lang = normalize_language(language)
    if lang not in SUPPORTED_LANGUAGES:
        lang = "en"
    return lang, LANGUAGE_NAMES_EN.get(lang, "English")


def _report_context(canonical: dict) -> dict:
    return {
        "summary": canonical.get("summary"),
        "xray_type": canonical.get("xray_type"),
        "attention_level": canonical.get("attention_level"),
        "findings_text": canonical.get("findings_text"),
        "possible_conditions": canonical.get("possible_conditions"),
        "possible_symptoms": canonical.get("possible_symptoms"),
        "recommendations": canonical.get("recommendations"),
        "confidence": canonical.get("confidence"),
    }


def report_conversation_turn(
    canonical: dict,
    message: str,
    language: str = "en",
    conversation_history: list[dict] | None = None,
    previous_report_summary: str | None = None,
) -> dict:
    if not message or not str(message).strip():
        raise ValueError("Message is required")

    lang_code, lang_name = _response_language(language)
    history = conversation_history or []
    cleaned_history: list[dict] = []
    for item in history[-10:]:
        role = str(item.get("role") or "").strip().lower()
        content = str(item.get("content") or "").strip()
        if role in ("user", "assistant") and content:
            cleaned_history.append({"role": role, "content": content})

    context_block = {
        "report_analysis": _report_context(canonical),
        "previous_report_summary": previous_report_summary,
        "response_language": lang_name,
        "patient_message": message.strip(),
        "conversation_history": cleaned_history,
    }

    system = (
        VOICE_CONVERSATION_SYSTEM
        + f"\nRespond in {lang_name}. If you cannot produce fluent {lang_name}, respond in English.\n"
    )
    user_payload = json.dumps(context_block, ensure_ascii=False)

    if config.get_gemini_api_key():
        from google import genai

        client = genai.Client(api_key=config.get_gemini_api_key())
        contents = [system + "\n\n" + user_payload]
        response = client.models.generate_content(
            model=config.TEXT_MODEL_NAME,
            contents=contents,
            config={"temperature": 0.2, "max_output_tokens": 700},
        )
        answer = (response.text or "").strip()
    elif config.get_openai_api_key():
        from openai import OpenAI

        messages = [{"role": "system", "content": system}]
        for turn in cleaned_history:
            messages.append({"role": turn["role"], "content": turn["content"]})
        messages.append({"role": "user", "content": user_payload})

        client = OpenAI(api_key=config.get_openai_api_key())
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.2,
            max_tokens=700,
        )
        answer = (response.choices[0].message.content or "").strip()
    else:
        raise ValueError("No LLM configured for report voice conversation")

    if not answer:
        answer = "I'm unable to answer that right now. Please try again or discuss this with your doctor."

    return {
        "answer": answer,
        "language": lang_code,
        "speech_language": lang_code,
    }
