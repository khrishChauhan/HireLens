/**
 * Centralized API client service for HireLens backend communication.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export interface ResumeExtractionResponse {
  filename: string;
  page_count: number;
  character_count: number;
  text: string;
  status: 'success';
}

interface ApiErrorDetail {
  msg?: string;
  detail?: string | { msg?: string }[];
}

/**
 * Uploads a PDF file to the FastAPI /api/resumes/extract endpoint.
 * Sends multipart/form-data with the field named 'file'.
 * Never sets manual Content-Type header to allow browser boundary injection.
 */
export async function extractResume(file: File): Promise<ResumeExtractionResponse> {
  const formData = new FormData();
  formData.append('file', file, file.name);

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
  } catch {
    throw new Error('Backend is currently offline or unreachable.');
  }
}
