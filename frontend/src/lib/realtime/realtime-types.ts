import { AnswerEvaluationResponse } from '@/lib/assessment-types';

export type RealtimeConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface RealtimeTranscriptItem {
  id: string;
  role: 'assistant' | 'candidate';
  text: string;
  timestamp: string;
  isFinal: boolean;
  stage?: string;
  evaluation?: AnswerEvaluationResponse;
}

export interface RealtimeVoiceSettings {
  isMuted: boolean;
  voice: 'alloy' | 'verse' | 'shimmer' | 'coral' | 'sage' | 'ash' | 'ballad';
  model: string;
  enableSimulationFallback: boolean;
}

export interface RealtimeTurnEvaluationPayload {
  questionId: string;
  questionText: string;
  candidateAnswer: string;
  targetSkill: string;
  rubric: string;
  stage: string;
}
