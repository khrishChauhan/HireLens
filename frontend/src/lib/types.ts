export type JobStatus = 'Active' | 'Draft' | 'Paused' | 'Closed';

export type EmploymentType = 'Full-time' | 'Contract' | 'Part-time' | 'Internship';

export type ExperienceLevel = 'Entry-level' | 'Mid-level' | 'Senior' | 'Staff / Lead';

export interface Job {
  id: string;
  title: string;
  department: string;
  type: EmploymentType;
  location: string;
  candidatesCount: number;
  status: JobStatus;
  createdAt: string;
  description: string;
  requiredSkills: string[];
  experienceLevel: ExperienceLevel;
  rubricSummary: string;
}

export type CandidateStage = 'Applied' | 'Screening' | 'Interview' | 'Evaluation' | 'Decision';

export interface CandidateExperience {
  role: string;
  company: string;
  duration: string;
  highlights: string[];
}

export interface CandidateEducation {
  degree: string;
  institution: string;
  year: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: string;
  jobId: string;
  department: string;
  stage: CandidateStage;
  appliedDate: string;
  matchScore: number; // illustrative demo metric based on skill rubrics
  skills: string[];
  resumeFileName: string;
  resumeFileSize: string;
  experience: CandidateExperience[];
  education: CandidateEducation;
  interviewStatus: string;
  notes: string;
}

export type InterviewType = 
  | 'Technical Screen' 
  | 'System Architecture' 
  | 'Live Problem Solving' 
  | 'Domain & Culture Fit';

export type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateRole: string;
  jobTitle: string;
  date: string;
  time: string;
  type: InterviewType;
  status: InterviewStatus;
  interviewer: string;
  meetingRoom: string;
  notes?: string;
}

export interface RubricCriterion {
  score: number;
  max: number;
  notes: string;
}

export interface EvidenceExcerpt {
  topic: string;
  excerpt: string;
  analysis: string;
}

export interface Evaluation {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateRole: string;
  interviewDate: string;
  status: 'Pending Review' | 'Reviewed';
  overallScore: number;
  rubric: {
    technicalCorrectness: RubricCriterion;
    problemSolving: RubricCriterion;
    questionRelevance: RubricCriterion;
    communicationClarity: RubricCriterion;
  };
  evidenceExcerpts: EvidenceExcerpt[];
  reviewerNotes: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export type TeamRole = 'Admin' | 'Lead Recruiter' | 'Hiring Manager' | 'Technical Interviewer';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  department: string;
  status: 'Active' | 'Invited';
  avatarInitials: string;
  activeInterviewsCount: number;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  type: 'candidate' | 'interview' | 'evaluation' | 'job';
  title: string;
  description: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  type: 'interview' | 'evaluation' | 'candidate' | 'system';
}

export interface PipelineStageCount {
  stage: CandidateStage;
  count: number;
  description: string;
}
