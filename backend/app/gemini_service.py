import io
import json
import re

from PIL import Image
from google import genai

from . import config
from .openai_service import (
    build_structured_sections_messages,
    normalize_structured_sections,
)


# ============================================================
# JSON HELPERS
# ============================================================

def _extract_json(text: str):
    """
    Safely extract a JSON object from Gemini's response.

    Handles:
    - Normal JSON
    - JSON inside markdown code fences
    - Extra text before/after JSON
    """

    if not text:
        return None

    text = text.strip()

    # Remove markdown code fences if Gemini adds them.
    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE,
    )

    text = re.sub(
        r"\s*```$",
        "",
        text,
    )

    # First try parsing the complete response.
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        pass

    # Find the beginning of a JSON object.
    start = text.find("{")

    if start == -1:
        return None

    decoder = json.JSONDecoder()

    try:
        parsed, _ = decoder.raw_decode(text[start:])
        return parsed
    except (json.JSONDecodeError, TypeError):
        return None


def _fallback_result(
    source_type: str,
    language: str,
    message: str,
):
    if language == "hi":
        attention = "आगे निगरानी करें"
    else:
        attention = "Monitor Further"

    return {
        "xray_type": "unknown",
        "source": source_type,
        "attention_level": attention,
        "findings": [message],
        "possible_conditions": [],
        "possible_symptoms": [],
        "references": [],
        "confidence_score": 0.0,
    }


# ============================================================
# PROMPT
# ============================================================

