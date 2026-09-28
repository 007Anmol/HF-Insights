import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Spacer } from './Spacer';
import { theme } from '../theme';
import type { CanonicalInsights } from '../lib/canonicalInsights';
import type { AppLanguage } from '../types/language';
import { fetchDoctorQuestions } from '../insights';

type Props = {
  canonical: CanonicalInsights;
  language: AppLanguage;
  contentKey?: string;
  cachedQuestions?: string[];
  onCached?: (questions: string[], language: AppLanguage) => void;
};

export const DoctorQuestions: React.FC<Props> = ({
  canonical,
  language,
  contentKey,
  cachedQuestions,
  onCached,
}) => {
  const [questions, setQuestions] = useState<string[]>(cachedQuestions || []);
  const [loading, setLoading] = useState(!cachedQuestions?.length);
  const [error, setError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  useEffect(() => {
    if (cachedQuestions?.length) {
      setQuestions(cachedQuestions);
      setLoading(false);
      setOfflineNotice(null);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      setOfflineNotice(null);
      try {
        const result = await fetchDoctorQuestions(canonical, language);
        if (!mounted) return;
        setQuestions(result.questions || []);
        if (result.offline_fallback) {
          setOfflineNotice('Suggested from your report summary. Update the backend for personalized AI questions.');
        }
        onCached?.(result.questions || [], language);
      } catch {
        if (mounted) {
          setError('Unable to generate doctor questions right now.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [language, contentKey, cachedQuestions?.length]);

  return (
    <Card elevated variant="gradient">
      <View style={styles.headerRow}>
        <Ionicons name="help-circle-outline" size={22} color={theme.colors.primary} />
        <Text style={styles.title}>Questions You May Want to Ask Your Doctor</Text>
      </View>
      <Text style={styles.subtitle}>
        Based on your report — to help you discuss next steps with your doctor
      </Text>

      <Spacer size={16} />

      {loading && <ActivityIndicator color={theme.colors.primary} />}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {offlineNotice && !error && <Text style={styles.noticeText}>{offlineNotice}</Text>}

      {!loading && !error && questions.map((q, idx) => (
        <View key={`${idx}-${q.slice(0, 12)}`} style={[styles.questionRow, idx > 0 && styles.borderTop]}>
          <View style={styles.numberBadge}>
            <Text style={styles.numberText}>{idx + 1}</Text>
          </View>
          <Text style={styles.questionText}>{q}</Text>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  numberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.iconBackground.blue,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  numberText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  questionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
  },
  noticeText: {
    marginBottom: theme.spacing.sm,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
});
