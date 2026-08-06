import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { Spacer } from './Spacer';
import { theme } from '../theme';

type PhotoTip = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
};

const PHOTO_TIPS: PhotoTip[] = [
  { icon: 'sunny-outline', text: 'Use even lighting — avoid flash glare on the film' },
  { icon: 'scan-outline', text: 'Capture the entire X-ray with all edges visible' },
  { icon: 'phone-portrait-outline', text: 'Hold your phone straight, parallel to the image' },
  { icon: 'contrast-outline', text: 'Place the X-ray on a dark, flat surface for contrast' },
];

export const PhotoGuidanceCard: React.FC = () => {
  return (
    <Card elevated>
      <Text style={styles.title}>Tips for a clear photo</Text>
      <Spacer size={4} />
      <Text style={styles.subtitle}>Better photos help the AI give more useful insights</Text>

      <Spacer size={20} />

      <View style={styles.comparisonRow}>
        <View style={styles.exampleColumn}>
          <View style={[styles.exampleBadge, styles.goodBadge]}>
            <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
            <Text style={[styles.exampleBadgeText, styles.goodBadgeText]}>Good</Text>
          </View>
          <Spacer size={10} />
          <View style={[styles.exampleFrame, styles.goodFrame]}>
            <View style={styles.exampleInner}>
              <Ionicons name="medical-outline" size={28} color={theme.colors.primary} />
            </View>
          </View>
          <Spacer size={8} />
          <Text style={styles.exampleLabel}>Full image, straight, no glare</Text>
        </View>

        <View style={styles.exampleColumn}>
          <View style={[styles.exampleBadge, styles.badBadge]}>
            <Ionicons name="close-circle" size={14} color={theme.colors.error} />
            <Text style={[styles.exampleBadgeText, styles.badBadgeText]}>Avoid</Text>
          </View>
          <Spacer size={10} />
          <View style={[styles.exampleFrame, styles.badFrame]}>
            <View style={[styles.exampleInner, styles.badExampleInner]}>
              <Ionicons name="medical-outline" size={28} color={theme.colors.text.tertiary} />
              <View style={styles.glareOverlay} />
            </View>
          </View>
          <Spacer size={8} />
          <Text style={styles.exampleLabel}>Cropped, tilted, or glare</Text>
        </View>
      </View>

      <Spacer size={20} />

      {PHOTO_TIPS.map((tip, index) => (
        <View key={tip.text}>
          <View style={styles.tipRow}>
            <View style={styles.tipIcon}>
              <Ionicons name={tip.icon} size={18} color={theme.colors.primary} />
            </View>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
          {index < PHOTO_TIPS.length - 1 && <Spacer size={12} />}
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  exampleColumn: {
    flex: 1,
    alignItems: 'center',
  },
  exampleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  goodBadge: {
    backgroundColor: '#ECFDF5',
  },
  badBadge: {
    backgroundColor: '#FEF2F2',
  },
  exampleBadgeText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  goodBadgeText: {
    color: theme.colors.success,
  },
  badBadgeText: {
    color: theme.colors.error,
  },
  exampleFrame: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    padding: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goodFrame: {
    borderColor: theme.colors.success + '60',
    backgroundColor: theme.colors.iconBackground.blue,
  },
  badFrame: {
    borderColor: theme.colors.error + '60',
    backgroundColor: theme.colors.background.tertiary,
    transform: [{ rotate: '-8deg' }],
  },
  exampleInner: {
    flex: 1,
    width: '100%',
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badExampleInner: {
    opacity: 0.7,
  },
  glareOverlay: {
    position: 'absolute',
    top: -10,
    right: -20,
    width: 60,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    transform: [{ rotate: '25deg' }],
  },
  exampleLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.xs * 1.4,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.iconBackground.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    paddingTop: 6,
  },
});
