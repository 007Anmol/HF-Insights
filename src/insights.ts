import type { AppLanguage } from './types/language';
import type { CanonicalInsights } from './lib/canonicalInsights';
import { buildInsightsPayloadFromApi } from './lib/canonicalInsights';
import {
  fallbackAskReportAnswer,
  fallbackDoctorQuestions,
  isNewApiUnavailable,
} from './lib/reportFallbacks';
import { API_TIMEOUT_MS, HEALTH_TIMEOUT_MS, fetchWithTimeout } from './lib/apiFetch';

function canonicalForTranslation(canonical: CanonicalInsights) {
  return {
    summary: canonical.summary || '',
    xray_type: canonical.xray_type,
    attention_level: canonical.attention_level || '',
    findings_text: canonical.findings_text || [],
    possible_conditions: canonical.possible_conditions || [],
    possible_symptoms: canonical.possible_symptoms || [],
    recommendations: canonical.recommendations || [],
    disclaimer: canonical.disclaimer || '',
  };
}

export type ApiInsights = {
  xray_type: string;
  source: string;
  attention_level?: string;
  findings?: string[];
  findings_text?: string[];
  possible_conditions: string[];
  possible_symptoms: string[];
  references?: { title: string; url: string }[];
  confidence_score?: number;
  confidence?: CanonicalInsights['confidence'];
  summary?: string;
  canonical?: CanonicalInsights;
  localized?: CanonicalInsights['localized'];
  display_language?: string;
};

export type Insights = ReturnType<typeof buildInsightsPayloadFromApi> & {
  title: string;
  laymanTerms?: { term: string; plain: string }[];
};

export const BACKEND_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_BACKEND_URL) ||
  'https://healthfutureinsights.onrender.com';

const COLD_START_STATUS_CODES = new Set([502, 503, 504]);
const ANALYZE_TIMEOUT_MS = 90000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isColdStartFailure(error: any, statusCode?: number) {
  if (typeof statusCode === 'number' && COLD_START_STATUS_CODES.has(statusCode)) {
    return true;
  }
  const errorName = String(error?.name || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  return errorName.includes('abort') || message.includes('aborted') || message.includes('timeout');
}

export async function pingBackendHealth(timeoutMs = HEALTH_TIMEOUT_MS): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${BACKEND_URL}/health`, { method: 'GET' }, timeoutMs);
    return response.ok;
  } catch {
    return false;
  }
}

export function getFriendlyAnalysisErrorMessage(error: any, statusCode?: number) {
  if (isColdStartFailure(error, statusCode)) {
    return 'Analysis service is waking up. Please try again in a few seconds.';
  }
  return 'Unable to analyze scan right now. Please try again shortly.';
}

let currentLanguage: AppLanguage = 'en';

export function setInsightsLanguage(lang: AppLanguage) {
  currentLanguage = lang;
}

export function getInsightsLanguage(): AppLanguage {
  return currentLanguage;
}

async function _runAnalyzeWithEndpoint(
  endpointPath: string,
  uri: string,
  filename: string,
  mime: string,
  language?: AppLanguage,
): Promise<Insights> {
  const lang = language ?? currentLanguage ?? 'en';

  const buildFormData = () => {
    const form = new FormData();
    form.append('file', { uri, name: filename, type: mime } as any);
    form.append('language', lang);
    return form;
  };

  const runAnalyzeRequest = async () => {
    const res = await fetchWithTimeout(
      `${BACKEND_URL}${endpointPath}?language=${encodeURIComponent(lang)}`,
      { method: 'POST', body: buildFormData() },
      ANALYZE_TIMEOUT_MS,
    );

    if (!res.ok) {
      const err = new Error(`Request failed with status ${res.status}`);
      (err as any).statusCode = res.status;
      throw err;
    }

    return (await res.json()) as ApiInsights;
  };

  try {
    const data = await runAnalyzeRequest();
    return buildInsightsPayloadFromApi(data) as Insights;
  } catch (firstError: any) {
    const firstStatusCode = Number(firstError?.statusCode);
    if (isColdStartFailure(firstError, Number.isFinite(firstStatusCode) ? firstStatusCode : undefined)) {
      await pingBackendHealth(HEALTH_TIMEOUT_MS);
      await delay(2500);
      try {
        const retried = await runAnalyzeRequest();
        return buildInsightsPayloadFromApi(retried) as Insights;
      } catch (retryError: any) {
        throw new Error(getFriendlyAnalysisErrorMessage(retryError, retryError?.statusCode));
      }
    }
    throw new Error(getFriendlyAnalysisErrorMessage(firstError, firstError?.statusCode));
  }
}

export async function generateInsightsFromImage(uri: string, language?: AppLanguage): Promise<Insights> {
  const filename = 'scan.jpg';
  const mime = uri?.toLowerCase()?.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return _runAnalyzeWithEndpoint('/analyze-image', uri, filename, mime, language);
}

export async function generateInsightsFromPdf(uri: string, language?: AppLanguage): Promise<Insights> {
  return _runAnalyzeWithEndpoint('/analyze-report-pdf', uri, 'report.pdf', 'application/pdf', language);
}

export async function translateAnalysis(
  canonical: CanonicalInsights,
  language: AppLanguage,
): Promise<CanonicalInsights['localized'] & { language: string }> {
  if (language === 'en') {
    return {
      summary: canonical.summary || '',
      attention_level: canonical.attention_level || '',
      findings_text: canonical.findings_text || [],
      possible_conditions: canonical.possible_conditions || [],
      possible_symptoms: canonical.possible_symptoms || [],
      recommendations: canonical.recommendations || [],
      disclaimer: canonical.disclaimer || '',
      language: 'en',
      translation_fallback: false,
    };
  }

  const payload = { canonical: canonicalForTranslation(canonical), language };

  const runRequest = async () => {
    const res = await fetchWithTimeout(
      `${BACKEND_URL}/translate-analysis`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      API_TIMEOUT_MS,
    );
    return res;
  };

  try {
    let res = await runRequest();

    if (!res.ok && COLD_START_STATUS_CODES.has(res.status)) {
      await pingBackendHealth(HEALTH_TIMEOUT_MS);
      await delay(2500);
      res = await runRequest();
    }

    if (!res.ok) {
      if (isNewApiUnavailable(res.status)) {
        throw new Error('TRANSLATION_API_UNAVAILABLE');
      }
      throw new Error('Translation is temporarily unavailable. Showing the original report.');
    }

    const data = await res.json();
    return {
      summary: data.summary || '',
      attention_level: data.attention_level || canonical.attention_level || '',
      findings_text: Array.isArray(data.findings_text) ? data.findings_text : canonical.findings_text || [],
      possible_conditions: Array.isArray(data.possible_conditions) ? data.possible_conditions : canonical.possible_conditions || [],
      possible_symptoms: Array.isArray(data.possible_symptoms) ? data.possible_symptoms : canonical.possible_symptoms || [],
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : canonical.recommendations || [],
      disclaimer: data.disclaimer || canonical.disclaimer || '',
      language: data.language || language,
      translation_fallback: Boolean(data.translation_fallback),
    };
  } catch (error: any) {
    if (error?.message === 'TRANSLATION_API_UNAVAILABLE') {
      throw error;
    }
    throw new Error('Translation is temporarily unavailable. Showing the original report.');
  }
}

export async function fetchDoctorQuestions(
  canonical: CanonicalInsights,
  language: AppLanguage,
): Promise<{ questions: string[]; questions_en?: string[]; language: string; offline_fallback?: boolean }> {
  const res = await fetchWithTimeout(
    `${BACKEND_URL}/doctor-questions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ canonical, language }),
    },
    API_TIMEOUT_MS,
  );

  if (!res.ok) {
    if (isNewApiUnavailable(res.status)) {
      const questions = fallbackDoctorQuestions(canonical);
      return { questions, questions_en: questions, language, offline_fallback: true };
    }
    throw new Error('Unable to generate doctor questions right now.');
  }

  return res.json();
}

