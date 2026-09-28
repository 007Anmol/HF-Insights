# Medical terms & report voice testing

## “What does this mean?” (terms)

1. Open a scan with terms like **degenerative changes** or **opacity**.
2. Tap underlined term or **What does this mean?**
3. Confirm reviewed glossary content, in-report quote, disclaimer, and doctor questions on the same sheet.
4. Unknown terms show the safe fallback message.

## Report voice conversation (only voice feature)

1. On the report screen, tap the **mic** icon (top right).
2. Allow microphone and speech recognition.
3. Tap the large mic, ask about your findings, tap again to send.
4. Verify the answer uses **this report’s** findings (not generic advice).
5. Ask a follow-up in the same session.
6. Test languages: English, Hindi, Marathi, Tamil, Punjabi (Telugu in app UI; unsupported locales fall back to English for voice).

Deploy backend with `POST /report-voice-chat` and `GEMINI_API_KEY` or `OPENAI_API_KEY` on Render.

See `docs/REPORT_VOICE_CONVERSATION.md` for API key and Expo Go notes.
