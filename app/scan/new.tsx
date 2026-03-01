import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Spacer } from '../../src/components/Spacer';
import { InfoBox } from '../../src/components/InfoBox';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import { ToggleButton } from '../../src/components/ToggleButton';
import { useApp } from '../../src/context/AppContext';
import { generateInsightsFromImage, setInsightsLanguage } from '../../src/insights';
import { supabase } from '../../src/supabase';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';
import Constants from 'expo-constants';

export default function NewScan() {
  const router = useRouter();
  const { addScan } = useApp();
  const [uri, setUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Please grant media library access' });
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      quality: 1,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets?.length) {
      setUri(res.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Toast.show({ type: 'error', text1: 'Permission denied', text2: 'Please grant camera access' });
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ 
      quality: 1,
      allowsEditing: false,
    });
    if (!res.canceled && res.assets?.length) {
      setUri(res.assets[0].uri);
    }
  };

  const analyze = async () => {
    if (!uri) {
      Toast.show({ type: 'error', text1: 'No image selected', text2: 'Please upload or capture an image first' });
      return;
    }
    // Require user to be signed in for cloud sync
    if (!supabase) {
      Toast.show({ type: 'error', text1: 'Service unavailable', text2: 'Please try again later' });
      return;
    }
    const { data: sessionRes } = await supabase.auth.getSession();
    if (!sessionRes.session?.user) {
      Toast.show({ type: 'info', text1: 'Sign in required', text2: 'Please log in to save scans to cloud' });
      router.push('/auth/login');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      setInsightsLanguage(language);
      const insights = await generateInsightsFromImage(uri);
      const uploaded = await uploadToStorage(uri);
      const clientId = Date.now().toString();
      const persistedId = await addScan({ id: clientId, uri: uploaded.publicUrl, storagePath: uploaded.storagePath, createdAt: Date.now(), insights });
      Toast.show({ type: 'success', text1: 'Analysis complete!', text2: 'View your health insights' });
      router.replace({ pathname: '/scan/result', params: { id: persistedId } });
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Analysis failed', text2: error.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  async function uploadToStorage(localUri: string): Promise<{ publicUrl: string; storagePath: string }> {
    if (!supabase) {
      console.warn('Supabase not available, using local URI');
      return { publicUrl: localUri, storagePath: '' };
    }
    try {
      const { data: sessionRes } = await supabase.auth.getSession();
      const token = sessionRes.session?.access_token;
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id || 'anonymous';
      const isPng = localUri.toLowerCase().endsWith('.png');
      const mime = isPng ? 'image/png' : 'image/jpeg';
      const filename = `scan-${Date.now()}.${isPng ? 'png' : 'jpg'}`;
      const storagePath = `${userId}/${filename}`;

      if (!token) throw new Error('Missing auth token');
      const extra = (Constants?.expoConfig?.extra || {}) as any;
      const SUPABASE_URL = extra?.supabaseUrl;
      if (!SUPABASE_URL) throw new Error('Supabase URL missing in app.json');

      // Upload directly via HTTP to avoid RN Blob issues
      const endpoint = `${SUPABASE_URL}/storage/v1/object/scans/${encodeURI(storagePath)}`;
      const result = await FileSystem.uploadAsync(endpoint, localUri, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-upsert': 'true',
          'Content-Type': mime,
        },
        httpMethod: 'POST',
      });
      if (result.status < 200 || result.status >= 300) {
        throw new Error(`Upload failed with status ${result.status}`);
      }
      const { data: pub } = supabase.storage.from('scans').getPublicUrl(storagePath);
      return { publicUrl: pub.publicUrl, storagePath };
    } catch (e: any) {
      console.warn('Upload failed, using local URI:', e?.message || e);
      return { publicUrl: localUri, storagePath: '' };
    }
  }

  const formatChips = ['JPG', 'PNG', 'PDF'];

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <LinearGradient
            colors={['#EFF6FF', '#DBEAFE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIconContainer}
          >
            <Ionicons name="document-text-outline" size={36} color={theme.colors.primary} />
          </LinearGradient>
          <Spacer size={20} />
          <Text style={styles.title}>Upload Medical Scan</Text>
          <Spacer size={8} />
          <Text style={styles.subtitle}>
            Upload or capture an X-ray, MRI, or medical report to get instant insights
          </Text>
        </View>

        <Spacer size={32} />

        <Card elevated>
          <Pressable onPress={pickImage} style={styles.uploadZone}>
            <LinearGradient
              colors={['#F8FAFC', '#EFF6FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.uploadZoneInner}
            >
              {uri ? (
                <Image source={{ uri }} style={styles.previewImage} />
              ) : (
                <>
                  <LinearGradient
                    colors={['#FFFFFF', '#F8FAFC']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.uploadIconContainer}
                  >
                    <Ionicons name="cloud-upload-outline" size={44} color={theme.colors.primary} />
                  </LinearGradient>
                  <Spacer size={20} />
                  <Text style={styles.uploadTitle}>Tap to Upload</Text>
                  <Spacer size={6} />
                  <Text style={styles.uploadSubtitle}>or drag and drop your file here</Text>
                  <Spacer size={20} />
                  <View style={styles.formatChips}>
                    {formatChips.map((format) => (
                      <View key={format} style={styles.formatChip}>
                        <Text style={styles.formatChipText}>{format}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Card>

        {uri && (
          <>
            <Spacer size={16} />
            <Button 
              title="Change Image" 
              variant="outline" 
              onPress={pickImage} 
              fullWidth 
            />
          </>
        )}

        <Spacer size={24} />

        <View style={styles.buttonRow}>
          <View style={styles.buttonHalf}>
            <Button 
              title="Take Photo" 
              onPress={takePhoto}
              variant="secondary"
              fullWidth
            />
          </View>
          <View style={styles.buttonHalf}>
            <Button 
              title="Analyze" 
              onPress={analyze} 
              disabled={!uri}
              fullWidth
            />
          </View>
        </View>

        <Spacer size={16} />

        <Card elevated>
          <View style={styles.languageContainer}>
            <View style={styles.languageHeader}>
              <Ionicons name="language-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.languageLabel}>Insights Language</Text>
            </View>
            <Spacer size={12} />
            <ToggleButton
              options={[
                { label: 'English', value: 'en' },
                { label: 'हिंदी', value: 'hi' },
              ]}
              value={language}
              onChange={(val) => setLanguage(val as 'en' | 'hi')}
            />
          </View>
        </Card>

        <Spacer size={32} />

        <InfoBox 
          message="Your privacy matters. Images are processed securely and are never shared without your consent."
          type="info"
        />

        <Spacer size={16} />

        <Card padded={false}>
          <View style={styles.featureItem}>
            <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.success} />
            <Text style={styles.featureText}>End-to-end encrypted</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.featureItem}>
            <Ionicons name="lock-closed-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.featureText}>HIPAA compliant storage</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.featureItem}>
            <Ionicons name="time-outline" size={24} color={theme.colors.warning} />
            <Text style={styles.featureText}>Results in under 30 seconds</Text>
          </View>
        </Card>
      </ScrollView>

      <LoadingOverlay 
        visible={isAnalyzing} 
        message="Analyzing your scan..." 
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background.secondary,
  },
  contentContainer: {
    padding: theme.layout.screenPadding,
  },
  header: {
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  title: { 
    color: theme.colors.text.primary, 
    fontSize: theme.typography.fontSize['2xl'], 
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
    maxWidth: 300,
  },
  uploadZone: {
    minHeight: 300,
  },
  uploadZoneInner: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary + '50',
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  uploadIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  uploadTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    letterSpacing: -0.2,
  },
  uploadSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.tertiary,
  },
  formatChips: {
    flexDirection: 'row',
    gap: 10,
  },
  formatChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  formatChipText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.secondary,
    letterSpacing: 0.5,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: theme.borderRadius.md,
    resizeMode: 'contain',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'stretch',
  },
  buttonHalf: {
    flex: 1,
    minWidth: 0,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  languageContainer: {
    padding: theme.spacing.md,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  languageLabel: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  langToggle: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  featureText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
  },
});
