'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Award,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Quote,
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Info,
  Check,
  RefreshCw,
} from 'lucide-react';
import {
  RealResumeAnalysisResponse,
  ResumeData,
} from '@/lib/assessment-types';
import { TARGET_ROLE_PRESETS } from '@/lib/assessment-data';
import { analyzeResume } from '@/lib/api';

interface StageAnalysisProps {
  resumeData: ResumeData | null;
  analysisResult?: RealResumeAnalysisResponse | null;
  onAnalysisComplete?: (result: RealResumeAnalysisResponse) => void;
  onStartInterview: () => void;
  onBackToUpload: () => void;
}

export function StageAnalysis({
  resumeData,
  analysisResult: externalAnalysisResult,
  onAnalysisComplete,
  onStartInterview,
  onBackToUpload,
}: StageAnalysisProps) {
  // Local fallback state in case external handler is omitted
  const [localAnalysisResult, setLocalAnalysisResult] =
    useState<RealResumeAnalysisResponse | null>(null);

  const analysisResult = externalAnalysisResult ?? localAnalysisResult;

  // Target role configuration state
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    TARGET_ROLE_PRESETS[0].id
  );
  const [jobDescriptionText, setJobDescriptionText] = useState<string>(
    TARGET_ROLE_PRESETS[0].description
  );
  const [showFullResumeText, setShowFullResumeText] = useState<boolean>(false);
  const [showScoringLimitations, setShowScoringLimitations] =
    useState<boolean>(false);
  const [activeRequirementFilter, setActiveRequirementFilter] = useState<
    'all' | 'matched' | 'partial' | 'unmatched'
  >('all');

  // Analysis execution state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Handle switching preset roles
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') {
      setJobDescriptionText('');
    } else {
      const found = TARGET_ROLE_PRESETS.find((p) => p.id === presetId);
      if (found) {
        setJobDescriptionText(found.description);
      }
    }
  };

  // Run real AI analysis against FastAPI backend
  const handleRunAnalysis = async () => {
    if (!resumeData?.extractedText) {
      setAnalysisError(
        'No extracted resume text available. Please upload a readable PDF resume.'
      );
      return;
    }

    if (!jobDescriptionText || jobDescriptionText.trim().length < 20) {
      setAnalysisError(
        'Target job description must be at least 20 characters long.'
      );
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const result = await analyzeResume(
        resumeData.extractedText,
        jobDescriptionText.trim()
      );
      setLocalAnalysisResult(result);
      if (typeof onAnalysisComplete === 'function') {
        onAnalysisComplete(result);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred during AI resume analysis.';
      setAnalysisError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter requirements for the matrix
  const filteredRequirements = () => {
    if (!analysisResult) return [];
    if (activeRequirementFilter === 'matched') {
      return analysisResult.matched_requirements;
    }
    if (activeRequirementFilter === 'partial') {
      return analysisResult.partially_matched_requirements;
    }
    if (activeRequirementFilter === 'unmatched') {
      return analysisResult.unmatched_requirements;
    }
    return [
      ...analysisResult.matched_requirements,
      ...analysisResult.partially_matched_requirements,
      ...analysisResult.unmatched_requirements,
    ];
  };

  const isConfigError =
    analysisError &&
    (analysisError.includes('GROQ_API_KEY') ||
      analysisError.includes('Groq API key') ||
      analysisError.includes('API key is not configured') ||
      analysisError.includes('Groq API authentication failed'));

  return (
    <div className="mx-auto max-w-4xl py-6 sm:py-10 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F2D5E1] bg-[#FFF0F5] px-3 py-1 text-xs font-semibold text-[#D94683]">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Stage 2: Real AI Resume Intelligence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#28232B]">
          Objective Evidence & Skill Alignment
        </h1>
        <p className="text-xs sm:text-sm text-[#716A75] max-w-xl mx-auto leading-relaxed">
          HireLens uses Groq LPU inference with structured JSON output validation to ground
          skill extraction strictly in verified resume evidence.
        </p>
      </div>

      {/* 1. Verified Resume Document Card */}
      {resumeData && (
        <div className="rounded-2xl border border-[#EEE9EE] bg-white p-5 sm:p-6 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEE9EE] pb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#D94683]" />
              <h2 className="text-xs font-bold text-[#28232B] uppercase tracking-wider">
                Source Document: {resumeData.name}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#716A75]">
              <span className="rounded-full bg-[#EBF6F1] border border-[#C6E7D7] px-2.5 py-0.5 font-semibold text-[#23845B]">
                {resumeData.pageCount || 1} Page(s) •{' '}
                {(
                  resumeData.characterCount ??
                  resumeData.extractedText?.length ??
                  0
                ).toLocaleString()}{' '}
                Chars
              </span>
              <button
                type="button"
                onClick={() => setShowFullResumeText(!showFullResumeText)}
                className="inline-flex items-center gap-1 font-semibold text-[#D94683] hover:underline"
              >
                {showFullResumeText ? 'Hide Text' : 'View Text'}
                {showFullResumeText ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          {showFullResumeText && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 text-xs font-mono text-[#28232B] whitespace-pre-wrap leading-relaxed">
              {resumeData.extractedText}
            </div>
          )}
        </div>
      )}

      {/* 2. Target Role & Job Description Configuration */}
      {!analysisResult && (
        <div className="rounded-2xl border border-[#EEE9EE] bg-white p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EEE9EE] pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-[#D94683]" />
              <h2 className="text-xs font-bold text-[#28232B] uppercase tracking-wider">
                Target Role & Requirements
              </h2>
            </div>
            <span className="text-[11px] text-[#99919C]">
              Select a benchmark role or paste a custom description
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {TARGET_ROLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetChange(preset.id)}
                disabled={isAnalyzing}
                className={`rounded-xl border p-3 text-left transition-all ${
                  selectedPresetId === preset.id
                    ? 'border-[#D94683] bg-[#FFF0F5] text-[#28232B] ring-1 ring-[#D94683]'
                    : 'border-[#EEE9EE] bg-white text-[#716A75] hover:border-[#D94683]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#D94683]">
                    {preset.department}
                  </span>
                  {selectedPresetId === preset.id && (
                    <Check className="h-3.5 w-3.5 text-[#D94683]" />
                  )}
                </div>
                <div className="text-xs font-bold line-clamp-1">
                  {preset.title}
                </div>
              </button>
            ))}
          </div>

          {/* Editable Job Description Area */}
          <div className="space-y-2">
            <label
              htmlFor="job-description-input"
              className="flex items-center justify-between text-xs font-semibold text-[#716A75]"
            >
              <span>Job Description & Requirements</span>
              <span className="text-[11px] text-[#99919C]">
                {jobDescriptionText.length} characters
              </span>
            </label>
            <textarea
              id="job-description-input"
              rows={6}
              disabled={isAnalyzing}
              value={jobDescriptionText}
              onChange={(e) => {
                setJobDescriptionText(e.target.value);
                setSelectedPresetId('custom');
              }}
              placeholder="Paste candidate target job description here..."
              className="w-full rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-3 text-xs text-[#28232B] focus:border-[#D94683] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#D94683] leading-relaxed"
            />
          </div>

          {/* Error Banner */}
          {analysisError && (
            <div className="rounded-xl border border-[#F2D5E1] bg-[#FFF0F5] p-4 text-xs text-[#28232B] space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#D94683] mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-[#D94683]">
                    {isConfigError
                      ? 'AI Provider Setup Required'
                      : 'Analysis Error'}
                  </span>
                  <p className="text-xs text-[#716A75] leading-relaxed">
                    {analysisError}
                  </p>
                </div>
              </div>

              {isConfigError && (
                <div className="mt-3 rounded-lg border border-[#F2D5E1] bg-white p-3 text-[11px] text-[#716A75] space-y-2">
                  <p className="font-semibold text-[#28232B]">
                    How to configure Groq:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-[#716A75]">
                    <li>
                      Obtain your API key from{' '}
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#D94683] underline inline-flex items-center gap-1"
                      >
                        Groq Console
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li>
                      Add <code className="bg-[#FFF0F5] px-1 py-0.5 rounded text-[#D94683]">GROQ_API_KEY=your_key</code> to <code className="bg-[#FFF0F5] px-1 py-0.5 rounded text-[#D94683]">backend/.env</code>
                    </li>
                    <li>Click &ldquo;Run AI Resume Analysis&rdquo; below to retry.</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Run Analysis Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#EEE9EE]">
            <span className="text-[11px] text-[#99919C]">
              Model: <code className="font-mono text-[#D94683]">openai/gpt-oss-120b</code> • Groq LPU Inference
            </span>

            <button
              id="run-analysis-btn"
              type="button"
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#D94683] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#BE356D] disabled:opacity-50 transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing with Groq LPU...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Run AI Resume Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. Real Analysis Results (Rendered Once Analysis Succeeds) */}
      {analysisResult && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Candidate Profile Header Card */}
          <div className="rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEE9EE] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#D94683]">
                  Candidate Profile
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#28232B] mt-0.5">
                  {analysisResult.candidate_name}
                </h2>
                <p className="text-xs font-semibold text-[#716A75]">
                  {analysisResult.candidate_title}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRunAnalysis()}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] px-3 py-2 text-xs font-semibold text-[#716A75] hover:bg-white hover:text-[#28232B] transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                  <span>Re-analyze</span>
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#716A75]">
                Profile Summary
              </span>
              <p className="text-xs text-[#28232B] leading-relaxed">
                {analysisResult.profile_summary}
              </p>
            </div>
          </div>

          {/* Deterministic Match Score Card */}
          <div className="rounded-2xl border border-[#F2D5E1] bg-[#FFF0F5] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#D94683]">
                  Deterministic Requirement Alignment
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-[#28232B] mt-1">
                  Validated Overlap Against Target Role
                </h3>
                {analysisResult.retrieval_metadata && (
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-[#716A75]">
                    <Sparkles className="h-3 w-3 text-[#D94683]" />
                    <span>
                      RAG Retrieval: {analysisResult.retrieval_metadata.total_chunks} chunks indexed •{' '}
                      <strong className="text-[#23845B]">{analysisResult.retrieval_metadata.verified_quotes_count}</strong> verified quotes
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 self-start sm:self-auto rounded-xl bg-white border border-[#F2D5E1] px-4 py-2.5 text-right shadow-2xs">
                <Award className="h-6 w-6 text-[#23845B]" />
                <div>
                  <div className="text-2xl font-black text-[#23845B]">
                    {analysisResult.match_score}%
                  </div>
                  <div className="text-[10px] font-medium text-[#716A75]">
                    Deterministic Rubric
                  </div>
                </div>
              </div>
            </div>

            {/* Requirement Breakdown Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
              <div className="rounded-xl border border-[#C6E7D7] bg-[#EBF6F1] p-3 text-center">
                <div className="text-lg font-black text-[#23845B]">
                  {analysisResult.scoring_breakdown.matched_count}
                </div>
                <div className="text-[10px] font-bold text-[#23845B] uppercase">
                  Fully Matched
                </div>
              </div>

              <div className="rounded-xl border border-[#F7E0B5] bg-[#FEF9ED] p-3 text-center">
                <div className="text-lg font-black text-[#B7791F]">
                  {analysisResult.scoring_breakdown.partially_matched_count}
                </div>
                <div className="text-[10px] font-bold text-[#B7791F] uppercase">
                  Partial / Inferred
                </div>
              </div>

              <div className="rounded-xl border border-[#EEE9EE] bg-white p-3 text-center">
                <div className="text-lg font-black text-[#716A75]">
                  {analysisResult.scoring_breakdown.not_demonstrated_count}
                </div>
                <div className="text-[10px] font-bold text-[#716A75] uppercase">
                  Not Evidenced
                </div>
              </div>

              <div className="rounded-xl border border-[#EEE9EE] bg-white p-3 text-center">
                <div className="text-lg font-black text-[#28232B]">
                  {analysisResult.scoring_breakdown.total_requirements}
                </div>
                <div className="text-[10px] font-bold text-[#716A75] uppercase">
                  Total Requirements
                </div>
              </div>
            </div>

            {/* Expandable Limitations and Formula Explanation */}
            <div className="pt-2 border-t border-[#F2D5E1]/60">
              <button
                type="button"
                onClick={() => setShowScoringLimitations(!showScoringLimitations)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D94683] hover:underline"
              >
                <Info className="h-3.5 w-3.5" />
                <span>Transparent Scoring Formula & Limitations</span>
                {showScoringLimitations ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>

              {showScoringLimitations && (
                <div className="mt-2.5 rounded-xl border border-[#F2D5E1] bg-white p-3.5 text-xs text-[#716A75] space-y-2">
                  <div>
                    <span className="font-bold text-[#28232B]">Deterministic Formula: </span>
                    <code className="bg-[#FFF0F5] px-1.5 py-0.5 rounded text-[#D94683] font-mono text-[11px]">
                      {analysisResult.scoring_breakdown.formula}
                    </code>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {analysisResult.scoring_breakdown.limitations}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Requirement Matching Matrix */}
          <div className="rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EEE9EE] pb-3">
              <div>
                <h3 className="text-xs font-bold text-[#28232B] uppercase tracking-wider">
                  Requirement Alignment Breakdown
                </h3>
                <p className="text-[11px] text-[#716A75]">
                  Detailed evaluation of each target job requirement against resume evidence
                </p>
              </div>

              {/* Requirement Filters */}
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { key: 'all', label: 'All', count: analysisResult.job_requirements.length },
                    { key: 'matched', label: 'Matched', count: analysisResult.matched_requirements.length },
                    { key: 'partial', label: 'Partial', count: analysisResult.partially_matched_requirements.length },
                    { key: 'unmatched', label: 'Not Evidenced', count: analysisResult.unmatched_requirements.length },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveRequirementFilter(tab.key)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      activeRequirementFilter === tab.key
                        ? 'bg-[#D94683] text-white'
                        : 'bg-[#FFF9FB] text-[#716A75] hover:text-[#28232B]'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredRequirements().map((req, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 space-y-2 transition-all ${
                    req.status === 'matched'
                      ? 'border-[#C6E7D7] bg-[#EBF6F1]/30'
                      : req.status === 'partially_matched'
                      ? 'border-[#F7E0B5] bg-[#FEF9ED]/30'
                      : 'border-[#EEE9EE] bg-[#FFF9FB]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-[#28232B] leading-snug">
                      {req.requirement}
                    </span>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        req.status === 'matched'
                          ? 'bg-[#EBF6F1] text-[#23845B] border border-[#C6E7D7]'
                          : req.status === 'partially_matched'
                          ? 'bg-[#FEF9ED] text-[#B7791F] border border-[#F7E0B5]'
                          : 'bg-[#F4F2F4] text-[#716A75] border border-[#EEE9EE]'
                      }`}
                    >
                      {req.status === 'matched'
                        ? 'Matched'
                        : req.status === 'partially_matched'
                        ? 'Partially Matched'
                        : 'Not Evidenced'}
                    </span>
                  </div>

                  <p className="text-xs text-[#716A75] leading-relaxed">
                    {req.explanation}
                  </p>

                  {/* Direct Quote Evidence */}
                  {req.evidence && (
                    <div className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg bg-white border border-[#EEE9EE] p-2.5 text-xs text-[#716A75]">
                        <div className="flex items-start gap-2 italic">
                          <Quote className="h-3.5 w-3.5 shrink-0 text-[#D94683] mt-0.5" />
                          <span>&ldquo;{req.evidence}&rdquo;</span>
                        </div>
                        {req.evidence_verified === true && (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded bg-[#EBF6F1] px-2 py-0.5 text-[10px] font-semibold text-[#23845B] border border-[#C6E7D7]">
                            <Check className="h-3 w-3" />
                            <span>Verified Source Quote</span>
                          </span>
                        )}
                        {req.evidence_verified === false && (
                          <span className="shrink-0 inline-flex items-center gap-1 rounded bg-[#FEF9ED] px-2 py-0.5 text-[10px] font-semibold text-[#B7791F] border border-[#F7E0B5]">
                            <AlertCircle className="h-3 w-3" />
                            <span>Unverified Quote</span>
                          </span>
                        )}
                      </div>
                      {req.relevant_chunk_indices && req.relevant_chunk_indices.length > 0 && (
                        <div className="text-[10px] text-[#99919C] font-mono px-1">
                          Semantic RAG Match: Resume Chunk #{req.relevant_chunk_indices.join(', #')}
                        </div>
                      )}
                    </div>
                  )}

                  {req.is_inferred && (
                    <span className="inline-block text-[10px] font-semibold text-[#B7791F]">
                      * Finding relies on reasonable inference from related experience.
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 5. Categorized Skills */}
          <div className="rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-[#28232B] uppercase tracking-wider">
              Verified Skills by Category
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysisResult.skills_by_category.map((cat, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-4 space-y-2"
                >
                  <span className="text-xs font-bold text-[#28232B]">
                    {cat.category}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="rounded-md border border-[#F2D5E1] bg-white px-2 py-0.5 text-xs font-medium text-[#D94683]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. Extracted Experience & Education */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Work Experience */}
            <div className="rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#D94683]" />
                <h3 className="text-xs font-bold text-[#28232B] uppercase tracking-wider">
                  Work Experience
                </h3>
              </div>

              <div className="space-y-3">
                {analysisResult.work_experience.map((exp, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#28232B]">{exp.role}</span>
                      <span className="text-[11px] text-[#99919C]">{exp.duration}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#D94683] block">
                      {exp.company}
                    </span>
                    <p className="text-xs text-[#716A75] leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Education & Projects */}
            <div className="space-y-6">
              {/* Education */}
              <div className="rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-[#D94683]" />
                  <h3 className="text-xs font-bold text-[#28232B] uppercase tracking-wider">
                    Education & Credentials
                  </h3>
                </div>

                <div className="space-y-2">
                  {analysisResult.education.map((edu, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#EEE9EE] bg-[#FFF9FB] p-3 text-xs"
                    >
                      <div className="font-bold text-[#28232B]">{edu.degree}</div>
                      <div className="text-[#716A75]">
                        {edu.institution} {edu.year ? `(${edu.year})` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uncertainty Notes */}
              {analysisResult.uncertainty_notes.length > 0 && (
                <div className="rounded-2xl border border-[#EEE9EE] bg-white p-6 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#B7791F]" />
                    <h3 className="text-xs font-bold text-[#28232B] uppercase tracking-wider">
                      Flagged for Interview Focus
                    </h3>
                  </div>

                  <ul className="space-y-1.5 text-xs text-[#716A75]">
                    {analysisResult.uncertainty_notes.map((note, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#B7791F] font-bold">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* 7. Action Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-[#EEE9EE] bg-white p-5 shadow-xs">
            <button
              type="button"
              onClick={onBackToUpload}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#716A75] hover:text-[#28232B]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Upload Different Resume
            </button>

            <button
              id="start-interview-btn"
              type="button"
              onClick={onStartInterview}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#D94683] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#BE356D] transition-colors"
            >
              <span>Start Technical Interview</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
