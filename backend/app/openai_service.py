import json
import base64
import logging
from openai import OpenAI
from . import config

def build_prompt(language="en", is_text_report=False):
    if language == "hi":
        language_rule = (
            "Respond only in simple, everyday Hindi. "
            "Medical terms ko simple shabdon me samjhao. "
            "Aam aadmi ko samajh aaye aisi bhasha ka use karo.\n"
            "For 'attention_level', you MUST use EXACTLY one of these three depending on severity:\n"
            "- 'कोई बड़ी चिंता नहीं' (No Major Concern Detected)\n"
            "- 'आगे निगरानी करें' (Monitor Further)\n"
            "- 'ध्यान देने की आवश्यकता' (Requires Attention)"
        )
    else:
        language_rule = (
            "Respond only in simple English. "
            "Explain medical terms in easy, everyday language. "
            "Use words a non-medical person can understand.\n"
            "For 'attention_level', you MUST use EXACTLY one of these three based on severity:\n"
            "- 'No Major Concern Detected'\n"
            "- 'Monitor Further'\n"
            "- 'Requires Attention'"
        )

    if is_text_report:
        task_description = (
            "Read the provided X-ray report text and summarize what is mentioned. "
            "Explain the visible findings, commonly associated conditions, "
            "and possible symptoms in simple language."
        )
        source_type = "text_report"
    else:
        task_description = (
            "Look at the X-ray image and describe what is visibly seen. "
            "Explain what such findings are commonly associated with and "
            "what symptoms people with similar findings may experience."
        )
        source_type = "image"

    return f"""
You are an educational medical imaging assistant.

TASK:
{task_description}

LANGUAGE RULE:
{language_rule}

STRICT RULES:
- Educational explanation only
- DO NOT diagnose the patient
- DO NOT confirm any disease
- DO NOT suggest treatment or medication
- DO NOT predict outcomes
- Use phrases like:
    - "may be associated with"
    - "people with similar findings sometimes experience"
- Keep tone calm, neutral, and reassuring
- Avoid scary or absolute language
- Provide accurate, highly reliable educational references in the 'references' array, linking to authoritative medical websites (e.g., Mayo Clinic, NIH, WHO) related to the findings.

OUTPUT FORMAT:
- Return a SINGLE valid JSON object
- DO NOT include code fences, markdown, backticks, or extra text
- DO NOT include comments or explanations outside JSON
- Keys must match exactly as shown below
- Each list must contain at least 2 items (except references, which can have 1 or more)

{{
    "xray_type": "chest | limb | dental | spine | unknown",
    "source": "{source_type}",
    "attention_level": "Category of attention required",
    "findings": [
        "Simple description of what is visible in the image or report"
    ],
    "possible_conditions": [
        "Common condition this finding may be associated with (non-confirming)"
    ],
    "possible_symptoms": [
        "Common symptom in simple everyday words"
    ],
    "references": [
        {{"title": "Reliable Medical Source Title", "url": "https://authoritative-medical-site.com/..."}}
    ],
    "confidence_score": 0.0
}}
"""

import re

def _extract_json(text: str):
    text = text.strip()
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    try:
        return json.loads(text)
    except Exception:
        return None

