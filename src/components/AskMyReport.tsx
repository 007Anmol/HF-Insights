import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Spacer } from './Spacer';
import { Button } from './Button';
import { theme } from '../theme';
import type { CanonicalInsights } from '../lib/canonicalInsights';
import type { AppLanguage } from '../types/language';
import { askReportQuestion } from '../insights';

const SUGGESTED_QUESTIONS = [
  'What does this finding mean?',
  'Is this serious?',
  'What does this medical term mean?',
  'What should I ask my doctor?',
  'Why was this mentioned in my report?',
  'What does this finding mean for me?',
];

type Props = {
  canonical: CanonicalInsights;
  language: AppLanguage;
  previousReportSummary?: string;
};

export const AskMyReport: React.FC<Props> = ({ canonical, language, previousReportSummary }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  const submit = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setOfflineNotice(null);
    try {
      const result = await askReportQuestion({
        canonical,
        question: trimmed,
        language,
        previousReportSummary,
      });
      setAnswer(result.answer);
      if (result.offline_fallback) {
        setOfflineNotice(
          'Using a summary from your report only. Connect to the latest backend for full AI answers.',
        );
      }
    } catch {
      setError('Unable to generate an answer right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevated>
      <View style={styles.headerRow}>
        <Ionicons name="chatbubbles-outline" size={22} color={theme.colors.primary} />
        <Text style={styles.title}>Ask My Report</Text>
      </View>
      <Text style={styles.subtitle}>Ask anything about your report</Text>

      <Spacer size={16} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestions}>
        {SUGGESTED_QUESTIONS.map((item) => (
          <Pressable key={item} style={styles.suggestionChip} onPress={() => submit(item)}>
            <Text style={styles.suggestionText}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Spacer size={12} />

      <TextInput
        style={styles.input}
        placeholder="Type your question..."
        placeholderTextColor={theme.colors.text.tertiary}
        value={question}
        onChangeText={setQuestion}
        multiline
      />

      <Spacer size={12} />

      <Button
        title={loading ? 'Thinking...' : 'Ask'}
        onPress={() => submit(question)}
        disabled={loading || !question.trim()}
        fullWidth
      />

      {loading && (
        <>
          <Spacer size={16} />
          <ActivityIndicator color={theme.colors.primary} />
        </>
      )}

      {error && (
        <>
          <Spacer size={12} />
          <Text style={styles.errorText}>{error}</Text>
        </>
      )}

      {offlineNotice && (
        <>
          <Spacer size={12} />
          <Text style={styles.noticeText}>{offlineNotice}</Text>
        </>
      )}

      {answer && (
        <>
          <Spacer size={16} />
          <View style={styles.answerBox}>
            <Text style={styles.answerLabel}>Answer</Text>
            <Text style={styles.answerText}>{answer}</Text>
          </View>
        </>
      )}
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
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  suggestions: {
    gap: theme.spacing.sm,
    paddingVertical: 2,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.iconBackground.blue,
    maxWidth: 260,
  },
  suggestionText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    textAlignVertical: 'top',
    backgroundColor: theme.colors.background.primary,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
  },
  noticeText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  answerBox: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  answerLabel: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  answerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
});
