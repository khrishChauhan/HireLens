# HireLens — System Architecture

## 1. Architecture Overview

HireLens follows a frontend-backend architecture with a dedicated AI processing layer.

- Frontend: Next.js and TypeScript.
- Backend: Python and FastAPI.
- Database: PostgreSQL.
- Authentication and storage: Supabase, subject to configuration.
- AI models: Groq Cloud LPU (`openai/gpt-oss-120b`) with JSON Schema structured outputs.
- Workflow orchestration: Client state coordinator (planned LangGraph for multi-turn interview branching).
- Retrieval-Augmented Generation: Local FastEmbed ONNX (`BAAI/bge-small-en-v1.5`), in-memory cosine vector index, and programmatic quote verification.
- Tool integration: Model Context Protocol (MCP, planned).

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
Coordinates application logic, document processing, AI calls, and SQLite session persistence.

### Database (SQLite & SQLAlchemy 2.x)
Provides transactional session persistence and refresh recovery for local development:
- **`assessment_sessions`**: Primary entity tracking overall progress across the 4 stages (`upload`, `analysis`, `interview`, `results`), candidate name, target role, and timestamps.
- **`analysis_results`**: Persists RAG-grounded resume analysis output (`LLMAnalysisOutput`), match scores, and requirements matrix.
- **`interview_questions`**: Persists generated questions, evaluation rubrics, target skills, difficulty, and order index with deduplication.
- **`candidate_answers`**: Stores submitted candidate answers, deterministic composite & percentage scores, criterion ratings, and verified answer quotations.
- **`final_reports`**: Stores final assessment reports in Markdown with overall scores and evaluation audits.

Configured via `DATABASE_URL` (defaults to `sqlite:///./data/hirelens.db`).

### Resume Processing
Extracts text from uploaded PDF files and produces structured candidate information with source evidence.

### AI Workflow
Coordinates resume analysis, personalized question generation, answer evaluation, follow-up decisions, and final report generation.

### Retrieval Layer (RAG)
Chunks extracted resume text, computes 384-dimensional dense embeddings via local FastEmbed ONNX models (`BAAI/bge-small-en-v1.5`), builds an ephemeral in-memory cosine index per request, retrieves relevant evidence chunks for each requirement, and programmatically verifies evidence quotations against the original document text.

### MCP Server
Exposes selected recruitment tools through standardized interfaces with explicit authorization and input validation.

## 4. Interview Workflow (Live Adaptive Engine)

1. **Question Synthesis (`POST /api/interviews/generate-questions`):** Formulates initial scenario questions by prioritizing `partially_matched_requirements`, `unmatched_requirements`, and `uncertainty_notes` from Stage 2 RAG analysis.
2. **Answer Submission & Evaluation (`POST /api/interviews/evaluate`):** Evaluates candidate responses against 4 criteria (`technical_correctness`, `problem_solving`, `relevance`, `communication`) on a 1.0–5.0 scale, verified using deterministic Python arithmetic mean and programmatic quote verification.
3. **Adaptive Routing (`POST /api/interviews/next-question`):** Evaluates whether to ask a targeted follow-up question for answers with gaps or transition to an unaddressed requirement while enforcing a bounded question budget.
4. **Final Assessment Audit Report:** Generates a dual-score report clearly separating Resume Evidence Alignment (0–100%) from Technical Interview Performance (1.0–5.0 / 0–100%) with human-oversight disclaimers.

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
