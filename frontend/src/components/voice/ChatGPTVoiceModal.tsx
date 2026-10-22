'use client';

/**
 * ChatGPTVoiceModal
 *
 * Immersive, ChatGPT-style live voice interface for HireLens technical interviews:
 * - Centered, large animated Orb reacting to candidate microphone and interviewer speech
 * - Continuous conversation without manual Submit Answer clicks
 * - Powered by browser SpeechRecognition + SpeechSynthesis with Groq adaptive intelligence
 * - Zero third-party paid voice APIs; uses existing GROQ_API_KEY on the backend
 * - Minimalist floating controls: Mute, Pause/Resume, Repeat Question, Done Speaking, Text Mode, End
 * - Collapsible slide-out transcript drawer with live 4-criteria Groq scorecards
 */

import React, { useState, useEffect } from 'react';
import {
  Mic,
  X,
  Keyboard,
  Sparkles,
  AlertCircle,
  MessageSquare,
  Volume2,
  VolumeX,
  RotateCcw,
  Pause,
  Play,
  Send,
  Edit3,
  Check,
  Undo2,
} from 'lucide-react';
import {
  AdaptiveQuestion,
  EvaluatedAnswerRecord,
  RealResumeAnalysisResponse,
} from '@/lib/assessment-types';
import { useLiveVoiceInterview } from '@/lib/speech/useLiveVoiceInterview';
import { ConversationState } from '@/lib/speech/speech-types';

interface ChatGPTVoiceModalProps {
  sessionId?: string | null;
  analysisResult?: RealResumeAnalysisResponse | null;
  initialQuestion?: AdaptiveQuestion | null;
  initialEvaluations?: EvaluatedAnswerRecord[];
  maxBudget?: number;
  onTurnEvaluated: (record: EvaluatedAnswerRecord) => void;
  onInterviewCompleted: () => void;
  onSwitchToText: (partialTranscript?: string) => void;
  onClose: () => void;
}

function getStateBadge(state: ConversationState): { label: string; bg: string; dot: string; text: string } {
  switch (state) {
    case 'idle':
      return {
        label: 'Ready',
        bg: 'bg-white/10 border-white/15',
        dot: 'bg-white/60',
        text: 'text-white/80',
      };
    case 'requesting_permission':
      return {
        label: 'Requesting Mic Access',
        bg: 'bg-amber-500/10 border-amber-500/20',
        dot: 'bg-amber-400 animate-ping',
        text: 'text-amber-300',
      };
    case 'listening':
      return {
        label: 'Listening to your answer...',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        dot: 'bg-emerald-400 animate-pulse',
        text: 'text-emerald-300',
      };
    case 'processing_answer':
      return {
        label: 'Evaluating with Groq & RAG...',
        bg: 'bg-purple-500/10 border-purple-500/20',
        dot: 'bg-purple-400 animate-spin',
        text: 'text-purple-300',
      };
    case 'speaking':
      return {
        label: 'Interviewer Speaking',
        bg: 'bg-[#F43F5E]/10 border-[#F43F5E]/20',
        dot: 'bg-[#F43F5E] animate-pulse',
        text: 'text-[#FDA4AF]',
      };
    case 'paused':
      return {
        label: 'Listening Paused',
        bg: 'bg-amber-500/10 border-amber-500/20',
        dot: 'bg-amber-400',
        text: 'text-amber-300',
      };
    case 'error':
      return {
        label: 'Audio Issue',
        bg: 'bg-red-500/10 border-red-500/20',
        dot: 'bg-red-400',
        text: 'text-red-300',
      };
    case 'completed':
      return {
        label: 'Interview Completed',
        bg: 'bg-emerald-500/10 border-emerald-500/20',
        dot: 'bg-emerald-400',
        text: 'text-emerald-300',
      };
    default:
      return {
        label: 'Live Voice',
        bg: 'bg-white/10 border-white/15',
        dot: 'bg-white/60',
        text: 'text-white/80',
      };
  }
}

