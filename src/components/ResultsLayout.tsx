import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

type Props = {
  title: string;
  attentionLevel?: string;
  xrayType?: string;
  confidenceScore?: number;
  createdAt?: string | number | Date;
  children?: React.ReactNode;
};

const ResultsLayout: React.FC<Props> = ({ title, attentionLevel, xrayType, confidenceScore, createdAt, children }) => {
  return (
    <>
      <LinearGradient
        colors={['#F0F7FF', '#F8FAFC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerSection}>
          <LinearGradient
            colors={['#DBEAFE', '#BFDBFE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBadge}
          >
            <Ionicons name="document-text" size={32} color={theme.colors.primary} />
          </LinearGradient>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.metaRow}>
            {createdAt && (
              <View style={styles.metaBadge}>
                <Ionicons name="calendar-outline" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.timestamp}>{new Date(createdAt).toLocaleDateString()}</Text>
              </View>
            )}
            {createdAt && (
              <View style={styles.metaBadge}>
                <Ionicons name="time-outline" size={14} color={theme.colors.text.secondary} />
                <Text style={styles.timestamp}>{new Date(createdAt).toLocaleTimeString()}</Text>
              </View>
            )}
          </View>

          {!!attentionLevel && (
            <View style={[
              styles.typeBadge,
              { backgroundColor: attentionLevel.includes('Requires') ? '#FEE2E2' : attentionLevel.includes('Monitor') ? '#FEF3C7' : '#DCFCE7' }
            ]}>
              <Ionicons name={attentionLevel.includes('Requires') ? 'warning' : attentionLevel.includes('Monitor') ? 'eye' : 'checkmark-circle'} size={16} color={attentionLevel.includes('Requires') ? '#DC2626' : attentionLevel.includes('Monitor') ? '#D97706' : '#16A34A'} style={{ marginRight: 6 }} />
              <Text style={[styles.typeText, { color: attentionLevel.includes('Requires') ? '#DC2626' : attentionLevel.includes('Monitor') ? '#D97706' : '#16A34A' }]}>{attentionLevel}</Text>
            </View>
          )}

          {!!xrayType && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{xrayType}</Text>
            </View>
          )}
        </View>
      </LinearGradient>

      <View style={styles.contentSection}>{children}</View>
    </>
  );
};

const styles = StyleSheet.create({
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
    marginTop: theme.spacing.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.md,
  },
  timestamp: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginTop: theme.spacing.md,
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
    marginLeft: theme.spacing.sm,
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
});

export default ResultsLayout;
