import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import type { AppLanguage } from '../types/language';
import type { CanonicalInsights } from '../lib/canonicalInsights';
import { fetchTermExplanation, type TermExplanation } from '../lib/termExplanation';

type Props = {
  visible: boolean;
  term: string | null;
  canonical: CanonicalInsights;
  language: AppLanguage;
  onClose: () => void;
};

export const TermExplanationSheet: React.FC<Props> = ({
  visible,
  term,
  canonical,
  language,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<TermExplanation | null>(null);
  useEffect(() => {
    if (!visible || !term) {
      setExplanation(null);
      return;
    }

    let mounted = true;
    (async () => {
      setLoading(true);
      const result = await fetchTermExplanation(term, canonical, language);
      if (mounted) {
        setExplanation(result);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [visible, term, canonical, language]);

  const displayTerm = explanation?.term || term || '';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            What does “{displayTerm}” mean?
          </Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {loading && <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 24 }} />}

          {!loading && explanation && !explanation.verified && (
            <Text style={styles.body}>{explanation.message}</Text>
          )}

          {!loading && explanation?.verified && (
            <>
              <Text style={styles.sectionLabel}>Simple meaning</Text>
              <Text style={styles.body}>{explanation.simple_meaning}</Text>

              <Text style={styles.sectionLabel}>In your report</Text>
              <Text style={styles.body}>{explanation.in_your_report}</Text>

              <Text style={styles.sectionLabel}>Important</Text>
              <Text style={styles.note}>{explanation.important_note}</Text>

              <Text style={styles.sectionLabel}>Discuss with your doctor</Text>
              <Text style={styles.subtle}>You may want to discuss:</Text>
              {(explanation.doctor_questions || []).map((q, idx) => (
                <View key={`${idx}-${q.slice(0, 16)}`} style={styles.questionRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.body}>{q}</Text>
                </View>
              ))}

              {explanation.review_status === 'clinically_reviewed' && (
                <Text style={styles.reviewMeta}>
                  Medically reviewed content · v{explanation.version || '1.0'}
                </Text>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    maxHeight: '82%',
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: theme.spacing.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border.light,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: theme.layout.screenPadding,
    gap: theme.spacing.md,
  },
  title: {
    flex: 1,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  content: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing['2xl'],
  },
  sectionLabel: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  body: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  note: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  subtle: {
    marginTop: 4,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  bullet: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.lg,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  reviewMeta: {
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
  },
});
