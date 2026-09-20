import React, { useMemo, useState, useEffect } from 'react';
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
  Pressable,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Spacer } from '../../src/components/Spacer';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';
import { InfoBox } from '../../src/components/InfoBox';
import ResultsLayout from '../../src/components/ResultsLayout';
import { ReportWhatsNext } from '../../src/components/ReportWhatsNext';
import { LanguageSelector } from '../../src/components/LanguageSelector';
import { ConfidenceDisplay } from '../../src/components/ConfidenceDisplay';
import { AskMyReport } from '../../src/components/AskMyReport';
import { DoctorQuestions } from '../../src/components/DoctorQuestions';
import { ReportNavBar, type ReportNavSection } from '../../src/components/ReportNavBar';
import { MedicalTermRichText } from '../../src/components/MedicalTermRichText';
import { TermExplanationSheet } from '../../src/components/TermExplanationSheet';
import type { CanonicalInsights } from '../../src/lib/canonicalInsights';
import { useReportScrollNav } from '../../src/hooks/useReportScrollNav';
import {
  generateReportSections,
  isBackendReportFeaturesLimited,
  translateAnalysis,
} from '../../src/insights';
import { buildDisplayContentKey } from '../../src/lib/displayFingerprint';
import { getCanonicalFromInsights, getDisplayInsights } from '../../src/lib/canonicalInsights';
import { AppLanguage } from '../../src/types/language';
import { detectDefaultLanguage, loadDisplayLanguage, saveDisplayLanguage } from '../../src/lib/languageStorage';

const HEALTH_CITATIONS = [
  { title: 'Mayo Clinic', url: 'https://www.mayoclinic.org/' },
  { title: 'World Health Organization', url: 'https://www.who.int/' },
  { title: 'Centers for Disease Control and Prevention', url: 'https://www.cdc.gov/' },
  { title: 'National Institutes of Health', url: 'https://www.nih.gov/' },
  { title: 'MedlinePlus', url: 'https://medlineplus.gov/' },
  { title: 'Cleveland Clinic', url: 'https://my.clevelandclinic.org/' },
  { title: 'Johns Hopkins Medicine', url: 'https://www.hopkinsmedicine.org/' },
  { title: 'Healthline', url: 'https://www.healthline.com/' },
  { title: 'Medical News Today', url: 'https://www.medicalnewstoday.com/' },
  { title: 'WebMD', url: 'https://www.webmd.com/' },
];

const hasSectionContent = (value: any) => Boolean(
  value && (
    (Array.isArray(value.recommended_actions) && value.recommended_actions.length > 0) ||
    (Array.isArray(value.lifestyle_recommendations) && value.lifestyle_recommendations.length > 0) ||
    (Array.isArray(value.checklist) && value.checklist.length > 0) ||
    (Array.isArray(value.seek_medical_attention) && value.seek_medical_attention.length > 0) ||
    typeof value.ai_confidence === 'number' ||
    Boolean(value.expected_outcome)
  )
);

const buildSectionsFromInsights = (insights: any) => {
  const findings = Array.isArray(insights?.findings) ? insights.findings.filter(Boolean) : [];
  const conditions = Array.isArray(insights?.possible_conditions) ? insights.possible_conditions.filter(Boolean) : [];
  const symptoms = Array.isArray(insights?.possible_symptoms) ? insights.possible_symptoms.filter(Boolean) : [];
  const confidence = typeof insights?.confidence_score === 'number'
    ? Math.max(0, Math.min(100, Math.round(insights.confidence_score <= 1 ? insights.confidence_score * 100 : insights.confidence_score)))
    : 0;

  return {
    recommended_actions: [
      findings.length > 0 ? {
        title: 'Review image observations',
        bullets: findings.slice(0, 3),
      } : null,
      conditions.length > 0 ? {
        title: 'Discuss patterns with your doctor',
        bullets: conditions.slice(0, 3),
      } : null,
    ].filter(Boolean),
    lifestyle_recommendations: symptoms.slice(0, 3).map((symptom: string) => ({
      label: symptom,
      percent: confidence || 60,
      level: confidence >= 75 ? 'High' : confidence >= 45 ? 'Medium' : 'Low',
    })),
    checklist: [
      ...findings.slice(0, 2).map((item: string) => `Keep note of: ${item}`),
      ...symptoms.slice(0, 2).map((item: string) => `Watch for changes related to: ${item}`),
    ].slice(0, 4),
    seek_medical_attention: symptoms.length > 0
      ? symptoms.slice(0, 3).map((item: string) => `If ${item.toLowerCase()} becomes severe or persistent`)
      : ['If symptoms become severe or persistent'],
    ai_confidence: confidence,
    expected_outcome: findings.length > 0
      ? 'These sections are organized from the scan insights while generated recommendations load or retry.'
      : '',
  };
};

