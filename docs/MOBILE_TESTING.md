# Mobile testing (Expo Go)

## Start the app

```bash
cd "/Users/yashkhatwani/Documents/HF-Insights"
npm install
npx expo start --clear
```

- iPhone: same Wi‑Fi as your Mac → scan QR in **Expo Go** (SDK 57).
- After code changes: shake device → **Reload**, or press `r` in the terminal.

## Backend options

| Mode | Command | What works |
|------|---------|------------|
| **Production (default)** | `npx expo start` | Scan/analyze via Render. Newer routes may be missing until Render is redeployed — app shows an info banner and uses report-based fallbacks. |
| **Full features (local)** | See below | Translation, Ask My Report, voice chat, ElevenLabs, doctor questions |

### Local backend (recommended before Render deploy)

```bash
# Terminal 1 — backend (.env with GEMINI_API_KEY, ELEVENLABS_API_KEY, etc.)
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 — app (replace with your Mac LAN IP)
ipconfig getifaddr en0
EXPO_PUBLIC_BACKEND_URL=http://192.168.x.x:8000 npx expo start --clear
```

Allow incoming connections on port **8000** if macOS firewall prompts you.

## Test checklist

1. **New scan** — camera or library (HEIC from Photos should work).
2. **Report** — scroll + section tabs; change language (English / Hindi).
3. **Terms** — tap underlined phrase → explanation sheet.
4. **Ask My Report** — type a question; note offline notice if backend is old.
5. **Doctor questions** — list loads for this report.
6. **Voice (mic)** — type question + Send in Expo Go; hear answer (ElevenLabs if backend configured, else device voice).
7. **Share** — shares text in the language shown on screen.

## Expo Go limits

- **Mic speech input** needs a dev build: `npx expo run:ios`
- **ElevenLabs** requires `ELEVENLABS_API_KEY` on the backend (`POST /synthesize-speech`).
