import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, Animated, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
};

export const Button: React.FC<Props> = ({ 
  title, 
  onPress, 
  style, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
  icon,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const sizeStyles = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  }[size];

  const textSizeStyles = {
    small: styles.textSmall,
    medium: styles.textMedium,
    large: styles.textLarge,
  }[size];

  const getGradientColors = () => {
    if (disabled) return ['#E2E8F0', '#CBD5E1'];
    switch (variant) {
      case 'primary': return theme.colors.gradient.primary;
      case 'secondary': return theme.colors.gradient.secondary;
      default: return ['transparent', 'transparent'];
    }
  };

  const isGradient = variant === 'primary' || variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const renderContent = () => (
    <View style={styles.contentRow}>
      {icon && <View style={styles.iconWrapper}>{icon}</View>}
      <Text 
        style={[
          styles.text, 
          textSizeStyles,
          isOutline && styles.textOutline,
          isGhost && styles.textGhost,
          disabled && styles.textDisabled
        ]}
      >
        {title}
      </Text>
    </View>
  );

  return (
    <Animated.View style={[
      fullWidth && styles.fullWidth,
      { transform: [{ scale: scaleAnim }] }
    ]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({ pressed }) => [
          styles.base,
          sizeStyles,
          fullWidth && styles.fullWidth,
          isOutline && styles.outline,
          isGhost && styles.ghost,
          disabled && !isGradient && styles.disabled,
          pressed && styles.pressed,
          style,
        ]}
      >
        {isGradient && (
          <LinearGradient
            colors={getGradientColors() as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientInner}
          />
        )}
        {renderContent()}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradientInner: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: theme.spacing.sm,
  },
  outline: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  small: {
    height: 44,
    paddingHorizontal: 24,
    borderRadius: theme.borderRadius.md,
  },
  medium: {
    height: 50,
    paddingHorizontal: 32,
  },
  large: {
    height: 56,
    paddingHorizontal: 40,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.95,
  },
  text: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: theme.typography.fontSize.sm,
  },
  textMedium: {
    fontSize: theme.typography.fontSize.base,
  },
  textLarge: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
  },
  textOutline: {
    color: theme.colors.primary,
  },
  textGhost: {
    color: theme.colors.primary,
  },
  textDisabled: {
    color: theme.colors.text.tertiary,
  },
});
