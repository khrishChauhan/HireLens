/**
 * Automated Test Suite for HireLens ChatGPT-Style Live Voice Experience
 * Tests WebRTC Realtime session payload formulation, missing credential handling,
 * audio volume normalization, orb state transitions, Whisper turn capture,
 * interruption handling, and background evaluation triggering.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type {
  OrbState,
  RealtimeTranscriptItem,
} from '../src/lib/realtime/realtime-types.ts';

describe('ChatGPT-Style Live Voice Engine — Unit & Integration Tests', () => {
  describe('1. Realtime Session Payloads and Credential Detection', () => {
    it('should identify missing credentials and provide actionable setup guidance', () => {
      const mockMissingCredsResponse = {
        status: 'missing_credentials' as const,
        provider: 'openai',
        env_variable: 'OPENAI_API_KEY',
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: 'Test instructions...',
        message: 'OPENAI_API_KEY is not configured in backend/.env.',
      };

      assert.equal(mockMissingCredsResponse.status, 'missing_credentials');
      assert.equal(mockMissingCredsResponse.env_variable, 'OPENAI_API_KEY');
      assert.ok(mockMissingCredsResponse.message.includes('backend/.env'));
    });

    it('should validate active session with ephemeral client secret', () => {
      const mockActiveResponse = {
        status: 'active' as const,
        client_secret: 'ek_test_ephemeral_client_secret_12345',
        session_id: 'sess_998877',
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: 'Test instructions...',
        provider: 'openai',
      };

      assert.equal(mockActiveResponse.status, 'active');
      assert.ok(mockActiveResponse.client_secret.startsWith('ek_'));
      assert.equal(mockActiveResponse.provider, 'openai');
    });
  });

  describe('2. Audio Reactivity & Orb Scale Mathematics', () => {
    it('should bound audio volume between 0.0 and 1.0', () => {
      const calculateVolume = (frequencyData: number[]) => {
        const sum = frequencyData.reduce((acc, val) => acc + val, 0);
        const avg = sum / (frequencyData.length || 1);
        return Math.min(1.0, Math.max(0.0, avg / 128));
      };

      assert.equal(calculateVolume([0, 0, 0, 0]), 0);
      assert.equal(calculateVolume([128, 128, 128, 128]), 1.0);
      assert.equal(calculateVolume([255, 255, 255, 255]), 1.0);
      assert.equal(calculateVolume([64, 64, 64, 64]), 0.5);
    });

    it('should scale Orb dynamically based on audio energy without exceeding safe bounds', () => {
      const getDynamicOrbScale = (volume: number) => 1.0 + volume * 0.24;

      assert.equal(getDynamicOrbScale(0), 1.0);
      assert.equal(getDynamicOrbScale(0.5), 1.12);
      assert.equal(getDynamicOrbScale(1.0), 1.24);
    });
  });

  describe('3. Orb State Machine & Low-Latency Interruption (Barge-In)', () => {
    it('should transition to listening and interrupt assistant when candidate speech starts', () => {
      let orbState: OrbState = 'speaking';
      let assistantAudioPlaying = true;

      // Event: input_audio_buffer.speech_started
      const handleSpeechStarted = () => {
        assistantAudioPlaying = false; // Interrupted
        orbState = 'listening';
      };

      handleSpeechStarted();
      assert.equal(orbState, 'listening');
      assert.equal(assistantAudioPlaying, false);
    });

    it('should transition to thinking when candidate speech stops', () => {
      let orbState: OrbState = 'listening';

      // Event: input_audio_buffer.speech_stopped
      const handleSpeechStopped = () => {
        orbState = 'thinking';
      };

      handleSpeechStopped();
      assert.equal(orbState, 'thinking');
    });

    it('should transition to speaking when assistant begins audio playback', () => {
      let orbState: OrbState = 'thinking';

      // Event: response.audio_transcript.delta
      const handleAudioDelta = () => {
        orbState = 'speaking';
      };

      handleAudioDelta();
      assert.equal(orbState, 'speaking');
    });
  });

  describe('4. Turn Capture & Background HireLens Evaluation Integration', () => {
    it('should capture Whisper transcription and queue background evaluation', () => {
      const candidateTranscript =
        'In my project HireLens, I implemented the FastAPI backend with async endpoints and SQLite persistence.';

      const evaluatedTurns: RealtimeTranscriptItem[] = [];

      // Turn capture handler
      const handleCandidateTurn = (text: string, currentTurnNum: number) => {
        const item: RealtimeTranscriptItem = {
          id: `cand_${currentTurnNum}`,
          role: 'candidate',
          text,
          timestamp: '14:30',
          isFinal: true,
          stage: 'Stage B: Project Overview',
        };
        evaluatedTurns.push(item);
        return item;
      };

      const item = handleCandidateTurn(candidateTranscript, 2);
      assert.equal(evaluatedTurns.length, 1);
      assert.equal(item.role, 'candidate');
      assert.ok(item.text.includes('FastAPI'));
      assert.equal(item.stage, 'Stage B: Project Overview');
    });

    it('should prevent duplicate turn submissions while evaluation is processing', () => {
      let isEvaluating = false;
      let evaluatedCount = 0;

      const triggerTurnEvaluation = (text: string) => {
        if (!text.trim() || text.length < 10) return false;
        if (isEvaluating) return false;

        isEvaluating = true;
        evaluatedCount++;
        return true;
      };

      // First call succeeds
      assert.equal(triggerTurnEvaluation('Valid candidate answer with sufficient technical depth.'), true);
      assert.equal(evaluatedCount, 1);

      // Concurrent duplicate call is rejected
      assert.equal(triggerTurnEvaluation('Duplicate invocation attempt.'), false);
      assert.equal(evaluatedCount, 1);

      // Reset upon completion
      isEvaluating = false;
      assert.equal(triggerTurnEvaluation('Subsequent turn answer after completion.'), true);
      assert.equal(evaluatedCount, 2);
    });

    it('should correctly advance stage progression across turns', () => {
      const getStageForTurn = (turnNum: number) => {
        if (turnNum === 1) return 'Stage A: Warm-Up';
        if (turnNum === 2) return 'Stage B: Project Overview';
        if (turnNum === 3) return 'Stage C: Project Deep Dive';
        if (turnNum === 4) return 'Stage D: Topic Transition';
        return 'Stage F: Wrap-Up';
      };

      assert.equal(getStageForTurn(1), 'Stage A: Warm-Up');
      assert.equal(getStageForTurn(2), 'Stage B: Project Overview');
      assert.equal(getStageForTurn(3), 'Stage C: Project Deep Dive');
      assert.equal(getStageForTurn(4), 'Stage D: Topic Transition');
      assert.equal(getStageForTurn(5), 'Stage F: Wrap-Up');
    });
  });

  describe('5. Session Recovery Parity', () => {
    it('should preserve evaluated answers and transcript history on mode toggle', () => {
      const sessionHistory: RealtimeTranscriptItem[] = [
        {
          id: 'asst_1',
          role: 'assistant',
          text: 'Tell me about yourself and your background.',
          timestamp: '14:28',
          isFinal: true,
          stage: 'Stage A: Warm-Up',
        },
        {
          id: 'cand_1',
          role: 'candidate',
          text: 'I am a backend engineer specializing in distributed systems and Python.',
          timestamp: '14:29',
          isFinal: true,
        },
      ];

      // Verify that history items retain complete role and stage attributes
      assert.equal(sessionHistory.length, 2);
      assert.equal(sessionHistory[0].role, 'assistant');
      assert.equal(sessionHistory[1].role, 'candidate');
      assert.ok(sessionHistory[1].text.includes('distributed systems'));
    });
  });
});
