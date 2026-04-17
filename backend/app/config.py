import os

IMAGE_MODEL_NAME = "gemini-2.5-flash-image"
TEXT_MODEL_NAME = "gemini-2.5-flash"

def get_gemini_api_key():
    return os.getenv("GEMINI_API_KEY")


def get_supabase_url():
    return os.getenv("SUPABASE_URL")


def get_supabase_anon_key():
    return os.getenv("SUPABASE_ANON_KEY")


def get_supabase_service_role_key():
    return os.getenv("SUPABASE_SERVICE_ROLE_KEY")


def get_storage_bucket_name():
    return os.getenv("SUPABASE_STORAGE_BUCKET", "scans")
