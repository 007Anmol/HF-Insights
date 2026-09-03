"""Supported patient-facing languages for HF Insights."""

SUPPORTED_LANGUAGES = ("en", "hi", "mr", "te", "pa", "ta")

LANGUAGE_LABELS = {
    "en": "English",
    "hi": "हिन्दी",
    "mr": "मराठी",
    "te": "తెలుగు",
    "pa": "ਪੰਜਾਬੀ",
    "ta": "தமிழ்",
}

LANGUAGE_NAMES_EN = {
    "en": "English",
    "hi": "Hindi",
    "mr": "Marathi",
    "te": "Telugu",
    "pa": "Punjabi",
    "ta": "Tamil",
}


def normalize_language(code: str | None) -> str:
    if not code:
        return "en"
    normalized = str(code).strip().lower()
    return normalized if normalized in SUPPORTED_LANGUAGES else "en"
