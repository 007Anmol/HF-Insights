import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

type InfoBoxProps = {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  icon?: boolean;
};

export const InfoBox: React.FC<InfoBoxProps> = ({ 
  message, 
  type = 'info',
  icon = true 
}) => {
  const iconName = {
    info: 'information-circle-outline' as const,
    success: 'checkmark-circle-outline' as const,
    warning: 'alert-circle-outline' as const,
    error: 'close-circle-outline' as const,
  }[type];

  const colors = {
    info: {
      gradient: ['#EFF6FF', '#DBEAFE'] as readonly string[],
      border: '#BFDBFE',
      text: theme.colors.text.primary,
      icon: theme.colors.info,
    },
    success: {
      gradient: ['#ECFDF5', '#D1FAE5'] as readonly string[],
      border: '#A7F3D0',
      text: theme.colors.text.primary,
      icon: theme.colors.success,
    },
    warning: {
      gradient: ['#FFFBEB', '#FEF3C7'] as readonly string[],
      border: '#FCD34D',
      text: theme.colors.text.primary,
      icon: theme.colors.warning,
    },
    error: {
      gradient: ['#FEF2F2', '#FEE2E2'] as readonly string[],
      border: '#FECACA',
      text: theme.colors.text.primary,
      icon: theme.colors.error,
    },
  }[type];

  return (
    <LinearGradient
      colors={colors.gradient as [string, string]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { borderColor: colors.border }]}
    >
      {icon && (
        <View style={[styles.iconContainer, { backgroundColor: colors.border + '40' }]}>
          <Ionicons name={iconName} size={18} color={colors.icon} />
        </View>
      )}
      <Text style={[styles.message, { color: colors.text }]}>
        {message}
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    fontWeight: theme.typography.fontWeight.medium,
    paddingTop: 4,
  },
});
