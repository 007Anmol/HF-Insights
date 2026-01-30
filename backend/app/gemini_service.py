import re
import json
from PIL import Image
import io
from google import genai
from . import config

# Initialize client lazily inside `analyze_xray` to avoid importing
# and creating a client at module import time (which fails if env not set).

def build_prompt(language="en", is_text_report=False):
    if language == "hi":
        language_rule = (
            "Respond only in simple, everyday Hindi. "
            "Use simple medical or technical terms and tell possible medical conditions."+ # noqa: E501
            "Use language a common person can understand."
        )
    else:
        language_rule = (
            "Respond only in simple English. "
            "Use simple medical or technical terms and tell possible medical conditions. "+ # noqa: E501
            "Use easy, clear language."
        )

    if is_text_report:
        task_description = (
            "Extract visible observations (findings) and possible medical conditions from the provided X-ray report text. "+ # noqa: E501
            "Your output should summarize the key findings and potential diagnoses mentioned in the text."
        )
        source_type = "text_report"
    else:
        task_description = "Describe visible observations from the X-ray image and name possible medical conditions."
        source_type = "image"

    return f"""
You are an educational medical imaging assistant.

TASK:
{task_description}

LANGUAGE RULE:
{language_rule}

STRICT RULES:
- Educational use only
- Do NOT suggest treatment
- Do NOT predict outcomes
- Neutral and calm tone

OUTPUT JSON ONLY:
{{
  "xray_type": "chest | limb | dental | spine | unknown",
  "source": "{source_type}",
  "findings": ["observation 1", "observation 2"],
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
            "findings": ["No image bytes or report text provided"],
            "confidence_score": 0.0
        }

    # Create the genai client using the configured API key. Do this lazily
    # so importing this module does not require the env var to be set.
    api_key = config.get_gemini_api_key()
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set")

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=config.MODEL_NAME,
        contents=contents,
        config={
            "temperature": 0.1,
            "max_output_tokens": 512
        }
    )

    raw_text = (response.text or "").strip()

    match = re.search(r"\{[\s\S]*\}", raw_text)
    if not match:
        return {
            "xray_type": "unknown",
            "source": source_type_for_error,
            "findings": ["Unable to generate interpretation"],
            "confidence_score": 0.0
        }

    return json.loads(match.group(0))


def analyze_xray_image(image_bytes: bytes, language="en"):
    """Backward-compatible wrapper used by the HTTP handler.

    Keeps the original core function name `analyze_xray` while exposing
    the `analyze_xray_image` name expected by `app.main`.
    """
    return analyze_xray(image_bytes=image_bytes, language=language)


def analyze_text_report(report_text: str, language="en"):
    """Backward-compatible wrapper for analyzing report text.

    Delegates to `analyze_xray` with the `report_text` argument.
    """
    return analyze_xray(report_text=report_text, language=language)