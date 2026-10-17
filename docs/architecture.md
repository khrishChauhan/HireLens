# HireLens — System Architecture

## 1. Architecture Overview

HireLens follows a frontend-backend architecture with a dedicated AI processing layer.

- Frontend: Next.js and TypeScript.
- Backend: Python and FastAPI.
- Database: PostgreSQL.
- Authentication and storage: Supabase, subject to configuration.
- AI models: Local models through Ollama where supported.
- Workflow orchestration: LangGraph.
- Retrieval-Augmented Generation: Embeddings and pgvector.
- Tool integration: Model Context Protocol (MCP).

## 2. High-Level Request Flow

1. A user interacts with the Next.js frontend.
2. The frontend sends authenticated requests to the FastAPI backend.
3. The backend validates permissions and input.
4. The backend reads or writes permitted data in PostgreSQL.
5. AI services process resume content, retrieve relevant context, or evaluate interview answers.
6. The backend validates the AI output and saves assessment results.
7. The frontend displays the result to the authorized user.

## 3. Main Components

### Frontend
Provides recruiter and candidate interfaces, resume upload, interview interaction, and assessment reports.

### Backend API
Coordinates application logic, authentication checks, document processing, AI calls, and persistence.

### Database
Stores users, jobs, candidate profiles, interview sessions, rubrics, evaluation results, and audit events.

### Resume Processing
Extracts text from uploaded PDF files and produces structured candidate information with source evidence.

### AI Workflow
Coordinates resume analysis, personalized question generation, answer evaluation, follow-up decisions, and final report generation.

### Retrieval Layer
Retrieves relevant job requirements, technical references, and evaluation rubrics to ground model outputs.

### MCP Server
Exposes selected recruitment tools through standardized interfaces with explicit authorization and input validation.

## 4. Interview Workflow

1. Create an interview session for a candidate and job.
2. Generate questions from the job requirements, candidate evidence, and rubrics.
3. Present a question and receive the candidate's answer.
4. Evaluate the answer against the relevant rubric.
5. Decide whether to ask a follow-up question or proceed.
6. Persist the session state and evaluation evidence.
7. Generate a final report when the interview ends.

## 5. Reliability and Security

- Validate all incoming requests and model outputs.
- Restrict access to candidate records by role and ownership.
- Store secrets in environment variables rather than source code.
- Treat uploaded documents as untrusted input.
- Add timeouts, error handling, and retries where appropriate.
- Record relevant evaluation events for debugging and auditing.
- Require human review for consequential hiring decisions.

## 6. Architectural Principle

Start with a small, working implementation. Add RAG, workflow orchestration, voice interaction, and MCP incrementally, and retain each capability only when it provides a measurable benefit.
