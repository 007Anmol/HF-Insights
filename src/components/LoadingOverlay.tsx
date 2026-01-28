import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { theme } from '../theme';

type LoadingOverlayProps = {
  visible: boolean;
  message?: string;
};

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message = 'Loading...' 
}) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: theme.animation.duration.fast,
        useNativeDriver: true,
      }).start();

      // Continuous spin animation
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      // Fade out animation
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: theme.animation.duration.fast,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, spinValue, fadeValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: fadeValue }]}>
        <View style={styles.content}>
          {/* Spinner */}
          <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
            <View style={styles.spinnerInner} />
          </Animated.View>
          
          {/* Message */}
          <Text style={styles.message}>{message}</Text>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.layout.screenPadding,
  },
  spinner: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    borderWidth: 4,
    borderColor: theme.colors.uploadZone.background,
    borderTopColor: theme.colors.primary,
    marginBottom: theme.spacing.lg,
  },
  spinnerInner: {
    width: '100%',
    height: '100%',
  },
  message: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.lg * theme.typography.lineHeight.relaxed,
  },
});
