import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

type CardProps = {
  children: ReactNode;
  padded?: boolean;
  elevated?: boolean;
  style?: ViewStyle;
  variant?: 'default' | 'gradient' | 'outlined';
};

export const Card = ({ 
  children, 
  padded = true, 
  elevated = true,
  style,
  variant = 'default',
}: CardProps) => {
  if (variant === 'gradient') {
    return (
      <View style={[styles.cardWrapper, elevated && styles.elevated, style]}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, padded && styles.padded]}
        >
          {children}
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[
      styles.card, 
      padded && styles.padded,
      elevated && styles.elevated,
      variant === 'outlined' && styles.outlined,
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  card: {
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  padded: {
    padding: theme.layout.cardPadding,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: theme.colors.border.medium,
    backgroundColor: 'transparent',
  },
});