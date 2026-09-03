"""Centralized patient-facing medical terminology glossary (reference for translators)."""

# Keys are English canonical terms; values are optional localized hints used in prompts.
GLOSSARY_TERMS = [
    "fracture",
    "degenerative changes",
    "opacity",
    "consolidation",
    "effusion",
    "inflammation",
    "infection",
    "nodule",
    "mass",
    "dislocation",
    "alignment",
    "soft tissue",
    "clinical correlation",
    "follow-up",
    "possible",
    "cannot exclude",
    "suggestive of",
    "indeterminate",
    "mild",
    "moderate",
    "severe",
    "left",
    "right",
    "bilateral",
]

UNCERTAINTY_PHRASES_EN = [
    "possible",
    "may represent",
    "suggestive of",
    "cannot exclude",
    "suspicious for",
    "indeterminate",
    "likely",
    "unlikely",
    "clinical correlation recommended",
]


def glossary_prompt_block() -> str:
    terms = ", ".join(GLOSSARY_TERMS[:20])
    uncertainty = "; ".join(f'"{p}"' for p in UNCERTAINTY_PHRASES_EN[:8])
    return (
        "Important terminology areas: "
        f"{terms}. "
        f"Preserve uncertainty phrases such as: {uncertainty}. "
        "When helpful, use LOCAL EXPLANATION (English medical term) format."
    )
