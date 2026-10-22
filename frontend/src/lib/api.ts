/**
 * Centralized API client service for HireLens backend communication.
 */

import type {
  AdaptiveQuestion,
  AnswerEvaluationResponse,
  AssessmentStage,
  EvaluatedAnswerRecord,
  NextQuestionResponse,
  RealResumeAnalysisResponse,
  RequirementMatchItem,
  SessionDetailResponse,
} from './assessment-types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export interface ResumeExtractionResponse {
  filename: string;
  page_count: number;
  character_count: number;
  text: string;
  session_id?: string;
  status: 'success';
}

interface ApiErrorDetail {
  msg?: string;
  detail?: string | { msg?: string }[];
}

/**
 * Uploads a PDF file to the FastAPI /api/resumes/extract endpoint.
 * Sends multipart/form-data with the field named 'file'.
 * If sessionId is provided, links extracted resume to that session.
 */
export async function extractResume(
  file: File,
  sessionId?: string | null
): Promise<ResumeExtractionResponse> {
  const formData = new FormData();
  formData.append('file', file, file.name);
  if (sessionId) {
    formData.append('session_id', sessionId);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/resumes/extract`, {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error(
      `Unable to connect to the HireLens backend server at ${API_BASE_URL}. Please ensure FastAPI is running and reachable.`
    );
  }

  if (!response.ok) {
    let errorMessage = '';
    try {
      const errorJson = (await response.json()) as ApiErrorDetail;
      if (typeof errorJson.detail === 'string') {
        errorMessage = errorJson.detail;
      } else if (Array.isArray(errorJson.detail) && errorJson.detail[0]?.msg) {
        errorMessage = errorJson.detail[0].msg;
      }
    } catch {
      // Non-JSON response body
    }

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    if (response.status === 413) {
      throw new Error('File is too large. Maximum size is 5 MB.');
    }
    if (response.status === 422) {
      throw new Error(
        'No readable text was found. Scanned PDFs require OCR, which is not implemented yet.'
      );
    }
    if (response.status === 400) {
      throw new Error('Invalid PDF file or format. Please select another document.');
    }

    throw new Error(
      `Server returned an error (${response.status}): ${response.statusText || 'Request failed'}`
    );
  }

  return response.json() as Promise<ResumeExtractionResponse>;
}

/**
 * Verifies backend health and connectivity.
 */
export async function checkBackendHealth(): Promise<{ status: string; service: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
    return (await response.json()) as { status: string; service: string };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith('Health check failed')) {
      throw err;
    }
    throw new Error('Backend is currently offline or unreachable.');
  }
}

/**
 * Sends extracted resume text and target job description to the FastAPI /api/resumes/analyze endpoint.
 */
export async function analyzeResume(
  resumeText: string,
  jobDescription: string
): Promise<RealResumeAnalysisResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/resumes/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_description: jobDescription,
      }),
    });
  } catch {
    throw new Error(
      `Unable to connect to the HireLens backend server at ${API_BASE_URL}. Please ensure FastAPI is running and reachable.`
    );
  }

  if (!response.ok) {
    let errorMessage = '';
    try {
      const errorJson = (await response.json()) as ApiErrorDetail;
      if (typeof errorJson.detail === 'string') {
        errorMessage = errorJson.detail;
      } else if (Array.isArray(errorJson.detail) && errorJson.detail[0]?.msg) {
        errorMessage = errorJson.detail[0].msg;
      }
    } catch {
      // Non-JSON error body
    }

    if (errorMessage) {
      throw new Error(errorMessage);
    }

    if (response.status === 503) {
      throw new Error(
        'Groq API key is not configured. Please set GROQ_API_KEY in backend/.env.'
      );
    }
    if (response.status === 502) {
      throw new Error(
        'AI Provider error or rate limit reached. Please wait a few moments and try again.'
      );
    }
    if (response.status === 422) {
      throw new Error(
        'Resume text or job description does not meet the length requirements.'
      );
    }

    throw new Error(
      `Resume analysis failed with status ${response.status}. Please try again.`
    );
  }

  return (await response.json()) as RealResumeAnalysisResponse;
}

export interface QuestionGenerationPayload {
  job_description: string;
  candidate_name?: string;
  candidate_title?: string;
  candidate_projects?: string[];
  top_project_name?: string;
  top_project_description?: string;
  matched_requirements?: RequirementMatchItem[];
  partially_matched_requirements?: RequirementMatchItem[];
  unmatched_requirements?: RequirementMatchItem[];
  uncertainty_notes?: string[];
  target_count?: number;
}

export interface QuestionGenerationApiResponse {
  questions: AdaptiveQuestion[];
  total_generated: number;
  focus_areas: string[];
  status: 'success';
}

/**
 * Requests targeted interview questions based on resume analysis gaps and job requirements.
 */
export async function generateInterviewQuestions(
  payload: QuestionGenerationPayload
): Promise<QuestionGenerationApiResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/interviews/generate-questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      `Unable to connect to backend server at ${API_BASE_URL}. Ensure FastAPI is running.`
    );
  }

  if (!response.ok) {
    let errorDetail = 'Failed to generate interview questions.';
    try {
      const err = await response.json();
      if (err.detail) errorDetail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
    } catch {}
    throw new Error(errorDetail);
  }

  return (await response.json()) as QuestionGenerationApiResponse;
}

export interface AnswerEvaluationPayload {
  question_id: string;
  question_text: string;
  target_skill: string;
  rubric: string;
  candidate_answer: string;
}

/**
 * Evaluates candidate's answer against the question rubric with deterministic Python scoring.
 */
export async function evaluateInterviewAnswer(
  payload: AnswerEvaluationPayload
): Promise<AnswerEvaluationResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/interviews/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      `Unable to connect to backend server at ${API_BASE_URL}. Ensure FastAPI is running.`
    );
  }

  if (!response.ok) {
    let errorDetail = 'Failed to evaluate interview answer.';
    try {
      const err = await response.json();
      if (err.detail) errorDetail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
    } catch {}
    throw new Error(errorDetail);
  }

  return (await response.json()) as AnswerEvaluationResponse;
}

export interface NextQuestionPayload {
  session_id?: string;
  resume_text?: string;
  interview_history: {
    question_id: string;
    question_text: string;
    target_skill: string;
    candidate_answer: string;
    composite_score: number;
    is_follow_up?: boolean;
    stage?: string;
    acknowledgement?: string | null;
  }[];
  current_question: AdaptiveQuestion;
  last_answer: string;
  last_evaluation: AnswerEvaluationResponse;
  remaining_budget: number;
  max_budget: number;
  unaddressed_requirements?: string[];
  candidate_name?: string;
  candidate_projects?: string[];
  job_description?: string;
  target_role?: string;
}

/**
 * Dynamically determines whether to ask an adaptive follow-up or advance to an unaddressed requirement.
 */
export async function getNextInterviewQuestion(
  payload: NextQuestionPayload
): Promise<NextQuestionResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/interviews/next-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      `Unable to connect to backend server at ${API_BASE_URL}. Ensure FastAPI is running.`
    );
  }

  if (!response.ok) {
    let errorDetail = 'Failed to get next interview question.';
    try {
      const err = await response.json();
      if (err.detail) errorDetail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
    } catch {}
    throw new Error(errorDetail);
  }

  return (await response.json()) as NextQuestionResponse;
}

/**
 * Creates a new assessment session in the SQLite database.
 */
export async function createSession(data?: {
  candidate_name?: string;
  target_role?: string;
  resume_filename?: string;
  resume_text?: string;
}): Promise<SessionDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {}),
  });
  if (!response.ok) {
    throw new Error(`Failed to create assessment session (${response.status})`);
  }
  return response.json() as Promise<SessionDetailResponse>;
}

/**
 * Retrieves an existing assessment session and its complete state from SQLite.
 */
export async function getSession(sessionId: string): Promise<SessionDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`);
  if (!response.ok) {
    throw new Error(`Session not found or unavailable (${response.status})`);
  }
  return response.json() as Promise<SessionDetailResponse>;
}

