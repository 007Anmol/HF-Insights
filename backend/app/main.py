from fastapi import FastAPI, UploadFile, File, HTTPException, status
from pydantic import BaseModel
from . import gemini_service
from . import config

app = FastAPI(
    title="X-ray Analysis API",
    description="API for analyzing X-ray images and text reports using Google Gemini",
    version="1.0.0",
)

class TextReportRequest(BaseModel):
    report_text: str
    language: str = "en"

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...), language: str = "en"):
    if not config.get_gemini_api_key():
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GEMINI_API_KEY not set")

    try:
        image_bytes = await file.read()
        result = gemini_service.analyze_xray(image_bytes=image_bytes, language=language)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@app.post("/analyze-report")
async def analyze_report(request: TextReportRequest):
    if not config.get_gemini_api_key():
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="GEMINI_API_KEY not set")

    try:
        result = gemini_service.analyze_xray(report_text=request.report_text, language=request.language)
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))