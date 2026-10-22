'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  OrbState,
  RealtimeConnectionStatus,
  RealtimeTranscriptItem,
} from './realtime-types';
import {
  createRealtimeInterviewSession,
  evaluateInterviewAnswer,
  RealtimeSessionApiResponse,
} from '@/lib/api';
import {
  EvaluatedAnswerRecord,
  RealResumeAnalysisResponse,
} from '@/lib/assessment-types';

export interface UseRealtimeVoiceProps {
  sessionId?: string | null;
  analysisResult?: RealResumeAnalysisResponse | null;
  maxBudget?: number;
  onTurnEvaluated: (record: EvaluatedAnswerRecord) => void;
  onInterviewCompleted: () => void;
}

export function useRealtimeVoice({
  sessionId,
  analysisResult,
  maxBudget = 4,
  onTurnEvaluated,
  onInterviewCompleted,
}: UseRealtimeVoiceProps) {
  // Connection and Orb States
  const [connectionStatus, setConnectionStatus] =
    useState<RealtimeConnectionStatus>('disconnected');
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [audioVolume, setAudioVolume] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Credential setup state
  const [requiresCredentialSetup, setRequiresCredentialSetup] = useState<boolean>(false);
  const [missingCredentialInfo, setMissingCredentialInfo] = useState<{
    provider: string;
    env_variable: string;
    message: string;
  } | null>(null);

  // Conversation & Subtitle State
  const [transcripts, setTranscripts] = useState<RealtimeTranscriptItem[]>([]);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [activeStage, setActiveStage] = useState<string>('Stage A: Warm-Up');
  const [turnCount, setTurnCount] = useState<number>(0);

  // References to WebRTC & Audio Contexts
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Tracking current interview turn state
  const lastQuestionTextRef = useRef<string>('To kick things off, could you tell me a little about yourself and your engineering background?');
  const lastQuestionIdRef = useRef<string>('turn_1');
  const isEvaluatingTurnRef = useRef<boolean>(false);
  const currentTurnCountRef = useRef<number>(0);

  // 1. Audio Analysis Loop for Driving the Reactive Orb Animation
  const startAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        // Normalize to 0.0 - 1.0 range
        const normalized = Math.min(1.0, avg / 128);
        setAudioVolume(normalized);

        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.warn('Audio analysis initialization skipped:', err);
    }
  }, []);

  // 2. Clean Audio Teardown
  const stopAudio = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (audioElementRef.current) {
      audioElementRef.current.srcObject = null;
      audioElementRef.current = null;
    }
    dataChannelRef.current = null;
    setAudioVolume(0);
    setOrbState('idle');
  }, []);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  // 3. Evaluate completed candidate turn in background via HireLens API
  const handleCandidateTurnCompleted = useCallback(
    async (transcribedText: string) => {
      const trimmed = transcribedText.trim();
      if (!trimmed || trimmed.length < 10) return;
      if (isEvaluatingTurnRef.current) return;

      isEvaluatingTurnRef.current = true;
      const turnNum = currentTurnCountRef.current + 1;
      currentTurnCountRef.current = turnNum;
      setTurnCount(turnNum);

      const candidateItem: RealtimeTranscriptItem = {
        id: `cand_${Date.now()}`,
        role: 'candidate',
        text: trimmed,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isFinal: true,
      };

      setTranscripts((prev) => [...prev, candidateItem]);

      try {
        const questionText = lastQuestionTextRef.current;
        const targetSkill =
          turnNum === 1
            ? 'Engineering Background & Introduction'
            : turnNum === 2
            ? 'Project Architecture & Context'
            : turnNum === 3
            ? 'Project Technical Trade-Offs'
            : 'Production Depth & Resilience';

        const evalResponse = await evaluateInterviewAnswer({
          question_id: lastQuestionIdRef.current,
          question_text: questionText,
          target_skill: targetSkill,
          rubric: 'Evaluates technical correctness, reasoning, relevance, and clear articulation of software implementation.',
          candidate_answer: trimmed,
        });

        const record: EvaluatedAnswerRecord = {
          question: {
            id: lastQuestionIdRef.current,
            question: questionText,
            target_skill: targetSkill,
            reason: `Realtime voice interview turn ${turnNum}`,
            difficulty: turnNum <= 2 ? 'foundational' : 'intermediate',
            rubric: 'Technical evaluation rubric',
            is_follow_up: turnNum > 2,
            stage:
              turnNum === 1
                ? 'warm_up'
                : turnNum === 2
                ? 'project_overview'
                : turnNum === 3
                ? 'project_deep_dive'
                : 'technical_depth',
          },
          answerText: trimmed,
          evaluation: evalResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        onTurnEvaluated(record);

        // Update transcript item with evaluation
        setTranscripts((prev) =>
          prev.map((item) =>
            item.id === candidateItem.id ? { ...item, evaluation: evalResponse } : item
          )
        );

        // Update active stage for next turn
        if (turnNum === 1) setActiveStage('Stage B: Project Overview');
        else if (turnNum === 2) setActiveStage('Stage C: Project Deep Dive');
        else if (turnNum === 3) setActiveStage('Stage D: Topic Transition');
        else if (turnNum >= maxBudget) {
          setActiveStage('Stage F: Wrap-Up');
          // Signal completion if budget exhausted
          setTimeout(() => {
            onInterviewCompleted();
          }, 4000);
        }
      } catch (err) {
        console.warn('Background evaluation of voice turn failed:', err);
      } finally {
        isEvaluatingTurnRef.current = false;
      }
    },
    [maxBudget, onTurnEvaluated, onInterviewCompleted]
  );

  // 4. Handle Incoming OpenAI Realtime Events over Data Channel
  const handleRealtimeEvent = useCallback(
    (event: Record<string, unknown>) => {
      const type = event.type as string;

      switch (type) {
        // Candidate speech started (barge-in / interruption)
        case 'input_audio_buffer.speech_started':
          setOrbState('listening');
          setCurrentSubtitle('Listening...');
          break;

        // Candidate finished speaking
        case 'input_audio_buffer.speech_stopped':
          setOrbState('thinking');
          setCurrentSubtitle('Processing response...');
          break;

        // Candidate speech Whisper transcription completed
        case 'conversation.item.input_audio_transcription.completed': {
          const transcript = (event.transcript as string) || '';
          if (transcript) {
            handleCandidateTurnCompleted(transcript);
          }
          break;
        }

        // Assistant streaming delta response
        case 'response.audio_transcript.delta': {
          setOrbState('speaking');
          const delta = (event.delta as string) || '';
          setCurrentSubtitle((prev) => (prev.startsWith('Listening') || prev.startsWith('Processing') ? delta : prev + delta));
          break;
        }

        // Assistant finished speaking question or acknowledgement
        case 'response.audio_transcript.done': {
          setOrbState('idle');
          const fullTranscript = (event.transcript as string) || '';
          if (fullTranscript) {
            lastQuestionTextRef.current = fullTranscript;
            lastQuestionIdRef.current = `turn_${currentTurnCountRef.current + 1}`;
            setTranscripts((prev) => [
              ...prev,
              {
                id: `asst_${Date.now()}`,
                role: 'assistant',
                text: fullTranscript,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isFinal: true,
                stage: activeStage,
              },
            ]);
            setCurrentSubtitle(fullTranscript);
          }
          break;
        }

        case 'response.done':
          setOrbState('idle');
          break;

        case 'error': {
          const errorObj = event.error as Record<string, unknown> | undefined;
          const msg = (errorObj?.message as string) || 'OpenAI Realtime error occurred.';
          console.warn('Realtime event error:', msg);
          setErrorMessage(msg);
          break;
        }

        default:
          break;
      }
    },
    [activeStage, handleCandidateTurnCompleted]
  );

  // 5. Connect to Live WebRTC Session
  const connect = useCallback(async () => {
    setConnectionStatus('connecting');
    setErrorMessage(null);
    setRequiresCredentialSetup(false);

    try {
      // Step A: Request session token from backend
      const sessionPayload = {
        session_id: sessionId,
        candidate_name: analysisResult?.candidate_name,
        candidate_title: analysisResult?.candidate_title,
        candidate_projects: (analysisResult?.projects || []).map((p) => p.name),
        top_project_name: analysisResult?.projects?.[0]?.name,
        top_project_description: analysisResult?.projects?.[0]?.description,
        job_description:
          analysisResult?.job_requirements && analysisResult.job_requirements.length > 0
            ? analysisResult.job_requirements.join('\n')
            : undefined,
        max_budget: maxBudget,
        remaining_budget: Math.max(1, maxBudget - turnCount),
      };

      const sessionRes: RealtimeSessionApiResponse = await createRealtimeInterviewSession(sessionPayload);

      // Check if credentials are missing
      if (sessionRes.status === 'missing_credentials') {
        setConnectionStatus('error');
        setRequiresCredentialSetup(true);
        setMissingCredentialInfo({
          provider: sessionRes.provider || 'openai',
          env_variable: sessionRes.env_variable || 'OPENAI_API_KEY',
          message: sessionRes.message || 'OPENAI_API_KEY is not configured in backend/.env.',
        });
        return;
      }

      if (sessionRes.status !== 'active' || !sessionRes.client_secret) {
        throw new Error(sessionRes.message || 'Failed to obtain OpenAI Realtime ephemeral key.');
      }

      const ephemeralKey = sessionRes.client_secret;

      // Step B: Acquire user microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // Hook up Web Audio Analyser to drive the Orb animation
      startAudioAnalysis(stream);

      // Step C: Setup WebRTC Peer Connection
      const pc = new RTCPeerConnection();
      peerConnectionRef.current = pc;

      // Setup audio element for remote assistant voice playback
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioElementRef.current = audioEl;

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // Add local microphone audio track
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Step D: Setup Data Channel for Realtime Events
      const dc = pc.createDataChannel('oai-events');
      dataChannelRef.current = dc;

      dc.addEventListener('message', (e) => {
        try {
          const parsed = JSON.parse(e.data);
          handleRealtimeEvent(parsed);
        } catch {
          // ignore non-json
        }
      });

      dc.addEventListener('open', () => {
        setConnectionStatus('connected');
        setOrbState('idle');
        setCurrentSubtitle('Connected. Listening for conversation...');
      });

      dc.addEventListener('close', () => {
        setConnectionStatus('disconnected');
      });

      // Step E: Create SDP Offer and exchange with OpenAI
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const sdpUrl = `https://api.openai.com/v1/realtime?model=${sessionRes.model || 'gpt-4o-realtime-preview-2024-12-17'}`;
      const sdpResponse = await fetch(sdpUrl, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      });

      if (!sdpResponse.ok) {
        const errText = await sdpResponse.text();
        throw new Error(`OpenAI Realtime WebRTC connection failed (${sdpResponse.status}): ${errText}`);
      }

      const answerSdp = await sdpResponse.text();
      await pc.setRemoteDescription({
        type: 'answer',
        sdp: answerSdp,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'WebRTC connection error occurred.';
      setErrorMessage(msg);
      setConnectionStatus('error');
      stopAudio();
    }
  }, [sessionId, analysisResult, maxBudget, turnCount, startAudioAnalysis, handleRealtimeEvent, stopAudio]);

  // 6. Interactive Voice Simulator Mode (For offline testing, CI, or prior to setting API key)
  const startSimulationMode = useCallback(async () => {
    setConnectionStatus('connecting');
    setRequiresCredentialSetup(false);
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      if (stream) {
        localStreamRef.current = stream;
        startAudioAnalysis(stream);
      }

      setConnectionStatus('connected');
      setOrbState('speaking');
      const intro = `Welcome! I'm your HireLens Voice Interviewer. Let's start with a warm-up: could you tell me a little about yourself and what you've been building recently?`;
      setCurrentSubtitle(intro);
      lastQuestionTextRef.current = intro;

      setTimeout(() => {
        setOrbState('listening');
        setCurrentSubtitle('Listening... Speak naturally.');
      }, 3500);
    } catch {
      setConnectionStatus('connected');
      setOrbState('idle');
    }
  }, [startAudioAnalysis]);

  // 7. Interrupt Assistant Speech (Barge-In)
  const interruptAssistant = useCallback(() => {
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      try {
        dataChannelRef.current.send(
          JSON.stringify({
            type: 'response.cancel',
          })
        );
      } catch {
        // ignore
      }
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }
    setOrbState('listening');
    setCurrentSubtitle('Listening...');
  }, []);

  // 8. Toggle Microphone Mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (localStreamRef.current) {
        localStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = !next;
        });
      }
      return next;
    });
  }, []);

  return {
    connectionStatus,
    orbState,
    audioVolume,
    isMuted,
    transcripts,
    currentSubtitle,
    activeStage,
    turnCount,
    errorMessage,
    requiresCredentialSetup,
    missingCredentialInfo,
    // Actions
    connect,
    disconnect: stopAudio,
    interruptAssistant,
    toggleMute,
    startSimulationMode,
    simulateCandidateAnswer: handleCandidateTurnCompleted,
  };
}
