import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
      background: '#EFF6FF',
      border: '#BFDBFE',
      text: theme.colors.text.primary,
      icon: theme.colors.info,
    },
    success: {
      background: '#ECFDF5',
      border: '#A7F3D0',
      text: theme.colors.text.primary,
      icon: theme.colors.success,
    },
    warning: {
      background: '#FEF3C7',
      border: '#FCD34D',
      text: theme.colors.text.primary,
      icon: theme.colors.warning,
    },
    error: {
      background: '#FEE2E2',
      border: '#FECACA',
      text: theme.colors.text.primary,
      icon: theme.colors.error,
    },
  }[type];

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderColor: colors.border }]}>
      {icon && (
        <Ionicons name={iconName} size={20} color={colors.icon} style={styles.icon} />
      )}
      <Text style={[styles.message, { color: colors.text }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  icon: {
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  message: {
    flex: 1,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
