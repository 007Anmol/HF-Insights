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
    Robustly extract a JSON object from Gemini's response.

    Handles:
    1. Normal JSON
    2. JSON surrounded by extra text
    3. Markdown code fences
    4. Gemini returning a JSON object as a JSON string
    5. Nested/stringified JSON inside fields
    """

    if not text:
        return None

    text = text.strip()

    # Remove markdown code fences.
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)

    # First try the entire response.
    try:
        parsed = json.loads(text)
        return _unwrap_json(parsed)
    except Exception:
        pass

    # Find the first valid JSON object.
    decoder = json.JSONDecoder()

    for match in re.finditer(r"\{", text):
        start = match.start()

        try:
            parsed, _ = decoder.raw_decode(text[start:])
            return _unwrap_json(parsed)
        except Exception:
            continue

    return None


def _unwrap_json(value):
    """
    Recursively unwrap JSON strings that contain JSON objects/lists.
    """

    if isinstance(value, str):
        candidate = value.strip()

        if candidate.startswith("{") or candidate.startswith("["):
            try:
                decoded = json.loads(candidate)
                return _unwrap_json(decoded)
            except Exception:
                return value

        return value

    if isinstance(value, dict):
        result = {}

        for key, item in value.items():
            result[key] = _unwrap_json(item)

        # Gemini can sometimes put the complete analysis object
        # inside the first findings item.
        findings = result.get("findings")

        if isinstance(findings, list) and findings:
            first = findings[0]

            if isinstance(first, dict):
                if "xray_type" in first and "findings" in first:
                    return first

            if isinstance(first, str):
                try:
                    nested = json.loads(first)

                    if isinstance(nested, dict) and "xray_type" in nested:
                        return _unwrap_json(nested)

                except Exception:
                    pass

        return result

    if isinstance(value, list):
        return [_unwrap_json(item) for item in value]

    return value


# ============================================================
# PROMPT
# ============================================================

def build_prompt(language="en", is_text_report=False):

    if language == "hi":
        language_rule = (
            "Respond only in simple, everyday Hindi. "
            "Medical terms ko simple shabdon me samjhao. "
            "Aam aadmi ko samajh aaye aisi bhasha ka use karo.\n"
            "For 'attention_level', you MUST use EXACTLY one of these three:\n"
            "- 'कोई बड़ी चिंता नहीं'\n"
            "- 'आगे निगरानी करें'\n"
            "- 'ध्यान देने की आवश्यकता'"
        )
    else:
        language_rule = (
            "Respond only in simple English. "
            "Explain medical terms in easy, everyday language. "
            "Use words a non-medical person can understand.\n"
            "For 'attention_level', you MUST use EXACTLY one of these three:\n"
            "- 'No Major Concern Detected'\n"
            "- 'Monitor Further'\n"
            "- 'Requires Attention'"
        )

    if is_text_report:
        task_description = (
            "Read the provided X-ray report text and summarize what is mentioned. "
            "Explain the reported findings, commonly associated conditions, "
            "and possible symptoms in simple language."
        )
        source_type = "text_report"
    else:
        task_description = (
            "Look at the X-ray image and describe what is visibly seen. "
            "Identify the anatomical body region as specifically as possible. "
            "For example, if the image is clearly a hand X-ray, return "
            "'hand' rather than the broader category 'limb'. "
            "If it is clearly a wrist X-ray, return 'wrist'. "
            "If it is a knee X-ray, return 'knee'. "
            "Do not use 'limb' when a more specific body part can be identified. "
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
- Provide reliable educational references in the references array.

IMPORTANT X-RAY TYPE RULE:

Identify the body part as specifically as possible.

Examples:
- Hand X-ray -> "hand"
- Wrist X-ray -> "wrist"
- Finger X-ray -> "finger"
- Elbow X-ray -> "elbow"
- Shoulder X-ray -> "shoulder"
- Knee X-ray -> "knee"
- Ankle X-ray -> "ankle"
- Foot X-ray -> "foot"
- Chest X-ray -> "chest"
- Spine X-ray -> "spine"
- Dental X-ray -> "dental"

ONLY use "limb" if the image genuinely cannot be classified
more specifically.

OUTPUT FORMAT:

Return ONE valid JSON object.

DO NOT include:
- markdown
- code fences
- backticks
- explanations outside JSON

Keys must match exactly.

Each list should contain at least 2 items where appropriate.

{{
    "xray_type": "specific body part such as hand, wrist, knee, chest, spine, dental, limb, unknown",
    "source": "{source_type}",
    "attention_level": "Category of attention required",
    "findings": [
        "Simple description of what is visible in the image or report"
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
            "url": "https://authoritative-medical-site.com/"
        }}
    ],
    "confidence_score": 0.0
}}
"""


