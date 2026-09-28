import type { AppLanguage } from '../types/language';

/** Stable key so section refetch runs when any displayed report field changes (not just findings). */
export function buildDisplayContentKey(
  language: AppLanguage,
  display: {
    findings?: string[];
    possible_conditions?: string[];
    possible_symptoms?: string[];
    summary?: string;
    attention_level?: string;
  } | null,
): string {
  if (!display) return language;
  return [
    language,
    display.summary || '',
    display.attention_level || '',
    (display.findings || []).join('\u001f'),
    (display.possible_conditions || []).join('\u001f'),
    (display.possible_symptoms || []).join('\u001f'),
  ].join('\u001e');
}
