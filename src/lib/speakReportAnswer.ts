import * as Speech from 'expo-speech';
import type { AppLanguage } from '../types/language';
import { speakWithElevenLabs, stopElevenLabsPlayback } from './elevenLabsSpeech';
import { resolveVoiceLanguage } from './voiceLanguage';

export async function stopReportAnswerSpeech(): Promise<void> {
  Speech.stop();
  await stopElevenLabsPlayback();
}

/** Speaks the exact assistant answer text — ElevenLabs first, device TTS fallback. */
export async function speakReportAnswer(text: string, language: AppLanguage): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const usedElevenLabs = await speakWithElevenLabs(trimmed, language).catch(() => false);
  if (usedElevenLabs) return;

  const { speechLocale } = resolveVoiceLanguage(language);
  await new Promise<void>((resolve) => {
    Speech.speak(trimmed, {
      language: speechLocale,
      onDone: () => resolve(),
      onStopped: () => resolve(),
      onError: () => resolve(),
    });
  });
}