# ============================================================
# MAIN GEMINI ANALYSIS
# ============================================================
def _normalize_analysis(result):
    """Normalize Gemini output without changing the analysis content."""

    if not isinstance(result, dict):
        return result

    # ----------------------------
    # Normalize X-ray body region
    # ----------------------------
    xray_type = str(result.get("xray_type", "")).strip().lower()

    if any(term in xray_type for term in [
        "hand",
        "right hand",
        "left hand",
        "hand and wrist",
    ]):
        result["xray_type"] = "hand"

    elif "wrist" in xray_type:
        result["xray_type"] = "wrist"

    elif "knee" in xray_type:
        result["xray_type"] = "knee"

    elif "elbow" in xray_type:
        result["xray_type"] = "elbow"

    elif "shoulder" in xray_type:
        result["xray_type"] = "shoulder"

    elif "ankle" in xray_type:
        result["xray_type"] = "ankle"

    elif "foot" in xray_type:
        result["xray_type"] = "foot"

    elif "hip" in xray_type:
        result["xray_type"] = "hip"

    elif "chest" in xray_type:
        result["xray_type"] = "chest"

    elif "spine" in xray_type:
        result["xray_type"] = "spine"

    # ----------------------------
    # Clean reference URLs
    # ----------------------------
    references = result.get("references")

    if isinstance(references, list):
        cleaned_references = []

        for reference in references:
            if not isinstance(reference, dict):
                continue

            title = str(reference.get("title", "")).strip()
            url = str(reference.get("url", "")).strip()

            # Convert Markdown link:
            # [Title](https://example.com)
            markdown_match = re.search(
                r"\]\((https?://[^)]+)\)",
                url
            )

            if markdown_match:
                url = markdown_match.group(1)

            # If URL contains a raw https URL after malformed text,
            # extract the actual URL.
            url_match = re.search(
                r"https?://[^\s\]\)\"']+",
                url
            )

            if url_match:
                url = url_match.group(0)

            # Remove obvious Markdown fragments.
            url = url.replace("[", "").replace("]", "")

            if title or url:
                cleaned_references.append({
                    "title": title,
                    "url": url,
                })

        result["references"] = cleaned_references

    return result


