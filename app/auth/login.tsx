import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { Button } from '../../src/components/Button';
import { Spacer } from '../../src/components/Spacer';
import { Card } from '../../src/components/Card';
import { LoadingOverlay } from '../../src/components/LoadingOverlay';
import { useApp } from '../../src/context/AppContext';
import { supabase } from '../../src/supabase';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../src/theme';

export default function Login() {
  const router = useRouter();
  const { setUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      Toast.show({ 
        type: 'error', 
        text1: 'Missing information', 
        text2: 'Please enter both email and password' 
      });
      return;
    }

    if (!supabase) {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: 'Authentication service is not available' 
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        Toast.show({ 
          type: 'error', 
          text1: 'Login failed', 
          text2: error.message 
        });
        return;
      }

      const u = data.user;
      await setUser(u ? { 
        id: u.id, 
        name: u.user_metadata?.name || u.email || 'User', 
        email: u.email || '' 
      } : null);

      Toast.show({ 
        type: 'success', 
        text1: 'Welcome back!', 
        text2: 'Logged in successfully' 
      });
      router.replace('/dashboard');
    } catch (error: any) {
      Toast.show({ 
        type: 'error', 
        text1: 'Login failed', 
        text2: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.centerContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="medical" size={48} color={theme.colors.primary} />
            </View>
            <Spacer size={24} />
            <Text style={styles.title}>Welcome Back</Text>
            <Spacer size={8} />
            <Text style={styles.subtitle}>Sign in to access your health insights</Text>
            <Spacer size={40} />

            <Card elevated style={styles.formCard}>
              <Text style={styles.label}>Email Address</Text>
              <Spacer size={8} />
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Spacer size={20} />

              <Text style={styles.label}>Password</Text>
              <Spacer size={8} />
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.text.tertiary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={20} 
                  color={theme.colors.text.tertiary}
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                />
              </View>

              <Spacer size={32} />

              <Button 
                title="Sign In" 
                onPress={onLogin} 
                size="large"
                fullWidth
              />
              
              <Spacer size={16} />

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Spacer size={16} />

              <Button 
                title="Create New Account" 
                variant="outline" 
                onPress={() => router.push('/auth/signup')}
                size="large"
                fullWidth
              />
            </Card>

            <Spacer size={24} />

            <Text style={styles.footer}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay 
        visible={isLoading} 
        message="Signing in..." 
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing['3xl'],
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.iconBackground.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  title: { 
    color: theme.colors.text.primary, 
    fontSize: theme.typography.fontSize['3xl'], 
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
  },
  label: { 
    color: theme.colors.text.secondary, 
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1.5,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.touchTarget.comfortable,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  eyeIcon: {
    marginLeft: theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    paddingVertical: theme.spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border.light,
  },
  dividerText: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.sm,
    paddingHorizontal: theme.spacing.md,
  },
  footer: {
    color: theme.colors.text.tertiary,
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.xs * theme.typography.lineHeight.relaxed,
    paddingHorizontal: theme.spacing.lg,
  },
});
