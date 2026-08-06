import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Spacer } from './Spacer';
import { InfoBox } from './InfoBox';
import { theme } from '../theme';

type OnboardingStep = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  iconBg: string;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'upload',
    icon: 'camera-outline',
    title: 'Upload your X-ray',
    description: 'Take a clear photo or choose one from your gallery',
    iconBg: theme.colors.iconBackground.blue,
  },
  {
    id: 'analyze',
    icon: 'sparkles-outline',
    title: 'AI analyzes your image',
    description: 'We look for patterns and explain them in plain language',
    iconBg: theme.colors.iconBackground.purple,
  },
  {
    id: 'review',
    icon: 'document-text-outline',
    title: 'Review your insights',
    description: 'Save or share your report with your doctor',
    iconBg: theme.colors.iconBackground.teal,
  },
];

type DashboardOnboardingProps = {
  userName?: string;
};

export const DashboardOnboarding: React.FC<DashboardOnboardingProps> = ({ userName }) => {
  const displayName = userName?.trim() || 'there';

  return (
    <View style={styles.container}>
      <Card variant="gradient" elevated>
        <LinearGradient
          colors={theme.colors.gradient.hero as unknown as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcomeBanner}
        >
          <View style={styles.welcomeIcon}>
            <Ionicons name="hand-left-outline" size={28} color={theme.colors.primary} />
          </View>
          <Spacer size={12} />
          <Text style={styles.welcomeTitle}>Welcome, {displayName}!</Text>
          <Spacer size={8} />
          <Text style={styles.welcomeSubtitle}>
            HF Insights helps you understand your X-ray in clear, everyday language — so you feel
            informed and supported.
          </Text>
        </LinearGradient>
      </Card>

      <Spacer size={16} />

      <Card elevated>
        <Text style={styles.sectionTitle}>How HF Insights works</Text>
        <Spacer size={4} />
        <Text style={styles.sectionSubtitle}>Three simple steps to get started</Text>
        <Spacer size={20} />

        {ONBOARDING_STEPS.map((step, index) => (
          <View key={step.id}>
            <View style={styles.stepRow}>
              <View style={styles.stepIndicator}>
                <View style={[styles.stepIcon, { backgroundColor: step.iconBg }]}>
                  <Ionicons name={step.icon} size={20} color={theme.colors.primary} />
                </View>
                {index < ONBOARDING_STEPS.length - 1 && <View style={styles.stepConnector} />}
              </View>
              <View style={styles.stepContent}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                </View>
                <Spacer size={4} />
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
            {index < ONBOARDING_STEPS.length - 1 && <Spacer size={16} />}
          </View>
        ))}

        <Spacer size={20} />

        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '0%' }]} />
          </View>
          <Spacer size={8} />
          <Text style={styles.progressText}>0 of 3 steps complete — tap New Scan to begin</Text>
        </View>
      </Card>

      <Spacer size={16} />

      <InfoBox
        type="info"
        message="HF Insights provides educational insights only. This is not a medical diagnosis. Always consult a healthcare professional for medical advice."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  welcomeBanner: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  welcomeTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    paddingHorizontal: theme.spacing.sm,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: theme.colors.border.light,
    marginTop: theme.spacing.sm,
  },
  stepContent: {
    flex: 1,
    paddingTop: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  stepNumber: {
    width: 22,
    height: 22,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.iconBackground.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  stepTitle: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  stepDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    marginLeft: 30,
  },
  progressContainer: {
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  progressTrack: {
    height: 6,
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.tertiary,
    textAlign: 'center',
  },
});
