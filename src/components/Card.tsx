import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../theme';

type CardProps = {
  children: ReactNode;
  padded?: boolean;
  elevated?: boolean;
  style?: ViewStyle;
};

export const Card = ({ 
  children, 
  padded = true, 
  elevated = true,
  style 
}: CardProps) => (
  <View style={[
    styles.card, 
    padded && styles.padded,
    elevated && styles.elevated,
    style
  ]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface.light,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  padded: {
    padding: theme.layout.cardPadding,
  },
  elevated: {
    ...theme.shadows.md,
  },
});