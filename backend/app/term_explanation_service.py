"""Explain medical terms using reviewed glossary only — no free-form definitions."""

from __future__ import annotations

from .languages import normalize_language
from .terminology_glossary import find_entry_for_text, resolve_entry_by_term


IMPORTANT_EN = (
    "This explanation is educational and informational. "
    "It does not independently establish a diagnosis."
)


def _report_sentences(canonical: dict) -> list[str]:
    parts: list[str] = []
    for key in ("summary", "attention_level"):
        val = canonical.get(key)
        if isinstance(val, str) and val.strip():
            parts.append(val.strip())
    for key in ("findings_text", "possible_conditions", "possible_symptoms", "recommendations"):
        for item in canonical.get(key) or []:
            if isinstance(item, str) and item.strip():
                parts.append(item.strip())
    return parts


def _in_your_report(entry: dict, matched_phrase: str, canonical: dict, lang_pack: dict) -> str:
    sentences = _report_sentences(canonical)
    phrase_lower = matched_phrase.lower()
    matches = [s for s in sentences if phrase_lower in s.lower()]
    for synonym in entry.get("synonyms") or []:
        syn = str(synonym).lower()
        matches.extend([s for s in sentences if syn in s.lower() and s not in matches])

    context = str(lang_pack.get("clinical_context") or "").strip()
    if matches:
        quote = matches[0]
        if lang_pack.get("in_your_report_template"):
            return str(lang_pack["in_your_report_template"]).format(quote=quote)
        return f'In your report, this appears as: "{quote}". {context}'.strip()
    if context:
        return context
    return str(lang_pack.get("patient_definition") or "").strip()


def _localized_pack(entry: dict, language: str) -> dict | None:
    lang = normalize_language(language)
    pack = entry.get(lang)
    if isinstance(pack, dict) and pack.get("patient_definition"):
        return pack
    pack_en = entry.get("en")
    return pack_en if isinstance(pack_en, dict) else None


def explain_medical_term(canonical: dict, term: str, language: str = "en") -> dict:
    entry = resolve_entry_by_term(term)
    if not entry or entry.get("review_status") != "clinically_reviewed":
        return {
            "verified": False,
            "message": "We couldn't confidently explain this term. Please discuss it with your doctor.",
        }

    matched = term
    _, matched_phrase = find_entry_for_text(term)
    if matched_phrase:
        matched = matched_phrase

    lang = normalize_language(language)
    pack = _localized_pack(entry, lang)
    if not pack:
        return {
            "verified": False,
            "message": "We couldn't confidently explain this term. Please discuss it with your doctor.",
        }

    simple = str(pack.get("patient_definition") or "").strip()
    in_report = _in_your_report(entry, matched, canonical, pack)
    important = str(pack.get("important_note") or IMPORTANT_EN).strip()
    questions = [str(q).strip() for q in (pack.get("discuss_questions") or []) if str(q).strip()][:5]

    if len(questions) < 2:
        questions.extend(
            [
                "What does this finding mean in my case?",
                "Could this relate to my symptoms?",
                "Does this require follow-up?",
            ][: 3 - len(questions)]
        )

    return {
        "verified": True,
        "term": entry.get("term") or matched,
        "matched_phrase": matched,
        "simple_meaning": simple,
        "in_your_report": in_report,
        "important_note": important,
        "doctor_questions": questions[:5],
        "review_status": entry.get("review_status"),
        "reviewed_by": entry.get("reviewed_by"),
        "version": entry.get("version") or "1.0",
        "language": lang,
        "not_confused_with": entry.get("not_confused_with") or [],
        "body_parts": entry.get("body_parts") or [],
    }
