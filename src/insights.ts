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

const BACKEND_URL = 'https://healthfutureinsights.onrender.com';

// Call FASTAPI to analyze the image. Falls back with a friendly error.
export async function generateInsightsFromImage(uri: string): Promise<Insights> {
  try {
    const form = new FormData();
    // React Native recommended way: pass { uri, name, type }
    const filename = 'scan.jpg';
    const mime = uri?.toLowerCase()?.endsWith('.png') ? 'image/png' : 'image/jpeg';
    form.append('file', { uri, name: filename, type: mime } as any);
    form.append('language', 'en');

    // Add timeout with AbortController to avoid hanging if server cold-starts
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const res = await fetch(`${BACKEND_URL}/analyze-image`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Server error ${res.status}`);
    }

    const data = (await res.json()) as ApiInsights;
    // Basic validation/sanitization
    const safeList = (v: any) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
    const insights: Insights = {
      title: 'Simplified Health Insights',
      xray_type: String(data?.xray_type || 'unknown'),
      source: String(data?.source || 'image'),
      findings: safeList(data?.findings),
      possible_conditions: safeList(data?.possible_conditions),
      possible_symptoms: safeList(data?.possible_symptoms),
      confidence_score: typeof data?.confidence_score === 'number' ? data.confidence_score : 0,
    };
    return insights;
  } catch (e: any) {
    // Graceful fallback so UI remains usable
    return {
      title: 'Simplified Health Insights',
      xray_type: 'unknown',
      source: 'image',
      findings: [e?.message ? `Analysis failed: ${e.message}` : 'Unable to analyze the image'],
      possible_conditions: [],
      possible_symptoms: [],
      confidence_score: 0,
    };
  }
}
