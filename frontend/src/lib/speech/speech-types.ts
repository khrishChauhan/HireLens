/**
 * Speech Recognition and Synthesis type definitions for HireLens Voice Interviewer (Phase 8).
 * Compatible with standard Web Speech API (W3C Community Group specification).
 */

export type VoiceState = 'idle' | 'speaking' | 'listening' | 'evaluating' | 'error';

/**
 * 8-state conversational state machine for live voice interview.
 */
export type ConversationState =
  | 'idle'
  | 'requesting_permission'
  | 'listening'
  | 'processing_answer'
  | 'speaking'
  | 'paused'
  | 'error'
  | 'completed';

import type { AnswerEvaluationResponse } from '../assessment-types';
import type { TechnicalCorrection } from './technical-corrections';

export interface LiveVoiceTranscriptItem {
  id: string;
  sender: 'interviewer' | 'candidate';
  text: string;
  rawText?: string;
  stage?: string;
  timestamp: number;
  evaluation?: AnswerEvaluationResponse;
  corrections?: TechnicalCorrection[];
  isManuallyEdited?: boolean;
}

export type SpeechErrorType =
  | 'not-allowed'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'service-not-allowed'
  | 'unknown';

export interface VoiceSupport {
  recognition: boolean;
  synthesis: boolean;
}

export interface VoiceSettings {
  isMuted: boolean;
  autoReadQuestions: boolean;
  speechRate: number;
  voiceName?: string;
}

// Browser Web Speech Recognition Interfaces (ensures clean TypeScript compilation across environments)
export interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    item(index: number): {
      length: number;
      item(index: number): {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
    [index: number]: {
      length: number;
      item(index: number): {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

export interface ISpeechRecognitionErrorEvent {
  error: SpeechErrorType | string;
  message?: string;
}

export interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onspeechstart?: (() => void) | null;
  onspeechend?: (() => void) | null;
}

export type SpeechRecognitionConstructor = new () => ISpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}
