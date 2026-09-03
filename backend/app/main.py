from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from app import gemini_service
from app import openai_service
from app import config
from app.structured_adapter import to_canonical
from app.translation_service import translate_canonical
from app.doctor_questions_service import generate_doctor_questions
from app.ask_report_service import ask_report_question
from app.languages import SUPPORTED_LANGUAGES, LANGUAGE_LABELS, normalize_language
from PyPDF2 import PdfReader
from urllib import request as urlrequest, error as urlerror
from urllib.parse import quote
import io
import json

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


def _supabase_request(method: str, path: str, token: str, body: dict | None = None, use_service_role: bool = False):
    supabase_url = config.get_supabase_url()
    if not supabase_url:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SUPABASE_URL not set")

    key = config.get_supabase_service_role_key() if use_service_role else config.get_supabase_anon_key()
    if not key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Supabase credentials not set")

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {token}",
    }
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")

    req = urlrequest.Request(f"{supabase_url}{path}", data=data, headers=headers, method=method)
    try:
        with urlrequest.urlopen(req, timeout=20) as resp:
            payload = resp.read().decode("utf-8")
            return resp.status, payload
    except urlerror.HTTPError as exc:
        payload = exc.read().decode("utf-8") if exc.fp else str(exc)
        return exc.code, payload


@app.delete("/account/delete")
async def delete_account(request: Request):
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    access_token = auth_header.split(" ", 1)[1].strip()
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    if not config.get_supabase_service_role_key():
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SUPABASE_SERVICE_ROLE_KEY not set")

    if not config.get_supabase_url():
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="SUPABASE_URL not set")

    user_status, user_payload = _supabase_request("GET", "/auth/v1/user", access_token)
    if user_status != 200:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")

    user_info = json.loads(user_payload)
    user_id = user_info.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unable to identify user")

    supabase_url = config.get_supabase_url().rstrip("/")
    service_role_key = config.get_supabase_service_role_key()
    storage_bucket = config.get_storage_bucket_name()

    scan_query = f"{supabase_url}/rest/v1/scans?select=id,storage_path&user_id=eq.{quote(user_id)}"
    scan_headers = {
        "apikey": service_role_key,
        "Authorization": f"Bearer {service_role_key}",
        "Accept": "application/json",
    }

    scans_request = urlrequest.Request(scan_query, headers=scan_headers, method="GET")
    deleted_storage_files = 0
    payload = None
    try:
        with urlrequest.urlopen(scans_request, timeout=20) as resp:
            scans = json.loads(resp.read().decode("utf-8"))
    except urlerror.HTTPError as exc:
        raise HTTPException(status_code=exc.code, detail="Unable to load user scans")

    for scan in scans:
        storage_path = scan.get("storage_path")
        if storage_path:
            storage_delete_url = f"{supabase_url}/storage/v1/object/{storage_bucket}/{quote(storage_path, safe='')}"
            storage_request = urlrequest.Request(storage_delete_url, headers=scan_headers, method="DELETE")
            try:
                with urlrequest.urlopen(storage_request, timeout=20):
                    deleted_storage_files += 1
            except urlerror.HTTPError:
                pass

    delete_scans_url = f"{supabase_url}/rest/v1/scans?user_id=eq.{quote(user_id)}"
    delete_scans_request = urlrequest.Request(delete_scans_url, headers=scan_headers, method="DELETE")
    try:
        with urlrequest.urlopen(delete_scans_request, timeout=20):
            pass
    except urlerror.HTTPError:
        pass

    delete_user_url = f"{supabase_url}/auth/v1/admin/users/{quote(user_id)}"
    delete_user_request = urlrequest.Request(delete_user_url, headers=scan_headers, method="DELETE")
    try:
        with urlrequest.urlopen(delete_user_request, timeout=20) as resp:
            payload = resp.read().decode("utf-8")
    except urlerror.HTTPError as exc:
        raise HTTPException(status_code=exc.code, detail="Unable to delete Supabase user")

    return {
        "deleted_user_id": user_id,
        "deleted_scans": len(scans),
        "deleted_storage_files": deleted_storage_files,
        "supabase_response": payload,
    }

