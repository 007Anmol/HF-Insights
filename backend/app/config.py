import os

IMAGE_MODEL_NAME = "gemini-2.5-flash-image"
TEXT_MODEL_NAME = "gemini-2.5-flash"

def get_gemini_api_key():
    return os.getenv("GEMINI_API_KEY")