export async function askReportQuestion(params: {
  canonical: CanonicalInsights;
  question: string;
  language: AppLanguage;
  previousReportSummary?: string;
}): Promise<{ answer: string; language: string; offline_fallback?: boolean }> {
  const res = await fetchWithTimeout(
    `${BACKEND_URL}/ask-report`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canonical: params.canonical,
        question: params.question,
        language: params.language,
        previous_report_summary: params.previousReportSummary,
      }),
    },
    API_TIMEOUT_MS,
  );

  if (!res.ok) {
    if (isNewApiUnavailable(res.status)) {
      return {
        answer: fallbackAskReportAnswer(params.canonical, params.question),
        language: params.language,
        offline_fallback: true,
      };
    }
    throw new Error('Unable to generate an answer right now. Please try again.');
  }

  return res.json();
}

export async function fetchLanguages(): Promise<{ code: string; label: string }[]> {
  const res = await fetchWithTimeout(`${BACKEND_URL}/languages`, { method: 'GET' }, HEALTH_TIMEOUT_MS);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data?.languages) ? data.languages : [];
}

/** True when the deployed backend is missing newer report/translation routes (404 on /languages). */
export async function isBackendReportFeaturesLimited(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(`${BACKEND_URL}/languages`, { method: 'GET' }, HEALTH_TIMEOUT_MS);
    return res.status === 404;
  } catch {
    return false;
  }
}

export async function generateReportSections(payload: {
  language: AppLanguage;
  insights: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const run = () =>
    fetchWithTimeout(
      `${BACKEND_URL}/generate-sections`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      API_TIMEOUT_MS,
    );

  let res = await run();
  if (!res.ok && COLD_START_STATUS_CODES.has(res.status)) {
    await pingBackendHealth(HEALTH_TIMEOUT_MS);
    await delay(2500);
    res = await run();
  }

  if (!res.ok) {
    throw new Error('Failed to generate sections');
  }

  return res.json();
}
