# HF Insights — Multilingual & AI Features Architecture

This document describes the six-language, translation, Ask My Report, doctor questions, and confidence systems added to HF Insights.

## Architecture Overview

```
X-ray / Medical Report
        ↓
Medical AI Analysis (English canonical — source of truth)
        ↓
Structured Adapter (`structured_adapter.py`)
        ↓
Confidence Service (`confidence_service.py`)
        ↓
Translation Service (`translation_service.py`) — on language change only
        ↓
Patient UI (React Native / Expo)
```

## Supported Languages

| Code | Language |
|------|----------|
| en | English |
| hi | Hindi |
| mr | Marathi |
| te | Telugu |
| pa | Punjabi |
| ta | Tamil |

English and Hindi remain supported. Additional languages use the same translation pipeline.

## Translation (Not Re-Analysis)

- X-ray analysis always runs in **English** to produce a **canonical structured result**.
- Changing language calls `POST /translate-analysis` — it does **not** re-analyze the image.
- Translations are cached in `scan.insights.translations[language]` on the device and synced to Supabase when online.
- If translation validation fails twice, the app falls back to English and shows a patient-friendly notice.

**Important:** Translations are AI-generated and have **not** been professionally/clinically validated.

## Medical Terminology

Central glossary reference: `backend/app/medical_terminology.py`

Used in translation prompts to encourage:
- anatomy, severity, uncertainty preservation
- `LOCAL EXPLANATION (English term)` format when helpful

## Confidence System

**Technically honest disclosure:**

- The underlying models (Gemini / OpenAI vision) return an `confidence_score` from the LLM prompt — this is **not** a calibrated clinical probability.
- `confidence_service.py` maps raw scores to categories:
  - HIGH
  - MODERATE
  - LOW
  - INSUFFICIENT_INFORMATION
- The UI shows **AI Confidence: Moderate** (etc.), not “87% chance of pneumonia”.
- `is_calibrated: false` is set explicitly. Future calibration against radiologist-reviewed datasets is supported by the architecture but **not implemented or claimed**.

## Ask My Report

- Endpoint: `POST /ask-report`
- Grounded in canonical analysis JSON only (no image re-sent unless required later)
- System instructions prohibit inventing findings, diagnoses, or medications
- Works in all six languages (response in selected language)
- Does not re-run X-ray analysis per question

## Doctor Questions

- Endpoint: `POST /doctor-questions`
- Generates 3–5 questions in English first, then translates via TranslationService
- Cached per scan per language in `insights.doctor_questions`
- Questions are based on actual findings — not alarmist unless report warrants discussion

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/languages` | List supported languages |
| POST | `/analyze-image` | Analyze X-ray → canonical English (+ optional initial translation) |
| POST | `/analyze-report-pdf` | Analyze PDF report |
| POST | `/translate-analysis` | Translate canonical result |
| POST | `/doctor-questions` | Generate doctor discussion questions |
| POST | `/ask-report` | Ask My Report Q&A |
| POST | `/generate-sections` | UI follow-up sections (existing) |

## Environment Variables

**Backend** (Render / local — never commit values):

- `GEMINI_API_KEY`
- `OPENAI_API_KEY` (optional fallback)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Mobile app** (optional):

- `EXPO_PUBLIC_BACKEND_URL` — override default `https://healthfutureinsights.onrender.com` for local backend testing

## Privacy

- Do not log X-ray images or full reports in production console output
- Ask My Report sends minimal structured medical context, not unnecessary patient identifiers
- Existing Supabase auth and storage patterns are preserved

## Limitations (Required Disclosures)

1. Translations are **not** clinically validated.
2. Confidence categories are **not** clinically calibrated probabilities.
3. HF Insights **does not** replace doctors or radiologists.
4. Ask My Report answers are educational, not diagnostic.

## Local Backend Testing

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then in the app project root:

```bash
EXPO_PUBLIC_BACKEND_URL=http://YOUR_LAN_IP:8000 npm start
```

Deploy backend to Render before testing new endpoints against production URL.
