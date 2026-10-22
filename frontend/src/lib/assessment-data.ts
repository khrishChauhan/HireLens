import {
  ResumeAnalysis,
  InterviewQuestion,
  AssessmentResult,
} from './assessment-types';

export const SAMPLE_ANALYSIS_PREVIEW: ResumeAnalysis = {
  candidateName: 'Alex Vance',
  matchedRole: 'Senior Full-Stack & Distributed Systems Engineer',
  matchScore: 94,
  roleSummary:
    'High alignment with Senior Engineering requirements, demonstrating strong ownership across modern React/TypeScript frontends and high-throughput Python/FastAPI microservices.',
  extractedSkills: [
    'React',
    'TypeScript',
    'Next.js',
    'Tailwind CSS',
    'Python',
    'FastAPI',
    'PostgreSQL',
    'Redis',
    'Distributed Systems',
    'Docker',
    'REST APIs',
    'System Architecture',
  ],
  extractedTechnologies: [
    'React 19',
    'Next.js App Router',
    'FastAPI',
    'SQLAlchemy / Alembic',
    'Redis Caching',
    'Docker Compose',
    'GitOps',
    'Playwright',
  ],
  experienceHighlights: [
    {
      role: 'Senior Software Engineer',
      company: 'Apex Cloud Platforms',
      duration: '2023 — Present',
      evidence:
        'Architected asynchronous data processing microservices in FastAPI and redesigned client dashboard in Next.js, achieving a 42% reduction in p99 page load times.',
    },
    {
      role: 'Full-Stack Developer',
      company: 'Vanguard Systems',
      duration: '2020 — 2023',
      evidence:
        'Led migration from monolithic views to component-driven React architecture with strict TypeScript types, WCAG AA accessibility, and automated CI pipelines.',
    },
  ],
  matchingRequirements: [
    '5+ years professional experience designing and maintaining production web applications',
    'Proficiency in React, modern TypeScript, and state management patterns',
    'Demonstrated backend API engineering in Python (FastAPI / asynchronous frameworks)',
    'Experience optimizing relational schemas and query latency in PostgreSQL',
    'Proven track record with containerized deployment and system observability',
  ],
  unverifiedRequirements: [
    'Hands-on Kubernetes cluster orchestration in production (flagged for interview focus)',
    'Experience managing cross-regional database read replicas',
  ],
  matchRationale:
    'Resume shows deep technical ownership across modern frontend and backend architectures, with verifiable evidence of latency optimization, scalable API design, and clean component systems.',
};

export const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
  {
    id: 1,
    topic: 'Engineering Background & Introduction',
    context:
      'Warm-up introduction to establish conversational comfort and recent engineering focus',
    question:
      'To kick things off, could you tell me a little about yourself, your engineering background, and what you’ve been working on recently?',
    rubricFocus:
      'Evaluates clarity of self-introduction, engineering trajectory, communication structure, and current technical focus.',
  },
  {
    id: 2,
    topic: 'Project Architecture & Problem Context',
    context:
      'Exploring candidate project experience and problem-solving context in their own words',
    question:
      'Could you walk me through a major software project you built recently? What was the core problem you were trying to solve, and what was your primary architectural role?',
    rubricFocus:
      'Assesses ability to clearly articulate problem domain, project rationale, high-level architecture, and individual ownership without buzzwords.',
  },
  {
    id: 3,
    topic: 'Project Deep Dive & Technical Trade-Offs',
    context:
      'Probing architectural choices, technologies, and personal ownership from the project',
    question:
      'In that project, what were the most critical technical choices or trade-offs you personally made, and how did you approach data flow and system reliability?',
    rubricFocus:
      'Evaluates technical decision-making, understanding of chosen technologies, and personal implementation responsibility.',
  },
  {
    id: 4,
    topic: 'Topic Transition: Concurrency & State Management',
    context:
      'Transitioning naturally to target job requirements across backend and frontend systems',
    question:
      'That makes sense. Let’s shift gears to how you handle concurrent users and data consistency. How do you design APIs and manage state to prevent race conditions or latency regressions?',
    rubricFocus:
      'Assesses understanding of asynchronous concurrency, state synchronization, caching layers, and deterministic error propagation.',
  },
  {
    id: 5,
    topic: 'Production Engineering Judgment & Scalability',
    context:
      'Evaluating technical depth, failure mode containment, and engineering judgment',
    question:
      'Walk us through an interesting technical challenge or trade-off you had to navigate in production. What were the alternatives, and how did you decide on the final approach?',
    rubricFocus:
      'Assesses systematic triage discipline, trade-off evaluation under real-world constraints, and long-term architectural resilience.',
  },
];

