import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { theme } from '../theme';
import { LANGUAGE_OPTIONS, AppLanguage } from '../types/language';

type Props = {
  value: AppLanguage;
  onChange: (lang: AppLanguage) => void;
  compact?: boolean;
};

export const LanguageSelector: React.FC<Props> = ({ value, onChange, compact = false }) => {
  return (
    <ScrollView
      horizontal={compact}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, compact && styles.rowCompact]}
    >
      {LANGUAGE_OPTIONS.map((option) => {
        const selected = option.code === value;
        return (
          <Pressable
            key={option.code}
            onPress={() => onChange(option.code)}
            style={[styles.chip, selected && styles.chipSelected, compact && styles.chipCompact]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  rowCompact: {
    flexWrap: 'nowrap',
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipCompact: {
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: theme.colors.iconBackground.blue,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  chipTextSelected: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
