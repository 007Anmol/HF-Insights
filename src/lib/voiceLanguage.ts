import { APP_LANGUAGES, type AppLanguage } from '../types/language';

const SPEECH_LOCALE: Record<AppLanguage, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  pa: 'pa-IN',
  ta: 'ta-IN',
};

const RECOGNITION_LOCALE: Record<AppLanguage, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  mr: 'mr-IN',
  te: 'te-IN',
  pa: 'pa-IN',
  ta: 'ta-IN',
};

export function resolveVoiceLanguage(preferred: string | null | undefined): {
  appLanguage: AppLanguage;
  speechLocale: string;
  recognitionLocale: string;
  usedEnglishFallback: boolean;
} {
  const normalized = (preferred || 'en').trim().toLowerCase();
  if (APP_LANGUAGES.includes(normalized as AppLanguage)) {
    const lang = normalized as AppLanguage;
    return {
      appLanguage: lang,
      speechLocale: SPEECH_LOCALE[lang],
      recognitionLocale: RECOGNITION_LOCALE[lang],
      usedEnglishFallback: false,
    };
  }
  return {
    appLanguage: 'en',
    speechLocale: SPEECH_LOCALE.en,
    recognitionLocale: RECOGNITION_LOCALE.en,
    usedEnglishFallback: true,
  };
}
