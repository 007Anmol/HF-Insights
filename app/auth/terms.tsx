import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Spacer } from '../../src/components/Spacer';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import { useApp } from '../../src/context/AppContext';
import { supabase } from '../../src/supabase';
import { clearPendingSignup, getPendingSignup } from '../../src/lib/pendingSignup';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';

export default function TermsAndConsent() {
  const router = useRouter();
  const { setUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const draft = getPendingSignup();

  useEffect(() => {
    if (!draft) {
      Toast.show({
        type: 'info',
        text1: 'Signup session expired',
        text2: 'Please fill the signup form again.',
      });
      router.replace('/auth/signup');
    }
  }, [draft, router]);

  const onDecline = () => {
    clearPendingSignup();
    Toast.show({
      type: 'info',
      text1: 'Consent required',
      text2: 'You can create an account anytime by accepting the terms.',
    });
    router.replace('/auth/signup');
  };

  const onAgreeAndCreateAccount = async () => {
    if (!draft) {
      Toast.show({
        type: 'error',
        text1: 'Missing signup details',
        text2: 'Please complete signup again.',
      });
      router.replace('/auth/signup');
      return;
    }

    if (!supabase) {
      Toast.show({
        type: 'error',
        text1: 'Service unavailable',
        text2: 'Authentication service is not available.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const consentAt = new Date().toISOString();
      const { data, error } = await supabase.auth.signUp({
        email: draft.email,
        password: draft.password,
        options: {
          data: {
            name: draft.name,
            ai_xray_consent: true,
            ai_xray_consent_at: consentAt,
          },
        },
      });

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Signup failed',
          text2: error.message,
        });
        return;
      }

      const u = data.user;
      await setUser(
        u
          ? {
              id: u.id,
              name: u.user_metadata?.name || draft.name,
              email: u.email || draft.email,
            }
          : null
      );

      clearPendingSignup();
      Toast.show({
        type: 'success',
        text1: 'Consent recorded',
        text2: 'Your account has been created successfully.',
      });
      router.replace('/dashboard');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Signup failed',
        text2: error?.message || 'Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <LinearGradient
          colors={['#F0F7FF', '#F8FAFC', '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradientBg}
        >
          <View style={styles.centerContent}>
            <LinearGradient
              colors={['#DBEAFE', '#BFDBFE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoContainer}
            >
              <Ionicons name="shield-checkmark" size={40} color={theme.colors.primary} />
            </LinearGradient>

            <Spacer size={24} />
            <Text style={styles.title}>Terms and AI Consent</Text>
            <Spacer size={8} />
            <Text style={styles.subtitle}>Please review and confirm before creating your account.</Text>
            <Spacer size={24} />

            <Card elevated style={styles.card}>
              <Text style={styles.sectionTitle}>How AI is used</Text>
              <Spacer size={10} />
              <Text style={styles.bodyText}>1. Your uploaded X-ray image is analyzed by our AI system to generate medical insights.</Text>
              <Spacer size={8} />
              <Text style={styles.bodyText}>2. AI output is assistive only and does not replace professional medical diagnosis.</Text>
              <Spacer size={8} />
              <Text style={styles.bodyText}>3. You should always consult a qualified healthcare provider for medical decisions.</Text>

              <Spacer size={20} />
              <Text style={styles.sectionTitle}>Consent statement</Text>
              <Spacer size={10} />
              <Text style={styles.consentText}>
                By selecting "Yes, I Consent", you agree that your X-ray data may be processed by AI for insight generation and that you understand the limitations described above.
              </Text>

              <Spacer size={24} />
              <Button title="Yes, I Consent" onPress={onAgreeAndCreateAccount} size="large" fullWidth />
              <Spacer size={12} />
              <Button title="No, I Do Not Consent" variant="outline" onPress={onDecline} size="large" fullWidth />
            </Card>
          </View>
        </LinearGradient>
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="Creating your account..." />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  contentContainer: {
    flexGrow: 1,
  },
  gradientBg: {
    flex: 1,
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing['2xl'],
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
  },
  card: {
    width: '100%',
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  bodyText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
    lineHeight: 22,
  },
  consentText: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    lineHeight: 22,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
