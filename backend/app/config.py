import os

IMAGE_MODEL_NAME = "gemini-2.5-flash-image"
TEXT_MODEL_NAME = "gemini-2.5-flash"


def _clean_env_value(key_name: str) -> str | None:
    raw = os.getenv(key_name)
    if raw is None:
        return None

    value = raw.strip()

    # Tolerate accidental paste of `KEY=value` into env dashboards.
    prefix = f"{key_name}="
    if value.startswith(prefix):
        value = value[len(prefix):].strip()

    return value or None

def get_gemini_api_key():
    return _clean_env_value("GEMINI_API_KEY")


def get_supabase_url():
    return _clean_env_value("SUPABASE_URL")


def get_supabase_anon_key():
    return _clean_env_value("SUPABASE_ANON_KEY")


def get_supabase_service_role_key():
    return _clean_env_value("SUPABASE_SERVICE_ROLE_KEY")


def get_storage_bucket_name():
    return _clean_env_value("SUPABASE_STORAGE_BUCKET") or "scans"
