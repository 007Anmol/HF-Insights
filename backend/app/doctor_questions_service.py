"""Generate doctor discussion questions from canonical analysis (English first)."""

import json

from . import config, gemini_service, openai_service
from .translation_service import translate_canonical


DOCTOR_QUESTIONS_SYSTEM = """You are an educational medical assistant helping patients prepare for a doctor visit.

Generate 3 to 5 useful questions the patient may want to ask their doctor, based ONLY on the provided report/analysis.

Rules:
- Base every question on actual findings in the provided content
- Do not invent findings, diagnoses, or alarming scenarios
- Do not generate "Do I have cancer?" unless the report contains a relevant finding that warrants discussing malignancy with a doctor
- Questions should help discuss: meaning of findings, symptoms, additional tests, treatment options, follow-up, monitoring
- Return JSON only: {"questions": ["...", "..."]}
- Use calm, neutral wording
"""


def _generate_questions_en(canonical: dict) -> list[str]:
    payload = {
        "summary": canonical.get("summary"),
        "findings_text": canonical.get("findings_text"),
        "possible_conditions": canonical.get("possible_conditions"),
        "possible_symptoms": canonical.get("possible_symptoms"),
        "attention_level": canonical.get("attention_level"),
    }

    prompt = DOCTOR_QUESTIONS_SYSTEM + "\n\n" + json.dumps(payload, ensure_ascii=False)

    if config.get_gemini_api_key():
        from google import genai

        client = genai.Client(api_key=config.get_gemini_api_key())
        response = client.models.generate_content(
            model=config.TEXT_MODEL_NAME,
            contents=[prompt],
            config={
                "temperature": 0.0,
                "max_output_tokens": 800,
                "response_mime_type": "application/json",
            },
        )
        parsed = gemini_service._extract_json(response.text or "")
    elif config.get_openai_api_key():
        from openai import OpenAI

        client = OpenAI(api_key=config.get_openai_api_key())
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": DOCTOR_QUESTIONS_SYSTEM},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
            ],
            temperature=0.0,
            max_tokens=800,
            response_format={"type": "json_object"},
        )
        parsed = openai_service._extract_json(response.choices[0].message.content or "")
    else:
        raise ValueError("No LLM configured for doctor questions")

    if not isinstance(parsed, dict):
        return _fallback_questions(canonical)

    questions = parsed.get("questions")
    if not isinstance(questions, list):
        return _fallback_questions(canonical)

    cleaned = [str(q).strip() for q in questions if str(q).strip()]
    return cleaned[:5] if cleaned else _fallback_questions(canonical)


def _fallback_questions(canonical: dict) -> list[str]:
    findings = canonical.get("findings_text") or []
    base = [
        "What do these imaging findings mean in my specific situation?",
        "Could these findings explain my symptoms?",
        "Do I need any additional tests or follow-up imaging?",
    ]
    if findings:
        base.insert(0, f"What does '{findings[0][:80]}' mean for me?")
    return base[:5]


def _translate_questions(questions_en: list[str], target_language: str) -> list[str]:
    if target_language == "en":
        return questions_en

    wrapper = {
        "summary": "",
        "attention_level": "",
        "findings_text": questions_en,
        "possible_conditions": [],
        "possible_symptoms": [],
        "recommendations": [],
        "disclaimer": "",
    }
    translated = translate_canonical(
        {
            **wrapper,
            "findings_text": questions_en,
            "possible_conditions": [],
            "possible_symptoms": [],
        },
        target_language,
    )
    result = translated.get("findings_text") or []
    if len(result) == len(questions_en):
        return result
    return questions_en


def generate_doctor_questions(canonical: dict, language: str = "en") -> dict:
    questions_en = _generate_questions_en(canonical)
    lang = language if language in ("en", "hi", "mr", "te", "pa", "ta") else "en"
    questions = _translate_questions(questions_en, lang)
    return {
        "questions": questions,
        "questions_en": questions_en,
        "language": lang,
    }
