import React, { useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

type ToggleOption = {
  label: string;
  value: string;
  icon?: React.ReactNode;
};

type Props = {
  options: ToggleOption[];
  value: string;
  onChange: (value: string) => void;
};

export const ToggleButton: React.FC<Props> = ({ options, value, onChange }) => {
  const animatedValues = useRef(options.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    options.forEach((option, index) => {
      Animated.timing(animatedValues[index], {
        toValue: option.value === value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    });
  }, [value]);

  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isActive = option.value === value;
        const scale = animatedValues[index].interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.98],
        });

        return (
          <Animated.View 
            key={option.value} 
            style={[
              styles.buttonWrapper,
              { transform: [{ scale }] }
            ]}
          >
            <Pressable
              onPress={() => onChange(option.value)}
              style={styles.button}
            >
              {isActive ? (
                <LinearGradient
                  colors={theme.colors.gradient.primary as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activeBackground}
                >
                  <View style={styles.content}>
                    {option.icon}
                    <Text style={[styles.label, styles.activeLabel]}>
                      {option.label}
                    </Text>
                  </View>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveBackground}>
                  <View style={styles.content}>
                    {option.icon}
                    <Text style={[styles.label, styles.inactiveLabel]}>
                      {option.label}
                    </Text>
                  </View>
                </View>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.background.tertiary,
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    gap: 4,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  activeBackground: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  inactiveBackground: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  activeLabel: {
    color: theme.colors.text.inverse,
  },
  inactiveLabel: {
    color: theme.colors.text.secondary,
  },
});
