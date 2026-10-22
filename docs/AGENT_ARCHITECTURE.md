# HireLens — Agentic AI Architecture & Evidence Grounding

## 1. Overview & Objective

HireLens has been upgraded from a sequential LLM prompting pipeline into a genuinely tool-using, evidence-grounded **Agentic AI Technical Interview System**.

Rather than passively relying on conversational heuristics or blind LLM generation, the interviewer agent operates in an active decision cycle:
1. **Observes** candidate answers and real-time performance scores.
2. **Selects and invokes** specialized evidence tools (`search_resume_evidence`, `get_interview_evidence`, `plan_next_interview_action`).
3. **Inspects verified observations** from local candidate-isolated RAG indexes and SQLite session history.
4. **Calibrates question difficulty and routing** based on verified facts versus candidate self-report.
5. **Enforces deterministic boundaries**: scoring formulas, question budgets, and execution safety remain under strict Python control.

```
+-----------------------------------------------------------------------------------+
|                            CANDIDATE INTERVIEW TURN                               |
|                  (Browser Voice Recognition / Text Mode Input)                    |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|               FastAPI Answer Evaluation (services/interview.py)                   |
|  - Groq 4-Criteria Assessment (Technical, Problem-Solving, Relevance, Comm)       |
|  - Deterministic Python Scoring Formula: composite_score = (s1 + s2 + s3 + s4) / 4|
|  - EvidenceVerifier: Programmatic Verbatim Quote Search                           |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|           AGENT DECISION LOOP: get_next_question (InterviewService)               |
|                                                                                   |
|  1. Session Scoping & Tool Context:                                               |
|     - Candidate Resume Text (SQLite or Payload)                                   |
|     - Multi-turn Transcript History & Verified Scores                             |
|     - Remaining Question Budget (Deterministic Python Guard)                      |
|                                                                                   |
|  2. Bounded Tool Cycle (Max 2 Iterations, Groq Tool Calling):                     |
|     +--------------------------------------------------------------------------+  |
|     |  Tool Registry (services/agent_tools.py)                                 |  |
|     |  - search_resume_evidence: Candidate-isolated RAG Vector Search & Quote  |  |
|     |                           Verification (Absence != Inability)            |  |
|     |  - get_interview_evidence: Prior turn search, score history, duplicate   |  |
|     |                           skill warning                                  |  |
|     |  - plan_next_interview_action: Validates strategy against budget & stage |  |
|     |                                (follow-up, deep dive, advance, wrap-up)  |  |
|     +--------------------------------------------------------------------------+  |
|     |  Guardrails: Repeated input detection, argument schema validation,       |  |
|     |              cycle limits, safe fallback on provider error               |  |
|     +--------------------------------------------------------------------------+  |
|                                                                                   |
|  3. Structured Decision Output:                                                   |
|     - Sanitized acknowledgement (1-4 words)                                       |
|     - Next progressive question (under 30 words, 1 question at a time)            |
|     - Safe User-Facing Agent Activities (action, summary, details, timestamp)     |
+------------------------------------------+----------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------+
|                        FRONTEND PRESENTATION & AUDIO                              |
|  - Live Voice Modal (ChatGPT-Style Orb + Subtitles + Real-Time Activity Pill)     |
|  - Transcript Drawer (Evidence Grounding Log + Scorecards + Normalized Terms)     |
|  - Text Mode (Adaptive Context + Real-Time Grounding Badges)                      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Agent Tools & Capabilities

All agent tools are defined in `backend/services/agent_tools.py` and registered with the `AgentToolRegistry`. Tools adhere to strict least-privilege principles: no arbitrary Python execution, no shell access, and strict candidate session isolation.

### Tool A: `search_resume_evidence`
- **Functionality**: Semantically indexes and searches the active candidate's resume using `TextChunker` and `VectorSearchIndex`. Verifies cited text against the original resume using `EvidenceVerifier`.
- **Inputs**:
  - `claim` (string, required): Specific technical claim, library, or architectural detail stated by candidate.
  - `technical_topic` (string, optional): Specific domain keyword (e.g., `FastAPI`, `PostgreSQL`, `Docker`).
- **Outputs**:
  - `found`: Boolean indicator.
  - `matched_keywords`: Exact keywords verified in resume.
  - `evidence_chunks`: Excerpts with character offsets (`start_char`, `end_char`, `chunk_index`, `relevance_score`).
  - `verified_quotes`: Verbatim verified quotations.
  - `notes`: Clear diagnostic notes.
- **Critical Policy**: Absence from the resume is explicitly documented as **not meaning the candidate lacks competence** (Absence $\ne$ Inability). It simply instructs the agent that the claim was not documented in the resume, prompting open-ended conversational exploration.

### Tool B: `get_interview_evidence`
- **Functionality**: Queries previously completed turns in the active session. Tracks covered skills and warns the agent if a skill is being tested repeatedly.
- **Inputs**:
  - `topic` (string, optional): Filter previous turns by topic or technology.
- **Outputs**:
  - `total_turns_completed`: Count of completed questions.
  - `skills_covered`: List of unique evaluated skills.
  - `repeated_skills`: List of skills evaluated more than once.
  - `average_score`: Composite average across prior turns.
  - `matching_turns`: Excerpts of previous questions, answers, and scores.
  - `warning`: Repetition warning when topics cycle.

### Tool C: `plan_next_interview_action`
- **Functionality**: Validates strategic interview routing against deterministic budget and stage rules before generating the question.
- **Supported Actions**:
  - `ask_follow_up`: Inquire deeper into ambiguous or incomplete candidate answers.
  - `investigate_claim`: Probe a specific technology or design claim mentioned in previous answers.
  - `increase_difficulty`: Candidate scored $\ge 3.8$; escalate to advanced trade-offs, concurrency, or latency hazards.
  - `change_topic`: Transition smoothly to unaddressed job requirements.
  - `wrap_up`: Conclude interview when remaining question budget reaches zero.
- **Deterministic Python Control**: If `remaining_budget <= 0`, this tool overrides any requested action to `wrap_up` with status `budget_exhausted`.

---

## 3. Bounded Agent Decision Loop & Guardrails

The agent loop in `InterviewService.get_next_question` operates under strict boundaries:

1. **Hard Budget Enforcement**: If `remaining_budget <= 0` or `current_total >= max_budget`, the service immediately concludes without making LLM calls.
2. **Bounded Iterations**: Tool execution is capped at a strict maximum of **2 cycles per decision turn**.
3. **Repeated Call Detection**: Every tool invocation signature `(tool_name, arguments_hash)` is tracked. Duplicate calls with identical parameters in the same turn are intercepted and returned with a cycle warning.
4. **Input Schema Validation**: All tool arguments are parsed through Pydantic schemas (`SearchResumeEvidenceInput`, etc.). Malformed arguments return structured error dictionaries to the model rather than raising uncaught exceptions.
5. **Provider Failure & Unsupported Model Fallback**: If Groq tool calling fails or the model returns an unexpected payload, the loop catches the exception and safely executes the direct structured-output fallback (`RawLLMNextQuestionDecision`).
6. **No Prompt Leaks**: Private chain-of-thought, system prompts, and raw API keys are never exposed in user-facing activity logs (`AgentActivity`). Only clean, user-friendly summaries are sent to the frontend.

---

## 4. Evidence Grounding & Progressive Flow

The interview maintains human conversational pacing across progressive stages:
- **Stage A (Warm-Up)**: Open-ended background introduction.
- **Stage B (Project Overview)**: Candidate describes their software project in their own words.
- **Stage C (Project Deep Dive)**: Focused inquiry into candidate's personal architectural choices and trade-offs.
- **Stage D (Topic Transition)**: Natural transition to unaddressed requirements from the job description.
- **Stage E (Technical Depth)**: Difficulty calibration based on demonstrated answers (supportive clarifying questions for $<3.0$, advanced trade-offs for $\ge 3.8$).
- **Stage F (Wrap-Up)**: Polite conclusion when budget is exhausted.

---

## 5. Frontend Activity Visualization

Both Live Voice Mode (`ChatGPTVoiceModal.tsx`) and Text Mode (`StageInterview.tsx`) expose real-time activity events:
- **Header Badge**: Displays real-time agent activity pills (e.g., `🔍 Checked resume evidence for 'FastAPI'`).
- **Transcript Drawer**: Dedicated "Agent Evidence Grounding" log showing timestamps, actions, and verified excerpts.
- **Interactive Controls**: Preserves candidate voice controls, inline transcript editing, technical-term normalization, and seamless switching between text and voice.

---

## 6. Verification & Test Evidence

All automated test suites pass cleanly:
- **Backend**: `80 passed, 0 failed` across `test_agent_tools.py`, `test_interview.py`, `test_rag.py`, `test_session.py`, `test_analysis.py`, `test_extraction.py`, `test_realtime.py`.
- **Frontend**: `87 passed, 0 failed` across `agent-activity.test.ts`, `live-voice-interview.test.ts`, `technical-corrections.test.ts`, `voice-interviewer.test.ts`, `realtime-voice.test.ts`.
- **TypeScript**: `0 errors` (`npx tsc --noEmit`).
- **Lint**: `0 warnings` (`npm run lint`).
- **Production Build**: Successful static and client bundle compilation with Next.js 16.4.2 Turbopack.
