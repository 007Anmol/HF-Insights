import React, { useRef, useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import type { AppLanguage } from '../types/language';
import type { CanonicalInsights } from '../lib/canonicalInsights';
import { useReportVoiceConversation } from '../hooks/useReportVoiceConversation';

type Props = {
  visible: boolean;
  onClose: () => void;
  canonical: CanonicalInsights;
  displayLanguage: AppLanguage;
  previousReportSummary?: string;
  reportTitle?: string;
};

export const ReportVoiceConversation: React.FC<Props> = ({
  visible,
  onClose,
  canonical,
  displayLanguage,
  previousReportSummary,
  reportTitle,
}) => {
  const scrollRef = useRef<ScrollView>(null);
  const [typedQuestion, setTypedQuestion] = useState('');
  const {
    messages,
    status,
    error,
    partialTranscript,
    voiceLang,
    speechInputAvailable,
    offlineAnswers,
    startListening,
    stopListeningAndSend,
    sendUserMessage,
    stopAll,
  } = useReportVoiceConversation({
    canonical,
    displayLanguage,
    previousReportSummary,
    enabled: visible,
  });

  useEffect(() => {
    if (visible) {
      scrollRef.current?.scrollToEnd({ animated: true });
    } else {
      stopAll();
    }
  }, [visible, messages.length, stopAll]);

  const handleClose = () => {
    stopAll();
    onClose();
  };

  const micActive = status === 'listening';
  const micDisabled = status === 'processing' || status === 'speaking';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Talk about your report</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {reportTitle || 'Your X-ray report'} · full report context
            </Text>
            {voiceLang.usedEnglishFallback && (
              <Text style={styles.fallbackNote}>Voice will use English for this language.</Text>
            )}
          </View>
          <Pressable onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={26} color={theme.colors.text.secondary} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              Ask anything about this scan — findings, terms, or what to discuss with your doctor.
              {speechInputAvailable
                ? ' Tap the microphone, speak, then tap again to send.'
                : ' Type your question below; answers are spoken aloud when possible.'}
            </Text>
            {!speechInputAvailable && (
              <Text style={styles.expoGoNote}>
                Live speech input requires a development build. Expo Go supports typed questions and spoken answers.
              </Text>
            )}
            {offlineAnswers && (
              <Text style={styles.expoGoNote}>
                Answers are based on your report summary only. Deploy the latest backend for full AI conversation and ElevenLabs voice.
              </Text>
            )}
            <Text style={styles.disclaimer}>
              Educational only. Not a medical diagnosis. Always consult a healthcare professional.
            </Text>
          </View>

          {messages.map((msg, idx) => (
            <View
              key={`${idx}-${msg.role}`}
              style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}
            >
              <Text style={styles.bubbleText}>{msg.content}</Text>
            </View>
          ))}

          {partialTranscript && status === 'listening' && (
            <View style={[styles.bubble, styles.userBubble, styles.partialBubble]}>
              <Text style={styles.bubbleText}>{partialTranscript}</Text>
            </View>
          )}

          {status === 'processing' && (
            <View style={styles.processingRow}>
              <ActivityIndicator color={theme.colors.primary} />
              <Text style={styles.processingText}>Thinking about your report…</Text>
            </View>
          )}
        </ScrollView>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.footer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask about your report…"
              placeholderTextColor={theme.colors.text.tertiary}
              value={typedQuestion}
              onChangeText={setTypedQuestion}
              editable={status !== 'processing' && status !== 'speaking'}
              multiline
            />
            <Pressable
              style={[styles.sendButton, (status === 'processing' || !typedQuestion.trim()) && styles.sendDisabled]}
              disabled={status === 'processing' || status === 'speaking' || !typedQuestion.trim()}
              onPress={async () => {
                const q = typedQuestion;
                setTypedQuestion('');
                await sendUserMessage(q);
              }}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          </View>

          {speechInputAvailable && (
            <>
              <Pressable
                style={[
                  styles.micButton,
                  micActive && styles.micButtonActive,
                  micDisabled && styles.micButtonDisabled,
                ]}
                onPress={micActive ? stopListeningAndSend : startListening}
                disabled={micDisabled}
                accessibilityRole="button"
                accessibilityLabel={micActive ? 'Stop and send message' : 'Start voice question'}
              >
                {status === 'speaking' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="mic" size={28} color="#fff" />
                )}
              </Pressable>
              <Text style={styles.footerHint}>
                {status === 'listening'
                  ? 'Listening… tap to send'
                  : status === 'speaking'
                    ? 'Speaking…'
                    : status === 'processing'
                      ? 'Please wait…'
                      : 'Or tap the mic to speak'}
              </Text>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    paddingTop: theme.spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  headerText: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    marginTop: 4,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  fallbackNote: {
    marginTop: 6,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.warning,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.layout.screenPadding,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  introCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginBottom: theme.spacing.sm,
  },
  introText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  disclaimer: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },
  expoGoNote: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.warning,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    width: '100%',
    paddingHorizontal: theme.layout.screenPadding,
    marginBottom: theme.spacing.md,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.primary,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.5,
  },
  bubble: {
    maxWidth: '92%',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.iconBackground.blue,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  partialBubble: {
    opacity: 0.85,
  },
  bubbleText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  processingText: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    paddingHorizontal: theme.layout.screenPadding,
    paddingBottom: theme.spacing.xs,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: theme.spacing['2xl'],
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  micButtonActive: {
    backgroundColor: theme.colors.error,
  },
  micButtonDisabled: {
    opacity: 0.65,
  },
  footerHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
});
