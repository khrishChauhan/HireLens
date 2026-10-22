# HireLens — Development Roadmap

## Phase 1: Project Foundation
- [x] Initialize Git repository.
- [x] Create project folder structure.
- [x] Define project requirements.
- [x] Document system architecture.
- [x] Finalize development roadmap.
- [x] Configure Git ignore rules.
- [x] Verify required development tools.

## Phase 2: Application Foundation
- [x] Initialize Next.js frontend with TypeScript.
- [x] Initialize FastAPI backend.
- [x] Configure environment variables.
- [x] Create a health-check endpoint.
- [x] Connect frontend to backend.
- [x] Verify both applications run locally.

## Phase 3: Database and Persistence (SQLite Session Engine)
- [x] Design and implement SQLite database schema with SQLAlchemy 2.x.
- [x] Dedicated backend data directory excluded from Git (`backend/data/`).
- [x] Tables for assessment sessions, resume analysis, questions, answers, and reports.
- [x] REST API endpoints for session creation, progress updates, and recovery.
- [x] Client session identifier and refresh restoration across all assessment stages.
- [x] Idempotent answer updates preventing duplicate submissions.
- [ ] Multi-tenant PostgreSQL and user authentication (future phase).

## Phase 4: Job Profiles, Resume Processing & RAG
- [x] Create and manage job descriptions.
- [x] Implement secure PDF upload with 5MB cap & magic-byte validation.
- [x] Extract resume text using pypdf.
- [x] Produce structured candidate profiles via Groq LPU inference.
- [x] Preserve source evidence and direct quotes.
- [x] Implement local RAG text chunking (configurable chunk_size & overlap).
- [x] Implement dense embeddings via FastEmbed (BAAI/bge-small-en-v1.5).
- [x] In-memory cosine similarity vector index with per-candidate isolation.
- [x] Programmatic quote verification against source resume text.

## Phase 5: Candidate Matching
- [x] Define evaluation rubrics with transparent scoring breakdown.
- [x] Compare candidate evidence with job requirements.
- [x] Generate explainable match reports with deterministic scoring.
- [ ] Establish a baseline evaluation dataset.

## Phase 6: Personalized Interview Planning
- [x] Generate job-specific questions prioritizing resume gaps.
- [x] Generate project-specific questions based on candidate evidence.
- [x] Define question-level evaluation criteria and rubrics.
- [x] Validate question quality via Groq JSON Schema mode.

## Phase 7: Natural, Conversational Technical Interview
- [x] Progressive conversational flow (Stage A warm-up -> Stage B project overview -> Stage C deep dive -> Stage D topic transition -> Stage E technical depth -> Stage F wrap-up).
- [x] Easy, open-ended warm-up questions without early algorithmic interrogation.
- [x] Contextual exploration of candidate's actual projects in their own words.
- [x] Technology-driven deep dives into components mentioned in candidate responses.
- [x] Natural topic transitions with concise interviewer acknowledgements ("Got it.", "That makes sense.", "Interesting. What made you choose that approach?").
- [x] Calibrated progressive difficulty (advanced depth for strong mastery, accessible guiding follow-ups for struggling responses).
- [x] Dynamic repetition prevention ensuring duplicate questions are never repeated.
- [x] SQLite session persistence of conversational stages, acknowledgements, and interview history.
- [x] Comprehensive test suite (55 backend unit/integration tests passing).
- [x] Add voice interaction (Phase 8 AI Voice Interviewer).

## Phase 8: Live Voice Interviewer (Browser Web Speech + Groq Adaptive Engine)
- [x] Dedicated, immersive voice-interview modal with centered, audio-reactive animated Orb.
- [x] Orb animation reacting to candidate microphone energy and interviewer speech.
- [x] Continuous conversational interaction with silence-based turn-taking (no "Submit Answer" button required each turn).
- [x] SpeechRecognition (STT) converting candidate microphone answers into text with substantive length validation (>= 20 chars).
- [x] SpeechSynthesis (TTS) vocalizing interviewer questions and acknowledgements in natural cadence.
- [x] Strict audio interlocking: microphone recognition is halted before assistant speech begins.
- [x] Zero extra paid API keys: reuses existing `GROQ_API_KEY` on backend for adaptive question generation and evaluation.
- [x] 8-state conversation machine (`idle`, `requesting_permission`, `listening`, `processing_answer`, `speaking`, `paused`, `error`, `completed`).
- [x] Minimalist controls: Mute, Pause/Resume, Repeat Question, Done Speaking, Text Mode, End Interview.
- [x] Slide-out glassmorphic transcript drawer displaying full conversational history and live 4-criteria Groq scorecards.
- [x] SQLite session persistence of confirmed candidate answers and evaluations.
- [x] Comprehensive test suites (59 backend pytest tests + 42 frontend tests passing).


## Phase 9: Final Reports and Evaluation
- [ ] Generate evidence-backed assessment reports.
- [ ] Evaluate scoring consistency.
- [ ] Measure retrieval quality and latency.
- [ ] Compare improvements against baselines.

## Phase 10: Production Readiness
- [ ] Add automated tests.
- [ ] Harden security and data protection.
- [ ] Add logging and monitoring.
- [ ] Configure CI/CD.
- [ ] Deploy frontend and backend.
- [ ] Document setup and operating procedures.
- [ ] Prepare a reproducible demonstration.

## Project Principle

Build incrementally, test each milestone, measure actual performance, and keep consequential hiring decisions under human oversight.
