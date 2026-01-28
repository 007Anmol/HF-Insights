"""Package initializer for backend.app

This file ensures `app` is a package so uvicorn can import `app.main`.
"""

__all__ = ["main", "config", "gemini_service"]
