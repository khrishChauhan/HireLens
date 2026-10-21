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

## Phase 7: Adaptive AI Interview
- [x] Implement interview session state and bounded question budget.
- [x] Evaluate candidate answers against 4-criterion rubrics.
- [x] Generate adaptive follow-up questions for ambiguous responses.
- [x] Validate cited evidence quotations against submitted answer text.
- [x] Present dual scores (Resume Alignment vs Interview Performance).
- [ ] Add voice interaction.

## Phase 8: Advanced AI Architecture
- [x] Implement RAG and retrieval evaluation (FastEmbed, in-memory cosine index, quote verification).
- [ ] Add workflow orchestration with LangGraph.
- [ ] Add an MCP server and authorized tools.
- [ ] Add validation, retries, and failure handling.

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
