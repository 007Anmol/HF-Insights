import React, { useRef } from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, Animated } from 'react-native';
import { theme } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  fullWidth?: boolean;
};

export const Button: React.FC<Props> = ({ 
  title, 
  onPress, 
  style, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  fullWidth = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const variantStyles = {
    primary: styles.primary,
    secondary: styles.secondary,
    outline: styles.outline,
  }[variant];

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
          variantStyles,
          sizeStyles,
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
          pressed && styles.pressed,
          style,
        ]}
      >
        <Text style={[
          styles.text, 
          textSizeStyles,
          variant === 'outline' && styles.textOutline,
          disabled && styles.textDisabled
        ]}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: theme.touchTarget.comfortable,
    ...theme.shadows.sm,
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  small: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minHeight: theme.touchTarget.min,
  },
  medium: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  large: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
  },
  text: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  textSmall: {
    fontSize: theme.typography.fontSize.sm,
  },
  textMedium: {
    fontSize: theme.typography.fontSize.base,
  },
  textLarge: {
    fontSize: theme.typography.fontSize.lg,
  },
  textOutline: {
    color: theme.colors.primary,
  },
  textDisabled: {
    color: theme.colors.text.tertiary,
  },
});
