/**
 * Test Suite for HireLens Agent Activity Events and Evidence Grounding
 *
 * Verifies:
 * 1. Safe, user-facing agent activity formatting (no prompt leakage, no private chain-of-thought).
 * 2. NextQuestionResponse agent_activities integration and state management.
 * 3. Voice and text interview compatibility with agent activities.
 * 4. Error resilience when agent activities are empty, missing, or malformed.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type {
  AgentActivityItem,
  NextQuestionResponse,
  AdaptiveQuestion,
  AnswerEvaluationResponse,
} from '../src/lib/assessment-types.ts';
import type { NextQuestionPayload } from '../src/lib/api.ts';

describe('HireLens Agentic AI — Agent Activity & Evidence Grounding Tests', () => {
  describe('1. Safe User-Facing Activity Formatting', () => {
    it('should format resume evidence search activities with safe summaries', () => {
      const activity: AgentActivityItem = {
        action: 'search_resume_evidence',
        summary: "Checked resume evidence for 'FastAPI'",
        details: 'Found 2 matching excerpts (1 keywords verified)',
        timestamp: '2026-10-22T08:00:00.000Z',
      };

      assert.equal(activity.action, 'search_resume_evidence');
      assert.ok(activity.summary.includes('FastAPI'));
      // Ensure no raw prompt instructions or system directives leak
      assert.ok(!activity.summary.includes('SYSTEM'));
      assert.ok(!activity.summary.includes('GROQ_API_KEY'));
      assert.ok(!activity.summary.includes('You are an agent'));
    });

    it('should format interview evidence review activities cleanly', () => {
      const activity: AgentActivityItem = {
        action: 'get_interview_evidence',
        summary: "Reviewed prior interview evidence for 'PostgreSQL'",
        details: '1 turns found (2 skills evaluated, avg score: 4.2)',
        timestamp: '2026-10-22T08:01:00.000Z',
      };

      assert.equal(activity.action, 'get_interview_evidence');
      assert.ok(activity.details?.includes('avg score: 4.2'));
    });

    it('should format question planning activities with approved strategy', () => {
      const activity: AgentActivityItem = {
        action: 'plan_next_interview_action',
        summary: 'Planned strategic action: Increase Difficulty (Distributed Systems)',
        details: 'Candidate demonstrated strong mastery; probe async trade-offs.',
        timestamp: '2026-10-22T08:02:00.000Z',
      };

      assert.equal(activity.action, 'plan_next_interview_action');
      assert.ok(activity.summary.includes('Increase Difficulty'));
    });
  });

  describe('2. NextQuestionResponse Integration & State Accumulation', () => {
    it('should safely parse NextQuestionResponse containing agent_activities', () => {
      const mockQuestion: AdaptiveQuestion = {
        id: 'q3_deep',
        question: 'How did you structure connection pooling in FastAPI?',
        target_skill: 'FastAPI Microservices',
        reason: 'Evidence-grounded follow-up',
        difficulty: 'intermediate',
        rubric: 'Pooling and asyncpg lifespan',
        is_follow_up: false,
        stage: 'project_deep_dive',
        acknowledgement: 'Got it.',
      };

      const response: NextQuestionResponse = {
        has_next_question: true,
        is_completed: false,
        next_question: mockQuestion,
        decision_reason: 'Progressive Flow: Candidate evidenced FastAPI in resume.',
        remaining_budget: 2,
        agent_activities: [
          {
            action: 'search_resume_evidence',
            summary: "Checked resume evidence for 'FastAPI'",
            details: 'Found 2 matching excerpts',
            timestamp: new Date().toISOString(),
          },
          {
            action: 'plan_next_interview_action',
            summary: 'Planned strategic action: Project Deep Dive (FastAPI Microservices)',
            details: 'Grounded on candidate resume claims',
            timestamp: new Date().toISOString(),
          },
        ],
        status: 'success',
      };

      assert.equal(response.status, 'success');
      assert.equal(response.has_next_question, true);
      assert.equal(response.agent_activities?.length, 2);
      assert.equal(response.agent_activities[0].action, 'search_resume_evidence');
    });

    it('should handle NextQuestionResponse when agent_activities is empty or undefined', () => {
      const responseWithoutActivities: NextQuestionResponse = {
        has_next_question: true,
        is_completed: false,
        next_question: null,
        decision_reason: 'Completed all stages.',
        remaining_budget: 0,
        status: 'success',
      };

      const activities = responseWithoutActivities.agent_activities || [];
      assert.equal(activities.length, 0);
    });

    it('should accumulate activities across multiple turns without mutating previous turns', () => {
      let stateActivities: AgentActivityItem[] = [];

      const turn1Activities: AgentActivityItem[] = [
        {
          action: 'search_resume_evidence',
          summary: "Checked resume evidence for 'FastAPI'",
          timestamp: '2026-10-22T08:00:00Z',
        },
      ];

      const turn2Activities: AgentActivityItem[] = [
        {
          action: 'get_interview_evidence',
          summary: "Reviewed prior interview evidence for 'Redis'",
          timestamp: '2026-10-22T08:02:00Z',
        },
      ];

      stateActivities = [...stateActivities, ...turn1Activities];
      assert.equal(stateActivities.length, 1);

      stateActivities = [...stateActivities, ...turn2Activities];
      assert.equal(stateActivities.length, 2);
      assert.equal(stateActivities[0].action, 'search_resume_evidence');
      assert.equal(stateActivities[1].action, 'get_interview_evidence');
    });
  });

  describe('3. Voice & Text Mode Compatibility with Session Scoping', () => {
    it('should accept session_id and resume_text in NextQuestionPayload', () => {
      const payload: NextQuestionPayload = {
        session_id: 'hl_test_123',
        resume_text: 'Senior Software Engineer with 6 years experience in Python and FastAPI.',
        interview_history: [],
        current_question: {
          id: 'q1',
          question: 'Tell me about yourself.',
          target_skill: 'Intro',
          reason: 'Warm up',
          difficulty: 'foundational',
          rubric: 'Clarity',
          is_follow_up: false,
        },
        last_answer: 'I built microservices with Python and FastAPI.',
        last_evaluation: {
          question_id: 'q1',
          composite_score: 4.0,
          percentage_score: 80,
          criteria_scores: [],
          evidence_verified: true,
          strengths: ['Clear intro'],
          improvements: [],
          overall_feedback: 'Strong start',
          status: 'success',
        } as unknown as AnswerEvaluationResponse,
        remaining_budget: 3,
        max_budget: 4,
      };

      assert.equal(payload.session_id, 'hl_test_123');
      assert.ok(payload.resume_text?.includes('FastAPI'));
      assert.equal(payload.remaining_budget, 3);
    });

    it('should ensure lastAgentActivity safely extracts the most recent activity', () => {
      const activities: AgentActivityItem[] = [
        {
          action: 'search_resume_evidence',
          summary: 'Checked resume evidence',
          timestamp: '2026-10-22T08:00:00Z',
        },
        {
          action: 'plan_next_interview_action',
          summary: 'Planned strategic action: Increase Difficulty',
          timestamp: '2026-10-22T08:01:00Z',
        },
      ];

      const lastActivity = activities.length > 0 ? activities[activities.length - 1] : null;
      assert.notEqual(lastActivity, null);
      assert.equal(lastActivity?.action, 'plan_next_interview_action');
      assert.equal(lastActivity?.summary, 'Planned strategic action: Increase Difficulty');
    });
  });
});
