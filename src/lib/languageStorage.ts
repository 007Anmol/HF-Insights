import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { AppLanguage, isAppLanguage } from '../types/language';

const LANGUAGE_KEY = 'hfi:display_language';

/** App defaults: English or Hindi (Hindi when device locale is Hindi). */
export function detectDefaultLanguage(): AppLanguage {
  try {
    const locales = Localization.getLocales();
    const code = (locales[0]?.languageCode || 'en').toLowerCase();
    if (code === 'hi') {
      return 'hi';
    }
  } catch {
    // ignore
  }
  return 'en';
}

export async function loadDisplayLanguage(): Promise<AppLanguage> {
  try {
    const raw = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (raw && isAppLanguage(raw)) {
      return raw;
    }
  } catch {
    // ignore
  }
  return detectDefaultLanguage();
}

export async function saveDisplayLanguage(language: AppLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // ignore
  }
}
