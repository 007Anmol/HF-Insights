import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '../../src/context/AppContext';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Spacer } from '../../src/components/Spacer';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';

export default function ScanResult() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { scans } = useApp();

  const scan = useMemo(() => scans.find(s => s.id === String(params.id)), [scans, params.id]);

  if (!scan) {
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

  const { insights } = scan;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
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
          <Spacer size={20} />
          <Text style={styles.title}>{insights.title}</Text>
          <Spacer size={10} />
          <View style={styles.metaRow}>
            <View style={styles.metaBadge}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.text.secondary} />
              <Text style={styles.timestamp}>
                {new Date(scan.createdAt).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <Ionicons name="time-outline" size={14} color={theme.colors.text.secondary} />
              <Text style={styles.timestamp}>
                {new Date(scan.createdAt).toLocaleTimeString()}
              </Text>
            </View>
          </View>
          {!!insights.xray_type && (
            <>
              <Spacer size={12} />
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{insights.xray_type}</Text>
                {typeof insights.confidence_score === 'number' && (
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {(insights.confidence_score * 100).toFixed(0)}% confidence
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </LinearGradient>

      <View style={styles.contentSection}>

      {insights.findings?.length ? (
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
            <Text style={styles.sectionTitle}>Findings</Text>
          </View>
          <Spacer size={12} />
          <Card elevated variant="gradient">
            {insights.findings.map((item, idx) => (
              <View key={`finding-${idx}`} style={[styles.listItem, idx > 0 && styles.listItemBorder]}>
                <View style={styles.bulletPoint}>
                  <View style={styles.bulletDot} />
                </View>
                <Text style={styles.bodyText}>{item}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : insights.summary ? (
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
            <Text style={styles.sectionTitle}>Summary</Text>
          </View>
          <Spacer size={12} />
          <Card elevated variant="gradient">
            <Text style={styles.bodyText}>{insights.summary}</Text>
          </Card>
        </>
      ) : null}

      <Spacer size={28} />

      {insights.possible_conditions?.length ? (
        <>
          <View style={styles.sectionHeader}>
            <LinearGradient
              colors={['#ECFDF5', '#D1FAE5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.sectionIconBg}
            >
              <Ionicons name="clipboard-outline" size={20} color={theme.colors.secondary} />
            </LinearGradient>
            <Text style={styles.sectionTitle}>Possible Conditions</Text>
          </View>
          <Spacer size={12} />
          <Card elevated variant="gradient">
            {insights.possible_conditions.map((r, idx) => (
              <View key={`cond-${idx}`} style={[styles.listItem, idx > 0 && styles.listItemBorder]}>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.secondary} />
                </View>
                <Text style={styles.bodyText}>{r}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Spacer size={28} />

      {insights.possible_symptoms?.length ? (
        <>
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
            {insights.possible_symptoms.map((t, idx) => (
              <View key={`sym-${idx}`} style={[styles.listItem, idx > 0 && styles.listItemBorder]}>
                <View style={styles.bulletPoint}>
                  <Ionicons name="heart-outline" size={16} color={theme.colors.info} />
                </View>
                <Text style={styles.bodyText}>{t}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Spacer size={40} />

      <View style={styles.actionButtons}>
        <Button 
          title="Back to Dashboard" 
          onPress={() => router.replace('/dashboard')} 
          fullWidth 
        />
        <Spacer size={12} />
        <Button 
          title="New Scan" 
          variant="outline" 
          onPress={() => router.push('/scan/new')} 
          fullWidth 
        />
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    gap: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    gap: theme.spacing.sm,
  },
  sectionIconBg: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: theme.spacing.sm,
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
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  actionButtons: {
    width: '100%',
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
});
