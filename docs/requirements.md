# HireLens — Project Requirements

## 1. Project Overview

HireLens is an AI-powered recruitment intelligence platform that evaluates candidates against job-specific requirements using resume analysis, personalized technical interviews, and evidence-based scoring.

## 2. Problem Statement

Traditional resume screening relies heavily on self-reported skills and manual review. A resume alone cannot reliably demonstrate whether a candidate possesses the knowledge and abilities required for a role.

HireLens aims to help recruiters evaluate candidates more consistently by combining documented experience with demonstrated skills.

## 3. Target Users

- Recruiters who create job profiles and review candidate assessments.
- Candidates who upload resumes and participate in AI interviews.

## 4. Core Workflow

1. A recruiter creates a job profile with a job description, required skills, and evaluation rubrics.
2. A candidate uploads a PDF resume.
3. HireLens extracts candidate information and analyzes relevant skills, experience, and projects.
4. The system compares the candidate's documented evidence against the job requirements.
5. The system generates personalized interview questions.
6. The candidate participates in an adaptive AI interview.
7. HireLens evaluates answers using predefined rubrics and supporting evidence.
8. The system generates a final assessment report for recruiter review.

## 5. Functional Requirements

### Resume Analysis
- Accept PDF resumes.
- Extract skills, experience, education, and projects.
- Preserve evidence from the source document.
- Identify missing or uncertain information.

### Job Matching
- Accept job descriptions and required competencies.
- Compare candidate evidence against job requirements.
- Explain matches and gaps.
- Avoid treating keyword similarity as proof of competence.

### Interview Generation
- Generate questions based on the job description and candidate profile.
- Include technical and project-related questions.
- Define evaluation criteria for each question.

### Adaptive Interview
- Ask questions and receive candidate answers.
- Generate relevant follow-up questions based on previous answers.
- Evaluate technical correctness, reasoning, and answer relevance.
- Support voice interaction as an advanced capability.

### Assessment Reports
- Produce structured scores and explanations.
- Link evaluations to candidate answers and source evidence.
- Identify uncertainty and limitations.
- Support human review of recommendations.

## 6. AI and Engineering Requirements

- Use structured model outputs and input validation.
- Introduce Retrieval-Augmented Generation (RAG) where retrieval improves grounding.
- Use workflow orchestration for interview state and controlled agent execution.
- Expose selected authorized tools through Model Context Protocol (MCP).
- Evaluate the system using repeatable test datasets.
- Measure quality, latency, reliability, and inference cost.

## 7. Security and Responsible Use

- Protect candidate information and uploaded documents.
- Enforce access control between recruiters and candidates.
- Validate uploaded files and limit their size.
- Treat resume content as untrusted input.
- Avoid scoring candidates based on facial appearance or inferred personality.
- Keep consequential hiring decisions under human oversight.

## 8. Initial Scope

The first implementation targets software engineering recruitment.

Advanced capabilities will be added incrementally after the basic application and assessment workflow are working.

## 9. Success Criteria

Success will be measured using reproducible evaluations of resume extraction, job matching, retrieval quality, assessment consistency, workflow reliability, latency, and cost.

Performance improvements must be demonstrated against a defined baseline rather than assumed in advance.
