# HireLens — AI-Powered Recruitment Intelligence

**Beyond Resumes. Proving Skills.**

HireLens is an AI-powered recruitment platform designed to help recruiters evaluate software engineering candidates through evidence-based resume analysis and personalized, adaptive technical interviews.

Rather than relying solely on resume keywords, HireLens connects documented candidate experience with demonstrated skills through structured assessments and explainable evaluation.

## Core Features

- **Resume Intelligence:** Extract candidate skills, experience, education, and projects from PDF resumes.
- **Job Matching:** Compare candidate evidence against job-specific requirements.
- **Personalized Interviews:** Generate questions based on the candidate's resume and target role.
- **Adaptive AI Interviewing:** Ask follow-up questions based on previous answers.
- **Evidence-Based Evaluation:** Assess technical correctness, reasoning, and answer relevance using predefined rubrics.
- **Retrieval-Augmented Generation (RAG):** Ground AI assessments in relevant job requirements and evaluation criteria.
- **Agentic Workflows:** Coordinate multi-step AI tasks with validation and controlled execution.
- **Model Context Protocol (MCP):** Provide standardized access to authorized recruitment tools.
- **Assessment Reports:** Produce transparent reports with supporting evidence and uncertainty.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| AI Models | Local LLMs through Ollama, where supported |
| Workflow Orchestration | LangGraph |
| Retrieval | Embeddings, pgvector, RAG |
| Tool Integration | MCP |
| Testing | Pytest, Playwright |
| Version Control | Git, GitHub |

## Candidate Workflow

1. Recruiter creates a job profile and defines evaluation criteria.
2. Candidate uploads a resume.
3. HireLens extracts and analyzes candidate evidence.
4. The system generates a personalized interview plan.
5. Candidate completes an adaptive AI interview.
6. HireLens evaluates responses against predefined rubrics.
7. A final evidence-backed assessment report is generated for recruiter review.

## Project Status

Currently in the foundation and environment setup stage.

Features will be implemented incrementally, tested, and evaluated before being considered complete.

## Evaluation Strategy

HireLens will be evaluated using reproducible test datasets and metrics covering resume extraction, candidate matching, retrieval quality, assessment consistency, latency, reliability, and inference cost.

Performance improvements will be reported only after measuring them against a defined baseline.

## Responsible AI

HireLens is designed to support human decision-making rather than autonomously determine hiring outcomes. Assessments should be grounded in job-relevant evidence, with appropriate privacy, security, and fairness safeguards.

## Development

The project is being developed incrementally, beginning with the application foundation and progressing toward AI-powered assessment, adaptive interviewing, evaluation, and deployment.

Detailed documentation is available in the `docs/` directory.

## License

A license will be selected before public release.
