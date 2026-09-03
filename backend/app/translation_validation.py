"""Validate that translated medical content preserves critical entities."""

from .structured_adapter import extract_numbers_and_units, UNCERTAINTY_WORDS, SEVERITY_WORDS


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


def validate_translation(canonical: dict, translated: dict) -> tuple[bool, list[str]]:
    """
    Basic safety checks — not clinically validated, but catches obvious mismatches.
    Returns (is_valid, list_of_issues).
    """
    issues: list[str] = []
    source_text = _collect_source_text(canonical).lower()
    target_text = _collect_translated_text(translated).lower()

    source_numbers = extract_numbers_and_units(source_text)
    target_numbers = extract_numbers_and_units(target_text)
    missing_numbers = source_numbers - target_numbers
    if missing_numbers:
        issues.append(f"missing_tokens:{','.join(sorted(missing_numbers))}")

    for word in ("left", "right", "bilateral"):
        if word in source_text and word not in target_text:
            # Laterality may be translated; check common Indic transliterations loosely
            issues.append(f"missing_laterality:{word}")

    for sev in SEVERITY_WORDS:
        if sev in source_text and sev not in target_text:
            issues.append(f"possible_severity_change:{sev}")

    # If source has strong uncertainty, translated should not drop all uncertainty markers
    source_uncertainty = any(u in source_text for u in UNCERTAINTY_WORDS)
    if source_uncertainty:
        # Heuristic: at least one uncertainty-related substring in target (English or preserved)
        has_uncertainty = any(u in target_text for u in UNCERTAINTY_WORDS) or "?" in target_text
        if not has_uncertainty and len(target_text) > 20:
            issues.append("uncertainty_may_be_lost")

    list_keys = ("findings_text", "possible_conditions", "possible_symptoms")
    for key in list_keys:
        src = canonical.get(key) or []
        tgt = translated.get(key) or translated.get("findings") or []
        if isinstance(tgt, list) and len(src) > 0 and len(tgt) == 0:
            issues.append(f"empty_list:{key}")

    return len(issues) == 0, issues
