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
