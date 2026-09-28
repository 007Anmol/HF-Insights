"""Ask My Report — grounded Q&A about the patient's report."""

import json

from . import config, gemini_service, openai_service
from .languages import LANGUAGE_NAMES_EN, normalize_language

ASK_REPORT_SYSTEM = """You are an AI medical report explanation assistant.

Your job is to help a patient understand the provided medical report and AI-assisted analysis in simple language.

You are not a doctor and must not provide a definitive diagnosis.

Answer questions using the provided report and analysis as the primary source of truth.

Do not invent findings, measurements, diagnoses, symptoms, test results, or medical history.

Clearly distinguish between:
1. What the report actually states.
2. General medical information that may help explain it.
3. Information that cannot be determined from the report.

If the answer cannot be determined from the provided report, explicitly say so.

Do not overstate certainty. Preserve the report's uncertainty.

Do not prescribe medication.
Do not tell the patient to stop or change medication.
Do not replace professional medical evaluation.

Keep answers concise and easy to understand (under 120 words when possible).
"""


def ask_report_question(
    canonical: dict,
    question: str,
    language: str = "en",
    previous_report_summary: str | None = None,
) -> dict:
    if not question or not str(question).strip():
        raise ValueError("Question is required")

    lang = normalize_language(language)
    lang_name = LANGUAGE_NAMES_EN.get(lang, "English")

    context = {
        "report_analysis": {
            "summary": canonical.get("summary"),
            "attention_level": canonical.get("attention_level"),
            "findings_text": canonical.get("findings_text"),
            "possible_conditions": canonical.get("possible_conditions"),
            "possible_symptoms": canonical.get("possible_symptoms"),
            "xray_type": canonical.get("xray_type"),
        },
        "previous_report_summary": previous_report_summary,
        "patient_question": question.strip(),
        "response_language": lang_name,
    }

    user_prompt = (
        f"Respond in {lang_name}.\n\n"
        + json.dumps(context, ensure_ascii=False)
    )

    if config.get_gemini_api_key():
        from google import genai

        client = genai.Client(api_key=config.get_gemini_api_key())
        response = client.models.generate_content(
            model=config.TEXT_MODEL_NAME,
            contents=[ASK_REPORT_SYSTEM + "\n\n" + user_prompt],
            config={"temperature": 0.0, "max_output_tokens": 600},
        )
        answer = (response.text or "").strip()
    elif config.get_openai_api_key():
        from openai import OpenAI

        client = OpenAI(api_key=config.get_openai_api_key())
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": ASK_REPORT_SYSTEM},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.0,
            max_tokens=600,
        )
        answer = (response.choices[0].message.content or "").strip()
    else:
        raise ValueError("No LLM configured for Ask My Report")

    if not answer:
        answer = "Unable to generate an answer right now. Please try again."

    return {
        "answer": answer,
        "language": lang,
        "grounded_in_report": True,
    }
