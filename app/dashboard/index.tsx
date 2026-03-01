import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../src/context/AppContext';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Spacer } from '../../src/components/Spacer';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { theme } from '../../src/theme';

export default function Dashboard() {
  const router = useRouter();
  const { scans, user, removeScan } = useApp();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user ? user.name : 'Guest'}</Text>
          </View>
          <Pressable
            style={styles.avatarContainer}
            onPress={() => {
              if (user) {
                // Show minimal profile info: name and email
                // Using Toast to avoid adding a new screen
                // Name
                // Email
                // The app stores only name and email in profile
                // and derives them from Supabase user metadata
                // which matches the requested behavior.
                Toast.show({
                  type: 'info',
                  text1: user.name,
                  text2: user.email,
                });
              }
            }}
          >
            <Ionicons name="person" size={24} color={theme.colors.primary} />
          </Pressable>
        </View>
        <Spacer size={24} />
        <Button 
          title="New Scan" 
          onPress={() => router.push('/scan/new')}
          size="large"
          fullWidth
        />
      </View>

      <View style={styles.sectionHeader}>
        <Ionicons name="time-outline" size={20} color={theme.colors.text.secondary} />
        <Text style={styles.sectionTitle}>Recent Scans</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{scans.length}</Text>
        </View>
      </View>

      <FlatList
        data={scans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card elevated>
            <View style={styles.scanCard}>
              <Image source={{ uri: item.uri }} style={styles.thumbnail} />
              <View style={styles.scanInfo}>
                <Text style={styles.scanTitle} numberOfLines={2}>
                  {item.insights.title}
                </Text>
                <Spacer size={4} />
                <View style={styles.scanMeta}>
                  <Ionicons name="calendar-outline" size={14} color={theme.colors.text.tertiary} />
                  <Text style={styles.scanMetaText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Spacer size={12} />
                <View style={styles.scanActions}>
                  <Pressable 
                    onPress={() => router.push({ pathname: '/scan/result', params: { id: item.id } })}
                    style={styles.viewButton}
                  >
                    <Text style={styles.viewButtonText}>View Insights</Text>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                  </Pressable>
                  <Pressable onPress={async () => {
                    await removeScan(item.id);
                    Toast.show({
                      type: 'success',
                      text1: 'Scan deleted',
                      text2: 'The scan has been removed successfully.',
                    });
                  }}>
                    <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                  </Pressable>
                </View>
              </View>
            </View>
          </Card>
        )}
        ItemSeparatorComponent={() => <Spacer size={16} />}
        ListEmptyComponent={
          <Card>
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={64} color={theme.colors.text.tertiary} />
              <Spacer size={16} />
              <Text style={styles.emptyTitle}>No scans yet</Text>
              <Spacer size={8} />
              <Text style={styles.emptySubtitle}>
                Start by uploading your first medical scan to get insights
              </Text>
              <Spacer size={24} />
              <Button 
                title="Upload First Scan" 
                onPress={() => router.push('/scan/new')}
                variant="outline"
              />
            </View>
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background.secondary,
  },
  header: { 
    backgroundColor: theme.colors.background.primary,
    padding: theme.layout.screenPadding,
    paddingTop: theme.spacing['2xl'] + 16,
    ...theme.shadows.sm,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greeting: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
  userName: { 
    color: theme.colors.text.primary, 
    fontSize: theme.typography.fontSize['2xl'], 
    fontWeight: theme.typography.fontWeight.bold,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.iconBackground.blue,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.layout.screenPadding,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badge: {
    backgroundColor: theme.colors.iconBackground.blue,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
  },
  listContent: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.spacing.xl,
  },
  scanCard: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  thumbnail: { 
    width: 80, 
    height: 80, 
    borderRadius: theme.borderRadius.md, 
    backgroundColor: theme.colors.background.tertiary,
  },
  scanInfo: {
    flex: 1,
  },
  scanTitle: { 
    color: theme.colors.text.primary, 
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.fontSize.base * 1.4,
  },
  scanMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scanMetaText: { 
    color: theme.colors.text.tertiary, 
    fontSize: theme.typography.fontSize.xs,
  },
  scanActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: { 
    color: theme.colors.primary, 
    fontWeight: theme.typography.fontWeight.semibold,
    fontSize: theme.typography.fontSize.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing['3xl'],
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
});
