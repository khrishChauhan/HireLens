'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  Shield,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { ResumeData } from '@/lib/assessment-types';
import { extractResume } from '@/lib/api';

interface StageUploadProps {
  resumeData: ResumeData | null;
  onResumeSelected: (data: ResumeData) => void;
  onResumeRemoved: () => void;
  onStartAnalysis: () => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function StageUpload({
  resumeData,
  onResumeSelected,
  onResumeRemoved,
  onStartAnalysis,
}: StageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileValidation = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate MIME type and file extension
    const isPdfExtension = file.name.toLowerCase().endsWith('.pdf');
    const isPdfMime = file.type === 'application/pdf' || file.type === '';

    if (!isPdfExtension && !isPdfMime) {
      setErrorMessage('Please upload a valid PDF document (.pdf format only).');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File size exceeds 5MB limit (${formatFileSize(file.size)}). Please choose a smaller PDF.`
      );
      return;
    }

    if (file.size === 0) {
      setErrorMessage('The selected file appears to be empty. Please select a valid document.');
      return;
    }

    onResumeSelected({
      file,
      name: file.name,
      size: formatFileSize(file.size),
      rawSize: file.size,
      isExtracted: false,
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileValidation(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isProcessing) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileValidation(e.target.files[0]);
    }
  };

  // Loads the sample resume from public/sample_resume.pdf as an actual File object
  const handleUseSampleResume = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      const response = await fetch('/sample_resume.pdf');
      if (!response.ok) {
        throw new Error('Unable to load sample resume from server.');
      }
      const blob = await response.blob();
      const file = new File([blob], 'Alex_Vance_Senior_Systems_Engineer_Resume.pdf', {
        type: 'application/pdf',
      });

      onResumeSelected({
        file,
        name: file.name,
        size: formatFileSize(file.size),
        rawSize: file.size,
        isExtracted: false,
      });
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveResume = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    onResumeRemoved();
  };

  // Main submission handler: sends actual PDF to FastAPI /api/resumes/extract
  const handleAnalyzeClick = async () => {
    if (isProcessing) return;

    if (!resumeData) {
      setErrorMessage('Please select a PDF resume to analyze.');
      return;
    }

    // If already extracted, proceed directly to analysis
    if (resumeData.isExtracted && resumeData.extractedText) {
      onStartAnalysis();
      return;
    }

    if (!resumeData.file) {
      setErrorMessage('No valid file object found. Please select or re-upload your PDF.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsProcessing(true);

    try {
      // Send actual file via FormData to FastAPI
      const result = await extractResume(resumeData.file, resumeData.sessionId);

      // Store extraction response in assessment state
      const updatedData: ResumeData = {
        ...resumeData,
        name: result.filename || resumeData.name,
        extractedText: result.text,
        pageCount: result.page_count,
        characterCount: result.character_count,
        sessionId: result.session_id,
        isExtracted: true,
      };

      onResumeSelected(updatedData);
      setSuccessMessage(
        `PDF extracted successfully: ${result.page_count} page(s), ${result.character_count.toLocaleString()} characters.`
      );

      // Smooth transition to analysis stage after displaying success
      setTimeout(() => {
        onStartAnalysis();
      }, 500);
    } catch (error) {
      setErrorMessage((error as Error).message || 'Failed to process resume. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-6 sm:py-10 space-y-8">
      {/* Page Title & Intro */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#28232B]">
          Let&apos;s discover what you&apos;re capable of.
        </h1>
        <p className="text-xs sm:text-sm text-[#716A75] max-w-lg mx-auto leading-relaxed">
          Upload your resume and let HireLens identify your technical strengths, relevant opportunities, and personalized interview path.
        </p>
      </div>

      {/* Main Upload Box */}
      <div className="rounded-2xl border border-[#EEE9EE] bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            if (!isProcessing) fileInputRef.current?.click();
          }}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 ${
            isProcessing
              ? 'opacity-60 cursor-not-allowed border-[#EEE9EE] bg-[#FFF9FB]'
              : isDragOver
              ? 'border-[#D94683] bg-[#FFF0F5] cursor-pointer'
              : resumeData
              ? 'border-[#F2D5E1] bg-[#FFF9FB] cursor-pointer'
              : 'border-[#F2D5E1] bg-[#FFF9FB]/70 hover:border-[#D94683] hover:bg-[#FFF0F5]/50 cursor-pointer'
          }`}
          role="button"
          tabIndex={isProcessing ? -1 : 0}
          aria-label="Upload resume PDF file"
          onKeyDown={(e) => {
            if (!isProcessing && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            disabled={isProcessing}
            className="hidden"
          />

          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FFF0F5] border border-[#F2D5E1] text-[#D94683] mb-3.5 shadow-2xs">
            <UploadCloud className="h-6 w-6" strokeWidth={2} />
          </div>

          <p className="text-sm font-bold text-[#28232B]">
            Drop your resume here
          </p>
          <p className="mt-1 text-xs text-[#716A75]">
            or <span className="font-semibold text-[#D94683] underline underline-offset-2">browse files</span> from your device
          </p>

          <div className="mt-4 flex items-center gap-2 text-[11px] text-[#99919C]">
            <span>Supported format: PDF</span>
            <span>•</span>
            <span>Max file size: 5 MB</span>
          </div>
        </div>

        {/* Validation Error Message */}
        {errorMessage && (
          <div className="flex items-center gap-2.5 rounded-xl border border-[#F7CCD3] bg-[#FDF2F4] p-3 text-xs text-[#C24155] animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Extraction Success Message */}
        {successMessage && (
          <div className="flex items-center gap-2.5 rounded-xl border border-[#C6E7D7] bg-[#EBF6F1] p-3 text-xs text-[#23845B] animate-in fade-in duration-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="font-medium leading-snug">{successMessage}</span>
          </div>
        )}

        {/* Selected File Details Banner */}
        {resumeData && (
          <div className="flex items-center justify-between rounded-xl border border-[#F2D5E1] bg-[#FFF0F5] p-3.5 transition-all">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-[#F2D5E1] text-[#D94683]">
                <FileText className="h-5 w-5" />
              </div>
              <div className="overflow-hidden">
                <span className="block truncate text-xs font-bold text-[#28232B]">
                  {resumeData.name}
                </span>
                <span className="text-[11px] text-[#716A75]">
                  {resumeData.size}
                  {resumeData.isExtracted && resumeData.pageCount
                    ? ` • Verified by FastAPI (${resumeData.pageCount} page(s), ${resumeData.characterCount?.toLocaleString()} chars)`
                    : ' • Ready to analyze'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isProcessing}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="text-xs font-semibold text-[#D94683] hover:text-[#BE356D] px-2 py-1 disabled:opacity-50"
              >
                Replace
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveResume();
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#F2D5E1] bg-white text-[#716A75] hover:text-[#C24155] hover:border-[#F7CCD3] disabled:opacity-50"
                aria-label="Remove selected resume"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Sample Resume Quick Select */}
        {!resumeData && (
          <div className="text-center pt-1 border-t border-[#EEE9EE]">
            <button
              id="sample-resume-btn"
              type="button"
              disabled={isProcessing}
              onClick={handleUseSampleResume}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#716A75] hover:text-[#D94683] transition-colors disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#D94683]" />
              <span>
                Or try with sample resume:{' '}
                <strong className="font-semibold text-[#28232B]">
                  Alex_Vance_Systems_Engineer.pdf
                </strong>
              </span>
            </button>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="pt-2">
          <button
            id="analyze-resume-btn"
            type="button"
            disabled={!resumeData || isProcessing}
            onClick={handleAnalyzeClick}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-bold transition-all shadow-xs ${
              resumeData && !isProcessing
                ? 'bg-[#D94683] text-white hover:bg-[#BE356D] cursor-pointer'
                : 'bg-[#EEE9EE] text-[#99919C] cursor-not-allowed'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-[#D94683]" />
                <span className="text-[#28232B]">Extracting text with FastAPI...</span>
              </>
            ) : (
              <>
                <span>
                  {resumeData?.isExtracted ? 'Proceed to Analysis' : 'Analyze Resume'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-2 pt-1 text-[11px] text-[#99919C] leading-snug">
          <Shield className="h-3.5 w-3.5 shrink-0 text-[#716A75] mt-0.5" />
          <p>
            Your resume is used to generate your assessment. Uploaded files should be handled securely.
          </p>
        </div>
      </div>
    </div>
  );
}