export const INITIAL_ASSESSMENT_RESULT: AssessmentResult = {
  candidateName: 'Alex Vance',
  matchedRole: 'Senior Full-Stack & Distributed Systems Engineer',
  overallScore: 4.7,
  maxScore: 5.0,
  percentile: 'Top 5% Demonstrated Technical Competency',
  evaluatedAt: 'Today',
  skillBreakdown: [
    {
      category: 'Technical Correctness',
      score: 4.8,
      max: 5.0,
      percentage: 96,
      notes:
        'Demonstrated precise knowledge of distributed idempotency keys, React concurrent fiber scheduling, and PostgreSQL transaction isolation semantics.',
    },
    {
      category: 'Problem-Solving & Reasoning',
      score: 4.6,
      max: 5.0,
      percentage: 92,
      notes:
        'Methodically addressed edge cases, proposing Lua scripts for atomic Redis updates and backpressure buffering during high-throughput ingestion spikes.',
    },
    {
      category: 'Relevance to Role & Requirements',
      score: 4.7,
      max: 5.0,
      percentage: 94,
      notes:
        'Directly answered core architectural constraints without drifting into unnecessary abstractions or ungrounded tooling.',
    },
    {
      category: 'Communication & Structural Clarity',
      score: 4.5,
      max: 5.0,
      percentage: 90,
      notes:
        'Structured complex multi-tier trade-offs clearly, articulating clear operational rationales for every design decision.',
    },
  ],
  strengths: [
    'Deep practical understanding of distributed state synchronization and idempotent event consumption.',
    'Rigorous approach to frontend web performance, virtualized render trees, and event listener lifecycle management.',
    'Systematic production debugging methodology backed by actionable observability metrics (p99 latency, CPU saturation, query locks).',
    'Balanced engineering perspective when weighing strict ACID compliance against eventual consistency trade-offs.',
  ],
  areasToImprove: [
    'Could further elaborate on distributed consensus failure recovery (e.g., Raft split-brain leader re-election dynamics).',
    'Consider adding explicit database connection pool exhaustion backoff strategies when architecting multi-tenant async workers.',
  ],
  evidenceFindings: [
    {
      topic: 'Event Streaming & Idempotency',
      answerExcerpt:
        '"To guarantee idempotency at 100k events/sec, I pair unique message UUIDs with distributed Redis sliding-window deduping keys and store processed offsets atomically inside the target database transaction."',
      analysis:
        'Demonstrates clear mastery of exactly-once semantics simulation over at-least-once distributed transports.',
    },
    {
      topic: 'UI Thread Performance & Throttling',
      answerExcerpt:
        '"For high-frequency WebSocket streams, we normalize the state tree and throttle state dispatching via requestAnimationFrame or custom RAF buffers so React is never forced to re-render faster than the display refresh rate."',
      analysis:
        'Exceptional grasp of browser rendering pipelines, microtask scheduling, and React frame budgets.',
    },
  ],
  recommendedLearning: [
    {
      topic: 'Raft & Paxos Consensus Boundary Conditions',
      reason:
        'Further exploration of consensus leader election corner-cases will strengthen Staff-level distributed architecture evaluations.',
    },
    {
      topic: 'PostgreSQL Zero-Downtime Table Partitioning',
      reason:
        'Deepen familiarity with native range and hash partitioning migrations on live multi-terabyte production tables.',
    },
    {
      topic: 'OpenTelemetry Trace Propagation Standards',
      reason:
        'Adopt standard W3C TraceContext headers for end-to-end distributed tracing across microservices.',
    },
  ],
};

export interface TargetRolePreset {
  id: string;
  title: string;
  department: string;
  description: string;
}

export const TARGET_ROLE_PRESETS: TargetRolePreset[] = [
  {
    id: 'fullstack-senior',
    title: 'Senior Full-Stack & Distributed Systems Engineer',
    department: 'Core Infrastructure',
    description: `We are seeking a Senior Full-Stack & Distributed Systems Engineer to design, scale, and maintain our high-throughput data processing platforms.

Key Requirements:
- 5+ years of production experience with Python (FastAPI or asynchronous frameworks)
- Demonstrated expertise in modern React, TypeScript, and state management
- Deep understanding of distributed caching, event pipelines, and Redis or Kafka
- Production experience with PostgreSQL schema design, query tuning, and index optimization
- Hands-on experience with Docker containerization and CI/CD automation pipelines
- Proven ability to design idempotent, backwards-compatible REST and gRPC API contracts
- Preferred: Experience with Kubernetes cluster orchestration and observability tools`,
  },
  {
    id: 'frontend-staff',
    title: 'Staff Frontend Engineer (React & TypeScript)',
    department: 'Client Platform',
    description: `We are looking for a Staff Frontend Engineer to lead frontend architecture and developer experience.

Key Requirements:
- 6+ years building enterprise React web applications with strict TypeScript
- Deep mastery of Next.js App Router, server/client component boundaries, and performance optimization
- Proven track record crafting accessible, reusable design systems (WCAG 2.1 AA compliant)
- Experience optimizing Core Web Vitals, minimizing main-thread execution time, and client-side memory management
- Solid automated testing experience with Playwright and Vitest/Jest
- Experience interfacing with Python/FastAPI backend APIs and streaming protocols`,
  },
  {
    id: 'backend-infra',
    title: 'Backend Infrastructure & API Engineer (Python / FastAPI)',
    department: 'Platform Engineering',
    description: `We are seeking a Backend Infrastructure Engineer to scale our core microservices and API gateways.

Key Requirements:
- 5+ years building scalable, fault-tolerant backend microservices in Python
- Advanced knowledge of FastAPI, asynchronous concurrency, and connection pooling
- Strong relational database experience with PostgreSQL and Alembic schema migrations
- Hands-on expertise with distributed locking, idempotency keys, and Redis rate limiting
- Experience containerizing microservices with Docker and managing automated deployment pipelines
- Track record of API performance profiling, p99 latency reduction, and observability`,
  },
];

