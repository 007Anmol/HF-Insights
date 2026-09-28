"""ElevenLabs text-to-speech for report voice answers."""

from __future__ import annotations

import base64
import json
import urllib.error
import urllib.request

from . import config
from .languages import normalize_language, SUPPORTED_LANGUAGES

DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"  # Adam — works well with eleven_multilingual_v2
DEFAULT_MODEL_ID = "eleven_multilingual_v2"
MAX_TTS_CHARS = 2500


def _speech_language(language: str) -> str:
    lang = normalize_language(language)
    return lang if lang in SUPPORTED_LANGUAGES else "en"


def synthesize_speech_base64(text: str, language: str = "en") -> dict:
    api_key = config.get_elevenlabs_api_key()
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not configured")

    cleaned = (text or "").strip()
    if not cleaned:
        raise ValueError("Text is required for speech synthesis")

    if len(cleaned) > MAX_TTS_CHARS:
        cleaned = cleaned[: MAX_TTS_CHARS - 3].rstrip() + "..."

    voice_id = config.get_elevenlabs_voice_id() or DEFAULT_VOICE_ID
    lang = _speech_language(language)

    body_obj = {
        "text": cleaned,
        "model_id": DEFAULT_MODEL_ID,
        "voice_settings": {
            "stability": 0.45,
            "similarity_boost": 0.8,
            "style": 0.0,
            "use_speaker_boost": True,
        },
    }
    payload = json.dumps(body_obj, ensure_ascii=False).encode("utf-8")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    request = urllib.request.Request(
        url,
        data=payload,
        headers={
            "xi-api-key": api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            audio_bytes = response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")[:200]
        raise ValueError(f"ElevenLabs TTS failed ({exc.code}): {detail}") from exc

    if not audio_bytes:
        raise ValueError("ElevenLabs returned empty audio")

    return {
        "audio_base64": base64.b64encode(audio_bytes).decode("ascii"),
        "content_type": "audio/mpeg",
        "language": lang,
        "provider": "elevenlabs",
        "model_id": DEFAULT_MODEL_ID,
    }
