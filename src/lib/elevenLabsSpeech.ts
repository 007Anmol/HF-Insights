import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import type { AppLanguage } from '../types/language';
import { resolveVoiceLanguage } from './voiceLanguage';
import { BACKEND_URL } from '../insights';
import { TTS_TIMEOUT_MS, fetchWithTimeout } from './apiFetch';

let activeSound: Audio.Sound | null = null;

export async function stopElevenLabsPlayback(): Promise<void> {
  if (!activeSound) return;
  try {
    await activeSound.stopAsync();
    await activeSound.unloadAsync();
  } catch {
    // ignore
  }
  activeSound = null;
}

export async function speakWithElevenLabs(text: string, language: AppLanguage): Promise<boolean> {
  const trimmed = text.trim();
  if (!trimmed) return false;

  const { appLanguage } = resolveVoiceLanguage(language);

  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${BACKEND_URL}/synthesize-speech`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, language: appLanguage }),
      },
      TTS_TIMEOUT_MS,
    );
  } catch {
    return false;
  }

  if (!res.ok) {
    return false;
  }

  const data = (await res.json()) as { audio_base64?: string; content_type?: string };
  if (!data.audio_base64) {
    return false;
  }

  await stopElevenLabsPlayback();

  const fileUri = `${FileSystem.cacheDirectory}hf-tts-${Date.now()}.mp3`;
  await FileSystem.writeAsStringAsync(fileUri, data.audio_base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  await Audio.setAudioModeAsync({
    playsInSilentModeIOS: true,
    allowsRecordingIOS: false,
  });

  const { sound } = await Audio.Sound.createAsync({ uri: fileUri }, { shouldPlay: false });
  activeSound = sound;

  await new Promise<void>((resolve, reject) => {
    sound.setOnPlaybackStatusUpdate((status) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        sound.unloadAsync().finally(resolve);
        if (activeSound === sound) activeSound = null;
      }
      if ('error' in status && status.error) {
        reject(new Error(String(status.error)));
      }
    });
    sound.playAsync().catch(reject);
  });

  try {
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  } catch {
    // ignore
  }

  return true;
}
