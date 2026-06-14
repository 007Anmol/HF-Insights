import re
import json
from PIL import Image
import io
from google import genai
from . import config
from .openai_service import build_structured_sections_messages, normalize_structured_sections


def _extract_json(text: str):
    text = (text or "").strip()
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


def analyze_xray(image_bytes: bytes = None, report_text: str = None, language="en", model_name: str | None = None):
    contents = None
    prompt = None
    source_type_for_error = "unknown"

    if report_text is not None:
        prompt = build_prompt(language, is_text_report=True)
        contents = [prompt, report_text]
        source_type_for_error = "text_report"

    elif image_bytes is not None:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        prompt = build_prompt(language, is_text_report=False)
        contents = [prompt, image]
        source_type_for_error = "image"

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

    api_key = config.get_gemini_api_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)

    # Choose model if not explicitly provided
    if model_name is None:
        if image_bytes is not None:
            model_name = config.IMAGE_MODEL_NAME
        else:
            model_name = config.TEXT_MODEL_NAME

    response = client.models.generate_content(
        model=model_name,
        contents=contents,
        config={
            "temperature": 0.0,
            "max_output_tokens": 2000,
            "response_mime_type": "application/json",
        }
    )

    raw_text = (response.text or "").strip()

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
    """Wrapper for image-based X-ray analysis"""
    return analyze_xray(image_bytes=image_bytes, language=language, model_name=config.IMAGE_MODEL_NAME)


def analyze_text_report(report_text: str, language="en"):
    """Wrapper for text-report-based X-ray analysis"""
    return analyze_xray(report_text=report_text, language=language, model_name=config.TEXT_MODEL_NAME)


def generate_structured_sections(insights: dict, language="en"):
    api_key = config.get_gemini_api_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    messages = build_structured_sections_messages(insights, language)
    prompt = "\n\n".join(message["content"] for message in messages)

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=config.TEXT_MODEL_NAME,
        contents=[prompt],
        config={
            "temperature": 0.0,
            "max_output_tokens": 1200,
            "response_mime_type": "application/json",
        }
    )

    raw_text = (response.text or "").strip()

    parsed = _extract_json(raw_text)
    if parsed is None:
        snippet = raw_text[:300].replace("\n", " ") or "empty response"
        raise ValueError(f"Gemini returned invalid structured sections JSON: {snippet}")

    return normalize_structured_sections(parsed, insights)
