import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { theme } from '../theme';
import type { ConfidenceInfo } from '../lib/canonicalInsights';

type Props = {
  confidence?: ConfidenceInfo | null;
};

const LEVEL_COLORS: Record<string, string> = {
  HIGH: theme.colors.success,
  MODERATE: theme.colors.warning,
  LOW: theme.colors.info,
  INSUFFICIENT_INFORMATION: theme.colors.text.tertiary,
};

export const ConfidenceDisplay: React.FC<Props> = ({ confidence }) => {
  if (!confidence) return null;

  const color = LEVEL_COLORS[confidence.level] || theme.colors.text.secondary;
  const label = confidence.label || 'Insufficient Information';

  return (
    <Card elevated variant="gradient">
      <Text style={styles.title}>AI Confidence: {label}</Text>
      <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '55' }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
      <Text style={styles.disclaimer}>
        {confidence.disclaimer ||
          'AI confidence reflects how strongly the AI supports this finding. It is not a medical diagnosis.'}
      </Text>
      {confidence.is_calibrated === false && (
        <Text style={styles.note}>
          This confidence level is AI-estimated and has not been clinically validated as a disease probability.
        </Text>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    marginBottom: theme.spacing.sm,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  disclaimer: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  note: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    lineHeight: theme.typography.fontSize.xs * 1.4,
  },
});
