from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from pydantic import BaseModel
from app import gemini_service
from app import config

app = FastAPI(
    title="X-ray Analysis API",
    description="Educational X-ray and report analysis using Google Gemini",
    version="1.0.0",
)

class TextReportRequest(BaseModel):
    report_text: str
    language: str = "en"


@app.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    language: str = "en"
):
    if not config.get_gemini_api_key():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY not set"
        )

    try:
        image_bytes = await file.read()
        return gemini_service.analyze_xray_image(
            image_bytes=image_bytes,
            language=language
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@app.post("/analyze-report")
async def analyze_report(request: TextReportRequest):
    if not config.get_gemini_api_key():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY not set"
        )

    try:
        return gemini_service.analyze_text_report(
            report_text=request.report_text,
            language=request.language
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
