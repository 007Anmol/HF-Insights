export const APP_LANGUAGES = ['en', 'hi', 'mr', 'te', 'pa', 'ta'] as const;

export type AppLanguage = (typeof APP_LANGUAGES)[number];

export const LANGUAGE_OPTIONS: { code: AppLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
  { code: 'ta', label: 'தமிழ்' },
];

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return APP_LANGUAGES.includes(value as AppLanguage);
}

export function normalizeAppLanguage(value: string | null | undefined): AppLanguage {
  return isAppLanguage(value) ? value : 'en';
}
