import glossaryData from '../data/medical_terminology_glossary.json';
import type { AppLanguage } from '../types/language';
import type { CanonicalInsights } from './canonicalInsights';
import { BACKEND_URL } from '../insights';
import { API_TIMEOUT_MS, fetchWithTimeout } from './apiFetch';

export type TermExplanation = {
  verified: boolean;
  message?: string;
  term?: string;
  matched_phrase?: string;
  simple_meaning?: string;
  in_your_report?: string;
  important_note?: string;
  doctor_questions?: string[];
  review_status?: string;
  reviewed_by?: string;
  version?: string;
  language?: string;
};

type GlossaryEntry = (typeof glossaryData.entries)[number];

const REVIEWED = 'clinically_reviewed';

function matchPhrases(entry: GlossaryEntry): string[] {
  const phrases = [entry.term, ...(entry.synonyms || [])].filter(Boolean);
  const unique: Record<string, string> = {};
  phrases.forEach((p) => {
    unique[p.toLowerCase()] = p;
  });
  return Object.values(unique).sort((a, b) => b.length - a.length);
}

export function findGlossaryMatches(text: string): { entry: GlossaryEntry; phrase: string; start: number; end: number }[] {
  if (!text?.trim()) return [];
  const lower = text.toLowerCase();
  const matches: { entry: GlossaryEntry; phrase: string; start: number; end: number }[] = [];

  for (const entry of glossaryData.entries) {
    if (entry.review_status !== REVIEWED) continue;
    for (const phrase of matchPhrases(entry)) {
      const idx = lower.indexOf(phrase.toLowerCase());
      if (idx >= 0) {
        matches.push({
          entry,
          phrase,
          start: idx,
          end: idx + phrase.length,
        });
      }
    }
  }

  matches.sort((a, b) => a.start - b.start || b.phrase.length - a.phrase.length);
  const deduped: typeof matches = [];
  let cursor = -1;
  for (const match of matches) {
    if (match.start >= cursor) {
      deduped.push(match);
      cursor = match.end;
    }
  }
  return deduped;
}

function reportSentences(canonical: CanonicalInsights): string[] {
  const parts: string[] = [];
  if (canonical.summary?.trim()) parts.push(canonical.summary.trim());
  if (canonical.attention_level?.trim()) parts.push(canonical.attention_level.trim());
  for (const key of ['findings_text', 'possible_conditions', 'possible_symptoms', 'recommendations'] as const) {
    for (const item of canonical[key] || []) {
      if (item?.trim()) parts.push(item.trim());
    }
  }
  return parts;
}

function localizedPack(entry: GlossaryEntry, language: AppLanguage) {
  const pack = (entry as Record<string, unknown>)[language];
  if (pack && typeof pack === 'object' && (pack as { patient_definition?: string }).patient_definition) {
    return pack as {
      patient_definition: string;
      clinical_context?: string;
      discuss_questions?: string[];
      important_note?: string;
    };
  }
  return entry.en;
}

export function explainTermFromGlossary(
  term: string,
  canonical: CanonicalInsights,
  language: AppLanguage,
): TermExplanation {
  const needle = term.trim().toLowerCase();
  let entry: GlossaryEntry | undefined;
  let matchedPhrase = term.trim();

  for (const candidate of glossaryData.entries) {
    if (candidate.review_status !== REVIEWED) continue;
    for (const phrase of matchPhrases(candidate)) {
      if (phrase.toLowerCase() === needle || needle.includes(phrase.toLowerCase())) {
        entry = candidate;
        matchedPhrase = phrase;
        break;
      }
    }
    if (entry) break;
  }

  if (!entry) {
    const fromText = findGlossaryMatches(term)[0];
    if (fromText) {
      entry = fromText.entry;
      matchedPhrase = fromText.phrase;
    }
  }

  if (!entry || entry.review_status !== REVIEWED) {
    return {
      verified: false,
      message: "We couldn't confidently explain this term. Please discuss it with your doctor.",
    };
  }

  const pack = localizedPack(entry, language);
  if (!pack?.patient_definition) {
    return {
      verified: false,
      message: "We couldn't confidently explain this term. Please discuss it with your doctor.",
    };
  }

  const sentences = reportSentences(canonical);
  const phraseLower = matchedPhrase.toLowerCase();
  const reportMatch = sentences.find(
    (s) =>
      s.toLowerCase().includes(phraseLower) ||
      (entry.synonyms || []).some((syn) => s.toLowerCase().includes(syn.toLowerCase())),
  );

  const context = pack.clinical_context?.trim() || '';
  const inYourReport = reportMatch
    ? `In your report, this appears as: "${reportMatch}". ${context}`.trim()
    : context || pack.patient_definition;

  const questions = (pack.discuss_questions || []).filter(Boolean).slice(0, 5);

  return {
    verified: true,
    term: entry.term,
    matched_phrase: matchedPhrase,
    simple_meaning: pack.patient_definition,
    in_your_report: inYourReport,
    important_note:
      pack.important_note ||
      'This explanation is educational and informational. It does not independently establish a diagnosis.',
    doctor_questions: questions,
    review_status: entry.review_status,
    reviewed_by: entry.reviewed_by,
    version: entry.version || glossaryData.version,
    language,
  };
}

export function buildExplanationSpeechText(explanation: TermExplanation): string {
  if (!explanation.verified) return explanation.message || '';
  return [
    explanation.simple_meaning,
    explanation.in_your_report,
    explanation.important_note,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildQuestionsSpeechText(questions: string[]): string {
  return questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
}

export async function fetchTermExplanation(
  term: string,
  canonical: CanonicalInsights,
  language: AppLanguage,
): Promise<TermExplanation> {
  try {
    const res = await fetchWithTimeout(
      `${BACKEND_URL}/explain-medical-term`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, canonical, language }),
      },
      API_TIMEOUT_MS,
    );
    if (res.ok) {
      const data = (await res.json()) as TermExplanation;
      if (data.verified) return data;
    }
  } catch {
    // fall through to reviewed glossary
  }
  return explainTermFromGlossary(term, canonical, language);
}
