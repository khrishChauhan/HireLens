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

## 4. Progressive Conversational Interview Workflow

HireLens implements a realistic, conversational software engineering interview flow:

1. **Progressive Conversational Stages:**
   - **Stage A — Introduction & Warm-Up:** Easy, open-ended warm-up question establishing conversational comfort, recent focus, and engineering trajectory (foundational difficulty).
   - **Stage B — Project Overview:** Asks the candidate to walk through their most relevant software project in their own words, explaining the core problem solved, high-level architecture, and individual ownership (foundational difficulty).
   - **Stage C — Project Deep Dive:** Probes specific technologies, libraries, or architectural patterns the candidate explicitly mentioned in their project overview (e.g., RAG, SQLite, Kafka, Redis, FastAPI). Asks why they chose that approach and their specific implementation role before exploring lower-level nuances.
   - **Stage D — Topic Transition:** Acknowledges the candidate's answer naturally (*"That makes sense."*, *"Got it."*) and transitions smoothly to unaddressed role requirements from the job description.
   - **Stage E — Technical Depth:** Adjusts technical difficulty dynamically: probes production trade-offs, latency, and edge cases (advanced) for strong answers, or offers guiding, clarifying questions for incomplete responses.
   - **Stage F — Wrap-Up:** Concludes when the question budget is met, presenting objective evaluation and verified evidence findings.

2. **Interviewer Personality & Tone:**
   - Professional, curious, patient, and conversational.
   - Employs short, natural acknowledgements (*"Got it."*, *"Interesting. What made you choose that approach?"*, *"Could you walk me through that part?"*).
   - Avoids robotic repetition, excessive flattery, and giving away expected answers.

3. **Rigorous Objective Evaluation (`POST /api/interviews/evaluate`):**
   - Evaluates technical responses against 4 criteria (`technical_correctness`, `problem_solving`, `relevance`, `communication`) on a 1.0–5.0 scale.
   - Deterministic arithmetic mean in Python maps composite scores to percentages.
   - Programmatically verifies evidence quotations against submitted answer text.

4. **Dynamic Next-Question Routing (`POST /api/interviews/next-question`):**
   - Dynamically analyzes latest answer, conversation depth, and remaining budget.
   - Enforces question deduplication and hard question budgets.
   - Persists conversational stages and acknowledgements in SQLite across browser refreshes.

## 5. Live Voice Interviewer Architecture (Phase 8)

HireLens provides a ChatGPT-style live voice interview interface powered by browser-native Web Speech APIs combined with the existing Groq-powered adaptive interview engine:

1. **Browser Web Speech API + Groq Intelligence Integration:**
   - **Speech Recognition (STT):** Uses browser `SpeechRecognition` / `webkitSpeechRecognition` with continuous listening and interim results to capture candidate microphone answers. A 2.6-second silence detector automatically triggers turn evaluation on substantive responses ($\ge 20$ characters), providing a natural hands-free conversational loop without requiring a "Submit Answer" button after each turn.
   - **Speech Synthesis (TTS):** Uses browser `SpeechSynthesis` to vocalize interviewer questions and acknowledgements aloud in clear, natural cadence (rate: `0.98`, pitch: `1.0`), stripping markdown code blocks and symbols prior to vocalization.
   - **Adaptive Groq Backend:** Reuses the existing FastAPI backend (`POST /api/interviews/evaluate-answer` and `POST /api/interviews/next-question`) powered by Groq `llama-3.3-70b-versatile`, RAG vector evidence verification, and SQLite session persistence.
   - **Architecture Clarification:** Groq text APIs do not provide raw audio transport. This implementation combines browser-native speech recognition and synthesis with Groq adaptive intelligence, requiring **zero extra paid API providers or OpenAI keys**.

2. **Audio Interlocking & Echo Prevention:**
   - Microphone recognition is strictly stopped before any speech synthesis vocalization begins.
   - After question playback completes (`utterance.onend`), microphone recognition automatically resumes.
   - Immediate audio cancellation is executed upon pausing, switching to Text Mode, or exiting.

3. **Audio-Reactive Centered Orb & UI:**
   - The primary visual interface is a centered, glowing Orb animated with HTML5 Canvas and CSS fluid gradients.
   - Web Audio API dual `AnalyserNode` meters candidate microphone frequency volume, scaling the Orb dynamically ($1.0\times$ to $1.25\times$) with harmonic wave ripples.
   - Clear 8-state machine: `idle`, `requesting_permission`, `listening`, `processing_answer`, `speaking`, `paused`, `error`, `completed`.
   - Minimalist overlay controls for Mute, Pause/Resume, Repeat Question, Done Speaking, Text Mode, and End Interview.
   - Slide-out glassmorphic drawer displaying full conversational transcript history and live 4-criteria Groq scorecards.

4. **Preservation of Evaluation Integrity & SQLite Persistence:**
   - Only finalized candidate transcripts ($\ge 20$ characters) are submitted for evaluation. Interim or partial results are never submitted prematurely.
   - Scores are computed via deterministic Python arithmetic across 4 criteria on a 1.0–5.0 scale with evidence quotation verification.
   - Confirmed candidate turns and evaluations are persisted in SQLite (`hirelens.db`).


## 6. Reliability and Security

- Validate all incoming requests and model outputs.
- Restrict access to candidate records by role and ownership.
- Store secrets in environment variables rather than source code.
- Treat uploaded documents as untrusted input.
- Add timeouts, error handling, and retries where appropriate.
- Record relevant evaluation events for debugging and auditing.
- Require human review for consequential hiring decisions.

## 7. Architectural Principle

Start with a small, working implementation. Add RAG, workflow orchestration, voice interaction, and MCP incrementally, and retain each capability only when it provides a measurable benefit.
