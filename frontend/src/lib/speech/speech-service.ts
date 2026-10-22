/**
 * Speech Recognition and Synthesis Services for HireLens Voice Interviewer.
 * Encapsulates browser Web Speech API interactions, feature detection, voice selection,
 * markdown sanitization for TTS, and error resolution.
 */

import type {
  ISpeechRecognition,
  SpeechErrorType,
  VoiceSupport,
} from './speech-types';
import { normalizeTechnicalTranscript } from './technical-corrections.ts';

export { normalizeTechnicalTranscript };
export type { TechnicalCorrection, NormalizedTranscriptResult } from './technical-corrections.ts';

/**
 * Check if the browser supports Speech Recognition (Web Speech API).
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * Check if the browser supports Speech Synthesis (Text-to-Speech).
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return typeof window.speechSynthesis !== 'undefined' && typeof window.SpeechSynthesisUtterance !== 'undefined';
}

/**
 * Get comprehensive voice feature support for the active environment.
 */
export function getVoiceSupport(): VoiceSupport {
  return {
    recognition: isSpeechRecognitionSupported(),
    synthesis: isSpeechSynthesisSupported(),
  };
}

/**
 * Strip markdown markers, code blocks, bullet syntax, and URLs to ensure natural vocalization.
 */
export function cleanSpokenText(markdownText: string): string {
  if (!markdownText) return '';

  return markdownText
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, ' code snippet ')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold/italics
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove Markdown headers (# Header)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove bullet points / numbering
    .replace(/^[\s*+-]+ /gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Clean up excessive whitespace and quotes
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Select a high quality English voice if available in the browser.
 */
export function selectBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // Preference list for natural sounding English voices
  const preferredVoiceNames = [
    'Google US English',
    'Google UK English Female',
    'Microsoft Jenny Online (Natural) - English (United States)',
    'Microsoft Guy Online (Natural) - English (United States)',
    'Samantha',
    'Daniel',
    'Karen',
    'Alex',
  ];

  for (const preferred of preferredVoiceNames) {
    const match = voices.find((v) => v.name.toLowerCase().includes(preferred.toLowerCase()));
    if (match) return match;
  }

  // Fallback to any en-US or en voice
  const englishVoice = voices.find((v) => v.lang.startsWith('en-US') || v.lang.startsWith('en'));
  return englishVoice || voices[0] || null;
}

export interface SpeakOptions {
  rate?: number; // default 0.98 for clear comprehension
  pitch?: number; // default 1.0
  voiceName?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

/**
 * Speak text aloud using browser SpeechSynthesis with natural cadence.
 */
export function speakText(text: string, options: SpeakOptions = {}): { cancel: () => void } {
  if (!isSpeechSynthesisSupported()) {
    options.onError?.(new Error('SpeechSynthesis is not supported in this browser.'));
    return { cancel: () => {} };
  }

  // Cancel any existing utterance before starting new speech
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore cancellation errors
  }

  const cleaned = cleanSpokenText(text);
  if (!cleaned) {
    options.onEnd?.();
    return { cancel: () => {} };
  }

  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.rate = options.rate ?? 0.98;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.lang = 'en-US';

  // Apply voice if available
  const voices = window.speechSynthesis.getVoices();
  if (options.voiceName) {
    const selected = voices.find((v) => v.name === options.voiceName);
    if (selected) utterance.voice = selected;
  } else {
    const best = selectBestVoice(voices);
    if (best) utterance.voice = best;
  }

  let isCancelled = false;

  utterance.onstart = () => {
    if (!isCancelled) {
      options.onStart?.();
    }
  };

  utterance.onend = () => {
    if (!isCancelled) {
      options.onEnd?.();
    }
  };

  utterance.onerror = (event) => {
    // speechSynthesis.cancel triggers an 'interrupted' or 'canceled' error event, which is expected
    if (event.error === 'interrupted' || event.error === 'canceled' || isCancelled) {
      return;
    }
    options.onError?.(event);
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    options.onError?.(err);
  }

  return {
    cancel: () => {
      isCancelled = true;
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    },
  };
}

/**
 * Cancel any ongoing speech synthesis output immediately.
 */
export function stopSpeaking(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }
}

export interface SpeechRecognizerCallbacks {
  onResult: (finalTranscript: string, interimTranscript: string) => void;
  onError: (errorType: SpeechErrorType, message: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

/**
 * Initialize a browser SpeechRecognition instance configured for technical interviews.
 */
export function createSpeechRecognizer(callbacks: SpeechRecognizerCallbacks): ISpeechRecognition | null {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionAPI) return null;

  try {
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    let accumulatedFinal = '';

    recognition.onstart = () => {
      callbacks.onStart();
    };

    recognition.onresult = (event) => {
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        const text = item[0]?.transcript || '';

        if (item.isFinal) {
          accumulatedFinal += (accumulatedFinal ? ' ' : '') + text.trim();
        } else {
          currentInterim += (currentInterim ? ' ' : '') + text;
        }
      }

      // Safe normalization layer applied strictly to finalized transcripts
      const normalized = normalizeTechnicalTranscript(accumulatedFinal);
      callbacks.onResult(normalized.correctedTranscript, currentInterim);
    };

    recognition.onerror = (event) => {
      const errorType = (event.error as SpeechErrorType) || 'unknown';
      const friendlyMessage = getFriendlyErrorMessage(errorType);
      callbacks.onError(errorType, friendlyMessage);
    };

    recognition.onend = () => {
      callbacks.onEnd();
    };

    return recognition;
  } catch (err) {
    callbacks.onError('unknown', `Failed to initialize speech recognition: ${String(err)}`);
    return null;
  }
}

/**
 * Human-friendly error translation for browser speech recognition errors.
 */
export function getFriendlyErrorMessage(errorType: SpeechErrorType | string): string {
  switch (errorType) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was denied. Please allow microphone permissions in your browser address bar to use voice mode.';
    case 'no-speech':
      return 'No speech was detected. Please check your microphone volume and speak clearly.';
    case 'audio-capture':
      return 'No microphone was found or your audio input device is currently unavailable.';
    case 'network':
      return 'Speech recognition network error occurred. Please check your internet connection.';
    case 'aborted':
      return 'Listening was stopped.';
    default:
      return 'Speech recognition encountered an unexpected error. You can continue typing in Text Mode.';
  }
}
