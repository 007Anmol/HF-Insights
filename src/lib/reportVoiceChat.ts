import type { AppLanguage } from '../types/language';
import type { CanonicalInsights } from './canonicalInsights';
import { BACKEND_URL } from '../insights';
import { API_TIMEOUT_MS, fetchWithTimeout } from './apiFetch';
import { fallbackAskReportAnswer, isNewApiUnavailable } from './reportFallbacks';

export type VoiceChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function sendReportVoiceChat(params: {
  canonical: CanonicalInsights;
  message: string;
  language: AppLanguage;
  conversationHistory: VoiceChatMessage[];
  previousReportSummary?: string;
}): Promise<{ answer: string; language: string; offline_fallback?: boolean }> {
  try {
    const res = await fetchWithTimeout(
      `${BACKEND_URL}/report-voice-chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canonical: params.canonical,
          message: params.message,
          language: params.language,
          conversation_history: params.conversationHistory,
          previous_report_summary: params.previousReportSummary,
        }),
      },
      API_TIMEOUT_MS,
    );

    if (res.ok) {
      const data = await res.json();
      return {
        answer: String(data.answer || '').trim(),
        language: data.language || params.language,
        offline_fallback: false,
      };
    }

    if (isNewApiUnavailable(res.status)) {
      return {
        answer: fallbackAskReportAnswer(params.canonical, params.message),
        language: params.language,
        offline_fallback: true,
      };
    }
  } catch {
    // fall through
  }

  return {
    answer: fallbackAskReportAnswer(params.canonical, params.message),
    language: params.language,
    offline_fallback: true,
  };
}