def analyze_xray(image_bytes: bytes = None, report_text: str = None, language="en"):
    prompt = None
    source_type_for_error = "unknown"
    messages = []

    if report_text is not None:
        prompt = build_prompt(language, is_text_report=True)
        source_type_for_error = "text_report"
        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": report_text}
        ]
        model_name = "gpt-4o-mini"
    elif image_bytes is not None:
        prompt = build_prompt(language, is_text_report=False)
        source_type_for_error = "image"
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        messages = [
            {"role": "system", "content": prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this X-ray image according to the system prompt rules."},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ]
        model_name = "gpt-4o"
    else:
        return {
            "xray_type": "unknown",
            "source": "unknown",
            "attention_level": "No Major Concern Detected" if language != "hi" else "कोई बड़ी चिंता नहीं",
            "findings": ["No image or report provided"],
            "possible_conditions": [],
            "possible_symptoms": [],
            "references": [],
            "confidence_score": 0.0
        }

    api_key = config.get_openai_api_key()
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")

    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            temperature=0.0,
            max_tokens=2000,
            response_format={ "type": "json_object" }
        )
        raw_text = response.choices[0].message.content or ""
    except Exception as e:
        logging.error(f"OpenAI API Error: {str(e)}")
        raise e

    parsed = _extract_json(raw_text)
    if parsed is not None:
        return parsed

    summary = raw_text[:300].replace("\n", " ").strip() if raw_text else "Unable to generate a clear explanation"
    return {
        "xray_type": "unknown",
        "source": source_type_for_error,
        "attention_level": "Monitor Further" if language != "hi" else "आगे निगरानी करें",
        "findings": [summary or "Unable to generate a clear explanation"],
        "possible_conditions": [],
        "possible_symptoms": [],
        "references": [],
        "confidence_score": 0.0
    }

def analyze_xray_image(image_bytes: bytes, language="en"):
    return analyze_xray(image_bytes=image_bytes, language=language)

def analyze_text_report(report_text: str, language="en"):
    return analyze_xray(report_text=report_text, language=language)


def _to_string_list(value, limit=6):
    if not isinstance(value, list):
        return []

    items = []
    for item in value:
        if isinstance(item, str):
            text = item.strip()
        elif isinstance(item, dict):
            text = str(item.get("text") or item.get("title") or item.get("label") or "").strip()
        else:
            text = str(item).strip()

        if text:
            items.append(text)

        if len(items) >= limit:
            break

    return items


def _clamp_percent(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        return 0

    if 0 < number <= 1:
        number *= 100

    return max(0, min(100, round(number)))


def normalize_structured_sections(parsed: dict, insights: dict):
    if not isinstance(parsed, dict):
        raise ValueError("Structured sections response was not a JSON object")

    recommended_actions = []
    for item in parsed.get("recommended_actions", []):
        if isinstance(item, dict):
            title = str(item.get("title") or item.get("label") or "").strip()
            bullets = _to_string_list(item.get("bullets"), limit=4)
        else:
            title = str(item).strip()
            bullets = []

        if title:
            recommended_actions.append({"title": title, "bullets": bullets})

        if len(recommended_actions) >= 6:
            break

    lifestyle_recommendations = []
    for item in parsed.get("lifestyle_recommendations", []):
        if not isinstance(item, dict):
            continue

        label = str(item.get("label") or item.get("title") or "").strip()
        if not label:
            continue

        level = str(item.get("level") or "Medium").strip().title()
        if level not in ("Low", "Medium", "High"):
            level = "Medium"

        lifestyle_recommendations.append({
            "label": label,
            "percent": _clamp_percent(item.get("percent")),
            "level": level,
        })

        if len(lifestyle_recommendations) >= 6:
            break

    confidence_score = insights.get("confidence_score")
    fallback_confidence = _clamp_percent(confidence_score)

    return {
        "recommended_actions": recommended_actions,
        "lifestyle_recommendations": lifestyle_recommendations,
        "checklist": _to_string_list(parsed.get("checklist"), limit=6),
        "seek_medical_attention": _to_string_list(parsed.get("seek_medical_attention"), limit=6),
        "ai_confidence": _clamp_percent(parsed.get("ai_confidence") if parsed.get("ai_confidence") is not None else fallback_confidence),
        "expected_outcome": str(parsed.get("expected_outcome") or "").strip(),
    }


def build_structured_sections_messages(insights: dict, language="en"):
    if language == "hi":
        language_rule = "Respond only in simple, everyday Hindi."
    else:
        language_rule = "Respond only in simple English."

    prompt = f"""
You are an educational medical imaging assistant creating UI-ready follow-up sections from an already generated X-ray insight JSON.

LANGUAGE RULE:
{language_rule}

STRICT RULES:
- Generate content from the provided insights only
- Do not use canned default recommendations
- Do not diagnose the patient
- Do not suggest medication or treatment
- Keep wording calm, educational, and non-alarming
- Use concise, plain language suitable for a mobile results page
- Return a single valid JSON object only
""".strip()

    user_content = f"Here are the insights from the X-ray analysis:\n{json.dumps(insights, ensure_ascii=False, indent=2)}\n\n"
    user_content += (
        "Produce exactly these keys:\n"
        "- recommended_actions: array of objects {title: string, bullets: [string]}\n"
        "- lifestyle_recommendations: array of objects {label: string, percent: number from 0 to 100, level: 'Low'|'Medium'|'High'}\n"
        "- checklist: array of short strings\n"
        "- seek_medical_attention: array of short strings\n"
        "- ai_confidence: number from 0 to 100\n"
        "- expected_outcome: short educational string\n"
        "Make every list 2-6 items when the insights contain enough detail. Return JSON only."
    )

    return [
        {"role": "system", "content": prompt},
        {"role": "user", "content": user_content},
    ]


def generate_structured_sections(insights: dict, language="en"):
    """Generate UI-friendly sections (recommended actions, lifestyle, checklist, warnings,
    ai confidence and expected outcome) based on existing insights JSON.
    Returns a JSON-serializable dict.
    """
    api_key = config.get_openai_api_key()
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set")

    client = OpenAI(api_key=api_key)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=build_structured_sections_messages(insights, language),
            temperature=0.0,
            max_tokens=800,
            response_format={"type": "json_object"}
        )
        raw_text = response.choices[0].message.content or ""
    except Exception as e:
        raise e

    parsed = _extract_json(raw_text)
    if parsed is not None:
        return normalize_structured_sections(parsed, insights)

    raise ValueError("OpenAI returned invalid structured sections JSON")