def build_prompt(
    language="en",
    is_text_report=False,
):

    if language == "hi":

        language_rule = (
            "Respond only in simple, everyday Hindi. "
            "Medical terms ko simple shabdon me samjhao. "
            "Aam aadmi ko samaj aaye aisi bhasha ka use karo.\n"
            "For 'attention_level', you MUST use EXACTLY one of these three "
            "depending on severity:\n"
            "- 'कोई बड़ी चिंता नहीं'\n"
            "- 'आगे निगरानी करें'\n"
            "- 'ध्यान देने की आवश्यकता'"
        )

    else:

        language_rule = (
            "Respond only in simple English. "
            "Explain medical terms in easy, everyday language. "
            "Use words a non-medical person can understand.\n"
            "For 'attention_level', you MUST use EXACTLY one of these three "
            "based on severity:\n"
            "- 'No Major Concern Detected'\n"
            "- 'Monitor Further'\n"
            "- 'Requires Attention'"
        )

    if is_text_report:

        task_description = (
            "Read the provided X-ray report text and summarize what is "
            "actually mentioned in the report. "
            "Explain the reported findings, commonly associated conditions, "
            "and possible symptoms in simple language. "
            "Do not invent findings that are not present in the report."
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

- Educational explanation only.
- DO NOT diagnose the patient.
- DO NOT confirm any disease.
- DO NOT suggest treatment or medication.
- DO NOT predict outcomes.
- Use phrases such as:
  - "may be associated with"
  - "people with similar findings sometimes experience"
- Keep the tone calm, neutral, and reassuring.
- Avoid scary or absolute language.
- For a text report, ONLY summarize information supported by the supplied report.
- Do not invent findings.
- Provide accurate and reliable educational references.
- Prefer authoritative medical websites such as Mayo Clinic, NIH,
  MedlinePlus, or WHO.

X-RAY TYPE:

Select the MOST SPECIFIC anatomical category supported by the image
or report.

Allowed values are ONLY:

- "chest"
- "hand"
- "wrist"
- "elbow"
- "shoulder"
- "foot"
- "ankle"
- "knee"
- "hip"
- "spine"
- "dental"
- "other"
- "unknown"

Examples:

- X-ray of the hand -> "hand"
- X-ray of the wrist -> "wrist"
- X-ray of the elbow -> "elbow"
- X-ray of the shoulder -> "shoulder"
- X-ray of the knee -> "knee"
- X-ray of the ankle -> "ankle"
- X-ray of the foot -> "foot"
- X-ray of the hip -> "hip"
- X-ray of the spine -> "spine"
- Chest X-ray -> "chest"
- Dental X-ray -> "dental"

If both hand and wrist are explicitly mentioned,
use "hand" unless the report is primarily about the wrist.

If the anatomical region cannot be determined,
use "unknown".

OUTPUT REQUIREMENTS:

Return ONLY ONE complete valid JSON object.

DO NOT include:

- Markdown
- Code fences
- Comments
- Explanations outside JSON

The JSON MUST follow this exact structure:

{{
  "xray_type": "chest | hand | wrist | elbow | shoulder | foot | ankle | knee | hip | spine | dental | other | unknown",
  "source": "{source_type}",
  "attention_level": "Category of attention required",
  "findings": [
    "Simple description of what is visible in the image or stated in the report"
  ],
  "possible_conditions": [
    "Common condition this finding may be associated with"
  ],
  "possible_symptoms": [
    "Common symptom in simple everyday words"
  ],
  "references": [
    {{
      "title": "Reliable Medical Source Title",
      "url": "https://authoritative-medical-site.com/example"
    }}
  ],
  "confidence_score": 0.0
}}

IMPORTANT:

- Return complete valid JSON.
- Do not stop in the middle of the JSON.
- Do not return partial JSON.
- Do not put JSON inside a string.
"""


# ============================================================
# GEMINI REQUEST
# ============================================================

def _generate_content(
    client,
    model_name: str,
    contents,
    max_output_tokens: int = 3000,
):

    return client.models.generate_content(
        model=model_name,
        contents=contents,
        config={
            "temperature": 0.0,
            "max_output_tokens": max_output_tokens,
            "response_mime_type": "application/json",
        },
    )


# ============================================================
# MAIN ANALYSIS
# ============================================================

def analyze_xray(
    image_bytes: bytes = None,
    report_text: str = None,
    language="en",
    model_name: str | None = None,
):

    contents = None
    source_type = "unknown"

    # --------------------------------------------------------
    # TEXT REPORT
    # --------------------------------------------------------

    if report_text is not None:

        prompt = build_prompt(
            language,
            is_text_report=True,
        )

        report_text = report_text.strip()

        contents = [
            prompt,
            report_text,
        ]

        source_type = "text_report"

    # --------------------------------------------------------
    # IMAGE
    # --------------------------------------------------------

    elif image_bytes is not None:

        try:

            image = Image.open(
                io.BytesIO(image_bytes)
            ).convert("RGB")

        except Exception as exc:

            raise ValueError(
                f"Unable to read image: {exc}"
            ) from exc

        prompt = build_prompt(
            language,
            is_text_report=False,
        )

        contents = [
            prompt,
            image,
        ]

        source_type = "image"

    else:

        return _fallback_result(
            "unknown",
            language,
            "No image or report was provided.",
        )

    # --------------------------------------------------------
    # API KEY
    # --------------------------------------------------------

    api_key = config.get_gemini_api_key()

    if not api_key:

        raise ValueError(
            "GEMINI_API_KEY not set"
        )

    client = genai.Client(
        api_key=api_key
    )

    # --------------------------------------------------------
    # MODEL
    # --------------------------------------------------------

    if model_name is None:

        if image_bytes is not None:
            model_name = config.IMAGE_MODEL_NAME

        else:
            model_name = config.TEXT_MODEL_NAME

    # --------------------------------------------------------
    # FIRST GEMINI REQUEST
    # --------------------------------------------------------

    try:

        response = _generate_content(
            client=client,
            model_name=model_name,
            contents=contents,
            max_output_tokens=3000,
        )

    except Exception as exc:

        raise RuntimeError(
            f"Gemini request failed: {exc}"
        ) from exc

    raw_text = (
        response.text or ""
    ).strip()

    parsed = _extract_json(
        raw_text
    )

    # --------------------------------------------------------
    # SUCCESS
    # --------------------------------------------------------

    if (
        parsed is not None
        and isinstance(parsed, dict)
    ):

        return parsed

    # --------------------------------------------------------
    # RETRY IF JSON IS INVALID
    # --------------------------------------------------------

    retry_prompt = f"""
The previous Gemini response was not valid complete JSON.

Return ONLY ONE complete valid JSON object.

Do not use markdown.
Do not use code fences.
Do not include explanations.
Do not stop in the middle of the JSON.

Use EXACTLY these keys:

{{
  "xray_type": "chest | hand | wrist | elbow | shoulder | foot | ankle | knee | hip | spine | dental | other | unknown",
  "source": "{source_type}",
  "attention_level": "No Major Concern Detected | Monitor Further | Requires Attention",
  "findings": [
    "...",
    "..."
  ],
  "possible_conditions": [
    "...",
    "..."
  ],
  "possible_symptoms": [
    "...",
    "..."
  ],
  "references": [
    {{
      "title": "...",
      "url": "https://..."
    }}
  ],
  "confidence_score": 0.0
}}

Choose the most specific xray_type supported by the provided image or report.

If the report says "hand and wrist", use "hand" unless the report
is primarily about the wrist.

Return the COMPLETE JSON object now.
"""

    try:

        retry_response = _generate_content(
            client=client,
            model_name=model_name,
            contents=[
                retry_prompt,
                *contents,
            ],
            max_output_tokens=4000,
        )

        retry_text = (
            retry_response.text or ""
        ).strip()

        retry_parsed = _extract_json(
            retry_text
        )

        if (
            retry_parsed is not None
            and isinstance(retry_parsed, dict)
        ):

            return retry_parsed

        raw_text = (
            retry_text
            or raw_text
        )

    except Exception:
        pass

    # --------------------------------------------------------
    # FINAL FALLBACK
    # --------------------------------------------------------

    summary = (
        raw_text[:500]
        .replace("\n", " ")
        .strip()
        if raw_text
        else "Unable to generate a clear explanation."
    )

    return _fallback_result(
        source_type,
        language,
        summary,
    )


# ============================================================
# IMAGE WRAPPER
# ============================================================

def analyze_xray_image(
    image_bytes: bytes,
    language="en",
):

    return analyze_xray(
        image_bytes=image_bytes,
        language=language,
        model_name=config.IMAGE_MODEL_NAME,
    )


# ============================================================
# PDF / TEXT REPORT WRAPPER
# ============================================================

def analyze_text_report(
    report_text: str,
    language="en",
):

    return analyze_xray(
        report_text=report_text,
        language=language,
        model_name=config.TEXT_MODEL_NAME,
    )


# ============================================================
# GENERATE STRUCTURED UI SECTIONS
# ============================================================

def generate_structured_sections(
    insights: dict,
    language="en",
):

    api_key = config.get_gemini_api_key()

    if not api_key:

        raise ValueError(
            "GEMINI_API_KEY not set"
        )

    messages = build_structured_sections_messages(
        insights,
        language,
    )

    prompt = "\n\n".join(
        message["content"]
        for message in messages
    )

    client = genai.Client(
        api_key=api_key
    )

    # --------------------------------------------------------
    # FIRST REQUEST
    # --------------------------------------------------------

    response = _generate_content(
        client=client,
        model_name=config.TEXT_MODEL_NAME,
        contents=[prompt],
        max_output_tokens=3000,
    )

    raw_text = (
        response.text or ""
    ).strip()

    parsed = _extract_json(
        raw_text
    )

    # --------------------------------------------------------
    # RETRY IF INVALID
    # --------------------------------------------------------

    if (
        parsed is None
        or not isinstance(parsed, dict)
    ):

        retry_prompt = """
Return ONLY ONE complete valid JSON object.

Do not use markdown.
Do not use code fences.
Do not include explanations.

Use EXACTLY this structure:

{
  "recommended_actions": [
    {
      "title": "...",
      "bullets": [
        "...",
        "..."
      ]
    }
  ],
  "lifestyle_recommendations": [
    {
      "label": "...",
      "percent": 0,
      "level": "Low | Medium | High"
    }
  ],
  "checklist": [
    "...",
    "..."
  ],
  "seek_medical_attention": [
    "...",
    "..."
  ],
  "ai_confidence": 0,
  "expected_outcome": "..."
}

Return the COMPLETE JSON object.
"""

        try:

            retry_response = _generate_content(
                client=client,
                model_name=config.TEXT_MODEL_NAME,
                contents=[
                    retry_prompt,
                    prompt,
                ],
                max_output_tokens=3000,
            )

            retry_text = (
                retry_response.text or ""
            ).strip()

            parsed = _extract_json(
                retry_text
            )

        except Exception:
            parsed = None

    # --------------------------------------------------------
    # FAILURE
    # --------------------------------------------------------

    if (
        parsed is None
        or not isinstance(parsed, dict)
    ):

        snippet = (
            raw_text[:500]
            .replace("\n", " ")
            if raw_text
            else "empty response"
        )

        raise ValueError(
            "Gemini returned invalid structured sections JSON: "
            f"{snippet}"
        )

    return normalize_structured_sections(
        parsed,
        insights,
    )
