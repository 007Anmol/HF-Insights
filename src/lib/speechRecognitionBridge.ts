import Constants from 'expo-constants';
import { requireOptionalNativeModule } from 'expo-modules-core';

/** Expo Go does not ship ExpoSpeechRecognition; never load that package there. */
function isExpoGoClient(): boolean {
  return Constants.appOwnership === 'expo';
}

export type SpeechRecognitionModule = {
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
  abort: () => void;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  addListener: (event: string, listener: (event: any) => void) => { remove: () => void };
};

let cachedModule: SpeechRecognitionModule | null | undefined;

export function isSpeechRecognitionNativeAvailable(): boolean {
  if (isExpoGoClient()) {
    return false;
  }
  try {
    return requireOptionalNativeModule('ExpoSpeechRecognition') != null;
  } catch {
    return false;
  }
}

/** Load speech recognition only when the native module exists (dev/production build). */
export async function loadSpeechRecognitionModule(): Promise<SpeechRecognitionModule | null> {
  if (cachedModule !== undefined) {
    return cachedModule;
  }

  if (isExpoGoClient() || !isSpeechRecognitionNativeAvailable()) {
    cachedModule = null;
    return null;
  }

  try {
    const mod = await import('expo-speech-recognition');
    cachedModule = mod.ExpoSpeechRecognitionModule as unknown as SpeechRecognitionModule;
    return cachedModule;
  } catch {
    cachedModule = null;
    return null;
  }
}
