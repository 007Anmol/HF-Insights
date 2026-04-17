// Insights returned from backend (FASTAPI)
export type ApiInsights = {
  xray_type: string;
  source: string;
  findings: string[];
  possible_conditions: string[];
  possible_symptoms: string[];
  confidence_score: number;
};

// Unified type the app stores. Old fields are optional for backward compatibility.
export type Insights = ApiInsights & {
  title: string;
  summary?: string;
  recommendations?: string[];
  laymanTerms?: { term: string; plain: string }[];
};

export const BACKEND_URL = 'https://healthfutureinsights.onrender.com';

const COLD_START_STATUS_CODES = new Set([502, 503, 504]);
const ANALYZE_TIMEOUT_MS = 90000;
const HEALTH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isColdStartFailure(error: any, statusCode?: number) {
  if (typeof statusCode === 'number' && COLD_START_STATUS_CODES.has(statusCode)) {
    return true;
  }

  const errorName = String(error?.name || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  return (
    errorName.includes('abort') ||
    message.includes('aborted') ||
    message.includes('timeout')
  );
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

// Call FASTAPI to analyze the image. Falls back with a friendly error.
let currentLanguage: 'en' | 'hi' = 'en';
export function setInsightsLanguage(lang: 'en' | 'hi') {
  currentLanguage = lang;
}

export async function generateInsightsFromImage(uri: string, language?: 'en' | 'hi'): Promise<Insights> {
  const filename = 'scan.jpg';
  const mime = uri?.toLowerCase()?.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const lang = (language ?? currentLanguage) || 'en';

  const buildFormData = () => {
    const form = new FormData();
    // React Native recommended way: pass { uri, name, type }
    form.append('file', { uri, name: filename, type: mime } as any);
    form.append('language', lang);
    return form;
  };

  const runAnalyzeRequest = async () => {
    const res = await fetchWithTimeout(
      `${BACKEND_URL}/analyze-image?language=${encodeURIComponent(lang)}`,
      {
        method: 'POST',
        body: buildFormData(),
      },
      ANALYZE_TIMEOUT_MS
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
    // Basic validation/sanitization
    const safeList = (v: any) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
    return {
      title: 'Simplified Health Insights',
      xray_type: String(data?.xray_type || 'unknown'),
      source: String(data?.source || 'image'),
      findings: safeList(data?.findings),
      possible_conditions: safeList(data?.possible_conditions),
      possible_symptoms: safeList(data?.possible_symptoms),
      confidence_score: typeof data?.confidence_score === 'number' ? data.confidence_score : 0,
    };
  } catch (firstError: any) {
    const firstStatusCode = Number(firstError?.statusCode);
    const firstCallCouldBeColdStart = isColdStartFailure(
      firstError,
      Number.isFinite(firstStatusCode) ? firstStatusCode : undefined
    );

    if (firstCallCouldBeColdStart) {
      // Warm backend and retry once to reduce Render cold-start failures.
      await pingBackendHealth(HEALTH_TIMEOUT_MS);
      await delay(2500);

      try {
        const retried = await runAnalyzeRequest();
        const safeList = (v: any) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
        return {
          title: 'Simplified Health Insights',
          xray_type: String(retried?.xray_type || 'unknown'),
          source: String(retried?.source || 'image'),
          findings: safeList(retried?.findings),
          possible_conditions: safeList(retried?.possible_conditions),
          possible_symptoms: safeList(retried?.possible_symptoms),
          confidence_score: typeof retried?.confidence_score === 'number' ? retried.confidence_score : 0,
        };
      } catch (retryError: any) {
        throw new Error(getFriendlyAnalysisErrorMessage(retryError, retryError?.statusCode));
      }
    }

    throw new Error(getFriendlyAnalysisErrorMessage(firstError, firstError?.statusCode));
  }
}

// Explicit helper with language to avoid stale type issues in some toolchains
export async function generateInsightsFromImageWithLanguage(
  uri: string,
  language: 'en' | 'hi'
): Promise<Insights> {
  return generateInsightsFromImage(uri, language);
}
