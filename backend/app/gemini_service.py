import re
import json
from PIL import Image
import io
from google import genai
from . import config


def build_prompt(language="en", is_text_report=False):
    if language == "hi":
        language_rule = (
            "Respond only in simple, everyday Hindi. "
            "Medical terms ko simple shabdon me samjhao. "
            "Aam aadmi ko samajh aaye aisi bhasha ka use karo."
        )
    else:
        language_rule = (
            "Respond only in simple English. "
            "Explain medical terms in easy, everyday language. "
            "Use words a non-medical person can understand."
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

OUTPUT JSON ONLY:
{{
  "xray_type": "chest | limb | dental | spine | unknown",
  "source": "{source_type}",
  "findings": [
    "Simple description of what is visible in the image or report"
  ],
  "possible_conditions": [
    "Common condition this finding may be associated with (non-confirming)"
  ],
  "possible_symptoms": [
    "Common symptom in simple everyday words"
  ],
  "confidence_score": 0.0
}}
"""
    

def analyze_xray(image_bytes: bytes = None, report_text: str = None, language="en"):
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
            "findings": ["No image or report provided"],
            "possible_conditions": [],
            "possible_symptoms": [],
            "confidence_score": 0.0
        }

    api_key = config.get_gemini_api_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=config.MODEL_NAME,
        contents=contents,
        config={
            "temperature": 0.1,
            "max_output_tokens": 600
        }
    )

    raw_text = (response.text or "").strip()

    match = re.search(r"\{[\s\S]*\}", raw_text)
    if not match:
        return {
            "xray_type": "unknown",
            "source": source_type_for_error,
            "findings": ["Unable to generate a clear explanation"],
            "possible_conditions": [],
            "possible_symptoms": [],
            "confidence_score": 0.0
        }

    return json.loads(match.group(0))


def analyze_xray_image(image_bytes: bytes, language="en"):
    """Wrapper for image-based X-ray analysis"""
    return analyze_xray(image_bytes=image_bytes, language=language)


def analyze_text_report(report_text: str, language="en"):
    """Wrapper for text-report-based X-ray analysis"""
    return analyze_xray(report_text=report_text, language=language)
