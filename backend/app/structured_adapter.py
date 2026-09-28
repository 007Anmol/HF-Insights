"""Adapter: raw AI analysis JSON → canonical structured medical result (English source of truth)."""

import re
from typing import Any

from .confidence_service import attach_confidence_to_analysis

SEVERITY_WORDS = ("mild", "moderate", "severe")
UNCERTAINTY_WORDS = (
    "possible",
    "may represent",
    "suggestive of",
    "cannot exclude",
    "suspicious for",
    "indeterminate",
    "likely",
    "unlikely",
)
LATERALITY_WORDS = ("left", "right", "bilateral")


def _extract_from_text(text: str) -> dict[str, str | None]:
    lower = text.lower()
    severity = next((w for w in SEVERITY_WORDS if w in lower), None)
    uncertainty = next((w for w in UNCERTAINTY_WORDS if w in lower), None)
    laterality = next((w for w in LATERALITY_WORDS if w in lower), None)
    return {
        "severity": severity,
        "uncertainty": uncertainty,
        "laterality": laterality,
    }


def _string_list(value: Any, limit: int = 12) -> list[str]:
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        if isinstance(item, str) and item.strip():
            out.append(item.strip())
        elif isinstance(item, dict):
            text = str(item.get("description") or item.get("name") or item.get("text") or "").strip()
            if text:
                out.append(text)
        if len(out) >= limit:
            break
    return out


def build_structured_finding(description: str) -> dict:
    meta = _extract_from_text(description)
    return {
        "name": description[:120],
        "description": description,
        "location": None,
        "laterality": meta["laterality"],
        "severity": meta["severity"],
        "uncertainty": meta["uncertainty"],
    }


def to_canonical(raw: dict) -> dict:
    """Normalize raw model output into canonical English structured result."""
    if not isinstance(raw, dict):
        raw = {}

    findings_raw = _string_list(raw.get("findings"))
    structured_findings = [build_structured_finding(f) for f in findings_raw]

    canonical = {
        "summary": findings_raw[0] if findings_raw else "",
        "xray_type": str(raw.get("xray_type") or "unknown").strip(),
        "source": str(raw.get("source") or "image").strip(),
        "attention_level": str(raw.get("attention_level") or "").strip(),
        "findings": structured_findings,
        "findings_text": findings_raw,
        "possible_conditions": _string_list(raw.get("possible_conditions")),
        "possible_symptoms": _string_list(raw.get("possible_symptoms")),
        "references": raw.get("references") if isinstance(raw.get("references"), list) else [],
        "recommendations": _string_list(raw.get("recommendations"), limit=6),
        "confidence_score": raw.get("confidence_score"),
        "disclaimer": (
            "HF Insights provides educational insights only. This is not a medical diagnosis. "
            "Always consult a healthcare professional for medical advice."
        ),
    }

    return attach_confidence_to_analysis(canonical)


def canonical_for_translation(canonical: dict) -> dict:
    """Minimal payload for translation — no patient identifiers."""
    return {
        "summary": canonical.get("summary"),
        "xray_type": canonical.get("xray_type"),
        "attention_level": canonical.get("attention_level"),
        "findings_text": canonical.get("findings_text") or [],
        "possible_conditions": canonical.get("possible_conditions") or [],
        "possible_symptoms": canonical.get("possible_symptoms") or [],
        "recommendations": canonical.get("recommendations") or [],
        "disclaimer": canonical.get("disclaimer"),
    }


def extract_numbers_and_units(text: str) -> set[str]:
    tokens: set[str] = set()
    for match in re.finditer(r"\b\d+(?:\.\d+)?\s?(?:mm|cm|mL|ml|%)?\b", text, re.IGNORECASE):
        tokens.add(match.group(0).lower())
    for word in ("left", "right", "bilateral", *SEVERITY_WORDS, *UNCERTAINTY_WORDS):
        if word in text.lower():
            tokens.add(word)
    return tokens
