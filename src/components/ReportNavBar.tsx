import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { theme } from '../theme';

export type ReportNavSection = {
  id: string;
  label: string;
};

type Props = {
  sections: ReportNavSection[];
  activeId: string;
  onSelect: (id: string) => void;
};

export const ReportNavBar: React.FC<Props> = ({ sections, activeId, onSelect }) => {
  if (sections.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <Pressable
              key={section.id}
              onPress={() => onSelect(section.id)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{section.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    ...theme.shadows.sm,
    zIndex: 10,
  },
  row: {
    paddingHorizontal: theme.layout.screenPadding,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.tertiary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    minHeight: 44,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: theme.colors.iconBackground.blue,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  chipTextActive: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});
