'use client';

/**
 * useLiveVoiceInterview
 *
 * Dedicated live voice interview hook using:
 * 1. Browser SpeechRecognition (continuous & interim) for candidate mic input
 * 2. Browser SpeechSynthesis for natural vocal delivery of questions
 * 3. Existing FastAPI & Groq adaptive interview engine for deterministic evaluation & next questions
 * 4. Existing SQLite session persistence
 *
 * Implements an 8-state conversation state machine:
 * 'idle' | 'requesting_permission' | 'listening' | 'processing_answer' | 'speaking' | 'paused' | 'error' | 'completed'
 *
 * Fully hands-free with silence-based turn-taking, audio interlocking (assistant never hears itself),
 * and audio-reactive amplitude metering for the centered Orb.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AdaptiveQuestion,
  AgentActivityItem,
  EvaluatedAnswerRecord,
  RealResumeAnalysisResponse,
} from '@/lib/assessment-types';
import {
  evaluateInterviewAnswer,
  getNextInterviewQuestion,
  saveSessionAnswer,
} from '@/lib/api';
import {
  ConversationState,
  ISpeechRecognition,
  LiveVoiceTranscriptItem,
  SpeechErrorType,
  VoiceSupport,
} from './speech-types';
import {
  cleanSpokenText,
  getFriendlyErrorMessage,
  getVoiceSupport,
  normalizeTechnicalTranscript,
  speakText,
  stopSpeaking,
} from './speech-service';
import type { TechnicalCorrection } from './technical-corrections';

export interface UseLiveVoiceInterviewProps {
  sessionId?: string | null;
  analysisResult?: RealResumeAnalysisResponse | null;
  initialQuestion?: AdaptiveQuestion | null;
  initialEvaluations?: EvaluatedAnswerRecord[];
  maxBudget?: number;
  onTurnEvaluated: (record: EvaluatedAnswerRecord) => void;
  onInterviewCompleted: () => void;
}

export function useLiveVoiceInterview({
  sessionId,
  analysisResult,
  initialQuestion = null,
  initialEvaluations = [],
  maxBudget = 4,
  onTurnEvaluated,
  onInterviewCompleted,
}: UseLiveVoiceInterviewProps) {
  // Feature Support
  const [support] = useState<VoiceSupport>(() => getVoiceSupport());

  // Conversation State Machine
  const [state, setState] = useState<ConversationState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Question & Evaluation Tracking
  const [activeQuestion, setActiveQuestion] = useState<AdaptiveQuestion | null>(initialQuestion);
  const [evaluatedAnswers, setEvaluatedAnswers] = useState<EvaluatedAnswerRecord[]>(initialEvaluations);
  const [transcripts, setTranscripts] = useState<LiveVoiceTranscriptItem[]>([]);
  const [agentActivities, setAgentActivities] = useState<AgentActivityItem[]>([]);

  // Real-time candidate speech buffers
  const [rawTranscript, setRawTranscript] = useState<string>('');
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [corrections, setCorrections] = useState<TechnicalCorrection[]>([]);
  const [isEditingTranscript, setIsEditingTranscript] = useState<boolean>(false);

  // Audio Reactivity (0.0 to 1.0)
  const [audioVolume, setAudioVolume] = useState<number>(0.0);

  // Refs for audio, recognition, and turn-taking timers
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const isListeningRef = useRef<boolean>(false);
  const isSpeakingRef = useRef<boolean>(false);
  const activeUtteranceCancelRef = useRef<(() => void) | null>(null);
  const accumulatedRawFinalRef = useRef<string>('');
  const accumulatedFinalRef = useRef<string>('');
  const interimTranscriptRef = useRef<string>('');
  const correctionsRef = useRef<TechnicalCorrection[]>([]);
  const isManuallyEditedRef = useRef<boolean>(false);
  const isEditingTranscriptRef = useRef<boolean>(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isProcessingRef = useRef<boolean>(false);

  // Keep state and callback refs in sync without updating during render
  const stateRef = useRef<ConversationState>(state);
  const activeQuestionRef = useRef<AdaptiveQuestion | null>(activeQuestion);
  const evaluatedAnswersRef = useRef<EvaluatedAnswerRecord[]>(evaluatedAnswers);
  const processCandidateAnswerRef = useRef<(answer: string) => void>(() => {});
  const startListeningRef = useRef<() => void>(() => {});

  useEffect(() => {
    stateRef.current = state;
    activeQuestionRef.current = activeQuestion;
    evaluatedAnswersRef.current = evaluatedAnswers;
  }, [state, activeQuestion, evaluatedAnswers]);

  // -------------------------------------------------------------
  // 1. Audio Interlocking: Stop Microphone Recognition
  // -------------------------------------------------------------
  const haltListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors if already stopped
      }
    }
    isListeningRef.current = false;
  }, []);

  // -------------------------------------------------------------
  // 2. Audio Interlocking: Stop Speech Synthesis
  // -------------------------------------------------------------
  const haltSpeaking = useCallback(() => {
    if (activeUtteranceCancelRef.current) {
      activeUtteranceCancelRef.current();
      activeUtteranceCancelRef.current = null;
    }
    stopSpeaking();
    isSpeakingRef.current = false;
  }, []);

  // -------------------------------------------------------------
  // 3. Audio Cleanup (teardown streams and Web Audio)
  // -------------------------------------------------------------
  const cleanupAudio = useCallback(() => {
    haltSpeaking();
    haltListening();

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close().catch(() => {});
      } catch {
        // ignore
      }
      audioContextRef.current = null;
    }

    setAudioVolume(0.0);
  }, [haltSpeaking, haltListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  // Handle browser tab visibility changes without losing drafts or playing in background
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab moved to background:
        // 1. Immediately halt synthesis so assistant speech doesn't play in background
        if (isSpeakingRef.current) {
          haltSpeaking();
        }
        // 2. Halt microphone recognition & clear silence timer to avoid capturing background audio or auto-submitting
        if (isListeningRef.current || stateRef.current === 'listening') {
          haltListening();
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          // Preserve draft answer in state and pause session
          setState('paused');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [haltSpeaking, haltListening]);

  // -------------------------------------------------------------
  // 4. Web Audio Metering for Centered Orb Reactivity
  // -------------------------------------------------------------
  const initAudioMetering = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
    try {
      if (!micStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStreamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
      }

      // Start volume extraction loop
      const bufferLength = analyserRef.current?.frequencyBinCount || 32;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = Math.min(1.0, Math.max(0.0, avg / 128));

        // When listening: use mic volume.
        // When speaking: synthesize pulsating wave.
        if (stateRef.current === 'listening') {
          setAudioVolume(normalized);
        } else if (stateRef.current === 'speaking') {
          const time = Date.now() / 250;
          const syntheticWave = 0.35 + Math.sin(time) * 0.25 + Math.sin(time * 2.3) * 0.15;
          setAudioVolume(Math.min(1.0, Math.max(0.0, syntheticWave)));
        } else {
          setAudioVolume(0.0);
        }

        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };

      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      }
    } catch {
      // If mic streaming fails, fallback to CSS animated pulses
      setAudioVolume(0.0);
    }
  }, []);

  // -------------------------------------------------------------
  // 5. Speak Interviewer Question Aloud (SpeechSynthesis)
  // -------------------------------------------------------------
  const speakInterviewerPrompt = useCallback(
    (textToSpeak: string, onDone?: () => void) => {
      // 1. Strictly halt listening BEFORE speaking so mic never hears assistant!
      haltListening();

      if (isMuted || !support.synthesis) {
        setState('speaking');
        setTimeout(() => {
          setState('listening');
          onDone?.();
        }, 1200);
        return;
      }

      const cleaned = cleanSpokenText(textToSpeak);
      if (!cleaned) {
        onDone?.();
        return;
      }

      setState('speaking');
      isSpeakingRef.current = true;

      const speech = speakText(cleaned, {
        rate: 0.98,
        pitch: 1.0,
        onStart: () => {
          isSpeakingRef.current = true;
          setState('speaking');
        },
        onEnd: () => {
          isSpeakingRef.current = false;
          // Acoustic settling delay (200ms) before opening mic to prevent capturing own echo
          setTimeout(() => {
            if (stateRef.current === 'speaking') {
              setState('listening');
              onDone?.();
            }
          }, 200);
        },
        onError: () => {
          isSpeakingRef.current = false;
          setTimeout(() => {
            if (stateRef.current === 'speaking') {
              setState('listening');
              onDone?.();
            }
          }, 200);
        },
      });

      activeUtteranceCancelRef.current = speech.cancel;
    },
    [isMuted, support.synthesis, haltListening]
  );

  // -------------------------------------------------------------
  // 6. Start Microphone SpeechRecognition
  // -------------------------------------------------------------
  const startListening = useCallback(() => {
    if (!support.recognition) {
      setState('error');
      setErrorMessage('Browser Speech Recognition is not supported. Please use Chrome, Edge, or Text Mode.');
      return;
    }

    // Stop speaking before opening mic
    haltSpeaking();

    // Check if permission needed
    setState('requesting_permission');
    setErrorMessage(null);

    try {
      const SpeechRecognitionAPI =
        typeof window !== 'undefined'
          ? window.SpeechRecognition || window.webkitSpeechRecognition
          : null;

      if (!SpeechRecognitionAPI) {
        setState('error');
        setErrorMessage('SpeechRecognition API is not available.');
        return;
      }

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

      // Initialize audio volume metering for Orb
      initAudioMetering().catch(() => {});

      recognition.onstart = () => {
        isListeningRef.current = true;
        setState('listening');
      };

      recognition.onresult = (event) => {
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';

          if (item.isFinal) {
            const baseRaw = accumulatedRawFinalRef.current;
            const updatedRaw = baseRaw ? `${baseRaw} ${text.trim()}` : text.trim();
            accumulatedRawFinalRef.current = updatedRaw;
            setRawTranscript(updatedRaw);

            // Safe technical normalization layer applied strictly to finalized transcripts
            const normalized = normalizeTechnicalTranscript(updatedRaw);
            accumulatedFinalRef.current = normalized.correctedTranscript;
            setCurrentTranscript(normalized.correctedTranscript);
            setCorrections(normalized.corrections);
            correctionsRef.current = normalized.corrections;
          } else {
            // Interim speech: kept raw, never normalized
            interim += (interim ? ' ' : '') + text;
          }
        }

        setInterimTranscript(interim);
        interimTranscriptRef.current = interim;

        // Turn-taking silence timer:
        // 1. Do not auto-submit if candidate is actively editing their transcript
        if (isEditingTranscriptRef.current) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          return;
        }

        // 2. Active speech detection: Candidate is actively uttering words/syllables
        // Immediately cancel silence timer so we NEVER interrupt the candidate!
        if (interim.trim().length > 0) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          return;
        }

        // 3. Dynamic Turn-Taking: Candidate has completed an utterance (interim is empty)
        // Auto-submit only when candidate has spoken a substantive answer (>= 20 chars)
        const finalizedAnswer = accumulatedFinalRef.current.trim();

        if (finalizedAnswer.length >= 20 && !isProcessingRef.current) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }

          // Dynamic silence threshold based on completion cues:
          // - Ends with terminal punctuation (. ? !) and substantive (>= 35 chars): 2.0s responsive turn-taking
          // - Ends mid-sentence without terminal punctuation (thoughtful pause): 2.8s breathing room
          const hasTerminalPunctuation = /[.?!]$/.test(finalizedAnswer);
          const silenceDelay = hasTerminalPunctuation && finalizedAnswer.length >= 35 ? 2000 : 2800;

          silenceTimerRef.current = setTimeout(() => {
            if (stateRef.current === 'listening' && !isProcessingRef.current && !isEditingTranscriptRef.current) {
              const currentFinal = accumulatedFinalRef.current.trim();
              if (currentFinal.length >= 20) {
                processCandidateAnswerRef.current(currentFinal);
              }
            }
          }, silenceDelay);
        }
      };

      recognition.onerror = (event) => {
        const errType = (event.error as SpeechErrorType) || 'unknown';

        if (errType === 'not-allowed' || errType === 'service-not-allowed') {
          setState('error');
          setErrorMessage(getFriendlyErrorMessage('not-allowed'));
          isListeningRef.current = false;
          return;
        }

        if (errType === 'network') {
          setState('error');
          setErrorMessage(getFriendlyErrorMessage('network'));
          isListeningRef.current = false;
          return;
        }

        if (errType === 'no-speech' || errType === 'aborted') {
          // Expected during pauses or when aborted manually
          return;
        }

        // For other minor errors, transition to idle or keep listening
        isListeningRef.current = false;
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        // If still in listening state and not processing or speaking, keep listening alive
        if (stateRef.current === 'listening' && !isProcessingRef.current && !isSpeakingRef.current) {
          try {
            recognition.start();
          } catch {
            // ignore
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setState('error');
      setErrorMessage(`Failed to start microphone: ${String(err)}`);
    }
  }, [support.recognition, haltSpeaking, initAudioMetering]);

  // -------------------------------------------------------------
  // 7. Process Candidate Answer with Groq + RAG + SQLite
  // -------------------------------------------------------------
  const processCandidateAnswer = useCallback(
    async (answerToProcess: string) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      // 1. Immediately halt listening and clear silence timer
      haltListening();
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      setState('processing_answer');
      setInterimTranscript('');

      const question = activeQuestionRef.current;
      if (!question) {
        isProcessingRef.current = false;
        setState('listening');
        return;
      }

      // Add candidate turn to transcript history with audit trail
      const candidateTurnId = `cand-${Date.now()}`;
      const rawText = accumulatedRawFinalRef.current || answerToProcess;
      const appliedCorrections = [...correctionsRef.current];
      const isManuallyEdited = isManuallyEditedRef.current;

      setTranscripts((prev) => [
        ...prev,
        {
          id: candidateTurnId,
          sender: 'candidate',
          text: answerToProcess,
          rawText: rawText !== answerToProcess ? rawText : undefined,
          corrections: appliedCorrections.length > 0 ? appliedCorrections : undefined,
          isManuallyEdited: isManuallyEdited || undefined,
          stage: question.stage,
          timestamp: Date.now(),
        },
      ]);

      try {
        // 2. Submit to existing FastAPI / Groq evaluation endpoint
        const evalResponse = await evaluateInterviewAnswer({
          question_id: question.id,
          question_text: question.question,
          target_skill: question.target_skill,
          rubric: question.rubric || 'Evaluate technical correctness, problem solving, relevance, and communication on a 1.0-5.0 scale.',
          candidate_answer: answerToProcess,
        });

        const newRecord: EvaluatedAnswerRecord = {
          question,
          answerText: answerToProcess,
          evaluation: evalResponse,
          timestamp: new Date().toISOString(),
        };

        // 3. Update evaluation records & notify parent
        const updatedEvaluated = [...evaluatedAnswersRef.current, newRecord];
        setEvaluatedAnswers(updatedEvaluated);
        onTurnEvaluated(newRecord);

        // Update candidate transcript item with evaluation
        setTranscripts((prev) =>
          prev.map((item) =>
            item.id === candidateTurnId
              ? {
                  ...item,
                  evaluation: evalResponse,
                }
              : item
          )
        );

        // 4. Persist in SQLite
        if (sessionId) {
          saveSessionAnswer(sessionId, newRecord).catch(() => {});
        }

        // Reset candidate transcript buffers for the next turn
        accumulatedRawFinalRef.current = '';
        accumulatedFinalRef.current = '';
        correctionsRef.current = [];
        isManuallyEditedRef.current = false;
        setRawTranscript('');
        setCurrentTranscript('');
        setCorrections([]);
        setIsEditingTranscript(false);
        isEditingTranscriptRef.current = false;

        // 5. Check if budget is met
        if (updatedEvaluated.length >= maxBudget) {
          const closingText = "Thank you! You've completed all interview questions. Preparing your final assessment report now.";
          setTranscripts((prev) => [
            ...prev,
            {
              id: `int-${Date.now()}`,
              sender: 'interviewer',
              text: closingText,
              stage: 'completed',
              timestamp: Date.now(),
            },
          ]);

          speakInterviewerPrompt(closingText, () => {
            setState('completed');
            isProcessingRef.current = false;
            onInterviewCompleted();
          });
          return;
        }

        // 6. Fetch Next Adaptive Question from Groq
        const historyPayload = updatedEvaluated.map((item) => ({
          question_id: item.question.id,
          question_text: item.question.question,
          target_skill: item.question.target_skill,
          candidate_answer: item.answerText,
          composite_score: item.evaluation.composite_score,
          is_follow_up: item.question.is_follow_up,
          stage: item.question.stage,
          acknowledgement: item.question.acknowledgement,
        }));

        const unaddressed = (analysisResult?.unmatched_requirements || [])
          .map((r) => r.requirement)
          .filter((req) => !updatedEvaluated.some((a) => a.question.target_skill.includes(req)));

        const nextRes = await getNextInterviewQuestion({
          session_id: sessionId || undefined,
          resume_text: (analysisResult as unknown as { resume_text?: string })?.resume_text || undefined,
          interview_history: historyPayload,
          current_question: question,
          last_answer: answerToProcess,
          last_evaluation: evalResponse,
          remaining_budget: Math.max(0, maxBudget - updatedEvaluated.length),
          max_budget: maxBudget,
          unaddressed_requirements: unaddressed,
          candidate_name: analysisResult?.candidate_name,
          candidate_projects: (analysisResult?.projects || []).map((p) => p.name),
          job_description:
            analysisResult?.job_requirements && analysisResult.job_requirements.length > 0
              ? `Requirements:\n${analysisResult.job_requirements.join('\n')}`
              : undefined,
        });

        if (nextRes.agent_activities && nextRes.agent_activities.length > 0) {
          setAgentActivities((prev) => [...prev, ...nextRes.agent_activities!]);
        }

        if (nextRes.is_completed || !nextRes.has_next_question || !nextRes.next_question) {
          const wrapUpText = "That concludes our interview questions. Thank you for your thorough responses.";
          setTranscripts((prev) => [
            ...prev,
            {
              id: `int-${Date.now()}`,
              sender: 'interviewer',
              text: wrapUpText,
              stage: 'completed',
              timestamp: Date.now(),
            },
          ]);
          speakInterviewerPrompt(wrapUpText, () => {
            setState('completed');
            isProcessingRef.current = false;
            onInterviewCompleted();
          });
          return;
        }

        const nextQuestion = nextRes.next_question;
        setActiveQuestion(nextQuestion);

        // Formulate spoken prompt (acknowledgement + question)
        const promptToSpeak = nextQuestion.acknowledgement
          ? `${nextQuestion.acknowledgement} ${nextQuestion.question}`
          : nextQuestion.question;

        setTranscripts((prev) => [
          ...prev,
          {
            id: `int-${Date.now()}`,
            sender: 'interviewer',
            text: promptToSpeak,
            stage: nextQuestion.stage,
            timestamp: Date.now(),
          },
        ]);

        // 7. Speak question aloud, then resume listening automatically
        speakInterviewerPrompt(promptToSpeak, () => {
          isProcessingRef.current = false;
          startListeningRef.current();
        });
      } catch (err) {
        setState('error');
        setErrorMessage(`Evaluation error: ${String(err)}. You can switch to Text Mode to continue.`);
        isProcessingRef.current = false;
      }
    },
    [
      haltListening,
      onTurnEvaluated,
      sessionId,
      maxBudget,
      analysisResult,
      speakInterviewerPrompt,
      onInterviewCompleted,
    ]
  );

  useEffect(() => {
    startListeningRef.current = startListening;
    processCandidateAnswerRef.current = processCandidateAnswer;
  }, [startListening, processCandidateAnswer]);

  // -------------------------------------------------------------
  // 8. Session Start / First Question Vocalization
  // -------------------------------------------------------------
  const startSession = useCallback(
    (questionToStart?: AdaptiveQuestion | null) => {
      const q = questionToStart || activeQuestion;
      if (!q) {
        startListeningRef.current();
        return;
      }

      setActiveQuestion(q);
      const textToSpeak = q.acknowledgement ? `${q.acknowledgement} ${q.question}` : q.question;

      setTranscripts((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            id: `int-initial-${Date.now()}`,
            sender: 'interviewer',
            text: textToSpeak,
            stage: q.stage,
            timestamp: Date.now(),
          },
        ];
      });

      speakInterviewerPrompt(textToSpeak, () => {
        startListeningRef.current();
      });
    },
    [activeQuestion, speakInterviewerPrompt]
  );

  // -------------------------------------------------------------
  // 9. Controls: Pause, Resume, Mute, Repeat Question, Submit Manual
  // -------------------------------------------------------------
  const pauseListening = useCallback(() => {
    haltListening();
    setState('paused');
  }, [haltListening]);

  const resumeListening = useCallback(() => {
    startListening();
  }, [startListening]);

  const togglePause = useCallback(() => {
    if (stateRef.current === 'listening') {
      pauseListening();
    } else if (stateRef.current === 'paused') {
      resumeListening();
    }
  }, [pauseListening, resumeListening]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        haltSpeaking();
      }
      return next;
    });
  }, [haltSpeaking]);

  const repeatQuestion = useCallback(() => {
    if (!activeQuestion) return;
    haltListening();
    const textToSpeak = activeQuestion.question;
    speakInterviewerPrompt(textToSpeak, () => {
      startListeningRef.current();
    });
  }, [activeQuestion, haltListening, speakInterviewerPrompt]);

  const submitCurrentTranscript = useCallback(() => {
    haltListening();
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Merge any pending interim text with accumulated finalized speech so trailing words aren't lost
    const rawBase = accumulatedRawFinalRef.current.trim();
    const interimPending = interimTranscriptRef.current.trim();
    const fullRaw = interimPending
      ? (rawBase ? `${rawBase} ${interimPending}` : interimPending)
      : rawBase;

    let candidateAnswer = accumulatedFinalRef.current.trim();
    if (interimPending && fullRaw) {
      const normalized = normalizeTechnicalTranscript(fullRaw);
      candidateAnswer = normalized.correctedTranscript;
      accumulatedFinalRef.current = candidateAnswer;
      accumulatedRawFinalRef.current = fullRaw;
      setRawTranscript(fullRaw);
      setCurrentTranscript(candidateAnswer);
      setCorrections(normalized.corrections);
      correctionsRef.current = normalized.corrections;
    }

    setInterimTranscript('');
    interimTranscriptRef.current = '';

    // Candidate deliberately clicked "Done Speaking"; accept if >= 10 chars
    if (candidateAnswer.length >= 10 && !isProcessingRef.current) {
      processCandidateAnswerRef.current(candidateAnswer);
    }
  }, [haltListening]);

  const setCandidateTranscript = useCallback((newText: string) => {
    accumulatedFinalRef.current = newText;
    setCurrentTranscript(newText);
    isManuallyEditedRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const setIsEditing = useCallback((editing: boolean) => {
    setIsEditingTranscript(editing);
    isEditingTranscriptRef.current = editing;
    if (editing && silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  return {
    state,
    isListening: state === 'listening',
    isSpeaking: state === 'speaking',
    isProcessing: state === 'processing_answer',
    isPaused: state === 'paused',
    isError: state === 'error',
    isCompleted: state === 'completed',
    isMuted,
    errorMessage,
    support,
    activeQuestion,
    evaluatedAnswers,
    transcripts,
    rawTranscript,
    currentTranscript,
    interimTranscript,
    corrections,
    hasCorrections: corrections.length > 0,
    isEditingTranscript,
    audioVolume,
    agentActivities,
    lastAgentActivity: agentActivities.length > 0 ? agentActivities[agentActivities.length - 1] : null,
    // Actions
    startSession,
    startListening,
    pauseListening,
    resumeListening,
    togglePause,
    toggleMute,
    repeatQuestion,
    submitCurrentTranscript,
    setCandidateTranscript,
    setIsEditing,
    cleanupAudio,
  };
}
