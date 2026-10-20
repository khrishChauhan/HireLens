export type AssessmentStage = 'upload' | 'analyzing' | 'analysis' | 'interview' | 'evaluating' | 'results';

export interface ResumeData {
  file: File | null;
  name: string;
  size: string;
  rawSize: number;
  extractedText?: string;
  pageCount?: number;
  characterCount?: number;
  isExtracted?: boolean;
}

export interface ExperienceHighlight {
  role: string;
  company: string;
  duration: string;
  evidence: string;
}

export interface SkillCategoryItem {
  category: string;
  skills: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  year?: string | null;
}

export interface WorkExperienceItem {
  role: string;
  company: string;
  duration: string;
  description: string;
  key_achievements?: string[];
}

export interface ProjectItem {
  name: string;
  description: string;
  technologies?: string[];
}

export interface RequirementMatchItem {
  requirement: string;
  status: 'matched' | 'partially_matched' | 'not_demonstrated';
  evidence?: string | null;
  explanation: string;
  is_inferred: boolean;
}

export interface ScoringBreakdown {
  total_requirements: number;
  matched_count: number;
  partially_matched_count: number;
  not_demonstrated_count: number;
  raw_points: number;
  max_possible_points: number;
  percentage: number;
  formula: string;
  limitations: string;
}

export interface RealResumeAnalysisResponse {
  candidate_name: string;
  candidate_title: string;
  profile_summary: string;
  skills_by_category: SkillCategoryItem[];
  all_skills: string[];
  education: EducationItem[];
  work_experience: WorkExperienceItem[];
  projects: ProjectItem[];
  job_requirements: string[];
  matched_requirements: RequirementMatchItem[];
  partially_matched_requirements: RequirementMatchItem[];
  unmatched_requirements: RequirementMatchItem[];
  match_score: number;
  scoring_breakdown: ScoringBreakdown;
  uncertainty_notes: string[];
  status: 'success';
}

export interface ResumeAnalysis {
  candidateName: string;
  matchedRole: string;
  matchScore: number;
  roleSummary: string;
  extractedSkills: string[];
  extractedTechnologies: string[];
  experienceHighlights: ExperienceHighlight[];
  matchingRequirements: string[];
  unverifiedRequirements: string[];
  matchRationale: string;
}

export interface InterviewQuestion {
  id: number;
  topic: string;
  question: string;
  context: string;
  rubricFocus: string;
}

export interface InterviewAnswer {
  questionId: number;
  questionText: string;
  topic: string;
  answerText: string;
  timestamp: string;
}

export interface SkillCategoryScore {
  category: string;
  score: number;
  max: number;
  percentage: number;
  notes: string;
}

export interface EvidenceFinding {
  topic: string;
  answerExcerpt: string;
  analysis: string;
}

export interface RecommendedStudy {
  topic: string;
  reason: string;
}

export interface AssessmentResult {
  candidateName: string;
  matchedRole: string;
  overallScore: number;
  maxScore: number;
  percentile: string;
  evaluatedAt: string;
  skillBreakdown: SkillCategoryScore[];
  strengths: string[];
  areasToImprove: string[];
  evidenceFindings: EvidenceFinding[];
  recommendedLearning: RecommendedStudy[];
}