export function ChatGPTVoiceModal({
  sessionId,
  analysisResult,
  initialQuestion,
  initialEvaluations = [],
  maxBudget = 4,
  onTurnEvaluated,
  onInterviewCompleted,
  onSwitchToText,
  onClose,
}: ChatGPTVoiceModalProps) {
  const [showDrawer, setShowDrawer] = useState<boolean>(false);
  const [isEditingInline, setIsEditingInline] = useState<boolean>(false);
  const [editText, setEditText] = useState<string>('');

  const voice = useLiveVoiceInterview({
    sessionId,
    analysisResult,
    initialQuestion,
    initialEvaluations,
    maxBudget,
    onTurnEvaluated,
    onInterviewCompleted,
  });

  // Start interview session and vocalize initial question on mount
  useEffect(() => {
    voice.startSession(initialQuestion);
    return () => {
      voice.cleanupAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const badge = getStateBadge(voice.state);
  const currentTurn = voice.evaluatedAnswers.length + 1;

  const handleStartEdit = () => {
    setEditText(voice.currentTranscript);
    setIsEditingInline(true);
    voice.setIsEditing(true);
  };

  const handleSaveEdit = () => {
    voice.setCandidateTranscript(editText);
    setIsEditingInline(false);
    voice.setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditText(voice.currentTranscript);
    setIsEditingInline(false);
    voice.setIsEditing(false);
  };

  const handleRestoreOriginal = () => {
    if (voice.rawTranscript) {
      setEditText(voice.rawTranscript);
      voice.setCandidateTranscript(voice.rawTranscript);
    }
  };

  // Dynamic Orb scaling based on Web Audio volume (0.0 to 1.0)
  const dynamicScale = 1.0 + voice.audioVolume * 0.22;
  const ringScale1 = 1.0 + voice.audioVolume * 0.42;
  const ringScale2 = 1.0 + voice.audioVolume * 0.68;

  // Subtitle / Preview text
  const subtitleText =
    voice.state === 'speaking'
      ? voice.activeQuestion
        ? voice.activeQuestion.acknowledgement
          ? `${voice.activeQuestion.acknowledgement} ${voice.activeQuestion.question}`
          : voice.activeQuestion.question
        : 'Thinking...'
      : voice.state === 'listening'
      ? voice.currentTranscript || voice.interimTranscript || 'Speak your answer naturally. It submits automatically when you pause.'
      : voice.state === 'processing_answer'
      ? 'Analyzing technical depth and verifying evidence quotes...'
      : voice.state === 'paused'
      ? 'Listening paused. Click Resume or Done Speaking.'
      : voice.errorMessage || 'Live voice session ready.';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#09080D] text-white select-none overflow-hidden animate-in fade-in duration-300">
      {/* 1. Ambient Background Glows with HireLens Pink/Purple Palette */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-[#DB2777]/15 via-[#8B5CF6]/15 to-[#F43F5E]/15 rounded-full blur-3xl opacity-70 animate-pulse duration-1000" />
      </div>

      {/* 2. Top Header Navigation */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#F43F5E]" />
            <span className="text-[#F43F5E]">{voice.activeQuestion?.stage || 'Adaptive Interview'}</span>
            <span className="text-white/40">•</span>
            <span className="text-white/80">Question {Math.min(currentTurn, maxBudget)} of {maxBudget}</span>
          </div>

          <span className={`flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-[11px] font-semibold ${badge.bg} ${badge.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
            {badge.label}
          </span>

          {voice.lastAgentActivity && (
            <span
              className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-0.5 text-[11px] font-semibold text-purple-300 backdrop-blur-md animate-in fade-in"
              title={voice.lastAgentActivity.details || voice.lastAgentActivity.summary}
            >
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>{voice.lastAgentActivity.summary}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Toggle Transcript Drawer */}
          <button
            type="button"
            onClick={() => setShowDrawer(!showDrawer)}
            className="flex items-center gap-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 text-xs font-medium text-white/80 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#FDA4AF]" />
            <span>Transcript</span>
            {voice.transcripts.length > 0 && (
              <span className="ml-1 rounded-full bg-[#F43F5E] px-1.5 py-0.2 text-[10px] font-bold text-white">
                {voice.transcripts.length}
              </span>
            )}
          </button>

          {/* Switch to Text Mode */}
          <button
            type="button"
            onClick={() => {
              voice.cleanupAudio();
              onSwitchToText(voice.currentTranscript || voice.interimTranscript);
            }}
            className="flex items-center gap-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-1.5 text-xs font-medium text-white/80 transition-colors"
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Text Mode</span>
          </button>

          {/* Exit Modal Button */}
          <button
            type="button"
            onClick={() => {
              voice.cleanupAudio();
              onClose();
            }}
            className="rounded-full bg-white/5 hover:bg-white/10 border border-white/10 p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Close Voice Mode"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* 3. Center Screen: Centered Animated Orb */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* The Animated Orb Component */}
        <div className="relative flex items-center justify-center w-72 h-72 md:w-80 md:h-80">
          {/* Outer Ripple Wave 2 */}
          <div
            className={`absolute inset-0 rounded-full transition-transform duration-150 ease-out ${
              voice.state === 'speaking'
                ? 'bg-gradient-to-tr from-[#DB2777]/20 to-[#8B5CF6]/20 blur-xl opacity-75'
                : voice.state === 'listening'
                ? 'bg-gradient-to-tr from-[#06B6D4]/20 to-[#DB2777]/20 blur-xl opacity-60'
                : 'opacity-0'
            }`}
            style={{ transform: `scale(${ringScale2})` }}
          />

          {/* Outer Ripple Wave 1 */}
          <div
            className={`absolute inset-4 rounded-full transition-transform duration-100 ease-out ${
              voice.state === 'speaking'
                ? 'bg-gradient-to-tr from-[#F43F5E]/30 to-[#A855F7]/30 blur-lg opacity-85'
                : voice.state === 'listening'
                ? 'bg-gradient-to-tr from-[#38BDF8]/25 to-[#F43F5E]/25 blur-lg opacity-70'
                : voice.state === 'processing_answer'
                ? 'bg-gradient-to-tr from-[#A855F7]/30 to-[#F43F5E]/30 blur-md animate-spin'
                : 'opacity-10'
            }`}
            style={{ transform: `scale(${ringScale1})` }}
          />

          {/* Core Orb Sphere */}
          <div
            className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full shadow-2xl transition-transform duration-100 ease-out flex items-center justify-center overflow-hidden border border-white/20 backdrop-blur-2xl ${
              voice.state === 'speaking'
                ? 'bg-gradient-to-br from-[#F43F5E] via-[#D946EF] to-[#8B5CF6] shadow-[#F43F5E]/50'
                : voice.state === 'listening'
                ? 'bg-gradient-to-br from-[#06B6D4] via-[#DB2777] to-[#F43F5E] shadow-[#DB2777]/50'
                : voice.state === 'processing_answer'
                ? 'bg-gradient-to-br from-[#8B5CF6] via-[#EC4899] to-[#6366F1] animate-pulse shadow-[#8B5CF6]/50'
                : voice.state === 'error'
                ? 'bg-gradient-to-br from-[#EF4444] via-[#B91C1C] to-[#7F1D1D] shadow-red-500/50'
                : 'bg-gradient-to-br from-[#64748B] via-[#475569] to-[#334155]'
            }`}
            style={{ transform: `scale(${dynamicScale})` }}
          >
            {/* Inner fluid specular reflection */}
            <div className="absolute top-2 left-6 w-20 h-10 bg-white/30 rounded-full blur-md transform -rotate-45" />

            {/* Inner State Icon / Glow */}
            <div className="flex flex-col items-center justify-center text-center p-4">
              {voice.state === 'speaking' && (
                <div className="flex items-center gap-1.5">
                  <span className="h-6 w-1 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="h-10 w-1 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="h-8 w-1 bg-white rounded-full animate-bounce" />
                  <span className="h-5 w-1 bg-white rounded-full animate-bounce [animation-delay:-0.2s]" />
                </div>
              )}

              {voice.state === 'listening' && (
                <div className="flex flex-col items-center gap-1">
                  <Mic className="h-8 w-8 text-white drop-shadow-md animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white/90">Listening</span>
                </div>
              )}

              {voice.state === 'processing_answer' && (
                <div className="flex flex-col items-center gap-1.5">
                  <Sparkles className="h-7 w-7 text-white animate-spin" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white/90">Groq RAG</span>
                </div>
              )}

              {voice.state === 'paused' && (
                <div className="flex flex-col items-center gap-1">
                  <Pause className="h-7 w-7 text-white/80" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white/80">Paused</span>
                </div>
              )}

              {voice.state === 'error' && (
                <div className="flex flex-col items-center gap-1">
                  <AlertCircle className="h-8 w-8 text-white" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white">Issue</span>
                </div>
              )}

              {voice.state === 'idle' && (
                <Sparkles className="h-8 w-8 text-white/60 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* 4. Live Subtitles / Spoken Preview & Interactive Normalization Layer */}
        <div className="mt-8 max-w-xl w-full text-center px-4">
          {voice.state === 'speaking' ? (
            <p className="text-sm md:text-base font-medium text-white/90 leading-relaxed min-h-[48px] transition-all">
              {subtitleText}
            </p>
          ) : isEditingInline ? (
            <div className="flex flex-col gap-2.5 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md animate-in fade-in duration-200 text-left">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span className="font-semibold text-white/90 flex items-center gap-1.5">
                  <Edit3 className="h-3.5 w-3.5 text-[#F43F5E]" />
                  Review &amp; Edit Answer Before Submission
                </span>
                {voice.rawTranscript && voice.rawTranscript !== editText && (
                  <button
                    type="button"
                    onClick={handleRestoreOriginal}
                    className="flex items-center gap-1 text-[11px] text-[#FDA4AF] hover:underline"
                    title="Revert to raw browser speech recognition"
                  >
                    <Undo2 className="h-3 w-3" />
                    Restore Browser Speech
                  </button>
                )}
              </div>

              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full rounded-xl bg-black/50 border border-white/15 p-3 text-sm text-white placeholder-white/30 focus:border-[#F43F5E] focus:outline-none transition-colors resize-none"
                placeholder="Type or edit your answer..."
              />

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-white/40">
                  {editText.trim().length} chars (minimum 20 to submit)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/70 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#DB2777] to-[#F43F5E] text-white text-xs font-semibold hover:brightness-110 shadow-md transition-all"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Save &amp; Resume
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm md:text-base font-medium text-white/90 leading-relaxed min-h-[48px] transition-all">
                {subtitleText}
              </p>

              {/* Technical Correction Pill & Candidate Edit Action */}
              {(voice.currentTranscript.length > 0 || voice.hasCorrections) && (
                <div className="flex flex-wrap items-center justify-center gap-2 animate-in fade-in duration-200">
                  {voice.hasCorrections && (
                    <div className="flex items-center gap-1.5 rounded-full bg-purple-500/15 border border-purple-500/30 px-3 py-1 text-[11px] text-purple-300">
                      <Sparkles className="h-3 w-3 text-purple-400" />
                      <span>
                        Normalized {voice.corrections.length} technical term{voice.corrections.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {voice.currentTranscript.length > 0 && voice.state === 'listening' && (
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="flex items-center gap-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1 text-[11px] text-white/80 hover:text-white transition-colors"
                      title="Edit recognized transcript before submitting"
                    >
                      <Edit3 className="h-3 w-3 text-[#FDA4AF]" />
                      <span>Edit Answer</span>
                    </button>
                  )}
                </div>
              )}

              {voice.state === 'listening' && voice.currentTranscript.length >= 20 && (
                <span className="text-[11px] text-emerald-400/80 font-medium">
                  Listening... pause naturally to auto-submit, or click Done Speaking.
                </span>
              )}
              {voice.state === 'paused' && (
                <span className="text-[11px] text-amber-300/80 font-medium">
                  Interview paused. Click Resume Listening or Done Speaking.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Error Troubleshooting Banner if needed */}
        {voice.errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-2.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{voice.errorMessage}</span>
          </div>
        )}
      </main>

      {/* 5. Minimalist Bottom Controls Bar */}
      <footer className="relative z-10 flex flex-col items-center gap-4 px-6 py-6 border-t border-white/5 bg-[#09080D]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Mute Toggle */}
          <button
            type="button"
            onClick={voice.toggleMute}
            className={`p-3 rounded-full border transition-all ${
              voice.isMuted
                ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:text-white'
            }`}
            title={voice.isMuted ? 'Unmute Interviewer' : 'Mute Interviewer'}
          >
            {voice.isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          {/* Repeat Question */}
          <button
            type="button"
            onClick={voice.repeatQuestion}
            disabled={voice.isSpeaking || voice.isProcessing}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-40 transition-colors"
            title="Replay current question"
          >
            <RotateCcw className="h-4 w-4 text-[#FDA4AF]" />
            <span>Repeat</span>
          </button>

          {/* Pause / Resume Listening */}
          <button
            type="button"
            onClick={voice.togglePause}
            disabled={voice.isProcessing || voice.isSpeaking}
            className={`px-5 py-2.5 rounded-full font-semibold text-xs border transition-all flex items-center gap-2 shadow-lg ${
              voice.isPaused
                ? 'bg-[#DB2777] hover:bg-[#BE185D] text-white border-[#F43F5E]/40'
                : 'bg-white/10 hover:bg-white/15 text-white border-white/20'
            }`}
          >
            {voice.isPaused ? (
              <>
                <Play className="h-4 w-4 fill-white" />
                <span>Resume Listening</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </>
            )}
          </button>

          {/* Optional Quick Send / Done Speaking */}
          {(voice.currentTranscript.length > 0 || voice.interimTranscript.length > 0) && (
            <button
              type="button"
              onClick={voice.submitCurrentTranscript}
              disabled={voice.isProcessing}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#DB2777] to-[#F43F5E] text-white text-xs font-bold hover:brightness-110 shadow-lg shadow-[#F43F5E]/20 transition-all"
              title="Submit answer immediately without waiting for silence"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Done Speaking</span>
            </button>
          )}

          {/* End Interview Early */}
          <button
            type="button"
            onClick={() => {
              voice.cleanupAudio();
              onInterviewCompleted();
            }}
            className="px-4 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-medium text-red-300 transition-colors"
          >
            End Interview
          </button>
        </div>

        {/* Architecture Note Disclaimer */}
        <p className="text-[11px] text-white/40 text-center">
          Powered by browser speech recognition &amp; synthesis with Groq adaptive intelligence. Zero third-party audio costs.
        </p>
      </footer>

      {/* 6. Slide-Out Transcript & Live Groq Evaluation Drawer */}
      {showDrawer && (
        <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-96 z-40 bg-[#110E1B]/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#F43F5E]" />
              <h3 className="text-sm font-bold text-white">Live Transcript &amp; Scores</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowDrawer(false)}
              className="text-white/60 hover:text-white p-1 rounded-lg"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Agentic Evidence Grounding Activity Log */}
          {voice.agentActivities && voice.agentActivities.length > 0 && (
            <div className="border-b border-white/10 p-3 bg-purple-950/20">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-2">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Agent Evidence Grounding ({voice.agentActivities.length})</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {voice.agentActivities.map((act, idx) => (
                  <div key={`${act.timestamp}-${idx}`} className="rounded-lg bg-white/5 border border-purple-500/20 p-2 text-[11px]">
                    <div className="flex items-center justify-between text-purple-200 font-medium">
                      <span>{act.summary}</span>
                      <span className="text-[9px] text-white/40">
                        {act.timestamp.includes('T') ? act.timestamp.split('T')[1].split('.')[0] : act.timestamp}
                      </span>
                    </div>
                    {act.details && (
                      <p className="text-[10px] text-white/60 mt-0.5">{act.details}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {voice.transcripts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-white/40 text-xs">
                <Sparkles className="h-8 w-8 mb-2 opacity-50" />
                <p>Spoken turns and Groq evaluation scores will appear here in real time.</p>
              </div>
            ) : (
              voice.transcripts.map((t) => (
                <div
                  key={t.id}
                  className={`rounded-xl p-3 text-xs leading-relaxed ${
                    t.sender === 'interviewer'
                      ? 'bg-white/5 border border-white/10 text-white/90'
                      : 'bg-[#DB2777]/10 border border-[#DB2777]/20 text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px] text-white/50">
                    <span className="font-semibold uppercase tracking-wider text-[#FDA4AF]">
                      {t.sender === 'interviewer' ? 'Interviewer' : 'Candidate'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {t.isManuallyEdited && (
                        <span className="rounded bg-white/10 px-1.5 py-0.2 text-[9px] font-medium text-white/70">
                          Edited
                        </span>
                      )}
                      {t.stage && <span className="opacity-70">{t.stage}</span>}
                    </div>
                  </div>

                  <p className="whitespace-pre-wrap">{t.text}</p>

                  {/* Technical Term Normalization Audit Metadata */}
                  {t.corrections && t.corrections.length > 0 && (
                    <div className="mt-2 rounded-lg bg-purple-500/10 border border-purple-500/20 p-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-300">
                        <Sparkles className="h-3 w-3 text-purple-400" />
                        <span>Normalized Developer Terms:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {t.corrections.map((c, idx) => (
                          <span
                            key={`${c.term}-${idx}`}
                            className="rounded bg-purple-500/20 px-1.5 py-0.5 text-[10px] text-purple-200"
                          >
                            <span className="line-through opacity-70">{c.originalMatch}</span>
                            <span className="mx-1">→</span>
                            <span className="font-semibold text-white">{c.replacement}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Original Raw Browser Transcript Audit */}
                  {t.rawText && t.rawText !== t.text && (
                    <div className="mt-1.5 text-[10px] text-white/50 border-l border-white/20 pl-2">
                      <span className="opacity-70">Browser recognized: </span>
                      <span className="italic">&ldquo;{t.rawText}&rdquo;</span>
                    </div>
                  )}

                  {/* Evaluation Scorecard if evaluated */}
                  {t.evaluation && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-emerald-400">Score: {t.evaluation.percentage_score}%</span>
                        <span className="text-white/60">{t.evaluation.composite_score.toFixed(1)} / 5.0</span>
                      </div>

                      <div className="grid grid-cols-2 gap-1 text-[10px] text-white/60">
                        {t.evaluation.criteria_scores?.map((c) => (
                          <div key={c.criterion} className="capitalize">
                            {c.criterion.replace('_', ' ')}: {c.score}/5
                          </div>
                        ))}
                      </div>

                      {t.evaluation.overall_feedback && (
                        <p className="text-[10px] text-white/70 italic border-l-2 border-[#F43F5E] pl-2">
                          {t.evaluation.overall_feedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </aside>
      )}
    </div>
  );
}
