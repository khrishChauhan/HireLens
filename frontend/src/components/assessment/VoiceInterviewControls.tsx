'use client';

import React from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  Loader2,
  AlertCircle,
  Keyboard,
  Radio,
  Edit3,
} from 'lucide-react';
import { VoiceState, VoiceSupport } from '@/lib/speech/speech-types';

interface VoiceInterviewControlsProps {
  voiceState: VoiceState;
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  transcript: string;
  interimTranscript: string;
  voiceError: string | null;
  permissionDenied: boolean;
  support: VoiceSupport;
  isEvaluating: boolean;
  questionNumber: number;
  questionStage?: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onToggleListening?: () => void;
  onRetryAnswer: () => void;
  onReplayQuestion: () => void;
  onToggleMute: () => void;
  onTranscriptChange: (text: string) => void;
  onSubmitAnswer: () => void;
  onSwitchToText: () => void;
}

export function VoiceInterviewControls({
  voiceState,
  isListening,
  isSpeaking,
  isMuted,
  transcript,
  interimTranscript,
  voiceError,
  permissionDenied,
  support,
  isEvaluating,
  questionNumber,
  questionStage,
  onStartListening,
  onStopListening,
  onRetryAnswer,
  onReplayQuestion,
  onToggleMute,
  onTranscriptChange,
  onSubmitAnswer,
  onSwitchToText,
}: VoiceInterviewControlsProps) {
  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const charCount = transcript.length;
  const canSubmit = !isEvaluating && transcript.trim().length >= 20;

  return (
    <div className="space-y-5 rounded-2xl border border-[#F2D5E1] bg-[#FFF9FB]/60 p-5 sm:p-6 transition-all">
      {/* 1. Header Bar: Mode Status, Speaker Status & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F2D5E1]/60 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF0F5] border border-[#F2D5E1] text-[#D94683]">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#28232B]">
                AI Voice Interview • Q{questionNumber}
              </span>
              <span className="rounded-full bg-[#EBF6F1] border border-[#C6E7D7] px-2 py-0.2 text-[10px] font-bold text-[#23845B] capitalize">
                {questionStage ? questionStage.replace('_', ' ') : 'Live Mic'}
              </span>
              <span className="text-[10px] text-[#99919C] capitalize">
                ({voiceState})
              </span>
            </div>
            <p className="text-[11px] text-[#716A75]">
              Speak naturally. HireLens transcribes your speech and lets you review before submitting.
            </p>
          </div>
        </div>

        {/* Action Controls: Audio Mute & Switch to Text */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Unmute question audio' : 'Mute question audio'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#EEE9EE] bg-white px-2.5 py-1.5 text-xs font-medium text-[#716A75] hover:border-[#D94683] hover:text-[#D94683] transition-colors"
          >
            {isMuted ? (
              <>
                <VolumeX className="h-3.5 w-3.5 text-[#C24155]" />
                <span className="text-[11px]">Unmute Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5 text-[#D94683]" />
                <span className="text-[11px]">Audio On</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onSwitchToText}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#EEE9EE] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#716A75] hover:border-[#28232B] hover:text-[#28232B] transition-colors"
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span className="text-[11px]">Switch to Text Mode</span>
          </button>
        </div>
      </div>

      {/* 2. Speaking Status Banner (When Interviewer is Reading Question) */}
      {isSpeaking && (
        <div className="flex items-center justify-between rounded-xl bg-white border border-[#F2D5E1] p-3 text-xs text-[#BE356D] animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            {/* Animated Sound Wave Bars */}
            <div className="flex items-center gap-1 h-4">
              <span className="w-1 bg-[#D94683] rounded-full animate-bounce h-3" style={{ animationDelay: '0ms' }} />
              <span className="w-1 bg-[#D94683] rounded-full animate-bounce h-4" style={{ animationDelay: '150ms' }} />
              <span className="w-1 bg-[#D94683] rounded-full animate-bounce h-2" style={{ animationDelay: '300ms' }} />
              <span className="w-1 bg-[#D94683] rounded-full animate-bounce h-4" style={{ animationDelay: '75ms' }} />
            </div>
            <span className="font-semibold text-[#28232B]">
              Interviewer is reading the question aloud...
            </span>
          </div>

          <button
            type="button"
            onClick={onStartListening}
            className="text-[11px] font-bold text-[#D94683] hover:underline"
          >
            Skip &amp; Start Speaking
          </button>
        </div>
      )}

      {/* 3. Browser Support Alert if Web Speech is missing */}
      {!support.recognition && (
        <div className="flex items-start gap-2.5 rounded-xl border border-[#F7CCD3] bg-[#FDF2F4] p-3.5 text-xs text-[#C24155]">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Microphone speech recognition is not supported in this browser.</p>
            <p className="text-[11px] text-[#716A75] leading-relaxed">
              Google Chrome, Microsoft Edge, and modern Chromium browsers support native Speech Recognition. You can continue smoothly using <strong>Text Mode</strong> below without losing any evaluation capabilities.
            </p>
            <button
              type="button"
              onClick={onSwitchToText}
              className="mt-1 rounded-lg bg-[#C24155] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#a83547]"
            >
              Switch to Text Mode Now
            </button>
          </div>
        </div>
      )}

      {/* 4. Permission Denied or Voice Error Notification */}
      {voiceError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-[#F7CCD3] bg-[#FDF2F4] p-3.5 text-xs text-[#C24155] animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <p className="font-semibold">{voiceError}</p>
            {permissionDenied && (
              <p className="text-[11px] text-[#716A75]">
                To re-enable: click the lock/settings icon next to the URL in your browser bar, toggle Microphone to &ldquo;Allow&rdquo;, and refresh or retry.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onSwitchToText}
            className="text-[11px] font-bold underline hover:text-[#28232B]"
          >
            Type Answer Instead
          </button>
        </div>
      )}

      {/* 5. Live Speech & Transcript Review Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="h-3.5 w-3.5 text-[#D94683]" />
            <span className="text-xs font-semibold text-[#28232B]">
              Recognized Speech Transcript
            </span>
            {isListening && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDF2F4] border border-[#F7CCD3] px-2 py-0.5 text-[10px] font-bold text-[#C24155] animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-[#C24155]" />
                Listening...
              </span>
            )}
          </div>

          <span className="text-[11px] text-[#99919C]">
            {wordCount} words • {charCount} chars
          </span>
        </div>

        {/* Real-time Interim Speech Bubble when mic is picking up active voice */}
        {isListening && interimTranscript && (
          <div className="rounded-xl border border-[#D94683]/30 bg-[#FFF0F5] p-3 text-xs text-[#28232B] italic animate-in fade-in duration-150">
            <span className="font-bold text-[#D94683] not-italic mr-1.5">Live Voice:</span>
            &ldquo;{interimTranscript}&rdquo;
            <span className="inline-block w-1.5 h-3 ml-1 bg-[#D94683] animate-pulse align-middle" />
          </div>
        )}

        {/* Editable Transcript Textarea */}
        <textarea
          rows={6}
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          disabled={isEvaluating}
          placeholder={
            isListening
              ? "Listening to your answer... Speak your thoughts, technical trade-offs, and architecture choices."
              : support.recognition
              ? "Click 'Start Speaking' below to record your response through your microphone, or edit the transcript directly."
              : "Type your technical response..."
          }
          className="w-full rounded-xl border border-[#EEE9EE] bg-white p-4 text-xs sm:text-sm text-[#28232B] placeholder-[#99919C] focus:border-[#D94683] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D94683] transition-colors leading-relaxed disabled:opacity-50"
        />

        <p className="text-[11px] text-[#716A75]">
          Tip: You can edit any technical terminology or acronyms in the transcript above before submitting.
        </p>
      </div>

      {/* 6. Primary Interactive Voice Controls Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Left Side: Mic recording & audio replay actions */}
        <div className="flex flex-wrap items-center gap-2">
          {isListening ? (
            <button
              type="button"
              onClick={onStopListening}
              disabled={isEvaluating}
              className="inline-flex items-center gap-2 rounded-xl bg-[#C24155] px-4 py-2 text-xs font-bold text-white hover:bg-[#a83547] shadow-xs transition-all cursor-pointer animate-pulse"
            >
              <MicOff className="h-4 w-4" />
              <span>Stop Listening</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartListening}
              disabled={isEvaluating || !support.recognition}
              className="inline-flex items-center gap-2 rounded-xl bg-[#D94683] px-4 py-2 text-xs font-bold text-white hover:bg-[#BE356D] shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mic className="h-4 w-4" />
              <span>{transcript.trim() ? 'Record More (Resume Mic)' : 'Start Speaking'}</span>
            </button>
          )}

          {transcript.trim() && !isListening && (
            <button
              type="button"
              onClick={onRetryAnswer}
              disabled={isEvaluating}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#EEE9EE] bg-white px-3 py-2 text-xs font-semibold text-[#716A75] hover:text-[#C24155] hover:border-[#F7CCD3] transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry Answer</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReplayQuestion}
            disabled={isEvaluating || isSpeaking || !support.synthesis}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#EEE9EE] bg-white px-3 py-2 text-xs font-semibold text-[#716A75] hover:text-[#28232B] hover:border-[#D94683] transition-colors disabled:opacity-50"
          >
            <Volume2 className="h-3.5 w-3.5 text-[#D94683]" />
            <span>Replay Question</span>
          </button>
        </div>

        {/* Right Side: Submit Confirmed Answer */}
        <button
          type="button"
          onClick={onSubmitAnswer}
          disabled={!canSubmit || isListening}
          className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-xs ${
            canSubmit && !isListening
              ? 'bg-[#D94683] text-white hover:bg-[#BE356D] cursor-pointer'
              : 'bg-[#EEE9EE] text-[#99919C] cursor-not-allowed'
          }`}
        >
          {isEvaluating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Evaluating Response...</span>
            </>
          ) : (
            <>
              <span>Submit Answer for Evaluation</span>
              <Send className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Validation hint if transcript is too short */}
      {transcript.trim().length > 0 && transcript.trim().length < 20 && !isListening && (
        <div className="text-[11px] text-[#C24155] font-medium">
          Please provide a more substantive technical response (at least 20 characters) before submitting.
        </div>
      )}
    </div>
  );
}
