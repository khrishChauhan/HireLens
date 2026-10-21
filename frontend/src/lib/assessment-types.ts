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
  sessionId?: string;
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
  evidence_verified?: boolean | null;
  relevant_chunk_indices?: number[];
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

export interface RetrievalMetadata {
  total_chunks: number;
  chunk_size: number;
  chunk_overlap: number;
  embedding_model: string;
  verified_quotes_count: number;
  unverified_quotes_count: number;
  retrieval_strategy: string;
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
  retrieval_metadata?: RetrievalMetadata | null;
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

export interface AdaptiveQuestion {
  id: string;
  question: string;
  target_skill: string;
  reason: string;
  difficulty: 'foundational' | 'intermediate' | 'advanced';
  rubric: string;
  is_follow_up: boolean;
}

export interface CriterionScore {
  criterion: 'technical_correctness' | 'problem_solving' | 'relevance' | 'communication';
  score: number;
  feedback: string;
}

export interface AnswerEvaluationResponse {
  question_id: string;
  composite_score: number;
  percentage_score: number;
  criteria_scores: CriterionScore[];
  evidence_quote?: string | null;
  evidence_verified: boolean;
  strengths: string[];
  improvements: string[];
  overall_feedback: string;
  status: 'success';
}

export interface NextQuestionResponse {
  has_next_question: boolean;
  is_completed: boolean;
  next_question?: AdaptiveQuestion | null;
  decision_reason: string;
  remaining_budget: number;
  status: 'success';
}

export interface EvaluatedAnswerRecord {
  question: AdaptiveQuestion;
  answerText: string;
  evaluation: AnswerEvaluationResponse;
  timestamp: string;
}

export interface InterviewQuestion {
  id: number | string;
  topic: string;
  question: string;
  context: string;
  rubricFocus: string;
}

export interface InterviewAnswer {
  questionId: number | string;
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

export interface SessionFinalReport {
  resume_match_score: number;
  interview_composite_score: number;
  interview_percentage_score: number;
  report_markdown: string;
  created_at: string;
}

export interface SessionDetailResponse {
  session_id: string;
  status: string;
  stage: AssessmentStage;
  candidate_name?: string | null;
  candidate_title?: string | null;
  resume_data?: {
    name: string;
    extractedText: string;
    pageCount: number;
    characterCount: number;
    isExtracted: boolean;
  } | null;
  job_description?: string | null;
  analysis_result?: RealResumeAnalysisResponse | null;
  questions: AdaptiveQuestion[];
  evaluated_answers: EvaluatedAnswerRecord[];
  final_report?: SessionFinalReport | null;
  created_at: string;
  updated_at: string;
  api_status: 'success';
}
