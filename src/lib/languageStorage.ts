import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage, normalizeAppLanguage } from '../types/language';

const LANGUAGE_KEY = 'hfi:display_language';

export async function loadDisplayLanguage(): Promise<AppLanguage> {
  try {
    const raw = await AsyncStorage.getItem(LANGUAGE_KEY);
    return normalizeAppLanguage(raw);
  } catch {
    return 'en';
  }
}

export async function saveDisplayLanguage(language: AppLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // ignore
  }
}