const Checklist: React.FC = () => {
  const [items, setItems] = useState([
    { id: 'water', text: 'Drink 2L water today', done: false },
    { id: 'walk', text: 'Walk 30 minutes', done: false },
    { id: 'breath', text: 'Practice breathing exercise', done: false },
    { id: 'sleep', text: 'Sleep 7-8 hours', done: false },
    { id: 'avoid', text: 'Avoid smoking exposure', done: false },
  ]);

  const toggle = (id: string) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, done: !it.done } : it));
  };

  return (
    <View>
      {items.map(item => (
        <TouchableOpacity key={item.id} onPress={() => toggle(item.id)} style={styles.checkRow}>
          <View style={[styles.checkbox, item.done && styles.checkboxChecked]}>
            {item.done && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={[styles.bodyText, { marginLeft: 8 }]}>{item.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default function ScanResult() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scans, updateScan } = useApp();

  const scan = useMemo(() => scans.find(s => s.id === String(params.id)), [scans, params.id]);

  const randomCitations = useMemo(() => {
    const shuffled = [...HEALTH_CITATIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 2);
  }, []);
  const [sections, setSections] = useState<any | null>(null);
  const [loadingSections, setLoadingSections] = useState(false);
  const [sectionsError, setSectionsError] = useState<string | null>(null);
  const [displayLanguage, setDisplayLanguage] = useState<AppLanguage>(() => detectDefaultLanguage());
  const [translating, setTranslating] = useState(false);
  const [translationNotice, setTranslationNotice] = useState<string | null>(null);
  const [termSheetTerm, setTermSheetTerm] = useState<string | null>(null);
  const [voiceConversationOpen, setVoiceConversationOpen] = useState(false);
  const [voiceLoadError, setVoiceLoadError] = useState<string | null>(null);
  const [backendLimited, setBackendLimited] = useState(false);
  const [VoiceConversationModal, setVoiceConversationModal] = useState<
    React.ComponentType<{
      visible: boolean;
      onClose: () => void;
      canonical: CanonicalInsights;
      displayLanguage: AppLanguage;
      previousReportSummary?: string;
      reportTitle?: string;
    }> | null
  >(null);
  const insights = scan?.insights;

  useEffect(() => {
    loadDisplayLanguage().then(setDisplayLanguage);
  }, []);

  const canonical = useMemo(
    () => (insights ? getCanonicalFromInsights(insights) : null),
    [insights],
  );

  useEffect(() => {
    if (!voiceConversationOpen || !canonical || VoiceConversationModal) return;
    setVoiceLoadError(null);
    // Metro resolves this path; Node16 moduleResolution requires an extension for tsc only.
    void import('../../src/components/ReportVoiceConversation' as `${string}.tsx`)
      .then((mod) => {
        setVoiceConversationModal(() => mod.ReportVoiceConversation);
      })
      .catch(() => {
        setVoiceLoadError('Voice chat could not load. Reload the app and try again.');
        setVoiceConversationOpen(false);
      });
  }, [voiceConversationOpen, canonical, VoiceConversationModal]);

  const display = useMemo(
    () => (insights ? getDisplayInsights(insights, displayLanguage) : null),
    [insights, displayLanguage],
  );

  const displayContentKey = useMemo(
    () => buildDisplayContentKey(displayLanguage, display),
    [displayLanguage, display],
  );

  useEffect(() => {
    let mounted = true;
    void isBackendReportFeaturesLimited().then((limited) => {
      if (mounted) setBackendLimited(limited);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!voiceLoadError) return;
    Toast.show({ type: 'error', text1: 'Voice unavailable', text2: voiceLoadError });
  }, [voiceLoadError]);

  const previousReportSummary = useMemo(() => {
    if (!scan) return undefined;
    const older = scans
      .filter((s) => s.id !== scan.id)
      .sort((a, b) => b.createdAt - a.createdAt)[0];
    if (!older?.insights) return undefined;
    const c = getCanonicalFromInsights(older.insights);
    return c.summary || c.findings_text?.[0];
  }, [scan, scans]);

  const attention_level = display?.attention_level || (insights as any)?.attention_level;

  const hasGuidanceContent = useMemo(() => {
    if (loadingSections) return true;
    if (!sections) return false;
    return Boolean(
      (Array.isArray(sections.recommended_actions) && sections.recommended_actions.length > 0) ||
      (Array.isArray(sections.lifestyle_recommendations) && sections.lifestyle_recommendations.length > 0) ||
      (Array.isArray(sections.checklist) && sections.checklist.length > 0) ||
      (Array.isArray(sections.seek_medical_attention) && sections.seek_medical_attention.length > 0) ||
      typeof sections.ai_confidence === 'number' ||
      Boolean(sections.expected_outcome),
    );
  }, [loadingSections, sections]);

  const navSections = useMemo((): ReportNavSection[] => {
    if (!insights) return [];
    const items: ReportNavSection[] = [{ id: 'findings', label: 'Findings' }];
    if (canonical?.confidence) items.push({ id: 'confidence', label: 'Confidence' });
    if (hasGuidanceContent || sectionsError) items.push({ id: 'guidance', label: 'Guidance' });
    items.push({ id: 'references', label: 'References' });
    if (canonical) {
      items.push({ id: 'ask', label: 'Ask' });
      items.push({ id: 'doctor', label: 'Doctor Qs' });
    }
    items.push({ id: 'next', label: 'Next Steps' });
    return items;
  }, [insights, canonical, hasGuidanceContent, sectionsError]);

  const navSectionIds = useMemo(() => navSections.map((section) => section.id), [navSections]);
  const {
    scrollRef,
    activeSection,
    setHeaderHeight,
    registerSection,
    scrollToSection,
    onScroll,
  } = useReportScrollNav(navSectionIds, theme.spacing.lg);

  useEffect(() => {
    if (!insights || !canonical) return;

    let mounted = true;
    async function fetchSections() {
      setLoadingSections(true);
      setSectionsError(null);
      try {
        const payload = {
          language: displayLanguage,
          insights: {
            xray_type: insights?.xray_type,
            attention_level: display?.attention_level || insights?.attention_level,
            findings: display?.findings || insights?.findings,
            possible_conditions: display?.possible_conditions || insights?.possible_conditions,
            possible_symptoms: display?.possible_symptoms || insights?.possible_symptoms,
            references: insights?.references,
            confidence_score: insights?.confidence_score,
          },
        };

        const data = await generateReportSections(payload);
        if (mounted) {
          setSections(hasSectionContent(data) ? data : buildSectionsFromInsights({ ...insights, findings: display?.findings }));
        }
      } catch {
        if (mounted) {
          setSections(buildSectionsFromInsights({ ...insights, findings: display?.findings }));
          setSectionsError('Generated sections are unavailable right now. The scan insights below are still available.');
        }
      } finally {
        if (mounted) setLoadingSections(false);
      }
    }

    fetchSections();
    return () => { mounted = false; };
  }, [insights, displayContentKey, display?.findings]);

  const handleLanguageChange = async (lang: AppLanguage) => {
    if (!scan || !insights || !canonical) return;
    const previousLang = displayLanguage;
    setDisplayLanguage(lang);
    await saveDisplayLanguage(lang);
    setTranslationNotice(null);

    if (lang === 'en') return;
    if (insights.translations?.[lang] && !(insights.translations[lang] as { translation_fallback?: boolean })?.translation_fallback) return;

    setTranslating(true);
    try {
      const translated = await translateAnalysis(canonical, lang);
      if (translated.translation_fallback) {
        setDisplayLanguage(previousLang);
        await saveDisplayLanguage(previousLang);
        setTranslationNotice('Translation is temporarily unavailable. Showing the original report.');
        return;
      }
      await updateScan(scan.id, (current) => ({
        ...current,
        insights: {
          ...current.insights,
          translations: {
            ...(current.insights.translations || {}),
            [lang]: translated,
          },
        },
      }));
    } catch (err: any) {
      setDisplayLanguage(previousLang);
      await saveDisplayLanguage(previousLang);
      if (err?.message === 'TRANSLATION_API_UNAVAILABLE') {
        setTranslationNotice('Translation service is not available yet. Please update the app backend or try again later.');
      } else {
        setTranslationNotice('Translation is temporarily unavailable. Showing the original report.');
      }
    } finally {
      setTranslating(false);
    }
  };

  const cacheDoctorQuestions = async (questions: string[], lang: AppLanguage) => {
    if (!scan) return;
    await updateScan(scan.id, (current) => ({
      ...current,
      insights: {
        ...current.insights,
        doctor_questions: {
          ...(current.insights.doctor_questions || {}),
          [lang]: questions,
        },
      },
    }));
  };

  if (!scan || !insights) {
    return (
      <View style={styles.container}> 
        <View style={styles.inner}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
            <Spacer size={16} />
            <Text style={styles.errorTitle}>Scan not found</Text>
            <Spacer size={8} />
            <Text style={styles.errorSubtitle}>The scan you're looking for doesn't exist or has been removed.</Text>
            <Spacer size={24} />
            <Button title="Back to Dashboard" onPress={() => router.replace('/dashboard')} fullWidth />
          </View>
        </View>
      </View>
    );
  }

  const openTermExplanation = (term: string) => setTermSheetTerm(term);

  const renderPrimaryInsights = () => {
    if (!display || !canonical) return null;
    return (
    <>
      {display.findings?.length ? (
        <>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconBg}
            >
              <Ionicons name="reader-outline" size={20} color={theme.colors.primary} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Image Observations</Text>
          </View>
          <Spacer size={12} />
          <Card elevated variant="gradient">
            {display.findings.map((item: string, idx: number) => (
              <View key={`finding-${idx}`} style={[styles.listItem, idx > 0 && styles.listItemBorder]}>
                <View style={styles.bulletPoint}>
                  <View style={styles.bulletDot} />
                </View>
                <MedicalTermRichText text={item} style={styles.bodyText} onExplainTerm={openTermExplanation} />
              </View>
            ))}
          </Card>
        </>
      ) : display.summary ? (
        <>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconBg}
            >
              <Ionicons name="reader-outline" size={20} color={theme.colors.primary} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Overall Summary</Text>
          </View>
          <Spacer size={12} />
          <Card elevated variant="gradient">
            <MedicalTermRichText text={display.summary} style={styles.bodyText} onExplainTerm={openTermExplanation} />
          </Card>
        </>
      ) : null}

      {display.possible_conditions?.length ? (
        <>
          <Spacer size={28} />
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#ECFDF5', '#D1FAE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconBg}
            >
              <Ionicons name="clipboard-outline" size={20} color={theme.colors.secondary} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Patterns the AI Detected</Text>
          </View>
          <Spacer size={12} />
          <Card elevated variant="gradient">
            {display.possible_conditions.map((r: string, idx: number) => (
              <View key={`cond-${idx}`} style={[styles.listItem, idx > 0 && styles.listItemBorder]}>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.secondary} />
                </View>
                <MedicalTermRichText text={r} style={styles.bodyText} onExplainTerm={openTermExplanation} />
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {display.possible_symptoms?.length ? (
        <>
          <Spacer size={28} />
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconBg}
            >
              <Ionicons name="medkit-outline" size={20} color={theme.colors.info} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Possible Symptoms</Text>
          </View>
          <Spacer size={12} />
          <Card elevated variant="gradient">
            {display.possible_symptoms.map((t: string, idx: number) => (
              <View key={`sym-${idx}`} style={[styles.listItem, idx > 0 && styles.listItemBorder]}>
                <View style={styles.bulletPoint}>
                  <Ionicons name="heart-outline" size={16} color={theme.colors.info} />
                </View>
                <MedicalTermRichText text={t} style={styles.bodyText} onExplainTerm={openTermExplanation} />
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {(display.findings?.length || display.summary || display.possible_conditions?.length || display.possible_symptoms?.length) && (
        <Spacer size={28} />
      )}
    </>
  );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + theme.spacing.xs }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.primary} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {insights.title}
        </Text>
        <Pressable
          onPress={() => setVoiceConversationOpen(true)}
          style={styles.voiceHeaderButton}
          accessibilityRole="button"
          accessibilityLabel="Talk about your report"
        >
          <Ionicons name="mic" size={22} color={theme.colors.primary} />
        </Pressable>
      </View>

      <ReportNavBar
        sections={navSections}
        activeId={activeSection}
        onSelect={scrollToSection}
      />

      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.container}
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
      >
        <View collapsable={false}>
          <ResultsLayout
            title={insights.title}
            attentionLevel={attention_level}
            xrayType={insights.xray_type}
            confidenceScore={insights.confidence_score}
            createdAt={scan.createdAt}
            onHeaderLayout={setHeaderHeight}
            disclaimer="HF Insights provides educational insights only. This is not a medical diagnosis. Always consult a healthcare professional for medical advice."
          >

          <View onLayout={registerSection('findings')} collapsable={false}>
            {renderPrimaryInsights()}

            <Card elevated>
              <Text style={styles.sectionTitle}>Report Language</Text>
              <Spacer size={8} />
              <LanguageSelector value={displayLanguage} onChange={handleLanguageChange} compact />
              {translating && (
                <>
                  <Spacer size={8} />
                  <Text style={styles.metaText}>Updating report language...</Text>
                </>
              )}
            </Card>

            {translationNotice && (
              <>
                <Spacer size={12} />
                <InfoBox type="warning" message={translationNotice} />
              </>
            )}

            {backendLimited && (
              <>
                <Spacer size={12} />
                <InfoBox
                  type="info"
                  message="Some AI features use report-only summaries until the server is updated (translation, Ask My Report, voice, ElevenLabs). Scan analysis still works."
                />
              </>
            )}
          </View>

          <Spacer size={20} />

          {canonical?.confidence && (
            <View onLayout={registerSection('confidence')} collapsable={false}>
              <ConfidenceDisplay confidence={canonical.confidence} />
              <Spacer size={28} />
            </View>
          )}

          <View onLayout={registerSection('guidance')} collapsable={false}>
      {loadingSections ? (
        <>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#EFF6FF', '#DBEAFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconBg}
            >
              <Ionicons name="sparkles-outline" size={20} color={theme.colors.primary} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Generating Sections</Text>
          </View>
          <Spacer size={12} />
          <Card elevated variant="gradient">
            <Text style={styles.bodyText}>Preparing personalized sections from this scan's insights...</Text>
          </Card>
          <Spacer size={28} />
        </>
      ) : sections ? (
        <>
          {sectionsError ? (
            <>
              <InfoBox message={sectionsError} />
              <Spacer size={20} />
            </>
          ) : null}

          {Array.isArray(sections.recommended_actions) && sections.recommended_actions.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={['#EFFCF0', '#E6FFFA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sectionIconBg}
                >
                  <Ionicons name="heart-outline" size={20} color={theme.colors.success} />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Recommended Actions</Text>
              </View>
              <Spacer size={12} />
              <Card elevated variant="gradient">
                {sections.recommended_actions.map((act: any, idx: number) => (
                  <View key={`ra-${idx}`} style={[styles.actionItem, idx > 0 && styles.listItemBorder]}>
                    <View style={styles.actionIcon}>
                      <Ionicons name="ellipse" size={14} color={theme.colors.primary} />
                    </View>
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>{act.title}</Text>
                      {Array.isArray(act.bullets) && act.bullets.map((bullet: string, bulletIndex: number) => (
                        <Text key={`ra-bullet-${bulletIndex}`} style={styles.actionBullets}>• {bullet}</Text>
                      ))}
                    </View>
                  </View>
                ))}
              </Card>
              <Spacer size={28} />
            </>
          )}

          {Array.isArray(sections.lifestyle_recommendations) && sections.lifestyle_recommendations.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={['#EFF6FF', '#DBEAFE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sectionIconBg}
                >
                  <Ionicons name="trail-sign-outline" size={20} color={theme.colors.primary} />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Lifestyle Recommendations</Text>
              </View>
              <Spacer size={12} />
              <Card elevated variant="gradient">
                {sections.lifestyle_recommendations.map((item: any, idx: number) => (
                  <View key={`lv-${idx}`} style={[styles.lifestyleRow, idx > 0 && styles.listItemBorder]}>
                    <View style={styles.lifestyleLabelRow}>
                      <Text style={styles.bodyText}>{item.label}</Text>
                      <View style={styles.lifestyleLevel}><Text style={styles.levelText}>{item.level}</Text></View>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, Number(item.percent || 0)))}%` }]} />
                    </View>
                  </View>
                ))}
              </Card>
              <Spacer size={28} />
            </>
          )}

          {Array.isArray(sections.checklist) && sections.checklist.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={['#EFF6FF', '#DBEAFE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sectionIconBg}
                >
                  <Ionicons name="checkmark-done-outline" size={20} color={theme.colors.primary} />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Your Health Checklist</Text>
              </View>
              <Spacer size={12} />
              <Card elevated variant="gradient">
                {sections.checklist.map((item: string, idx: number) => (
                  <View key={`chk-${idx}`} style={[styles.checkRow, idx > 0 && styles.listItemBorder]}>
                    <View style={styles.checkbox} />
                    <Text style={[styles.bodyText, { marginLeft: 8 }]}>{item}</Text>
                  </View>
                ))}
              </Card>
              <Spacer size={28} />
            </>
          )}

          {Array.isArray(sections.seek_medical_attention) && sections.seek_medical_attention.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={['#FFFBEB', '#FEF3C7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sectionIconBg}
                >
                  <Ionicons name="alert-circle-outline" size={20} color={theme.colors.warning} />
                </LinearGradient>
                <Text style={styles.sectionTitle}>Seek Medical Attention If</Text>
              </View>
              <Spacer size={12} />
              <Card elevated variant="gradient">
                {sections.seek_medical_attention.map((item: string, idx: number) => (
                  <View key={`warn-${idx}`} style={[styles.listItem, idx > 0 && styles.listItemBorder]}>
                    <View style={styles.bulletPoint}><Ionicons name="caret-forward-outline" size={12} color={theme.colors.warning} /></View>
                    <Text style={styles.bodyText}>{item}</Text>
                  </View>
                ))}
              </Card>
              <Spacer size={28} />
            </>
          )}

          {typeof sections.ai_confidence === 'number' && !canonical?.confidence && (
            <>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={['#EFF6FF', '#DBEAFE']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sectionIconBg}
                >
                  <Ionicons name="flash-outline" size={20} color={theme.colors.primary} />
                </LinearGradient>
                <Text style={styles.sectionTitle}>AI Confidence</Text>
              </View>
              <Spacer size={12} />
              <Card elevated variant="gradient">
                <View style={styles.aiConfidenceContent}>
                  <View style={styles.aiConfidenceSummary}>
                    <View style={styles.aiCircle}>
                      <Text style={styles.aiPercent}>{sections.ai_confidence}%</Text>
                    </View>
                    <View style={styles.aiConfidenceTextGroup}>
                      <Text style={styles.aiLabel}>Confidence Level</Text>
                      <Text style={styles.aiDescription}>Generated from the scan insights and supporting medical context.</Text>
                    </View>
                  </View>
                  <View style={styles.aiConfidenceMeter}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, Number(sections.ai_confidence || 0)))}%` }]} />
                    </View>
                  </View>
                </View>
              </Card>
              <Spacer size={28} />
            </>
          )}

          {!!sections.expected_outcome && (
            <>
              <View style={styles.sectionHeader}>
                <LinearGradient
                  colors={['#ECFDF5', '#D1FAE5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sectionIconBg}
                >
                  <Ionicons name="trending-up-outline" size={20} color={theme.colors.success} />
                </LinearGradient>
                <Text style={styles.sectionTitle}>General Information</Text>
              </View>
              <Spacer size={12} />
              <Card elevated variant="gradient">
                <Text style={styles.bodyText}>{sections.expected_outcome}</Text>
              </Card>
              <Spacer size={28} />
            </>
          )}
        </>
      ) : sectionsError ? (
        <>
          <InfoBox message={sectionsError} />
          <Spacer size={28} />
        </>
      ) : null}
          </View>

      <View onLayout={registerSection('references')} collapsable={false}>
      {randomCitations.length > 0 ? (
        <>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#F3E8FF', '#FCE7F3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconBg}
            >
              <Ionicons name="link-outline" size={20} color={theme.colors.error} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>References & Citations</Text>
          </View>
          <Spacer size={12} />
          <Card elevated variant="gradient">
            {randomCitations.map((citation, idx) => (
              <TouchableOpacity
                key={`cit-${idx}`}
                style={[styles.listItem, idx > 0 && styles.listItemBorder]}
                onPress={async () => {
                  try {
                    const supported = await Linking.canOpenURL(citation.url);
                    if (supported) {
                      await Linking.openURL(citation.url);
                    } else {
                      console.warn(`Cannot open URL: ${citation.url}`);
                    }
                  } catch (error) {
                    console.error('An error occurred trying to open the URL:', error);
                  }
                }}
              >
                <View style={styles.bulletPoint}>
                  <Ionicons name="open-outline" size={16} color={theme.colors.primary} />
                </View>
                <Text style={[styles.bodyText, { color: theme.colors.primary, textDecorationLine: 'underline', flex: 1 }]} numberOfLines={1}>
                  {citation.title}
                </Text>
              </TouchableOpacity>
            ))}
          </Card>
          <Spacer size={28} />
        </>
      ) : null}
      </View>

      <Spacer size={32} />

      {canonical && (
        <>
          <View onLayout={registerSection('ask')} collapsable={false}>
            <AskMyReport
              canonical={canonical}
              language={displayLanguage}
              previousReportSummary={previousReportSummary}
            />
          </View>
          <Spacer size={28} />
          <View onLayout={registerSection('doctor')} collapsable={false}>
            <DoctorQuestions
              canonical={canonical}
              language={displayLanguage}
              contentKey={`${scan.id}-${displayContentKey}`}
              cachedQuestions={insights.doctor_questions?.[displayLanguage]}
              onCached={cacheDoctorQuestions}
            />
          </View>
          <Spacer size={28} />
        </>
      )}

      <View onLayout={registerSection('next')} collapsable={false}>
        <ReportWhatsNext
          title={insights.title}
          createdAt={scan.createdAt}
          insights={insights}
          shareSnapshot={{
            xray_type: insights.xray_type,
            findings: display?.findings,
            possible_conditions: display?.possible_conditions,
            possible_symptoms: display?.possible_symptoms,
            summary: display?.summary,
          }}
          onAnalyzeAnother={() => router.push('/scan/new')}
          onReturnDashboard={() => router.replace('/dashboard')}
        />
      </View>
          </ResultsLayout>
        </View>
      </ScrollView>

      {canonical && (
        <>
          <TermExplanationSheet
            visible={Boolean(termSheetTerm)}
            term={termSheetTerm}
            canonical={canonical}
            language={displayLanguage}
            onClose={() => setTermSheetTerm(null)}
          />
          {VoiceConversationModal ? (
            <VoiceConversationModal
              visible={voiceConversationOpen}
              onClose={() => setVoiceConversationOpen(false)}
              canonical={canonical}
              displayLanguage={displayLanguage}
              previousReportSummary={previousReportSummary}
              reportTitle={insights.title}
            />
          ) : null}
          <Modal visible={voiceConversationOpen && !VoiceConversationModal} transparent animationType="fade">
            <View style={styles.voiceLoadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          </Modal>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingRight: theme.spacing.sm,
  },
  backLabel: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  voiceHeaderButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceLoadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  container: { 
    backgroundColor: theme.colors.background.primary,
    flex: 1,
  },
  inner: { 
    paddingBottom: theme.spacing['3xl'],
  },
  headerGradient: {
    paddingTop: theme.spacing['2xl'],
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.layout.screenPadding,
  },
  headerSection: {
    alignItems: 'center',
  },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { 
    color: theme.colors.text.primary, 
    fontSize: theme.typography.fontSize['2xl'], 
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.md,
    marginRight: theme.spacing.sm,
  },
  timestamp: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  typeText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  confidenceBadge: {
    backgroundColor: theme.colors.iconBackground.teal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  confidenceText: {
    color: theme.colors.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  contentSection: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconBg: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  sectionTitle: { 
    color: theme.colors.text.primary, 
    fontSize: theme.typography.fontSize.lg, 
    fontWeight: theme.typography.fontWeight.bold,
    letterSpacing: -0.2,
  },
  bodyText: { 
    color: theme.colors.text.primary, 
    fontSize: theme.typography.fontSize.base, 
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  listItemBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  bulletPoint: {
    marginTop: 4,
    width: 20,
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.layout.screenPadding,
  },
  errorTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  errorSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  metaText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.md,
  },
  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.06)',
    marginRight: theme.spacing.sm,
  },
  actionContent: {
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  actionBullets: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  lifestyleRow: {
    paddingVertical: theme.spacing.md,
  },
  lifestyleLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  lifestyleLevel: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface.light,
  },
  levelText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  progressTrack: {
    height: 10,
    backgroundColor: theme.colors.border.light,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  aiConfidenceSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiConfidenceContent: {
    minWidth: 0,
  },
  aiConfidenceTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  aiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: theme.colors.primary,
    marginRight: theme.spacing.sm,
  },
  aiPercent: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  aiLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 4,
  },
  aiDescription: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  aiConfidenceMeter: {
    marginTop: theme.spacing.sm,
  },
});
