import React from 'react';
import { View, Text, Pressable, StyleSheet, TextStyle } from 'react-native';
import { theme } from '../theme';
import { findGlossaryMatches } from '../lib/termExplanation';

type Props = {
  text: string;
  style?: TextStyle;
  onExplainTerm: (term: string) => void;
};

export const MedicalTermRichText: React.FC<Props> = ({ text, style, onExplainTerm }) => {
  const matches = findGlossaryMatches(text);

  if (matches.length === 0) {
    return <Text style={[styles.body, style]}>{text}</Text>;
  }

  const segments: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      segments.push(
        <Text key={`plain-${index}`} style={[styles.body, style]}>
          {text.slice(cursor, match.start)}
        </Text>,
      );
    }

    segments.push(
      <View key={`term-${index}`} style={styles.termBlock}>
        <Pressable onPress={() => onExplainTerm(match.phrase)} accessibilityRole="button">
          <Text style={[styles.body, styles.termText, style]}>{text.slice(match.start, match.end)}</Text>
        </Pressable>
        <Pressable
          onPress={() => onExplainTerm(match.phrase)}
          style={styles.chip}
          accessibilityRole="button"
          accessibilityLabel={`What does ${match.phrase} mean?`}
        >
          <Text style={styles.chipText}>What does this mean?</Text>
        </Pressable>
      </View>,
    );
    cursor = match.end;
  });

  if (cursor < text.length) {
    segments.push(
      <Text key="plain-tail" style={[styles.body, style]}>
        {text.slice(cursor)}
      </Text>,
    );
  }

  return <View style={styles.wrap}>{segments}</View>;
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  body: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  termBlock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginVertical: 2,
  },
  termText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
  chip: {
    marginLeft: 6,
    marginTop: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.iconBackground.blue,
  },
  chipText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
