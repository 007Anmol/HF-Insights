import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppLanguage } from '../types/language';
import type { CanonicalInsights } from '../lib/canonicalInsights';
import { resolveVoiceLanguage } from '../lib/voiceLanguage';
import { sendReportVoiceChat, type VoiceChatMessage } from '../lib/reportVoiceChat';
import { loadSpeechRecognitionModule, type SpeechRecognitionModule } from '../lib/speechRecognitionBridge';
import { speakReportAnswer, stopReportAnswerSpeech } from '../lib/speakReportAnswer';

export type VoiceConversationStatus = 'idle' | 'listening' | 'processing' | 'speaking';

type Params = {
  canonical: CanonicalInsights;
  displayLanguage: AppLanguage;
  previousReportSummary?: string;
  enabled: boolean;
};

export function useReportVoiceConversation({
  canonical,
  displayLanguage,
  previousReportSummary,
  enabled,
}: Params) {
  const [messages, setMessages] = useState<VoiceChatMessage[]>([]);
  const [status, setStatus] = useState<VoiceConversationStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState('');
  const [speechInputAvailable, setSpeechInputAvailable] = useState(false);
  const [offlineAnswers, setOfflineAnswers] = useState(false);
  const pendingTranscript = useRef('');
  const messagesRef = useRef<VoiceChatMessage[]>([]);
  const speechModuleRef = useRef<SpeechRecognitionModule | null>(null);
  const voiceLang = resolveVoiceLanguage(displayLanguage);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!enabled) {
      void stopReportAnswerSpeech();
      speechModuleRef.current?.abort();
      setStatus('idle');
      setPartialTranscript('');
      return;
    }

    let cancelled = false;
    const subscriptions: { remove: () => void }[] = [];

    (async () => {
      try {
        const module = await loadSpeechRecognitionModule();
        if (cancelled) return;

        speechModuleRef.current = module;
        setSpeechInputAvailable(Boolean(module));

        if (!module) return;

        subscriptions.push(
          module.addListener('result', (event) => {
            const text = event.results?.[0]?.transcript?.trim() || '';
            if (!text) return;
            pendingTranscript.current = text;
            setPartialTranscript(text);
          }),
        );

        subscriptions.push(
          module.addListener('error', () => {
            setStatus('idle');
            setError('Could not hear you clearly. Please try again or type your question.');
          }),
        );
      } catch {
        if (!cancelled) {
          speechModuleRef.current = null;
          setSpeechInputAvailable(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      subscriptions.forEach((sub) => sub.remove());
    };
  }, [enabled]);

  const speakAnswer = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setStatus('speaking');
      try {
        await speakReportAnswer(trimmed, voiceLang.appLanguage);
      } finally {
        setStatus('idle');
      }
    },
    [voiceLang.appLanguage],
  );

  const sendUserMessage = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed) return;

      setError(null);
      setPartialTranscript('');
      pendingTranscript.current = '';

      const userMessage: VoiceChatMessage = { role: 'user', content: trimmed };
      const priorHistory = messagesRef.current;
      setMessages((prev) => [...prev, userMessage]);
      setStatus('processing');

      try {
        const result = await sendReportVoiceChat({
          canonical,
          message: trimmed,
          language: voiceLang.appLanguage,
          conversationHistory: priorHistory,
          previousReportSummary,
        });

        const answer = result.answer.trim();
        if (result.offline_fallback) {
          setOfflineAnswers(true);
        }
        const assistantMessage: VoiceChatMessage = { role: 'assistant', content: answer };
        setMessages((prev) => [...prev, assistantMessage]);
        setStatus('idle');
        await speakAnswer(answer);
      } catch {
        setError('Unable to answer right now. Please try again.');
        setStatus('idle');
      }
    },
    [canonical, previousReportSummary, speakAnswer, voiceLang.appLanguage],
  );

  const startListening = useCallback(async () => {
    const module = speechModuleRef.current;
    if (!module) {
      setError('Voice input needs a development build. Type your question below for now.');
      return;
    }

    setError(null);
    await stopReportAnswerSpeech();

    const permission = await module.requestPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone and speech recognition permission is required.');
      return;
    }

    if (status === 'listening') {
      module.stop();
      return;
    }

    if (status === 'speaking' || status === 'processing') {
      return;
    }

    pendingTranscript.current = '';
    setPartialTranscript('');
    setStatus('listening');

    module.start({
      lang: voiceLang.recognitionLocale,
      interimResults: true,
      continuous: false,
    });
  }, [status, voiceLang.recognitionLocale]);

  const stopListeningAndSend = useCallback(async () => {
    const module = speechModuleRef.current;
    if (status !== 'listening' || !module) return;
    module.stop();
    const text = (pendingTranscript.current || partialTranscript).trim();
    setStatus('idle');
    if (!text) {
      setError('Could not hear you clearly. Type your question below.');
      return;
    }
    await sendUserMessage(text);
  }, [partialTranscript, sendUserMessage, status]);

  const stopAll = useCallback(() => {
    void stopReportAnswerSpeech();
    speechModuleRef.current?.abort();
    setStatus('idle');
    setPartialTranscript('');
  }, []);

  return {
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
  };
};
