'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ISpeechRecognition,
  SpeechErrorType,
  VoiceState,
  VoiceSupport,
} from './speech-types';
import {
  cleanSpokenText,
  getFriendlyErrorMessage,
  getVoiceSupport,
  speakText,
  stopSpeaking,
} from './speech-service';

export interface UseVoiceInterviewOptions {
  initialMode?: 'voice' | 'text';
  autoReadQuestions?: boolean;
}

export function useVoiceInterview(options: UseVoiceInterviewOptions = {}) {
  const { initialMode = 'text', autoReadQuestions = true } = options;

  // Feature detection
  const [support] = useState<VoiceSupport>(() => getVoiceSupport());
  const [mode, setMode] = useState<'voice' | 'text'>(initialMode);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Transcript states
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  // References to active speech recognition and synthesis
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const activeUtteranceCancelRef = useRef<(() => void) | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const accumulatedFinalRef = useRef<string>('');

  // 2. Stop speaking helper
  const haltSpeaking = useCallback(() => {
    if (activeUtteranceCancelRef.current) {
      activeUtteranceCancelRef.current();
      activeUtteranceCancelRef.current = null;
    }
    stopSpeaking();
    isSpeakingRef.current = false;
    setVoiceState((prev) => (prev === 'speaking' ? 'idle' : prev));
  }, []);

  // 3. Stop recognition helper
  const haltListening = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors if already stopping
      }
    }
    isListeningRef.current = false;
    setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
  }, []);

  // 4. Stop all audio and speech engines (called on unmount, mode switch, or before submit)
  const stopAllAudio = useCallback(() => {
    haltSpeaking();
    haltListening();
    setInterimTranscript('');
  }, [haltSpeaking, haltListening]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  // 5. Speak a question aloud using SpeechSynthesis
  const speakQuestion = useCallback(
    (text: string, onCompleted?: () => void) => {
      if (isMuted || !support.synthesis) {
        onCompleted?.();
        return;
      }

      // Important: Stop recognition before speaking to prevent microphone capturing interviewer voice!
      haltListening();

      const cleaned = cleanSpokenText(text);
      if (!cleaned) {
        onCompleted?.();
        return;
      }

      isSpeakingRef.current = true;
      setVoiceState('speaking');

      const speech = speakText(cleaned, {
        rate: 0.98,
        pitch: 1.0,
        onStart: () => {
          isSpeakingRef.current = true;
          setVoiceState('speaking');
        },
        onEnd: () => {
          isSpeakingRef.current = false;
          setVoiceState((prev) => (prev === 'speaking' ? 'idle' : prev));
          onCompleted?.();
        },
        onError: () => {
          isSpeakingRef.current = false;
          setVoiceState((prev) => (prev === 'speaking' ? 'idle' : prev));
        },
      });

      activeUtteranceCancelRef.current = speech.cancel;
    },
    [isMuted, support.synthesis, haltListening]
  );

  // 6. Start microphone speech recognition
  const startListening = useCallback(() => {
    if (!support.recognition) {
      setVoiceError('Speech recognition is not supported in this browser. Please use Text Mode.');
      return;
    }

    // Halt any active synthesis before opening the microphone
    haltSpeaking();

    setVoiceError(null);
    setPermissionDenied(false);

    try {
      const SpeechRecognitionAPI =
        typeof window !== 'undefined'
          ? window.SpeechRecognition || window.webkitSpeechRecognition
          : null;

      if (!SpeechRecognitionAPI) {
        setVoiceError('Speech recognition API unavailable.');
        return;
      }

      // If already listening, stop previous session first
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      // Keep previous transcript as baseline
      accumulatedFinalRef.current = transcript;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setVoiceState('listening');
      };

      recognition.onresult = (event) => {
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';

          if (item.isFinal) {
            const base = accumulatedFinalRef.current;
            const updated = base ? `${base} ${text.trim()}` : text.trim();
            accumulatedFinalRef.current = updated;
            setTranscript(updated);
          } else {
            currentInterim += (currentInterim ? ' ' : '') + text;
          }
        }

        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event) => {
        const errorType = (event.error as SpeechErrorType) || 'unknown';
        if (errorType === 'not-allowed' || errorType === 'service-not-allowed') {
          setPermissionDenied(true);
        }

        if (errorType !== 'aborted') {
          const friendly = getFriendlyErrorMessage(errorType);
          setVoiceError(friendly);
        }

        isListeningRef.current = false;
        setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setVoiceState((prev) => (prev === 'listening' ? 'idle' : prev));
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setVoiceError(`Failed to start microphone: ${String(err)}`);
      setVoiceState('idle');
    }
  }, [support.recognition, haltSpeaking, transcript]);

  // 7. Stop listening
  const stopListening = useCallback(() => {
    haltListening();
    if (interimTranscript) {
      const merged = transcript
        ? `${transcript} ${interimTranscript.trim()}`
        : interimTranscript.trim();
      setTranscript(merged);
      setInterimTranscript('');
      accumulatedFinalRef.current = merged;
    }
  }, [haltListening, interimTranscript, transcript]);

  // 8. Toggle listening
  const toggleListening = useCallback(() => {
    if (isListeningRef.current) {
      stopListening();
    } else {
      startListening();
    }
  }, [startListening, stopListening]);

  // 9. Retry answer (clears transcript and re-opens mic)
  const retryAnswer = useCallback(() => {
    haltListening();
    setTranscript('');
    setInterimTranscript('');
    accumulatedFinalRef.current = '';
    setVoiceError(null);
    startListening();
  }, [haltListening, startListening]);

  // 10. Clear transcript
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    accumulatedFinalRef.current = '';
  }, []);

  // 11. Replay question aloud
  const replayQuestion = useCallback(
    (questionText: string) => {
      stopListening();
      speakQuestion(questionText);
    },
    [stopListening, speakQuestion]
  );

  // 12. Toggle Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        haltSpeaking();
      }
      return next;
    });
  }, [haltSpeaking]);

  // 13. Switch mode handlers
  const switchToTextMode = useCallback(() => {
    stopAllAudio();
    setMode('text');
  }, [stopAllAudio]);

  const switchToVoiceMode = useCallback(() => {
    setMode('voice');
    setVoiceError(null);
  }, []);

  return {
    mode,
    voiceState,
    isSpeaking: voiceState === 'speaking',
    isListening: voiceState === 'listening',
    isMuted,
    transcript,
    interimTranscript,
    voiceError,
    permissionDenied,
    support,
    autoReadQuestions,
    // Actions
    setTranscript,
    startListening,
    stopListening,
    toggleListening,
    speakQuestion,
    stopSpeaking: haltSpeaking,
    replayQuestion,
    toggleMute,
    retryAnswer,
    clearTranscript,
    switchToTextMode,
    switchToVoiceMode,
    stopAllAudio,
  };
}
