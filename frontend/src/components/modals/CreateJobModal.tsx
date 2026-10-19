'use client';

import React, { useState } from 'react';
import { X, Briefcase, Sparkles } from 'lucide-react';
import { useHireLens } from '@/context/HireLensContext';
import { EmploymentType, ExperienceLevel } from '@/lib/types';

export function CreateJobModal() {
  const { isCreateJobModalOpen, setIsCreateJobModalOpen, addJob } = useHireLens();

  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [type, setType] = useState<EmploymentType>('Full-time');
  const [location, setLocation] = useState('Remote (US/EU)');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Senior');
  const [description, setDescription] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [rubricSummary, setRubricSummary] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isCreateJobModalOpen) return null;

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = 'Job title is required';
    if (!description.trim()) newErrors.description = 'Job description is required';
    if (!skillsInput.trim()) newErrors.skills = 'At least one skill is required';
    if (!rubricSummary.trim()) newErrors.rubric = 'Evaluation rubric summary is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    addJob({
      title,
      department,
      type,
      location,
      status: 'Active',
      description,
      requiredSkills: skills,
      experienceLevel,
      rubricSummary,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setSkillsInput('');
    setRubricSummary('');
    setErrors({});
    setIsCreateJobModalOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#F0EBEF] bg-white p-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#F0EBEF] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF0F5] border border-[#F5D5E2] text-[#D94683]">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#26212A]">Create Job Opening</h2>
              <p className="text-xs text-[#99919C]">
                Define role requirements and structured evaluation criteria
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateJobModalOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#F0EBEF] text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#26212A] mb-1">
                Job Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className={`w-full rounded-lg border px-3 py-2 text-xs text-[#26212A] placeholder-[#99919C] focus:outline-none focus:ring-1 focus:ring-[#D94683] ${
                  errors.title ? 'border-[#C24155] bg-[#FDF2F4]' : 'border-[#F0EBEF] bg-[#FFF9FB]'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-[11px] text-[#C24155]">{errors.title}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-semibold text-[#26212A] mb-1">
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
              >
                <option value="Engineering">Engineering</option>
                <option value="AI & Data">AI & Data</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Platform">Platform</option>
                <option value="Operations">Operations</option>
              </select>
            </div>

            {/* Employment Type */}
            <div>
              <label className="block text-xs font-semibold text-[#26212A] mb-1">
                Employment Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EmploymentType)}
                className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-[#26212A] mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote, San Francisco, CA"
                className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
              >
              </input>
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-xs font-semibold text-[#26212A] mb-1">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full rounded-lg border border-[#F0EBEF] bg-[#FFF9FB] px-3 py-2 text-xs text-[#26212A] focus:outline-none focus:ring-1 focus:ring-[#D94683]"
              >
                <option value="Entry-level">Entry-level</option>
                <option value="Mid-level">Mid-level</option>
                <option value="Senior">Senior</option>
                <option value="Staff / Lead">Staff / Lead</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#26212A] mb-1">
              Job Description *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline role responsibilities and key technical deliverables..."
              className={`w-full rounded-lg border px-3 py-2 text-xs text-[#26212A] placeholder-[#99919C] focus:outline-none focus:ring-1 focus:ring-[#D94683] ${
                errors.description ? 'border-[#C24155] bg-[#FDF2F4]' : 'border-[#F0EBEF] bg-[#FFF9FB]'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-[11px] text-[#C24155]">{errors.description}</p>
            )}
          </div>

          {/* Required Skills */}
          <div>
            <label className="block text-xs font-semibold text-[#26212A] mb-1">
              Required Skills (comma separated) *
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. React, TypeScript, Next.js, Web Performance"
              className={`w-full rounded-lg border px-3 py-2 text-xs text-[#26212A] placeholder-[#99919C] focus:outline-none focus:ring-1 focus:ring-[#D94683] ${
                errors.skills ? 'border-[#C24155] bg-[#FDF2F4]' : 'border-[#F0EBEF] bg-[#FFF9FB]'
              }`}
            />
            {errors.skills && (
              <p className="mt-1 text-[11px] text-[#C24155]">{errors.skills}</p>
            )}
          </div>

          {/* Rubric Summary */}
          <div>
            <label className="block text-xs font-semibold text-[#26212A] mb-1">
              Evaluation Rubric Summary *
            </label>
            <textarea
              rows={2}
              value={rubricSummary}
              onChange={(e) => setRubricSummary(e.target.value)}
              placeholder="Describe what verifiable evidence reviewers should look for..."
              className={`w-full rounded-lg border px-3 py-2 text-xs text-[#26212A] placeholder-[#99919C] focus:outline-none focus:ring-1 focus:ring-[#D94683] ${
                errors.rubric ? 'border-[#C24155] bg-[#FDF2F4]' : 'border-[#F0EBEF] bg-[#FFF9FB]'
              }`}
            />
            {errors.rubric && (
              <p className="mt-1 text-[11px] text-[#C24155]">{errors.rubric}</p>
            )}
          </div>

          {/* Operational notice */}
          <div className="flex items-center gap-2 rounded-lg bg-[#FFF0F5] border border-[#F5D5E2] p-2.5 text-[11px] text-[#BE356D]">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#D94683]" />
            <span>
              Job opening will be added to the live operational pipeline in React state.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0EBEF]">
            <button
              type="button"
              onClick={() => setIsCreateJobModalOpen(false)}
              className="rounded-lg border border-[#F0EBEF] px-4 py-2 text-xs font-medium text-[#6F6873] hover:bg-[#FFF9FB] hover:text-[#26212A]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D94683] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#BE356D] focus:outline-none focus:ring-2 focus:ring-[#D94683]"
            >
              Create Position
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
