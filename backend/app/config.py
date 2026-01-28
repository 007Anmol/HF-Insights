import os

MODEL_NAME = "gemini-2.5-flash-image"

def get_gemini_api_key():
    return os.getenv("GEMINI_API_KEY")
