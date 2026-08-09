import React from 'react';
import { View, Text, StyleSheet, Pressable, Share, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Card } from './Card';
import { Spacer } from './Spacer';
import { Button } from './Button';
import { theme } from '../theme';
import type { ScanItem } from '../context/AppContext';

type ReportWhatsNextProps = {
  title: string;
  createdAt: number;
  insights: ScanItem['insights'];
  onAnalyzeAnother: () => void;
  onReturnDashboard: () => void;
};

function formatReportText(
  title: string,
  createdAt: number,
  insights: ScanItem['insights'],
  forDoctor: boolean,
): string {
  const lines: string[] = [];

  lines.push(
    forDoctor
      ? 'Hi, I used HF Insights to help understand my X-ray. These are AI-generated educational notes for our discussion — not a diagnosis.'
      : 'HF Insights Report\nEducational insights only — not a medical diagnosis.',
  );
  lines.push('');
  lines.push(`Title: ${title}`);
  lines.push(`Date: ${new Date(createdAt).toLocaleString()}`);

  if (insights.xray_type) {
    lines.push(`X-ray type: ${insights.xray_type}`);
  }

  const appendSection = (heading: string, items?: string[]) => {
    if (!items?.length) return;
    lines.push('');
    lines.push(heading);
    items.forEach((item) => lines.push(`• ${item}`));
  };

  appendSection('Image Observations:', insights.findings);
  appendSection('Patterns the AI Detected:', insights.possible_conditions);
  appendSection('Possible Symptoms:', insights.possible_symptoms);

  if (insights.summary) {
    lines.push('');
    lines.push('Summary:');
    lines.push(insights.summary);
  }

  lines.push('');
  lines.push('Always consult a healthcare professional for medical advice.');

  return lines.join('\n');
}

type ActionRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  iconBg: string;
  onPress: () => void;
  showBorder?: boolean;
};

const ActionRow: React.FC<ActionRowProps> = ({
  icon,
  title,
  subtitle,
  iconBg,
  onPress,
  showBorder = false,
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.actionRow,
      showBorder && styles.actionRowBorder,
      pressed && styles.actionRowPressed,
    ]}
    accessibilityRole="button"
    accessibilityLabel={title}
  >
    <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
    </View>
    <View style={styles.actionTextGroup}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSubtitle}>{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={theme.colors.text.tertiary} />
  </Pressable>
);

export const ReportWhatsNext: React.FC<ReportWhatsNextProps> = ({
  title,
  createdAt,
  insights,
  onAnalyzeAnother,
  onReturnDashboard,
}) => {
  const shareReport = async (forDoctor: boolean) => {
    try {
      const message = formatReportText(title, createdAt, insights, forDoctor);
      await Share.share(
        Platform.OS === 'ios'
          ? { message, title: 'HF Insights Report' }
          : { message, title: 'HF Insights Report' },
      );
    } catch (error: any) {
      if (error?.message !== 'User did not share') {
        Toast.show({
          type: 'error',
          text1: 'Unable to share',
          text2: 'Please try again.',
        });
      }
    }
  };

  const confirmSaved = () => {
    Toast.show({
      type: 'success',
      text1: 'Report saved',
      text2: 'This report is already in your dashboard.',
    });
  };

  return (
    <View style={styles.container}>
      <Card elevated variant="gradient">
        <Text style={styles.heading}>What's Next</Text>
        <Spacer size={8} />
        <Text style={styles.supportText}>
          You have taken an important step toward understanding your imaging. Here are a few
          helpful ways to follow up.
        </Text>

        <Spacer size={20} />

        <ActionRow
          icon="medical-outline"
          title="Share with Doctor"
          subtitle="Send a summary to discuss at your appointment"
          iconBg={theme.colors.iconBackground.teal}
          onPress={() => shareReport(true)}
        />
        <ActionRow
          icon="share-outline"
          title="Download / Share Report"
          subtitle="Save to Files or send through your share sheet"
          iconBg={theme.colors.iconBackground.blue}
          onPress={() => shareReport(false)}
          showBorder
        />
        <ActionRow
          icon="bookmark-outline"
          title="Save Report"
          subtitle="Already saved to your dashboard"
          iconBg={theme.colors.iconBackground.purple}
          onPress={confirmSaved}
          showBorder
        />
      </Card>

      <Spacer size={24} />

      <Button title="Analyze Another X-ray" onPress={onAnalyzeAnother} fullWidth size="large" />
      <Spacer size={12} />
      <Button
        title="Return to Dashboard"
        variant="outline"
        onPress={onReturnDashboard}
        fullWidth
        size="large"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  heading: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  supportText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
    minHeight: theme.touchTarget.min,
  },
  actionRowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  actionRowPressed: {
    opacity: 0.7,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  actionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  actionSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
    lineHeight: theme.typography.fontSize.xs * 1.4,
  },
});