/**
 * Persists resume analysis results to SQLite session.
 */
export async function saveSessionAnalysis(
  sessionId: string,
  analysisResult: RealResumeAnalysisResponse,
  jobDescription?: string
): Promise<SessionDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/analysis`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analysis_result: analysisResult,
      job_description: jobDescription,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to save resume analysis to session (${response.status})`);
  }
  return response.json() as Promise<SessionDetailResponse>;
}

/**
 * Persists generated technical questions to SQLite session.
 */
export async function saveSessionQuestions(
  sessionId: string,
  questions: AdaptiveQuestion[]
): Promise<SessionDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ questions }),
  });
  if (!response.ok) {
    throw new Error(`Failed to save interview questions to session (${response.status})`);
  }
  return response.json() as Promise<SessionDetailResponse>;
}

/**
 * Persists candidate answer submission and its evaluation to SQLite session.
 */
export async function saveSessionAnswer(
  sessionId: string,
  record: EvaluatedAnswerRecord
): Promise<SessionDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question: record.question,
      answer_text: record.answerText,
      evaluation: record.evaluation,
      timestamp: record.timestamp,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to save answer to session (${response.status})`);
  }
  return response.json() as Promise<SessionDetailResponse>;
}

/**
 * Updates the current session stage in SQLite.
 */
export async function updateSessionStage(
  sessionId: string,
  stage: AssessmentStage,
  status?: string
): Promise<SessionDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/stage`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stage, status }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update session stage (${response.status})`);
  }
  return response.json() as Promise<SessionDetailResponse>;
}

/**
 * Marks session complete and stores final report in SQLite.
 */
export async function completeSession(
  sessionId: string,
  payload: {
    report_markdown: string;
    resume_match_score?: number;
    interview_composite_score?: number;
    interview_percentage_score?: number;
  }
): Promise<SessionDetailResponse> {
  const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/complete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Failed to complete session (${response.status})`);
  }
  return response.json() as Promise<SessionDetailResponse>;
}

export interface RealtimeSessionPayload {
  session_id?: string | null;
  candidate_name?: string;
  candidate_title?: string;
  candidate_projects?: string[];
  top_project_name?: string;
  top_project_description?: string;
  job_description?: string;
  target_role?: string;
  remaining_budget?: number;
  max_budget?: number;
  voice?: string;
}

export interface RealtimeSessionApiResponse {
  status: 'active' | 'missing_credentials' | 'provider_error';
  client_secret?: string | null;
  session_id?: string | null;
  model: string;
  voice: string;
  instructions: string;
  provider: string;
  env_variable?: string | null;
  message?: string | null;
}

/**
 * Requests an ephemeral session token from backend for OpenAI Realtime WebRTC audio.
 */
export async function createRealtimeInterviewSession(
  payload: RealtimeSessionPayload
): Promise<RealtimeSessionApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/interviews/realtime-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetail = 'Failed to create real-time voice interview session.';
    try {
      const err = await response.json();
      if (err.detail) errorDetail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
    } catch {}
    throw new Error(errorDetail);
  }

  return response.json() as Promise<RealtimeSessionApiResponse>;
}



