"""
Confidence / uncertainty processing for HF Insights.

Gemini/OpenAI return a numeric confidence_score from the model prompt.
These are NOT clinically calibrated disease probabilities.
We map them to labeled categories for patient-facing UI.
"""

from typing import Any

CONFIDENCE_CATEGORIES = (
    "HIGH",
    "MODERATE",
    "LOW",
    "INSUFFICIENT_INFORMATION",
)

CONFIDENCE_UI_LABELS = {
    "HIGH": "High",
    "MODERATE": "Moderate",
    "LOW": "Low",
    "INSUFFICIENT_INFORMATION": "Insufficient Information",
}

PATIENT_DISCLAIMER = (
    "AI confidence reflects how strongly the AI supports this finding. "
    "It is not a medical diagnosis or a clinically validated disease probability."
)


def _normalize_score(raw: Any) -> float | None:
    if raw is None:
        return None
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    if 0 < value <= 1:
        value *= 100
    if value < 0 or value > 100:
        return None
    return value


def categorize_confidence(raw_score: Any, findings: list | None = None) -> dict:
    """
    Convert raw model output to a safe patient-facing confidence representation.
    Raw score is preserved internally but UI should prefer category labels.
    """
    score = _normalize_score(raw_score)
    has_findings = bool(findings and len(findings) > 0)

    if not has_findings and score is None:
        category = "INSUFFICIENT_INFORMATION"
    elif score is None or score <= 0:
        category = "INSUFFICIENT_INFORMATION"
    elif score >= 75:
        category = "HIGH"
    elif score >= 45:
        category = "MODERATE"
    else:
        category = "LOW"

    return {
        "level": category,
        "label": CONFIDENCE_UI_LABELS[category],
        "raw_score": score,
        "type": "ai_estimated",
        "is_calibrated": False,
        "disclaimer": PATIENT_DISCLAIMER,
    }


def attach_confidence_to_analysis(analysis: dict) -> dict:
    findings = analysis.get("findings") if isinstance(analysis.get("findings"), list) else []
    confidence = categorize_confidence(analysis.get("confidence_score"), findings)
    analysis["confidence"] = confidence
    # Keep legacy field for backward compatibility but do not encourage % display
    analysis["confidence_score"] = confidence["raw_score"] if confidence["raw_score"] is not None else 0
    return analysis