def analyze_xray(
    image_bytes: bytes = None,
    report_text: str = None,
    language="en",
    model_name: str | None = None
):

    contents = None
    source_type_for_error = "unknown"

    # --------------------------------------------------------
    # TEXT REPORT
    # --------------------------------------------------------

    if report_text is not None:

        prompt = build_prompt(
            language,
            is_text_report=True
        )

        contents = [
            prompt,
            report_text
        ]

        source_type_for_error = "text_report"

    # --------------------------------------------------------
    # IMAGE
    # --------------------------------------------------------

    elif image_bytes is not None:

        image = Image.open(
            io.BytesIO(image_bytes)
        ).convert("RGB")

        prompt = build_prompt(
            language,
            is_text_report=False
        )

        contents = [
            prompt,
            image
        ]

        source_type_for_error = "image"

    else:

        return {
            "xray_type": "unknown",
            "source": "unknown",
            "attention_level": (
                "No Major Concern Detected"
                if language != "hi"
                else "कोई बड़ी चिंता नहीं"
            ),
            "findings": [
                "No image or report provided"
            ],
            "possible_conditions": [],
            "possible_symptoms": [],
            "references": [],
            "confidence_score": 0.0
        }

    # --------------------------------------------------------
    # API KEY
    # --------------------------------------------------------

    api_key = config.get_gemini_api_key()

    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    # --------------------------------------------------------
    # GEMINI CLIENT
    # --------------------------------------------------------

    client = genai.Client(
        api_key=api_key
    )

    # Select appropriate model.
    if model_name is None:

        if image_bytes is not None:
            model_name = config.IMAGE_MODEL_NAME
        else:
            model_name = config.TEXT_MODEL_NAME

    # --------------------------------------------------------
    # GEMINI REQUEST
    # --------------------------------------------------------

    response = client.models.generate_content(
        model=model_name,
        contents=contents,
        config={
            "temperature": 0.0,
            "max_output_tokens": 2000,
            "response_mime_type": "application/json",
        }
    )

    raw_text = (
        response.text or ""
    ).strip()

    # --------------------------------------------------------
    # PARSE JSON
    # --------------------------------------------------------

    parsed = _extract_json(raw_text)

    if parsed is not None:

        # Extra safety:
        # make sure xray_type exists.
        if isinstance(parsed, dict):

            if not parsed.get("xray_type"):
                parsed["xray_type"] = "unknown"

            if not parsed.get("source"):
                parsed["source"] = source_type_for_error

        return parsed

    # --------------------------------------------------------
    # FALLBACK
    # --------------------------------------------------------

    summary = (
        raw_text[:300]
        .replace("\n", " ")
        .strip()
        if raw_text
        else "Unable to generate a clear explanation"
    )

    return {
        "xray_type": "unknown",
        "source": source_type_for_error,
        "attention_level": (
            "Monitor Further"
            if language != "hi"
            else "आगे निगरानी करें"
        ),
        "findings": [
            summary or "Unable to generate a clear explanation"
        ],
        "possible_conditions": [],
        "possible_symptoms": [],
        "references": [],
        "confidence_score": 0.0
    }


# ============================================================
# IMAGE ANALYSIS WRAPPER
# ============================================================

def analyze_xray_image(
    image_bytes: bytes,
    language="en"
):
    """
    Wrapper for image-based X-ray analysis.
    """

    return analyze_xray(
        image_bytes=image_bytes,
        language=language,
        model_name=config.IMAGE_MODEL_NAME
    )


# ============================================================
# TEXT REPORT ANALYSIS WRAPPER
# ============================================================

def analyze_text_report(
    report_text: str,
    language="en"
):
    """
    Wrapper for text-report-based X-ray analysis.
    """

    return analyze_xray(
        report_text=report_text,
        language=language,
        model_name=config.TEXT_MODEL_NAME
    )


# ============================================================
# STRUCTURED UI SECTIONS
# ============================================================

def generate_structured_sections(
    insights: dict,
    language="en"
):

    api_key = config.get_gemini_api_key()

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY not set"
        )

    messages = build_structured_sections_messages(
        insights,
        language
    )

    prompt = "\n\n".join(
        message["content"]
        for message in messages
    )

    client = genai.Client(
        api_key=api_key
    )

    response = client.models.generate_content(
        model=config.TEXT_MODEL_NAME,
        contents=[prompt],
        config={
            "temperature": 0.0,
            "max_output_tokens": 1200,
            "response_mime_type": "application/json",
        }
    )

    raw_text = (
        response.text or ""
    ).strip()

    parsed = _extract_json(
        raw_text
    )

    if parsed is None:

        snippet = (
            raw_text[:300]
            .replace("\n", " ")
            if raw_text
            else "empty response"
        )

        raise ValueError(
            "Gemini returned invalid structured sections JSON: "
            + snippet
        )

    return normalize_structured_sections(
        parsed,
        insights
    )