@app.get("/languages")
def list_languages():
    return {
        "languages": [
            {"code": code, "label": LANGUAGE_LABELS[code]}
            for code in SUPPORTED_LANGUAGES
        ]
    }


def _analyze_raw_image(image_bytes: bytes):
    """Run vision analysis in English to produce canonical source-of-truth."""
    try:
        return gemini_service.analyze_xray_image(image_bytes=image_bytes, language="en")
    except Exception as gemini_err:
        if config.get_openai_api_key():
            return openai_service.analyze_xray_image(image_bytes=image_bytes, language="en")
        raise gemini_err


def _analyze_raw_pdf(report_text: str):
    try:
        return gemini_service.analyze_text_report(report_text=report_text, language="en")
    except Exception as gemini_err:
        if config.get_openai_api_key():
            return openai_service.analyze_text_report(report_text=report_text, language="en")
        raise gemini_err

@app.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    language: str = "en"
):
    try:
        image_bytes = await file.read()

        if not image_bytes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Empty image file"
            )

        try:
            raw = _analyze_raw_image(image_bytes)
            canonical = to_canonical(raw)
            display_lang = normalize_language(language)
            if display_lang != "en":
                localized = translate_canonical(canonical, display_lang)
                return {
                    **canonical,
                    "localized": localized,
                    "display_language": display_lang,
                }
            return {**canonical, "display_language": "en"}

        except Exception as err:
            print(f"Analysis failed: {type(err).__name__}: {err}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to analyze scan right now. Please try again shortly.",
            )

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to analyze scan right now. Please try again shortly.",
        )

# ============================
# GENERATE UI SECTIONS FROM INSIGHTS
# ============================
@app.post("/generate-sections")
async def generate_sections(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")

    insights = body.get("insights")
    language = body.get("language", "en")
    if not insights or not isinstance(insights, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing 'insights' object in request body")

    errors = []

    if config.get_gemini_api_key():
        try:
            return gemini_service.generate_structured_sections(insights=insights, language=language)
        except Exception as gemini_err:
            print(f"Gemini section generation failed: {gemini_err}. Falling back to OpenAI.")
            errors.append(f"Gemini: {gemini_err}")

    if config.get_openai_api_key():
        try:
            return openai_service.generate_structured_sections(insights=insights, language=language)
        except Exception as openai_err:
            errors.append(f"OpenAI: {openai_err}")

    detail = "Unable to generate sections from an LLM"
    if errors:
        detail = f"{detail}: {'; '.join(errors)}"

    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)


@app.post("/translate-analysis")
async def translate_analysis(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")

    canonical = body.get("canonical")
    language = normalize_language(body.get("language"))
    if not canonical or not isinstance(canonical, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing 'canonical' object")

    try:
        translated = translate_canonical(canonical, language)
        return translated
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Translation is temporarily unavailable. Showing the original report.",
        )


@app.post("/doctor-questions")
async def doctor_questions(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")

    canonical = body.get("canonical")
    language = normalize_language(body.get("language", "en"))
    if not canonical or not isinstance(canonical, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing 'canonical' object")

    try:
        return generate_doctor_questions(canonical, language)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate doctor questions right now. Please try again.",
        )


@app.post("/ask-report")
async def ask_report(request: Request):
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON body")

    canonical = body.get("canonical")
    question = body.get("question")
    language = normalize_language(body.get("language", "en"))
    previous_report_summary = body.get("previous_report_summary")

    if not canonical or not isinstance(canonical, dict):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing 'canonical' object")
    if not question or not str(question).strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing 'question'")

    try:
        return ask_report_question(canonical, str(question), language, previous_report_summary)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid question")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate an answer right now. Please try again.",
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

        try:
            raw = _analyze_raw_pdf(report_text)
            canonical = to_canonical(raw)
            display_lang = normalize_language(language)
            if display_lang != "en":
                localized = translate_canonical(canonical, display_lang)
                return {
                    **canonical,
                    "localized": localized,
                    "display_language": display_lang,
                }
            return {**canonical, "display_language": "en"}
        except Exception as gemini_err:
            print(f"PDF analysis failed: {gemini_err}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to analyze report right now. Please try again shortly.",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
