from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app import gemini_service
from app import config
from PyPDF2 import PdfReader
import io

app = FastAPI(
    title="X-ray Analysis API",
    description="Educational X-ray and report analysis using Google Gemini",
    version="1.0.0",
)

# 🔹 Render / Mobile CORS (OPEN for launch, restrict later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # later: ["https://your-app-domain.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 🔹 Health check (used by Render + warm-up)
@app.get("/health")
@app.head("/health")
def health():
    return {"ok": True}

# ============================
# IMAGE ANALYSIS
# ============================
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

# ============================
# PDF REPORT ANALYSIS
# ============================
@app.post("/analyze-report-pdf")
async def analyze_report_pdf(
    file: UploadFile = File(...),
    language: str = "en"
):
    if not config.get_gemini_api_key():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GEMINI_API_KEY not set"
        )

    if file.content_type not in ("application/pdf", None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )

    try:
        pdf_bytes = await file.read()
        reader = PdfReader(io.BytesIO(pdf_bytes))

        text_parts = []
        for page in reader.pages:
            extracted = page.extract_text() or ""
            if extracted:
                text_parts.append(extracted)

        report_text = "\n\n".join(text_parts).strip()

        if not report_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to extract text from PDF"
            )

        return gemini_service.analyze_text_report(
            report_text=report_text,
            language=language
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
