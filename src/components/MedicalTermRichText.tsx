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
  const terms: string[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start < cursor) return; // skip overlapping matches
    if (match.start > cursor) {
      segments.push(text.slice(cursor, match.start));
    }
    segments.push(
      <Text
        key={`term-${index}`}
        style={styles.termText}
        onPress={() => onExplainTerm(match.phrase)}
        accessibilityRole="button"
      >
        {text.slice(match.start, match.end)}
      </Text>,
    );
    if (!terms.includes(match.phrase)) terms.push(match.phrase);
    cursor = match.end;
  });

  if (cursor < text.length) {
    segments.push(text.slice(cursor));
  }

  return (
    <View style={styles.wrap}>
      <Text style={[styles.body, style]}>{segments}</Text>
      <View style={styles.chipRow}>
        {terms.map((term) => (
          <Pressable
            key={term}
            onPress={() => onExplainTerm(term)}
            style={styles.chip}
            accessibilityRole="button"
            accessibilityLabel={`What does ${term} mean?`}
          >
            <Text style={styles.chipText}>
              {terms.length > 1 ? `What is “${term}”?` : 'What does this mean?'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  body: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  termText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  chip: {
    marginRight: 6,
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.iconBackground.blue,
  },
  chipText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
});
