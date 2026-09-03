"""Medical translation service — translation only, no reinterpretation."""

import json

from . import config, gemini_service, openai_service
from .languages import LANGUAGE_NAMES_EN, normalize_language
from .medical_terminology import glossary_prompt_block
from .structured_adapter import canonical_for_translation
from .translation_validation import validate_translation

MEDICAL_TRANSLATION_SYSTEM = """You are a professional medical translator specializing in radiology and patient-facing healthcare communication in India.

Translate the provided canonical medical content into the requested language.

Your task is TRANSLATION ONLY.

Do not interpret, diagnose, infer, add, remove, strengthen, weaken, or modify medical information.

Preserve exactly:
- findings
- anatomical locations
- laterality
- severity
- uncertainty
- measurements
- numbers
- units
- recommendations
- warnings
- clinical correlation statements

Maintain exactly the same level of certainty as the source.

If the source says 'possible', the translation must retain the meaning of possible.
If the source says 'cannot exclude', the translation must retain that uncertainty.
If the source says 'mild', do not translate it as moderate or severe.

Use natural, concise language that an ordinary patient can understand.
For important medical terminology, use the local-language explanation followed by the original English medical term in parentheses when this improves clarity.

Do not provide additional medical advice.
Do not explain the translation.

Return a single valid JSON object with keys:
- summary (string)
- attention_level (string)
- findings_text (array of strings)
- possible_conditions (array of strings)
- possible_symptoms (array of strings)
- recommendations (array of strings)
- disclaimer (string)
"""


def _strict_retry_instruction() -> str:
    return (
        "STRICT RETRY: Preserve every number, unit, left/right/bilateral reference, "
        "severity word, and uncertainty phrase exactly in meaning. Do not add or remove findings."
    )


def _translate_with_gemini(payload: dict, target_language: str, strict: bool = False) -> dict:
    api_key = config.get_gemini_api_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    from google import genai

    lang_name = LANGUAGE_NAMES_EN.get(target_language, "English")
    user_content = {
        "target_language": lang_name,
        "canonical_content": payload,
        "glossary_guidance": glossary_prompt_block(),
    }
    if strict:
        user_content["strict_instruction"] = _strict_retry_instruction()

    prompt = MEDICAL_TRANSLATION_SYSTEM + "\n\n" + json.dumps(user_content, ensure_ascii=False)
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=config.TEXT_MODEL_NAME,
        contents=[prompt],
        config={
            "temperature": 0.0,
            "max_output_tokens": 2000,
            "response_mime_type": "application/json",
        },
    )
    raw = (response.text or "").strip()
    parsed = gemini_service._extract_json(raw)
    if not isinstance(parsed, dict):
        raise ValueError("Invalid translation JSON from Gemini")
    return parsed


def _translate_with_openai(payload: dict, target_language: str, strict: bool = False) -> dict:
    api_key = config.get_openai_api_key()
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")

    from openai import OpenAI

    lang_name = LANGUAGE_NAMES_EN.get(target_language, "English")
    user_content = {
        "target_language": lang_name,
        "canonical_content": payload,
        "glossary_guidance": glossary_prompt_block(),
    }
    if strict:
        user_content["strict_instruction"] = _strict_retry_instruction()

    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": MEDICAL_TRANSLATION_SYSTEM},
            {"role": "user", "content": json.dumps(user_content, ensure_ascii=False)},
        ],
        temperature=0.0,
        max_tokens=2000,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content or ""
    parsed = openai_service._extract_json(raw)
    if not isinstance(parsed, dict):
        raise ValueError("Invalid translation JSON from OpenAI")
    return parsed


def _normalize_translated_output(translated: dict, canonical: dict) -> dict:
    findings = translated.get("findings_text")
    if not isinstance(findings, list):
        findings = translated.get("findings")
    if not isinstance(findings, list):
        findings = canonical.get("findings_text") or []

    def clean_list(key: str) -> list[str]:
        val = translated.get(key)
        if not isinstance(val, list):
            return list(canonical.get(key) or []) if key != "findings_text" else list(findings)
        return [str(x).strip() for x in val if str(x).strip()]

    return {
        "summary": str(translated.get("summary") or canonical.get("summary") or "").strip(),
        "attention_level": str(translated.get("attention_level") or canonical.get("attention_level") or "").strip(),
        "findings_text": clean_list("findings_text") if translated.get("findings_text") else [str(x) for x in findings],
        "possible_conditions": clean_list("possible_conditions"),
        "possible_symptoms": clean_list("possible_symptoms"),
        "recommendations": clean_list("recommendations"),
        "disclaimer": str(translated.get("disclaimer") or canonical.get("disclaimer") or "").strip(),
        "language": translated.get("language"),
    }


def translate_canonical(canonical: dict, target_language: str) -> dict:
    target = normalize_language(target_language)
    if target == "en":
        return {
            "summary": canonical.get("summary") or "",
            "attention_level": canonical.get("attention_level") or "",
            "findings_text": list(canonical.get("findings_text") or []),
            "possible_conditions": list(canonical.get("possible_conditions") or []),
            "possible_symptoms": list(canonical.get("possible_symptoms") or []),
            "recommendations": list(canonical.get("recommendations") or []),
            "disclaimer": canonical.get("disclaimer") or "",
            "language": "en",
            "translation_fallback": False,
        }

    payload = canonical_for_translation(canonical)
    errors: list[str] = []

    for strict in (False, True):
        try:
            if config.get_gemini_api_key():
                translated = _translate_with_gemini(payload, target, strict=strict)
            elif config.get_openai_api_key():
                translated = _translate_with_openai(payload, target, strict=strict)
            else:
                raise ValueError("No translation API configured")

            normalized = _normalize_translated_output(translated, canonical)
            normalized["language"] = target
            is_valid, issues = validate_translation(canonical, normalized)
            if is_valid:
                normalized["translation_fallback"] = False
                return normalized
            errors.extend(issues)
            if not strict:
                continue
        except Exception as exc:
            errors.append(str(exc))
            if strict:
                break

    # Safe fallback to English
    return {
        "summary": canonical.get("summary") or "",
        "attention_level": canonical.get("attention_level") or "",
        "findings_text": list(canonical.get("findings_text") or []),
        "possible_conditions": list(canonical.get("possible_conditions") or []),
        "possible_symptoms": list(canonical.get("possible_symptoms") or []),
        "recommendations": list(canonical.get("recommendations") or []),
        "disclaimer": canonical.get("disclaimer") or "",
        "language": "en",
        "translation_fallback": True,
        "translation_error": "Translation validation failed; showing English.",
    }
