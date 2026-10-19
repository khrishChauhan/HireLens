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
    topic: 'System Architecture & High-Throughput Ingestion',
    context:
      'Tailored to distributed systems and asynchronous event streaming mentioned in your resume',
    question:
      'You highlighted building high-throughput backend services. How would you design an event-driven ingestion pipeline handling 100,000 events/second that guarantees idempotency and at-least-once processing without unbounded queue latency?',
    rubricFocus:
      'Evaluates distributed queue partitioning, dead-letter strategies, offset commit semantics, and memory backpressure.',
  },
  {
    id: 2,
    topic: 'Concurrency & Reactive State Management',
    context:
      'Tailored to React, Next.js, and TypeScript frontend performance listed in your resume',
    question:
      'When architecting a real-time analytics UI that consumes continuous high-frequency updates, what strategies do you employ to prevent main-thread UI jank, unnecessary component re-renders, and memory leaks from event listeners?',
    rubricFocus:
      'Assesses understanding of React concurrent rendering, batching, state normalization, memoization, and requestAnimationFrame throttling.',
  },
  {
    id: 3,
    topic: 'API Contracts & Graceful Degradation',
    context:
      'Tailored to FastAPI, RESTful services, and microservice communication',
    question:
      'How do you design backward-compatible REST and gRPC API contracts across evolving service boundaries? In particular, how do you handle partial downstream service failures with circuit breakers and fallback caching?',
    rubricFocus:
      'Tests API schema versioning, idempotency keys, circuit-breaker thresholds, and deterministic error propagation.',
  },
  {
    id: 4,
    topic: 'Data Consistency & Relational Query Profiling',
    context:
      'Tailored to PostgreSQL and Redis caching layers',
    question:
      'When scaling relational database writes, how do you evaluate whether to enforce strict serializable ACID transactions versus optimistic locking? Describe how you diagnose index bloat, sequential table scans, and deadlocks in PostgreSQL.',
    rubricFocus:
      'Evaluates relational transaction isolation levels, row-level locking nuances, EXPLAIN ANALYZE query profiling, and index strategies.',
  },
  {
    id: 5,
    topic: 'Production Incident Triage & Engineering Judgment',
    context:
      'Tailored to real-world engineering problem solving',
    question:
      'Walk us through a critical production performance regression or outage you diagnosed. What was your step-by-step methodology to isolate the root cause, mitigate immediate customer impact, and implement permanent structural safeguards?',
    rubricFocus:
      'Assesses systematic triage discipline, observability metrics (p99 latency, saturation, errors), post-mortem root cause analysis, and architectural resilience.',
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
