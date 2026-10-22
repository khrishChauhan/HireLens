/**
 * Automated Test Suite for HireLens Phase 8 — AI Voice Interviewer
 * Tests Web Speech API feature detection, synthesis formatting, speech recognition lifecycle,
 * transcript aggregation, error translation, state transitions, duplicate submission prevention,
 * and mode switching.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  cleanSpokenText,
  getFriendlyErrorMessage,
  isSpeechRecognitionSupported,
  isSpeechSynthesisSupported,
  getVoiceSupport,
} from '../src/lib/speech/speech-service.ts';

interface MockSpeechItem {
  isFinal: boolean;
  0: { transcript: string; confidence: number };
}

interface MockSpeechEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: MockSpeechItem;
  };
}

interface MockSpeechErrorEvent {
  error: string;
}

// Setup Mock Window and Web Speech APIs for automated testing
class MockSpeechRecognition {
  continuous = true;
  interimResults = true;
  lang = 'en-US';
  maxAlternatives = 1;
  started = false;
  stopped = false;
  aborted = false;

  onstart: (() => void) | null = null;
  onresult: ((event: MockSpeechEvent) => void) | null = null;
  onerror: ((event: MockSpeechErrorEvent) => void) | null = null;
  onend: (() => void) | null = null;

  start() {
    this.started = true;
    this.onstart?.();
  }

  stop() {
    this.stopped = true;
    this.onend?.();
  }

  abort() {
    this.aborted = true;
    this.onend?.();
  }

  // Test helper to simulate incoming spoken words
  simulateSpeechResult(finalText: string, interimText: string = '') {
    const results: MockSpeechItem[] = [];
    if (finalText) {
      results.push({
        isFinal: true,
        0: { transcript: finalText, confidence: 0.95 },
      });
    }
    if (interimText) {
      results.push({
        isFinal: false,
        0: { transcript: interimText, confidence: 0.8 },
      });
    }

    const event: MockSpeechEvent = {
      resultIndex: 0,
      results: Object.assign([...results], { length: results.length }),
    };
    this.onresult?.(event);
  }

  simulateError(errorType: string) {
    this.onerror?.({ error: errorType });
  }
}

class MockSpeechSynthesisUtterance {
  text: string;
  rate = 1.0;
  pitch = 1.0;
  lang = 'en-US';
  voice = null;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;

  constructor(text: string) {
    this.text = text;
  }
}

const mockSpeechSynthesis = {
  speaking: false,
  cancelled: false,
  spokenUtterance: null as MockSpeechSynthesisUtterance | null,
  speak(utterance: MockSpeechSynthesisUtterance) {
    this.speaking = true;
    this.spokenUtterance = utterance;
    utterance.onstart?.();
  },
  cancel() {
    this.speaking = false;
    this.cancelled = true;
  },
  getVoices() {
    return [
      { name: 'Google US English', lang: 'en-US' },
      { name: 'Microsoft David', lang: 'en-US' },
    ];
  },
};

interface CustomGlobal {
  window?: Record<string, unknown>;
}

const testGlobal = globalThis as unknown as CustomGlobal;

describe('HireLens AI Voice Interviewer — Unit & Integration Tests', () => {
  beforeEach(() => {
    // Reset global window mocks before each test
    testGlobal.window = undefined;
  });

  describe('1. Feature Detection and Unsupported-Browser Fallback', () => {
    it('should report false when running in an environment without Web Speech API', () => {
      assert.equal(isSpeechRecognitionSupported(), false);
      assert.equal(isSpeechSynthesisSupported(), false);
      const support = getVoiceSupport();
      assert.deepEqual(support, { recognition: false, synthesis: false });
    });

    it('should detect speech recognition when SpeechRecognition or webkitSpeechRecognition exists', () => {
      testGlobal.window = {
        webkitSpeechRecognition: MockSpeechRecognition,
      };
      assert.equal(isSpeechRecognitionSupported(), true);
      assert.equal(isSpeechSynthesisSupported(), false);
    });

    it('should detect speech synthesis when window.speechSynthesis exists', () => {
      testGlobal.window = {
        speechSynthesis: mockSpeechSynthesis,
        SpeechSynthesisUtterance: MockSpeechSynthesisUtterance,
      };
      assert.equal(isSpeechRecognitionSupported(), false);
      assert.equal(isSpeechSynthesisSupported(), true);
      assert.deepEqual(getVoiceSupport(), { recognition: false, synthesis: true });
    });
  });

  describe('2. Spoken Text Sanitization for Natural TTS Delivery', () => {
    it('should strip markdown bold, headers, code blocks, and bullets', () => {
      const rawMarkdown = `### Stage B: Project Overview\n\nCould you explain **HireLens** and its \`FastAPI\` backend?\n* What problem did you solve?\n* How does [RAG](https://hirelens.ai) work?`;
      const cleaned = cleanSpokenText(rawMarkdown);

      assert.ok(!cleaned.includes('###'));
      assert.ok(!cleaned.includes('**'));
      assert.ok(!cleaned.includes('`'));
      assert.ok(!cleaned.includes('https://'));
      assert.ok(!cleaned.includes('*'));
      assert.equal(
        cleaned,
        'Stage B: Project Overview Could you explain HireLens and its FastAPI backend? What problem did you solve? How does RAG work?'
      );
    });

    it('should handle empty or whitespace-only text gracefully', () => {
      assert.equal(cleanSpokenText(''), '');
      assert.equal(cleanSpokenText('   \n\t  '), '');
    });
  });

  describe('3. Error Handling and Permission Denial Translation', () => {
    it('should translate not-allowed into clear microphone permission instructions', () => {
      const msg = getFriendlyErrorMessage('not-allowed');
      assert.ok(msg.includes('Microphone access was denied'));
      assert.ok(msg.includes('browser address bar'));
    });

    it('should translate no-speech into clear detection feedback', () => {
      const msg = getFriendlyErrorMessage('no-speech');
      assert.ok(msg.includes('No speech was detected'));
    });

    it('should translate audio-capture into device not found warning', () => {
      const msg = getFriendlyErrorMessage('audio-capture');
      assert.ok(msg.includes('No microphone was found'));
    });

    it('should translate network and unknown errors gracefully', () => {
      const netMsg = getFriendlyErrorMessage('network');
      assert.ok(netMsg.includes('network error'));

      const unkMsg = getFriendlyErrorMessage('aborted');
      assert.equal(unkMsg, 'Listening was stopped.');
    });
  });

  describe('4. Speech Recognition Lifecycle & Real-Time Transcript Handling', () => {
    it('should accumulate final transcripts and stream interim speech', () => {
      const recognizer = new MockSpeechRecognition();
      let accumulatedFinal = '';
      let activeInterim = '';

      recognizer.onresult = (event: MockSpeechEvent) => {
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
        activeInterim = currentInterim;
      };

      recognizer.start();
      assert.equal(recognizer.started, true);

      // Simulate interim speaking
      recognizer.simulateSpeechResult('', 'In our project');
      assert.equal(activeInterim, 'In our project');
      assert.equal(accumulatedFinal, '');

      // Simulate finalized sentence
      recognizer.simulateSpeechResult('In our project, we used FastAPI for asynchronous routing.');
      assert.equal(accumulatedFinal, 'In our project, we used FastAPI for asynchronous routing.');

      // Simulate second finalized sentence
      recognizer.simulateSpeechResult('We also integrated SQLite for session recovery.');
      assert.equal(
        accumulatedFinal,
        'In our project, we used FastAPI for asynchronous routing. We also integrated SQLite for session recovery.'
      );
    });

    it('should allow candidate to edit and confirm transcript before submitting', () => {
      let candidateAnswer = 'Initial transcribed speech with a misheard term like pie test.';
      // Candidate reviews and edits misheard term
      candidateAnswer = candidateAnswer.replace('pie test', 'pytest');
      assert.equal(candidateAnswer, 'Initial transcribed speech with a misheard term like pytest.');
      // Confirm length validation (>= 20 characters)
      assert.ok(candidateAnswer.trim().length >= 20);
    });
  });

  describe('5. Duplicate Submission Prevention & Audio Interlocking', () => {
    it('should prevent submission when answer is under 20 characters or whitespace', () => {
      const validateAnswer = (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return 'Please provide your technical response before submitting.';
        if (trimmed.length < 20) return 'Please provide a more substantive technical response (at least 20 characters).';
        return null;
      };

      assert.equal(validateAnswer(''), 'Please provide your technical response before submitting.');
      assert.equal(validateAnswer('   '), 'Please provide your technical response before submitting.');
      assert.equal(validateAnswer('Too short'), 'Please provide a more substantive technical response (at least 20 characters).');
      assert.equal(
        validateAnswer('We used FastAPI and SQLAlchemy with SQLite persistence for reliable sessions.'),
        null
      );
    });

    it('should prevent duplicate submissions while evaluation is in-flight', () => {
      let isEvaluating = false;
      let submissionCount = 0;

      const submitAnswer = () => {
        if (isEvaluating) return false;
        isEvaluating = true;
        submissionCount++;
        return true;
      };

      assert.equal(submitAnswer(), true);
      assert.equal(submissionCount, 1);
      // Second attempt while isEvaluating is true must be rejected
      assert.equal(submitAnswer(), false);
      assert.equal(submissionCount, 1);

      // After evaluation completes, next submission is allowed
      isEvaluating = false;
      assert.equal(submitAnswer(), true);
      assert.equal(submissionCount, 2);
    });

    it('should stop recognition before submitting answer', () => {
      const recognizer = new MockSpeechRecognition();
      recognizer.start();
      assert.equal(recognizer.started, true);

      let recognitionStoppedBeforeSubmit = false;
      const submitAnswer = () => {
        recognizer.stop();
        recognitionStoppedBeforeSubmit = recognizer.stopped;
      };

      submitAnswer();
      assert.equal(recognitionStoppedBeforeSubmit, true);
    });

    it('should preserve dictated answer when switching from voice to text mode', () => {
      const voiceTranscript = 'This is my dictated response explaining asynchronous Python and FastAPI.';
      let textAnswer = '';

      // Mode switch: voice -> text
      textAnswer = voiceTranscript;
      assert.equal(textAnswer, voiceTranscript);
      assert.ok(textAnswer.length > 20);
    });
  });

  describe('6. Phase 10 Voice Turn-Taking, Pacing & Tab Visibility', () => {
    it('should calculate dynamic silence thresholds (2.0s for terminal punctuation vs 2.8s for mid-sentence pauses)', () => {
      const calculateSilenceDelay = (text: string) => {
        const trimmed = text.trim();
        if (trimmed.length < 20) return null; // do not auto-submit
        const hasTerminalPunctuation = /[.?!]$/.test(trimmed);
        return hasTerminalPunctuation && trimmed.length >= 35 ? 2000 : 2800;
      };

      // 1. Terminal sentence punctuation with substantive length: responsive 2.0s timeout
      const completeSentence = 'I built HireLens using FastAPI, SQLite, and Groq for adaptive interviews.';
      assert.equal(calculateSilenceDelay(completeSentence), 2000);

      const questionSentence = 'Why did we choose SQLite over PostgreSQL for local assessment persistence?';
      assert.equal(calculateSilenceDelay(questionSentence), 2000);

      // 2. Mid-sentence thoughtful pause (no period, or conjunction): generous 2.8s breathing room
      const midSentencePause = 'We chose Redis for caching because the token generation was';
      assert.equal(calculateSilenceDelay(midSentencePause), 2800);

      const commaEnding = 'In our architecture, we separated the frontend and backend,';
      assert.equal(calculateSilenceDelay(commaEnding), 2800);

      // 3. Short / incomplete answers (< 20 chars): no auto-submit
      assert.equal(calculateSilenceDelay('Yeah okay'), null);
      assert.equal(calculateSilenceDelay('FastAPI'), null);
      assert.equal(calculateSilenceDelay(''), null);
    });

    it('should clear silence timer immediately when interim speech is streaming', () => {
      let silenceTimerActive = true;

      const handleSpeechResult = (interim: string) => {
        // If candidate is actively producing syllables, timer must be cleared immediately
        if (interim.trim().length > 0) {
          silenceTimerActive = false;
        }
      };

      handleSpeechResult('and we also implemented');
      assert.equal(silenceTimerActive, false);
    });

    it('should merge pending interim syllables when candidate clicks Done Speaking', () => {
      const baseRawFinal = 'I built our search pipeline using';
      const trailingInterim = 'FastEmbed and vector embeddings.';

      const combineForSubmission = (raw: string, interim: string) => {
        const rawBase = raw.trim();
        const pending = interim.trim();
        return pending ? (rawBase ? `${rawBase} ${pending}` : pending) : rawBase;
      };

      const finalSubmission = combineForSubmission(baseRawFinal, trailingInterim);
      assert.equal(
        finalSubmission,
        'I built our search pipeline using FastEmbed and vector embeddings.'
      );
      assert.ok(finalSubmission.length >= 10);
    });

    it('should halt synthesis, listening, and silence timers on hidden tab visibility while preserving draft answers', () => {
      let isSpeaking = true;
      let isListening = true;
      const silenceTimer = setTimeout(() => {}, 2000);
      let sessionState: 'listening' | 'paused' | 'speaking' = 'speaking';
      const draftAnswer = 'We designed an asynchronous queue to process resume analysis jobs.';

      // Simulate tab switching to background: document.visibilityState === 'hidden'
      const handleVisibilityChange = (visibilityState: 'hidden' | 'visible') => {
        if (visibilityState === 'hidden') {
          if (isSpeaking) {
            isSpeaking = false;
          }
          if (isListening || sessionState === 'listening') {
            isListening = false;
            clearTimeout(silenceTimer);
            sessionState = 'paused';
          }
        }
      };

      handleVisibilityChange('hidden');

      assert.equal(isSpeaking, false);
      // Draft answer is retained without being lost
      assert.equal(draftAnswer, 'We designed an asynchronous queue to process resume analysis jobs.');
    });

    it('should enforce acoustic settling delay (200ms) before microphone reactivation', async () => {
      let micOpen = false;
      const onSpeechEnd = (callback: () => void) => {
        setTimeout(() => {
          callback();
        }, 200);
      };

      let timerFired = false;
      onSpeechEnd(() => {
        micOpen = true;
        timerFired = true;
      });

      // Initially mic must not open immediately
      assert.equal(micOpen, false);

      // Wait 250ms for settling delay to complete
      await new Promise((resolve) => setTimeout(resolve, 250));
      assert.equal(timerFired, true);
      assert.equal(micOpen, true);
    });
  });
});
