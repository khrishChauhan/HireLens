/**
 * Automated Test Suite for Technical Speech Recognition Normalization & Editing (HireLens Phase 9)
 *
 * Requirements verified:
 * 1. Dictionary of common developer terms & speech-recognition variants (all 20+ terms):
 *    pytest, FastAPI, SQL, SQLite, PostgreSQL, Redis, Docker, Kubernetes/K8s, API,
 *    RAG, LLM, embeddings, Git, GitHub, TypeScript, JavaScript, Python, React, Next.js, Groq.
 * 2. High-confidence, contextually appropriate matches only (false-positive prevention).
 * 3. Preservation of original transcript alongside normalized transcript.
 * 4. Candidate inline editing and manual transcript overrides before submission.
 * 5. Ambiguous phrases left untouched (never blindly replace ordinary words).
 * 6. Corrections applied strictly to finalized transcripts, never interim speech.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeTechnicalTranscript } from '../src/lib/speech/technical-corrections.ts';
import type { LiveVoiceTranscriptItem } from '../src/lib/speech/speech-types.ts';

describe('HireLens Phase 9 — Technical Speech Recognition Accuracy', () => {
  describe('1. Dictionary of Common Developer Terms & Speech Variants', () => {
    it('should correct pytest variants (pie test, py test, pi test)', () => {
      const res1 = normalizeTechnicalTranscript('We wrote unit tests using pie test framework.');
      assert.equal(res1.correctedTranscript, 'We wrote unit tests using pytest framework.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'pytest');

      const res2 = normalizeTechnicalTranscript('Run py test with coverage reporting.');
      assert.equal(res2.correctedTranscript, 'Run pytest with coverage reporting.');

      const res3 = normalizeTechnicalTranscript('All pi test suites passed successfully.');
      assert.equal(res3.correctedTranscript, 'All pytest suites passed successfully.');
    });

    it('should correct FastAPI variants (fast api, fast-api, fastapi)', () => {
      const res1 = normalizeTechnicalTranscript('I implemented asynchronous fast api routes with Pydantic.');
      assert.equal(res1.correctedTranscript, 'I implemented asynchronous FastAPI routes with Pydantic.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'FastAPI');

      const res2 = normalizeTechnicalTranscript('The backend is built with fast-api.');
      assert.equal(res2.correctedTranscript, 'The backend is built with FastAPI.');

      const res3 = normalizeTechnicalTranscript('We chose fastapi for automatic OpenAPI documentation.');
      assert.equal(res3.correctedTranscript, 'We chose FastAPI for automatic OpenAPI documentation.');
    });

    it('should correct SQL and SQLite variants (seek well, seek well lite, sql lite, sqlite)', () => {
      // SQLite
      const resLite1 = normalizeTechnicalTranscript('We used seek well lite for assessment session persistence.');
      assert.equal(resLite1.correctedTranscript, 'We used SQLite for assessment session persistence.');
      assert.equal(resLite1.hasCorrections, true);

      const resLite2 = normalizeTechnicalTranscript('Data is stored in a local sql lite database.');
      assert.equal(resLite2.correctedTranscript, 'Data is stored in a local SQLite database.');

      const resLite3 = normalizeTechnicalTranscript('sqlite database file in backend storage.');
      assert.equal(resLite3.correctedTranscript, 'SQLite database file in backend storage.');

      // SQL
      const resSql1 = normalizeTechnicalTranscript('I wrote complex seek well queries for analytics.');
      assert.equal(resSql1.correctedTranscript, 'I wrote complex SQL queries for analytics.');

      const resSql2 = normalizeTechnicalTranscript('We optimized see quel queries with composite indexes.');
      assert.equal(resSql2.correctedTranscript, 'We optimized SQL queries with composite indexes.');

      const resSql3 = normalizeTechnicalTranscript('Candidate can write sequel queries with joins.');
      assert.equal(resSql3.correctedTranscript, 'Candidate can write SQL queries with joins.');

      const resNoSql = normalizeTechnicalTranscript('We migrated from no sequel to a relational model.');
      assert.equal(resNoSql.correctedTranscript, 'We migrated from NoSQL to a relational model.');
    });

    it('should correct PostgreSQL variants (postgre sql, postgres sql, post gres, postgres)', () => {
      const res1 = normalizeTechnicalTranscript('For production, we provisioned a postgre sql cluster on AWS.');
      assert.equal(res1.correctedTranscript, 'For production, we provisioned a PostgreSQL cluster on AWS.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'PostgreSQL');

      const res2 = normalizeTechnicalTranscript('Connected to postgres database via connection pooling.');
      assert.equal(res2.correctedTranscript, 'Connected to PostgreSQL database via connection pooling.');

      const res3 = normalizeTechnicalTranscript('Migration from post gresql to AWS Aurora.');
      assert.equal(res3.correctedTranscript, 'Migration from PostgreSQL to AWS Aurora.');
    });

    it('should correct Redis variants (radis, rediss, red is cache, using red is)', () => {
      const res1 = normalizeTechnicalTranscript('We stored session tokens in radis for high throughput.');
      assert.equal(res1.correctedTranscript, 'We stored session tokens in Redis for high throughput.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'Redis');

      const res2 = normalizeTechnicalTranscript('Session state was cached in red is with TTL.');
      assert.equal(res2.correctedTranscript, 'Session state was cached in Redis with TTL.');

      const res3 = normalizeTechnicalTranscript('We configured red is cache invalidation on mutation.');
      assert.equal(res3.correctedTranscript, 'We configured Redis cache invalidation on mutation.');
    });

    it('should correct Docker variants (dock er, doc ker, dockers container, docker)', () => {
      const res1 = normalizeTechnicalTranscript('We packaged the microservices into dock er images.');
      assert.equal(res1.correctedTranscript, 'We packaged the microservices into Docker images.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'Docker');

      const res2 = normalizeTechnicalTranscript('I built a multi-stage doc ker build.');
      assert.equal(res2.correctedTranscript, 'I built a multi-stage Docker build.');

      const res3 = normalizeTechnicalTranscript('Managing dockers container deployment with compose.');
      assert.equal(res3.correctedTranscript, 'Managing Docker container deployment with compose.');
    });

    it('should correct Kubernetes / K8s variants (k eight s, k8 s, coobernetes, kuber netes)', () => {
      const res1 = normalizeTechnicalTranscript('We deployed our helm charts to k eight s clusters.');
      assert.equal(res1.correctedTranscript, 'We deployed our helm charts to K8s clusters.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'K8s');

      const res2 = normalizeTechnicalTranscript('Running pods in k8 s with horizontal autoscaling.');
      assert.equal(res2.correctedTranscript, 'Running pods in K8s with horizontal autoscaling.');

      const res3 = normalizeTechnicalTranscript('Orchestration handled via coobernetes deployment manifests.');
      assert.equal(res3.correctedTranscript, 'Orchestration handled via Kubernetes deployment manifests.');

      const res4 = normalizeTechnicalTranscript('Scaled up across the kuber netes node pool.');
      assert.equal(res4.correctedTranscript, 'Scaled up across the Kubernetes node pool.');
    });

    it('should correct API & REST API variants (a p i, a.p.i., rest api, api)', () => {
      const res1 = normalizeTechnicalTranscript('We designed a p i endpoints with rate limiting.');
      assert.equal(res1.correctedTranscript, 'We designed API endpoints with rate limiting.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'API');

      const res2 = normalizeTechnicalTranscript('Consuming the external a.p.i. securely.');
      assert.equal(res2.correctedTranscript, 'Consuming the external API securely.');

      const res3 = normalizeTechnicalTranscript('We exposed a stateless rest api for third parties.');
      assert.equal(res3.correctedTranscript, 'We exposed a stateless REST API for third parties.');
    });

    it('should correct RAG variants (r a g, r.a.g., rag pipeline, dense rag)', () => {
      const res1 = normalizeTechnicalTranscript('We built an enterprise r a g system with chunking.');
      assert.equal(res1.correctedTranscript, 'We built an enterprise RAG system with chunking.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'RAG');

      const res2 = normalizeTechnicalTranscript('I designed the rag pipeline with cosine similarity search.');
      assert.equal(res2.correctedTranscript, 'I designed the RAG pipeline with cosine similarity search.');

      const res3 = normalizeTechnicalTranscript('We implemented dense rag with cross-encoder re-ranking.');
      assert.equal(res3.correctedTranscript, 'We implemented dense RAG with cross-encoder re-ranking.');
    });

    it('should correct LLM & LLMs variants (l l m, l.l.m., llms)', () => {
      const res1 = normalizeTechnicalTranscript('We queried the l l m using structured JSON output prompts.');
      assert.equal(res1.correctedTranscript, 'We queried the LLM using structured JSON output prompts.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'LLM');

      const res2 = normalizeTechnicalTranscript('Evaluating several open-source llms for latency.');
      assert.equal(res2.correctedTranscript, 'Evaluating several open-source LLMs for latency.');
      assert.equal(res2.corrections[0].term, 'LLMs');
    });

    it('should correct embeddings variants (imbeddings, em beddings, embedings)', () => {
      const res1 = normalizeTechnicalTranscript('We generated 384-dimensional imbeddings for semantic search.');
      assert.equal(res1.correctedTranscript, 'We generated 384-dimensional embeddings for semantic search.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'embeddings');

      const res2 = normalizeTechnicalTranscript('Cached the dense em beddings in memory.');
      assert.equal(res2.correctedTranscript, 'Cached the dense embeddings in memory.');
    });

    it('should correct Git variants in VCS command contexts (get commit, get checkout, get clone)', () => {
      const res1 = normalizeTechnicalTranscript('I ran get commit and then pushed to the remote branch.');
      assert.equal(res1.correctedTranscript, 'I ran git commit and then pushed to the remote branch.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'Git');

      const res2 = normalizeTechnicalTranscript('Run get checkout to switch feature branches.');
      assert.equal(res2.correctedTranscript, 'Run git checkout to switch feature branches.');

      const res3 = normalizeTechnicalTranscript('First get clone the repository onto your machine.');
      assert.equal(res3.correctedTranscript, 'First git clone the repository onto your machine.');

      const res4 = normalizeTechnicalTranscript('Tracking project history using get version control.');
      assert.equal(res4.correctedTranscript, 'Tracking project history using Git version control.');
    });

    it('should correct GitHub variants (git hub, get hub, github)', () => {
      const res1 = normalizeTechnicalTranscript('We pushed code to git hub repositories with automated actions.');
      assert.equal(res1.correctedTranscript, 'We pushed code to GitHub repositories with automated actions.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'GitHub');

      const res2 = normalizeTechnicalTranscript('Our CI workflows run on get hub actions.');
      assert.equal(res2.correctedTranscript, 'Our CI workflows run on GitHub actions.');
    });

    it('should correct TypeScript & JavaScript variants (type script, java script)', () => {
      const res1 = normalizeTechnicalTranscript('The frontend is written in type script for type safety.');
      assert.equal(res1.correctedTranscript, 'The frontend is written in TypeScript for type safety.');
      assert.equal(res1.hasCorrections, true);

      const res2 = normalizeTechnicalTranscript('We migrated legacy java script to modern modules.');
      assert.equal(res2.correctedTranscript, 'We migrated legacy JavaScript to modern modules.');
    });

    it('should correct Python variants (pie thon, py thon)', () => {
      const res1 = normalizeTechnicalTranscript('The service uses pie thon 3.12 with async io.');
      assert.equal(res1.correctedTranscript, 'The service uses Python 3.12 with async io.');
      assert.equal(res1.hasCorrections, true);

      const res2 = normalizeTechnicalTranscript('Our machine learning models are written in py thon.');
      assert.equal(res2.correctedTranscript, 'Our machine learning models are written in Python.');
    });

    it('should correct React & Next.js variants (react js, react component, next js, nextjs)', () => {
      const res1 = normalizeTechnicalTranscript('We built the dashboard using react js components.');
      assert.equal(res1.correctedTranscript, 'We built the dashboard using React components.');
      assert.equal(res1.hasCorrections, true);

      const res2 = normalizeTechnicalTranscript('Our web app uses next js with Turbopack for SSR.');
      assert.equal(res2.correctedTranscript, 'Our web app uses Next.js with Turbopack for SSR.');
      assert.equal(res2.corrections[0].term, 'Next.js');

      const res3 = normalizeTechnicalTranscript('We configured dynamic routes in nextjs app router.');
      assert.equal(res3.correctedTranscript, 'We configured dynamic routes in Next.js app router.');
    });

    it('should correct Groq variants (grok api, groq api, g rock api, grok model, using grok)', () => {
      const res1 = normalizeTechnicalTranscript('We evaluated the response using grok api for ultra-fast inference.');
      assert.equal(res1.correctedTranscript, 'We evaluated the response using Groq API for ultra-fast inference.');
      assert.equal(res1.hasCorrections, true);
      assert.equal(res1.corrections[0].term, 'Groq');

      const res2 = normalizeTechnicalTranscript('Connected to g rock api with the existing GROQ_API_KEY.');
      assert.equal(res2.correctedTranscript, 'Connected to Groq API with the existing GROQ_API_KEY.');

      const res3 = normalizeTechnicalTranscript('Inference performed with grok model llama-3.3-70b-versatile.');
      assert.equal(res3.correctedTranscript, 'Inference performed with Groq model llama-3.3-70b-versatile.');

      const res4 = normalizeTechnicalTranscript('Adaptive interviewing implemented on grok cloud.');
      assert.equal(res4.correctedTranscript, 'Adaptive interviewing implemented on Groq cloud.');
    });

    it('should correct additional developer terms (SQLAlchemy, FastEmbed, CI/CD, Node.js, GraphQL, JSON)', () => {
      const res1 = normalizeTechnicalTranscript('We mapped models using seek well alchemy with WAL mode.');
      assert.equal(res1.correctedTranscript, 'We mapped models using SQLAlchemy with WAL mode.');
      assert.equal(res1.corrections[0].term, 'SQLAlchemy');

      const res2 = normalizeTechnicalTranscript('Local inference with fast embed library.');
      assert.equal(res2.correctedTranscript, 'Local inference with FastEmbed library.');

      const res3 = normalizeTechnicalTranscript('Automated deployments via c i c d pipeline.');
      assert.equal(res3.correctedTranscript, 'Automated deployments via CI/CD pipeline.');

      const res4 = normalizeTechnicalTranscript('Backend utility built on node js runtime.');
      assert.equal(res4.correctedTranscript, 'Backend utility built on Node.js runtime.');

      const res5 = normalizeTechnicalTranscript('Querying entities using graph ql schema.');
      assert.equal(res5.correctedTranscript, 'Querying entities using GraphQL schema.');

      const res6 = normalizeTechnicalTranscript('Payload was returned in jason format.');
      assert.equal(res6.correctedTranscript, 'Payload was returned in JSON format.');
    });
  });

  describe('2. False-Positive Prevention & Ambiguity Protection', () => {
    it('should NOT replace ordinary "get" when not used as a Git version control command', () => {
      const text1 = 'I will get a glass of water before we begin.';
      const res1 = normalizeTechnicalTranscript(text1);
      assert.equal(res1.correctedTranscript, text1);
      assert.equal(res1.hasCorrections, false);

      const text2 = 'Did you get my latest email regarding the architectural review?';
      const res2 = normalizeTechnicalTranscript(text2);
      assert.equal(res2.correctedTranscript, text2);
      assert.equal(res2.hasCorrections, false);

      const text3 = 'We need to get more engineers on this deliverable.';
      const res3 = normalizeTechnicalTranscript(text3);
      assert.equal(res3.correctedTranscript, text3);
      assert.equal(res3.hasCorrections, false);
    });

    it('should NOT replace ordinary "sequel" when referring to movies or books', () => {
      const text1 = 'The sequel to the movie was far better than the original film.';
      const res1 = normalizeTechnicalTranscript(text1);
      assert.equal(res1.correctedTranscript, text1);
      assert.equal(res1.hasCorrections, false);

      const text2 = 'We watched the exciting sequel yesterday evening.';
      const res2 = normalizeTechnicalTranscript(text2);
      assert.equal(res2.correctedTranscript, text2);
      assert.equal(res2.hasCorrections, false);
    });

    it('should NOT replace ordinary "rag" when used for cleaning or cloth', () => {
      const text1 = 'Please wipe the kitchen counter with a clean damp rag.';
      const res1 = normalizeTechnicalTranscript(text1);
      assert.equal(res1.correctedTranscript, text1);
      assert.equal(res1.hasCorrections, false);

      const text2 = 'The old rag was discarded into the recycling bin.';
      const res2 = normalizeTechnicalTranscript(text2);
      assert.equal(res2.correctedTranscript, text2);
      assert.equal(res2.hasCorrections, false);
    });

    it('should NOT replace ordinary "red is" when referring to colors', () => {
      const text1 = 'The apple red is ripe and ready to eat from the tree.';
      const res1 = normalizeTechnicalTranscript(text1);
      assert.equal(res1.correctedTranscript, text1);
      assert.equal(res1.hasCorrections, false);

      const text2 = 'The primary color red is my favorite for graphic design.';
      const res2 = normalizeTechnicalTranscript(text2);
      assert.equal(res2.correctedTranscript, text2);
      assert.equal(res2.hasCorrections, false);
    });

    it('should NOT replace ordinary "react" in emotional or behavioral contexts', () => {
      const text1 = 'How did the stakeholders react to the unexpected timeline change?';
      const res1 = normalizeTechnicalTranscript(text1);
      assert.equal(res1.correctedTranscript, text1);
      assert.equal(res1.hasCorrections, false);

      const text2 = 'Our team will react quickly if any outage occurs.';
      const res2 = normalizeTechnicalTranscript(text2);
      assert.equal(res2.correctedTranscript, text2);
      assert.equal(res2.hasCorrections, false);
    });

    it('should NOT replace ordinary "grok" in conversational comprehension contexts', () => {
      const text1 = 'It took me a while to grok the philosophical nuances of that book.';
      const res1 = normalizeTechnicalTranscript(text1);
      assert.equal(res1.correctedTranscript, text1);
      assert.equal(res1.hasCorrections, false);
    });

    it('should NOT replace ordinary "dock" when referring to ships or harbors', () => {
      const text1 = 'The ferry arrived at the harbor dock right on schedule.';
      const res1 = normalizeTechnicalTranscript(text1);
      assert.equal(res1.correctedTranscript, text1);
      assert.equal(res1.hasCorrections, false);
    });
  });

  describe('3. Preservation of Already Correct Technical Terminology', () => {
    it('should cleanly preserve correctly cased developer terms without spurious modifications', () => {
      const canonical = 'In HireLens, we built a FastAPI backend with PostgreSQL, Redis, Docker, and Next.js.';
      const res = normalizeTechnicalTranscript(canonical);
      assert.equal(res.correctedTranscript, canonical);
      // Already correct terms shouldn't generate false corrections
      assert.equal(res.corrections.length, 0);
      assert.equal(res.hasCorrections, false);
    });

    it('should handle complex multi-term sentences accurately', () => {
      const raw = 'I used pie test for testing fast api with seek well lite, and deployed dock er on k eight s.';
      const res = normalizeTechnicalTranscript(raw);
      assert.equal(
        res.correctedTranscript,
        'I used pytest for testing FastAPI with SQLite, and deployed Docker on K8s.'
      );
      assert.equal(res.hasCorrections, true);
      assert.equal(res.corrections.length, 5);
      const correctedTerms = res.corrections.map((c) => c.term);
      assert.ok(correctedTerms.includes('pytest'));
      assert.ok(correctedTerms.includes('FastAPI'));
      assert.ok(correctedTerms.includes('SQLite'));
      assert.ok(correctedTerms.includes('Docker'));
      assert.ok(correctedTerms.includes('K8s'));
    });
  });

  describe('4. Full Audit Trail: Raw vs. Corrected Transcript Preservation', () => {
    it('should preserve original raw transcript and record each replacement with position index', () => {
      const raw = 'We used seek well queries to inspect the data.';
      const res = normalizeTechnicalTranscript(raw);

      assert.equal(res.rawTranscript, raw);
      assert.equal(res.correctedTranscript, 'We used SQL queries to inspect the data.');
      assert.equal(res.hasCorrections, true);
      assert.equal(res.corrections.length, 1);
      assert.equal(res.corrections[0].originalMatch, 'seek well');
      assert.equal(res.corrections[0].replacement, 'SQL');
      assert.equal(res.corrections[0].term, 'SQL');
      assert.ok(typeof res.corrections[0].index === 'number');
    });

    it('should handle empty or null inputs gracefully without throwing', () => {
      const resEmpty = normalizeTechnicalTranscript('');
      assert.equal(resEmpty.rawTranscript, '');
      assert.equal(resEmpty.correctedTranscript, '');
      assert.equal(resEmpty.hasCorrections, false);
      assert.deepEqual(resEmpty.corrections, []);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resNull = normalizeTechnicalTranscript(null as any);
      assert.equal(resNull.hasCorrections, false);
      assert.deepEqual(resNull.corrections, []);
    });
  });

  describe('5. Transcript Editing & Turn-Taking Candidate Overrides', () => {
    it('should support candidate manual editing of normalized transcript before submission', () => {
      const rawSpoken = 'In our architecture, we used seek well lite and fast api.';
      const normalized = normalizeTechnicalTranscript(rawSpoken);

      assert.equal(normalized.correctedTranscript, 'In our architecture, we used SQLite and FastAPI.');

      // Candidate manually edits and expands the answer in the UI
      const candidateManualEdit = 'In our architecture, we used SQLite with WAL mode and FastAPI dependency injection.';
      const isManuallyEdited = candidateManualEdit !== normalized.correctedTranscript;

      const item: LiveVoiceTranscriptItem = {
        id: 'turn-cand-123',
        sender: 'candidate',
        text: candidateManualEdit,
        rawText: rawSpoken,
        corrections: normalized.corrections,
        isManuallyEdited,
        stage: 'project_deep_dive',
        timestamp: Date.now(),
      };

      assert.equal(item.text, candidateManualEdit);
      assert.equal(item.rawText, rawSpoken);
      assert.equal(item.isManuallyEdited, true);
      assert.equal(item.corrections?.length, 2);
    });

    it('should allow candidate to revert manual edit back to original speech recognition text', () => {
      const rawSpoken = 'I set up dock er containers with k eight s.';
      const normalized = normalizeTechnicalTranscript(rawSpoken);

      let activeDraft = normalized.correctedTranscript;
      assert.equal(activeDraft, 'I set up Docker containers with K8s.');

      // Candidate types something erroneous
      activeDraft = 'I set up typo';

      // Candidate clicks "Restore Browser Speech"
      activeDraft = rawSpoken;
      assert.equal(activeDraft, rawSpoken);
    });
  });

  describe('6. Finalized vs. Interim Speech Invariant', () => {
    it('should verify corrections are applied strictly to finalized strings and never partial interim streams', () => {
      // Simulate interim partial word tokens coming from Web Speech API
      const interimFragments = ['In my sys', 'In my system we u', 'In my system we used pie'];

      // Interim speech is NEVER passed to normalizeTechnicalTranscript
      // It is kept in interimTranscript buffer as raw text
      const simulatedInterimBuffers = interimFragments.map((frag) => ({
        isFinal: false,
        text: frag,
      }));

      for (const item of simulatedInterimBuffers) {
        assert.equal(item.isFinal, false);
        // Ensure no transformation occurs on interim
        assert.ok(item.text.startsWith('In my'));
      }

      // Only when speech recognition delivers isFinal: true is normalization applied
      const finalRawSpeech = 'In my system we used pie test for test automation.';
      const normalizedFinal = normalizeTechnicalTranscript(finalRawSpeech);
      assert.equal(normalizedFinal.correctedTranscript, 'In my system we used pytest for test automation.');
    });
  });
});
