import type { AppLanguage } from '../types/language';

export type ConfidenceInfo = {
  level: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT_INFORMATION';
  label: string;
  raw_score?: number | null;
  type: string;
  is_calibrated: boolean;
  disclaimer: string;
};

export type LocalizedInsights = {
  summary?: string;
  attention_level?: string;
  findings_text?: string[];
  possible_conditions?: string[];
  possible_symptoms?: string[];
  recommendations?: string[];
  disclaimer?: string;
  language?: string;
  translation_fallback?: boolean;
  translation_error?: string;
};

export type CanonicalInsights = {
  summary?: string;
  xray_type?: string;
  source?: string;
  attention_level?: string;
  findings_text?: string[];
  possible_conditions?: string[];
  possible_symptoms?: string[];
  references?: { title: string; url: string }[];
  recommendations?: string[];
  confidence?: ConfidenceInfo;
  confidence_score?: number;
  disclaimer?: string;
  localized?: LocalizedInsights;
  display_language?: string;
  translations?: Partial<Record<AppLanguage, LocalizedInsights>>;
  doctor_questions?: Partial<Record<AppLanguage, string[]>>;
  doctor_questions_en?: string[];
};

export function getCanonicalFromInsights(insights: any): CanonicalInsights {
  if (insights?.canonical) {
    return insights.canonical as CanonicalInsights;
  }
  return {
    summary: insights?.summary || insights?.findings?.[0] || '',
    xray_type: insights?.xray_type,
    source: insights?.source,
    attention_level: insights?.attention_level,
    findings_text: Array.isArray(insights?.findings_text)
      ? insights.findings_text
      : Array.isArray(insights?.findings)
        ? insights.findings
        : [],
    possible_conditions: insights?.possible_conditions || [],
    possible_symptoms: insights?.possible_symptoms || [],
    references: insights?.references || [],
    recommendations: insights?.recommendations || [],
    confidence: insights?.confidence,
    confidence_score: insights?.confidence_score,
    disclaimer: insights?.disclaimer,
  };
}

export function getDisplayInsights(insights: any, language: AppLanguage) {
  const canonical = getCanonicalFromInsights(insights);
  const cached = insights?.translations?.[language];

  if (cached && !cached.translation_fallback) {
    return {
      findings: cached.findings_text || canonical.findings_text || [],
      possible_conditions: cached.possible_conditions || canonical.possible_conditions || [],
      possible_symptoms: cached.possible_symptoms || canonical.possible_symptoms || [],
      summary: cached.summary || canonical.summary || '',
      attention_level: cached.attention_level || canonical.attention_level,
      disclaimer: cached.disclaimer || canonical.disclaimer,
      translation_fallback: false,
    };
  }

  if (language !== 'en' && cached?.translation_fallback) {
    return {
      findings: canonical.findings_text || [],
      possible_conditions: canonical.possible_conditions || [],
      possible_symptoms: canonical.possible_symptoms || [],
      summary: canonical.summary || '',
      attention_level: canonical.attention_level,
      disclaimer: canonical.disclaimer,
      translation_fallback: true,
    };
  }

  return {
    findings: canonical.findings_text || [],
    possible_conditions: canonical.possible_conditions || [],
    possible_symptoms: canonical.possible_symptoms || [],
    summary: canonical.summary || '',
    attention_level: canonical.attention_level,
    disclaimer: canonical.disclaimer,
    translation_fallback: false,
  };
}

export function buildInsightsPayloadFromApi(data: any) {
  const canonical: CanonicalInsights = {
    summary: data.summary || data.findings_text?.[0] || data.findings?.[0]?.description || '',
    xray_type: data.xray_type,
    source: data.source,
    attention_level: data.attention_level,
    findings_text: data.findings_text || (Array.isArray(data.findings)
      ? data.findings.map((f: any) => (typeof f === 'string' ? f : f?.description)).filter(Boolean)
      : []),
    possible_conditions: data.possible_conditions || [],
    possible_symptoms: data.possible_symptoms || [],
    references: data.references || [],
    recommendations: data.recommendations || [],
    confidence: data.confidence,
    confidence_score: data.confidence_score,
    disclaimer: data.disclaimer,
  };

  const translations: Partial<Record<AppLanguage, LocalizedInsights>> = {};
  if (data.localized && data.display_language) {
    translations[data.display_language as AppLanguage] = data.localized;
  }

  let confidence = data.confidence;
  if (!confidence) {
    const score = typeof data.confidence_score === 'number' ? data.confidence_score : 0;
    const normalized = score > 0 && score <= 1 ? score * 100 : score;
    let level: ConfidenceInfo['level'] = 'INSUFFICIENT_INFORMATION';
    if (normalized >= 75) level = 'HIGH';
    else if (normalized >= 45) level = 'MODERATE';
    else if (normalized > 0) level = 'LOW';
    confidence = {
      level,
      label: level === 'HIGH' ? 'High' : level === 'MODERATE' ? 'Moderate' : level === 'LOW' ? 'Low' : 'Insufficient Information',
      raw_score: normalized || null,
      type: 'ai_estimated',
      is_calibrated: false,
      disclaimer:
        'AI confidence reflects how strongly the AI supports this finding. It is not a medical diagnosis or a clinically validated disease probability.',
    };
  }

  return {
    title: 'Simplified Health Insights',
    ...canonical,
    findings: canonical.findings_text,
    canonical: { ...canonical, confidence },
    translations,
    confidence,
    confidence_score: typeof data.confidence_score === 'number' ? data.confidence_score : 0,
  };
}
