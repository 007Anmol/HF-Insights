"""Validate that translated medical content preserves critical entities."""

import re

from .languages import normalize_language


def _collect_source_text(canonical: dict) -> str:
    parts: list[str] = []
    for key in ("summary", "attention_level", "disclaimer"):
        val = canonical.get(key)
        if isinstance(val, str):
            parts.append(val)
    for key in ("findings_text", "possible_conditions", "possible_symptoms", "recommendations"):
        for item in canonical.get(key) or []:
            if isinstance(item, str):
                parts.append(item)
    return "\n".join(parts)


def _collect_translated_text(translated: dict) -> str:
    parts: list[str] = []
    for key in ("summary", "attention_level", "disclaimer", "title"):
        val = translated.get(key)
        if isinstance(val, str):
            parts.append(val)
    for key in ("findings", "findings_text", "possible_conditions", "possible_symptoms", "recommendations"):
        for item in translated.get(key) or []:
            if isinstance(item, str):
                parts.append(item)
    return "\n".join(parts)


def extract_measurements(text: str) -> set[str]:
    """Numeric values and units only — safe to compare across languages."""
    tokens: set[str] = set()
    for match in re.finditer(r"\b\d+(?:\.\d+)?\s?(?:mm|cm|ml|mL|%)\b", text, re.IGNORECASE):
        tokens.add(re.sub(r"\s+", "", match.group(0).lower()))
    return tokens


def validate_translation(
    canonical: dict,
    translated: dict,
    target_language: str = "en",
) -> tuple[bool, list[str]]:
    """
    Basic safety checks — not clinically validated, but catches obvious mismatches.
    English-only word checks are skipped for non-English targets because valid
    translations naturally use the target language.
    """
    issues: list[str] = []
    target_lang = normalize_language(target_language)
    source_text = _collect_source_text(canonical)
    target_text = _collect_translated_text(translated)

    source_measurements = extract_measurements(source_text)
    target_measurements = extract_measurements(target_text)
    missing_measurements = source_measurements - target_measurements
    if missing_measurements:
        issues.append(f"missing_measurements:{','.join(sorted(missing_measurements))}")

    list_keys = ("findings_text", "possible_conditions", "possible_symptoms")
    for key in list_keys:
        src = canonical.get(key) or []
        tgt = translated.get(key) or translated.get("findings") or []
        if isinstance(src, list) and len(src) > 0:
            if not isinstance(tgt, list) or len(tgt) == 0:
                issues.append(f"empty_list:{key}")

    if target_lang != "en":
        # Translated text should differ from source when source is non-empty English content.
        if source_text.strip() and target_text.strip():
            if source_text.strip().lower() == target_text.strip().lower():
                issues.append("translation_unchanged")
        return len(issues) == 0, issues

    # English target — stricter checks
    source_lower = source_text.lower()
    target_lower = target_text.lower()

    for word in ("left", "right", "bilateral"):
        if word in source_lower and word not in target_lower:
            issues.append(f"missing_laterality:{word}")

    from .structured_adapter import SEVERITY_WORDS, UNCERTAINTY_WORDS

    for sev in SEVERITY_WORDS:
        if sev in source_lower and sev not in target_lower:
            issues.append(f"possible_severity_change:{sev}")

    source_uncertainty = any(u in source_lower for u in UNCERTAINTY_WORDS)
    if source_uncertainty:
        has_uncertainty = any(u in target_lower for u in UNCERTAINTY_WORDS) or "?" in target_text
        if not has_uncertainty and len(target_text) > 20:
            issues.append("uncertainty_may_be_lost")

    return len(issues) == 0, issues
