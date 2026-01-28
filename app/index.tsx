import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/Button';
import { Card } from '../src/components/Card';
import { Spacer } from '../src/components/Spacer';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../src/theme';

type FeatureCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  delay: number;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, delay }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ 
      opacity: fadeAnim, 
      transform: [{ translateY: slideAnim }] 
    }}>
      <Card elevated>
        <View style={styles.featureCard}>
          <View style={[styles.iconContainer, { backgroundColor: theme.colors.iconBackground.blue }]}>
            <Ionicons name={icon} size={28} color={theme.colors.primary} />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Spacer size={4} />
            <Text style={styles.featureDescription}>{description}</Text>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
};

export default function Home() {
  const router = useRouter();
  const heroFadeAnim = useRef(new Animated.Value(0)).current;
  const heroSlideAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroFadeAnim, {
        toValue: 1,
        duration: 800,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(heroSlideAnim, {
        toValue: 0,
        duration: 800,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Animated.View style={[
        styles.hero, 
        { 
          opacity: heroFadeAnim,
          transform: [{ translateY: heroSlideAnim }]
        }
      ]}>
        <View style={styles.logoContainer}>
          <Ionicons name="medical" size={36} color={theme.colors.primary} />
        </View>
        <Spacer size={16} />
        <Text style={styles.welcomeTitle}>Welcome to</Text>
        <Spacer size={8} />
        <Text style={styles.appTitle}>HealthFuture Insights</Text>
        <Spacer size={16} />
        <Text style={styles.subtitle}>
          Understand your medical reports with AI-powered insights. We translate complex medical jargon into clear, plain language.
        </Text>
        <Spacer size={32} />
        <View style={styles.buttonGroup}>
          <Button title="Get Started" onPress={() => router.push('/auth/signup')} size="large" fullWidth />
          <Spacer size={12} />
          <Button title="Login" variant="outline" onPress={() => router.push('/auth/login')} size="large" fullWidth />
        </View>
      </Animated.View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose Us</Text>
        <Spacer size={24} />
        <View style={styles.featuresGrid}>
          <FeatureCard
            icon="medical-outline"
            title="Medical Expertise"
            description="AI-powered insights backed by medical knowledge to help you understand your reports"
            delay={200}
          />
          <Spacer size={16} />
          <FeatureCard
            icon="shield-checkmark-outline"
            title="Privacy First"
            description="Your medical data stays secure. Optional cloud storage with end-to-end encryption"
            delay={300}
          />
          <Spacer size={16} />
          <FeatureCard
            icon="chatbubble-ellipses-outline"
            title="Plain Language"
            description="Complex medical terminology translated into easy-to-understand explanations"
            delay={400}
          />
          <Spacer size={16} />
          <FeatureCard
            icon="time-outline"
            title="Quick Analysis"
            description="Get instant insights from your scans and reports in seconds"
            delay={500}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What Our Users Say</Text>
        <Spacer size={24} />
        <View style={styles.testimonialsGrid}>
          <Card elevated>
            <View style={styles.testimonialHeader}>
              <Ionicons name="star" size={20} color={theme.colors.warning} />
              <Ionicons name="star" size={20} color={theme.colors.warning} />
              <Ionicons name="star" size={20} color={theme.colors.warning} />
              <Ionicons name="star" size={20} color={theme.colors.warning} />
              <Ionicons name="star" size={20} color={theme.colors.warning} />
            </View>
            <Spacer size={12} />
            <Text style={styles.testimonialText}>
              "Finally understood my X-ray report without Googling every term! The plain language explanations are clear and reassuring."
            </Text>
            <Spacer size={8} />
            <Text style={styles.testimonialAuthor}>— Sarah M.</Text>
          </Card>
          <Spacer size={16} />
          <Card elevated>
            <View style={styles.testimonialHeader}>
              <Ionicons name="star" size={20} color={theme.colors.warning} />
              <Ionicons name="star" size={20} color={theme.colors.warning} />
              <Ionicons name="star" size={20} color={theme.colors.warning} />
              <Ionicons name="star" size={20} color={theme.colors.warning} />
              <Ionicons name="star" size={20} color={theme.colors.warning} />
            </View>
            <Spacer size={12} />
            <Text style={styles.testimonialText}>
              "Fast and simple. The insights helped me ask better questions to my doctor. Highly recommend!"
            </Text>
            <Spacer size={8} />
            <Text style={styles.testimonialAuthor}>— Michael R.</Text>
          </Card>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    backgroundColor: theme.colors.background.secondary,
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.spacing['3xl'],
  },
  hero: {
    alignItems: 'center',
    paddingTop: theme.spacing['4xl'],
    paddingBottom: theme.spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.iconBackground.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  welcomeTitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  appTitle: {
    fontSize: theme.typography.fontSize['4xl'],
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize['4xl'] * 1.2,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
    paddingHorizontal: theme.spacing.md,
  },
  buttonGroup: {
    width: '100%',
    maxWidth: 400,
  },
  section: {
    width: '100%',
    paddingTop: theme.spacing['3xl'],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
  },
  featuresGrid: {
    width: '100%',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.lg * 1.3,
  },
  featureDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  testimonialsGrid: {
    width: '100%',
  },
  testimonialHeader: {
    flexDirection: 'row',
    gap: 4,
  },
  testimonialText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  testimonialAuthor: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
