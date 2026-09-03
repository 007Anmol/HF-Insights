import type { CanonicalInsights } from './canonicalInsights';
import type { AppLanguage } from '../types/language';

export function fallbackDoctorQuestions(canonical: CanonicalInsights): string[] {
  const findings = canonical.findings_text || [];
  const conditions = canonical.possible_conditions || [];
  const questions: string[] = [];

  if (findings[0]) {
    questions.push(`What does "${findings[0].slice(0, 80)}" mean in my situation?`);
  }
  if (conditions[0]) {
    questions.push(`Could "${conditions[0].slice(0, 80)}" explain my symptoms?`);
  }
  questions.push('Do I need any additional tests or follow-up imaging?');
  questions.push('What treatment or lifestyle changes might help?');
  questions.push('When should I schedule a follow-up with you?');

  return questions.slice(0, 5);
}

export function fallbackAskReportAnswer(
  canonical: CanonicalInsights,
  question: string,
): string {
  const q = question.trim().toLowerCase();
  const findingsText = (canonical.findings_text || []).join(' ').toLowerCase();
  const conditionsText = (canonical.possible_conditions || []).join(' ').toLowerCase();
  const reportBlob = `${findingsText} ${conditionsText}`;

  const notInReport = (term: string) => !reportBlob.includes(term.toLowerCase());

  if (q.includes('pneumonia') && notInReport('pneumonia') && notInReport('opacity')) {
    return (
      'The provided report does not mention pneumonia. Imaging findings can have several possible causes, ' +
      'and the report alone cannot confirm pneumonia. Your doctor can interpret this together with your symptoms and examination.'
    );
  }

  if (q.includes('cancer') || q.includes('tumor') || q.includes('mass')) {
    if (notInReport('cancer') && notInReport('tumor') && notInReport('mass') && notInReport('malign')) {
      return (
        'The provided report does not mention cancer, a tumor, or a mass. I cannot explain a finding that is not stated in this report. ' +
        'Please discuss any concerns with your doctor.'
      );
    }
  }

  if (q.includes('fracture') && notInReport('fracture') && notInReport('break')) {
    return (
      'The provided report does not mention a fracture. If you are worried about a broken bone, please ask your doctor to review the images with you.'
    );
  }

  if (q.includes('serious') || q.includes('dangerous')) {
    const level = canonical.attention_level || '';
    return (
      `Your report is marked for attention level: "${level || 'review with your doctor'}". ` +
      'This AI summary is educational only and cannot determine how serious a finding is for you personally. ' +
      'Your doctor can explain what this means in your case.'
    );
  }

  if (findingsText) {
    const summary = (canonical.findings_text || [])[0];
    return (
      `Based on your report, one observation is: "${summary}". ` +
      'This is educational information from your imaging summary, not a diagnosis. ' +
      'Your doctor can explain what it means for you and whether any next steps are needed.'
    );
  }

  return (
    'I can only explain what is included in your provided report. ' +
    'Please ask about a specific finding mentioned in the report, or consult your healthcare professional for personal medical advice.'
  );
}

export function isNewApiUnavailable(statusCode?: number): boolean {
  return statusCode === 404 || statusCode === 405 || statusCode === 501;
}
