'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Upload,
  Award,
  GraduationCap,
} from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';
import { CandidateStage } from '@/lib/types';

export function CandidateDetailDrawer() {
  const {
    selectedCandidateId,
    setSelectedCandidateId,
    candidates,
    updateCandidateStage,
    showToast,
  } = useHireLens();

  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState('');

  if (!selectedCandidateId) return null;

  const candidate = candidates.find((c) => c.id === selectedCandidateId);
  if (!candidate) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setUploadError('Only PDF and DOCX files are supported.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit.');
      return;
    }

    const sizeFormatted = `${(file.size / 1024).toFixed(0)} KB`;
    setUploadedFile({ name: file.name, size: sizeFormatted });
    showToast(`Resume "${file.name}" staged locally for evaluation`);
  };

  const stages: CandidateStage[] = ['Applied', 'Screening', 'Interview', 'Evaluation', 'Decision'];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0"
        onClick={() => setSelectedCandidateId(null)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#F0EBEF] bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF0F5] border border-[#F5D5E2] text-sm font-bold text-[#BE356D]">
              {candidate.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <h2 className="text-base font-bold text-[#26212A]">{candidate.name}</h2>
              <p className="text-xs text-[#6F6873]">{candidate.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedCandidateId(null)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0EBEF] text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 space-y-6 p-6">
          {/* Quick Contact & Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-[#6F6873]">
              <Mail className="h-3.5 w-3.5 text-[#99919C]" />
              <span className="truncate">{candidate.email}</span>
            </div>
            <div className="flex items-center gap-2 text-[#6F6873]">
              <Phone className="h-3.5 w-3.5 text-[#99919C]" />
              <span>{candidate.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-[#6F6873]">
              <MapPin className="h-3.5 w-3.5 text-[#99919C]" />
              <span>{candidate.location}</span>
            </div>
            <div className="flex items-center gap-2 text-[#6F6873]">
              <Calendar className="h-3.5 w-3.5 text-[#99919C]" />
              <span>Applied {candidate.appliedDate}</span>
            </div>
          </div>

          {/* Hiring Stage Progression */}
          <div className="rounded-xl border border-[#F0EBEF] bg-[#FFF9FB] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#26212A]">Hiring Stage</span>
              <span className="text-[11px] font-medium text-[#D94683] bg-[#FFF0F5] px-2 py-0.5 rounded-full border border-[#F5D5E2]">
                Current: {candidate.stage}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mt-2">
              {stages.map((stg) => {
                const isCurrent = candidate.stage === stg;
                return (
                  <button
                    key={stg}
                    type="button"
                    onClick={() => updateCandidateStage(candidate.id, stg)}
                    className={`rounded-md py-1.5 text-center text-[11px] font-medium transition-all ${
                      isCurrent
                        ? 'bg-[#D94683] text-white shadow-xs font-semibold'
                        : 'bg-white border border-[#F0EBEF] text-[#6F6873] hover:border-[#D94683] hover:text-[#D94683]'
                    }`}
                  >
                    {stg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skill Rubric Match & Verified Evidence */}
          <div className="rounded-xl border border-[#F0EBEF] bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#26212A]">
                Skill Rubric & Evidence Match
              </span>
              <span className="flex items-center gap-1 rounded-full bg-[#EBF6F1] px-2 py-0.5 text-xs font-bold text-[#23845B]">
                <Award className="h-3 w-3" />
                {candidate.matchScore}% Match
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[#99919C]">
              Illustrative demo score derived from structured skill Rubrics and verifiable code evidence.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {candidate.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-[#F5D5E2] bg-[#FFF0F5] px-2 py-1 text-xs font-medium text-[#BE356D]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Resume Inspection & Upload Dropzone */}
          <div className="rounded-xl border border-[#F0EBEF] bg-white p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#26212A]">Resume Document</span>
              <span className="text-[11px] text-[#99919C]">
                {uploadedFile ? uploadedFile.size : candidate.resumeFileSize}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] p-3 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#D94683]" />
                <span className="font-medium text-[#26212A]">
                  {uploadedFile ? uploadedFile.name : candidate.resumeFileName}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#23845B] bg-[#EBF6F1] px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>

            {/* Upload Dropzone */}
            <div className="mt-3">
              <label className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#F5D5E2] bg-[#FFF0F5]/40 p-4 text-center cursor-pointer hover:bg-[#FFF0F5] transition-colors">
                <Upload className="h-5 w-5 text-[#D94683] mb-1.5" />
                <span className="text-xs font-semibold text-[#26212A]">
                  Upload new resume for inspection
                </span>
                <span className="text-[11px] text-[#99919C] mt-0.5">
                  PDF or DOCX up to 5MB (processed locally in browser)
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {uploadError && (
                <p className="mt-1 text-[11px] text-[#C24155]">{uploadError}</p>
              )}
            </div>
          </div>

          {/* Experience Highlights */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-[#26212A] uppercase tracking-wider">
              Experience History
            </h3>
            {candidate.experience.map((exp, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#F0EBEF] bg-white p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#26212A]">{exp.role}</h4>
                    <p className="text-[11px] text-[#6F6873]">{exp.company}</p>
                  </div>
                  <span className="text-[11px] text-[#99919C]">{exp.duration}</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#6F6873]">
                  {exp.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Education */}
          <div className="rounded-xl border border-[#F0EBEF] bg-white p-4">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-4 w-4 text-[#D94683]" />
              <span className="text-xs font-semibold text-[#26212A]">Education</span>
            </div>
            <p className="text-xs font-medium text-[#26212A]">
              {candidate.education.degree}
            </p>
            <p className="text-[11px] text-[#99919C]">
              {candidate.education.institution} • Class of {candidate.education.year}
            </p>
          </div>

          {/* Recruiter Assessment Notes */}
          <div className="rounded-xl border border-[#F0EBEF] bg-[#FFF9FB] p-4">
            <h3 className="text-xs font-semibold text-[#26212A] mb-1">
              Recruiter Evaluation Notes
            </h3>
            <p className="text-xs text-[#6F6873] leading-relaxed">{candidate.notes}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
