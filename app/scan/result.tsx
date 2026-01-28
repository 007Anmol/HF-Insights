import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
      <View style={styles.headerSection}>
        <View style={styles.iconBadge}>
          <Ionicons name="document-text" size={32} color={theme.colors.primary} />
        </View>
        <Spacer size={16} />
        <Text style={styles.title}>{insights.title}</Text>
        <Spacer size={8} />
        <Text style={styles.timestamp}>
          {new Date(scan.createdAt).toLocaleDateString()} • {new Date(scan.createdAt).toLocaleTimeString()}
        </Text>
      </View>

      <Spacer size={32} />

      <View style={styles.sectionHeader}>
        <Ionicons name="reader-outline" size={24} color={theme.colors.primary} />
        <Text style={styles.sectionTitle}>Summary</Text>
      </View>
      <Spacer size={12} />
      <Card elevated>
        <Text style={styles.bodyText}>{insights.summary}</Text>
      </Card>

      <Spacer size={32} />

      <View style={styles.sectionHeader}>
        <Ionicons name="clipboard-outline" size={24} color={theme.colors.secondary} />
        <Text style={styles.sectionTitle}>Recommendations</Text>
      </View>
      <Spacer size={12} />
      <Card elevated>
        {insights.recommendations.map((r, idx) => (
          <View key={idx}>
            {idx > 0 && <Spacer size={12} />}
            <View style={styles.recommendationItem}>
              <View style={styles.bulletPoint}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.secondary} />
              </View>
              <Text style={styles.bodyText}>{r}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Spacer size={32} />

      <View style={styles.sectionHeader}>
        <Ionicons name="book-outline" size={24} color={theme.colors.info} />
        <Text style={styles.sectionTitle}>Medical Terms Simplified</Text>
      </View>
      <Spacer size={12} />
      {insights.laymanTerms?.map((t, idx) => (
        <View key={idx}>
          {idx > 0 && <Spacer size={12} />}
          <Card elevated>
            <View style={styles.termCard}>
              <View style={styles.termHeader}>
                <View style={styles.termBadge}>
                  <Ionicons name="school-outline" size={16} color={theme.colors.primary} />
                </View>
                <Text style={styles.termTitle}>{t.term}</Text>
              </View>
              <Spacer size={12} />
              <View style={styles.termDivider} />
              <Spacer size={12} />
              <Text style={styles.termExplanation}>{t.plain}</Text>
            </View>
          </Card>
        </View>
      ))}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    backgroundColor: theme.colors.background.secondary,
    flex: 1,
  },
  inner: { 
    padding: theme.layout.screenPadding,
  },
  headerSection: {
    alignItems: 'center',
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.iconBackground.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  title: { 
    color: theme.colors.text.primary, 
    fontSize: theme.typography.fontSize['3xl'], 
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  timestamp: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  sectionTitle: { 
    color: theme.colors.text.primary, 
    fontSize: theme.typography.fontSize.xl, 
    fontWeight: theme.typography.fontWeight.bold,
  },
  bodyText: { 
    color: theme.colors.text.primary, 
    fontSize: theme.typography.fontSize.base, 
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  bulletPoint: {
    marginTop: 2,
  },
  termCard: {
    width: '100%',
  },
  termHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  termBadge: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.iconBackground.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  termTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  termDivider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
  },
  termExplanation: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
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
});
