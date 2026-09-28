# Report voice conversation

## What it does

- **One voice feature only:** talk about the current X-ray report (not read-aloud of static text).
- **Full report context:** canonical findings, conditions, symptoms, attention level, and optional prior scan summary.
- **Multi-turn:** follow-up questions stay in the same conversation.
- **Language:** uses the report language selected in the app (en, hi, mr, te, pa, ta). If a locale is not supported, **English** is used for speech and answers.
- **Pipeline:** your question → `/report-voice-chat` (Gemini/OpenAI) → answer text → `/synthesize-speech` (**ElevenLabs**) → audio playback (`expo-av`). Falls back to device TTS if ElevenLabs is unavailable.

## API keys

You do **not** need a new key in the mobile app.

Ensure your **Render backend** has:

- `GEMINI_API_KEY` and/or `OPENAI_API_KEY` (report answers)
- **`ELEVENLABS_API_KEY`** (natural spoken answers)
- Optional: `ELEVENLABS_VOICE_ID` (defaults to multilingual-friendly voice)

Never put ElevenLabs keys in the mobile app — backend only (`backend/.env`, gitignored).

Speech input uses the device when available; otherwise type your question in Expo Go.

## Testing

1. Open a scan result → tap **mic** (top right).
2. Allow microphone + speech recognition.
3. Tap the large mic → ask a question → tap again to send.
4. Confirm spoken reply matches on-screen text and references your report.
5. Test in **English** and at least one Indian language you use in the app.

## Expo Go note

Speech recognition may require a **development build** after `app.json` microphone changes (`npx expo run:ios` / `run:android`). If Expo Go blocks mic, use a dev build.
