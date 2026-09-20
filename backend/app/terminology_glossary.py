"""Load clinically reviewed medical terminology glossary."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

GLOSSARY_PATH = Path(__file__).resolve().parent.parent / "data" / "medical_terminology_glossary.json"


@lru_cache(maxsize=1)
def load_glossary() -> dict:
    with GLOSSARY_PATH.open(encoding="utf-8") as handle:
        return json.load(handle)


def list_glossary_entries() -> list[dict]:
    data = load_glossary()
    entries = data.get("entries") or []
    return [entry for entry in entries if entry.get("review_status") == "clinically_reviewed"]


def _match_phrases(entry: dict) -> list[str]:
    phrases = [str(entry.get("term") or "").strip()]
    for synonym in entry.get("synonyms") or []:
        text = str(synonym).strip()
        if text:
            phrases.append(text)
    unique: dict[str, str] = {}
    for phrase in phrases:
        if phrase:
            unique[phrase.lower()] = phrase
    return sorted(unique.values(), key=len, reverse=True)


def find_entry_for_text(text: str) -> tuple[dict | None, str | None]:
    """Return (entry, matched_phrase) for the longest glossary match in text."""
    if not text:
        return None, None
    lower = text.lower()
    for entry in list_glossary_entries():
        for phrase in _match_phrases(entry):
            if phrase.lower() in lower:
                return entry, phrase
    return None, None


def resolve_entry_by_term(term: str) -> dict | None:
    if not term:
        return None
    needle = term.strip().lower()
    for entry in list_glossary_entries():
        for phrase in _match_phrases(entry):
            if phrase.lower() == needle:
                return entry
    return find_entry_for_text(term)[0]
