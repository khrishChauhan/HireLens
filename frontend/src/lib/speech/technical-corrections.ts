/**
 * Technical Speech Recognition Normalization & Correction Layer for HireLens
 *
 * Provides safe, context-aware normalization for developer terminology misrecognized
 * by browser Web Speech recognition engines (e.g. Chrome webkitSpeechRecognition).
 *
 * Rules:
 * 1. Only high-confidence, contextually validated patterns are replaced.
 * 2. Ambiguous ordinary words (e.g. "get", "rag", "sequel", "red is") are never blindly
 *    replaced unless preceded or followed by explicit technical qualifiers.
 * 3. Applied strictly to finalized speech transcripts, never interim/partial speech.
 * 4. Preserves full audit metadata (original transcript vs corrected transcript with diffs).
 */

export interface TechnicalCorrection {
  originalMatch: string;
  replacement: string;
  term: string;
  index: number;
}

export interface NormalizedTranscriptResult {
  rawTranscript: string;
  correctedTranscript: string;
  corrections: TechnicalCorrection[];
  hasCorrections: boolean;
}

interface CorrectionRule {
  term: string;
  regex: RegExp;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  replacement: string | ((match: string, ...args: any[]) => string);
  description: string;
}

/**
 * Curated list of high-confidence technical term normalization rules.
 * Uses strict word boundaries, explicit multi-word technical phrases,
 * and contextual lookaheads/lookbehinds to prevent false positives.
 */
const TECHNICAL_CORRECTION_RULES: CorrectionRule[] = [
  // --- 1. Compound terms & frameworks (MUST run before single words) ---
  {
    term: 'SQLAlchemy',
    regex: /\b(?:sql\s*alchemy|seek\s*well\s*alchemy|sequel\s*alchemy)\b/gi,
    replacement: 'SQLAlchemy',
    description: 'Python SQL toolkit and ORM',
  },
  {
    term: 'FastEmbed',
    regex: /\bfast\s*embed\b/gi,
    replacement: 'FastEmbed',
    description: 'Lightweight embedding generation library',
  },
  {
    term: 'FastAPI',
    regex: /\b(?:fast\s*api|fast-api|fastapi)\b/gi,
    replacement: 'FastAPI',
    description: 'Modern asynchronous Python web framework',
  },
  {
    term: 'SQLite',
    regex: /\b(?:sqlite|sql\s*lite|seek\s*well\s*lite|sequel\s*lite)\b/gi,
    replacement: 'SQLite',
    description: 'Embedded relational database engine',
  },
  {
    term: 'PostgreSQL',
    regex: /\b(?:postgre\s*sql|postgres\s*sql|post\s*gresql|post\s*gres|postgress|postgres)\b/gi,
    replacement: 'PostgreSQL',
    description: 'Open source relational database',
  },
  {
    term: 'GitHub',
    regex: /\b(?:git\s*hub|get\s*hub|github)\b/gi,
    replacement: 'GitHub',
    description: 'Cloud Git repository platform',
  },
  {
    term: 'REST API',
    regex: /\brest\s+api\b/gi,
    replacement: 'REST API',
    description: 'RESTful Application Programming Interface',
  },
  {
    term: 'NoSQL',
    regex: /\bno\s*sequel\b/gi,
    replacement: 'NoSQL',
    description: 'Non-relational database paradigm',
  },
  {
    term: 'Next.js',
    regex: /\b(?:next\s*js|next\.js|nextjs)\b/gi,
    replacement: 'Next.js',
    description: 'Full-stack React framework',
  },
  {
    term: 'TypeScript',
    regex: /\b(?:type\s*script|typescript)\b/gi,
    replacement: 'TypeScript',
    description: 'Typed superset of JavaScript',
  },
  {
    term: 'JavaScript',
    regex: /\b(?:java\s*script|javascript)\b/gi,
    replacement: 'JavaScript',
    description: 'Web programming language',
  },
  {
    term: 'CI/CD',
    regex: /\b(?:c\s*i\s*c\s*d|c\s*i\s*\/\s*c\s*d)\b/gi,
    replacement: 'CI/CD',
    description: 'Continuous Integration / Continuous Deployment',
  },
  {
    term: 'Node.js',
    regex: /\b(?:node\s*js|node\.js|nodejs)\b/gi,
    replacement: 'Node.js',
    description: 'JavaScript runtime environment',
  },
  {
    term: 'GraphQL',
    regex: /\b(?:graph\s*ql|graphql)\b/gi,
    replacement: 'GraphQL',
    description: 'Query language for APIs',
  },
  {
    term: 'JSON',
    regex: /\b(?:j\s*son|jason)\s+(format|payload|body|data|object|string|schema)\b/gi,
    replacement: (_match, p1: string) => `JSON ${p1}`,
    description: 'JSON format misheard as Jason',
  },
  {
    term: 'JSON',
    regex: /\bj\s*son\b/gi,
    replacement: 'JSON',
    description: 'JavaScript Object Notation',
  },

  // --- 2. Testing & Language ---
  {
    term: 'pytest',
    regex: /\b(?:pie\s*test|py\s*test|pi\s*test|pie-test|py-test)\b/gi,
    replacement: 'pytest',
    description: 'Python testing framework',
  },
  {
    term: 'Python',
    regex: /\b(?:pie\s*thon|py\s*thon)\b/gi,
    replacement: 'Python',
    description: 'High-level programming language',
  },

  // --- 3. Container & Orchestration ---
  {
    term: 'Docker',
    regex: /\b(?:dock\s*er|doc\s*ker)\b/gi,
    replacement: 'Docker',
    description: 'Container virtualization platform',
  },
  {
    term: 'Docker',
    regex: /\bdockers\s+(container|containers|image|images|compose|daemon|hub)\b/gi,
    replacement: (_match, p1: string) => `Docker ${p1}`,
    description: 'Docker in container context',
  },
  {
    term: 'Docker',
    regex: /\bdocker\b/g,
    replacement: 'Docker',
    description: 'Standardize Docker casing',
  },
  {
    term: 'K8s',
    regex: /\b(?:k\s*eight\s*s|k\s*eights|k8\s*s|k-8s)\b/gi,
    replacement: 'K8s',
    description: 'Kubernetes abbreviation',
  },
  {
    term: 'Kubernetes',
    regex: /\b(?:coobernetes|koobernetes|kuber\s*netes|kubernetes)\b/gi,
    replacement: 'Kubernetes',
    description: 'Container orchestration platform',
  },

  // --- 4. Databases & Caching ---
  {
    term: 'Redis',
    regex: /\b(?:radis|rediss|reddis)\b/gi,
    replacement: 'Redis',
    description: 'In-memory data store / cache',
  },
  {
    term: 'Redis',
    regex: /\bred\s+is\s+(cache|caching|store|database|db|instance|cluster|pub\s*sub|queue|memory)\b/gi,
    replacement: (_match, p1: string) => `Redis ${p1}`,
    description: 'Redis in cache/queue context',
  },
  {
    term: 'Redis',
    regex: /\b(in-memory|cached?\s+in|cached?\s+with|using)\s+red\s+is\b/gi,
    replacement: (_match, p1: string) => `${p1} Redis`,
    description: 'Redis preceded by caching verbs',
  },
  {
    term: 'Redis',
    regex: /\bredis\b/g,
    replacement: 'Redis',
    description: 'Standardize Redis casing',
  },
  {
    term: 'SQL',
    regex: /\b(?:seek\s*well|see\s*quel)\b/gi,
    replacement: 'SQL',
    description: 'Structured Query Language',
  },
  {
    term: 'SQL',
    regex: /\bsequel\s+(queries|query|database|databases|db|server|injection|tables?|schema|syntax|dialect)\b/gi,
    replacement: (_match, p1: string) => `SQL ${p1}`,
    description: 'SQL in database query context',
  },
  {
    term: 'SQL',
    regex: /\b(write|wrote|writing|run|running|structured|relational)\s+sequel\b/gi,
    replacement: (_match, p1: string) => `${p1} SQL`,
    description: 'SQL preceded by execution/query verbs',
  },
  {
    term: 'SQL',
    regex: /\bsql\b/g,
    replacement: 'SQL',
    description: 'Standardize SQL casing',
  },

  // --- 5. AI, Search & Embeddings ---
  {
    term: 'RAG',
    regex: /(?:\br\s+a\s+g\b|\br\.a\.g\.?(?!\w))/gi,
    replacement: 'RAG',
    description: 'Retrieval-Augmented Generation acronym',
  },
  {
    term: 'RAG',
    regex: /\brag\s+(pipeline|architecture|system|retrieval|search|framework|model|application|workflow|chunking|embeddings?)\b/gi,
    replacement: (_match, p1: string) => `RAG ${p1}`,
    description: 'RAG in retrieval pipeline context',
  },
  {
    term: 'RAG',
    regex: /\b(implemented|built|using|with|dense|vector|hybrid)\s+rag\b/gi,
    replacement: (_match, p1: string) => `${p1} RAG`,
    description: 'RAG preceded by implementation verbs',
  },
  {
    term: 'LLMs',
    regex: /(?:\bl\s+l\s+ms\b|\bl\.l\.m\.s\.?(?!\w)|\bllms\b)/gi,
    replacement: 'LLMs',
    description: 'Large Language Models plural acronym',
  },
  {
    term: 'LLM',
    regex: /(?:\bl\s+l\s+m\b|\bl\.l\.m\.?(?!\w)|\bllm\b)/gi,
    replacement: 'LLM',
    description: 'Large Language Model acronym',
  },
  {
    term: 'embeddings',
    regex: /\b(?:imbeddings?|em\s+beddings?|embedings?)\b/gi,
    replacement: (match: string) => (match.toLowerCase().endsWith('s') ? 'embeddings' : 'embedding'),
    description: 'Vector embeddings representation',
  },
  {
    term: 'Groq',
    regex: /\b(?:grok\s+api|groq\s+api|g\s*rock\s+api)\b/gi,
    replacement: 'Groq API',
    description: 'Groq LPU AI inference platform',
  },
  {
    term: 'Groq',
    regex: /\b(?:grok|groq)\s+(model|models|inference|lpu|cloud|speed)\b/gi,
    replacement: (_match, p1: string) => `Groq ${p1}`,
    description: 'Groq in model/inference context',
  },
  {
    term: 'Groq',
    regex: /\b(using|with|on)\s+(?:grok|groq)\b/gi,
    replacement: (_match, p1: string) => `${p1} Groq`,
    description: 'Groq preceded by provider usage verbs',
  },
  {
    term: 'Groq',
    regex: /\bgroq\b/g,
    replacement: 'Groq',
    description: 'Standardize Groq casing',
  },

  // --- 6. Frontend Libraries ---
  {
    term: 'React',
    regex: /\b(?:react\s*js|react\.js)\b/gi,
    replacement: 'React',
    description: 'Frontend UI library',
  },
  {
    term: 'React',
    regex: /\breact\s+(component|components|hook|hooks|state|native|frontend|ui|app|router)\b/gi,
    replacement: (_match, p1: string) => `React ${p1}`,
    description: 'React in frontend UI component context',
  },

  // --- 7. Version Control ---
  {
    term: 'Git',
    regex: /\bget\s+(commit|checkout|branch|merge|rebase|push|pull|clone|repo|repository|status|diff|stash|log|fetch|init)\b/gi,
    replacement: (_match, p1: string) => `git ${p1}`,
    description: 'Git commands misheard as get',
  },
  {
    term: 'Git',
    regex: /\b(using|in|with)\s+get\s+(version\s+control|vcs)\b/gi,
    replacement: (_match, p1: string) => `${p1} Git version control`,
    description: 'Git version control misheard as get',
  },

  // --- 8. API acronym (Runs last to prevent swallowing FastAPI or REST API) ---
  {
    term: 'API',
    regex: /(?:\ba\s+p\s+i\b|\ba\.p\.i\.?(?!\w)|\bapi\b)/gi,
    replacement: 'API',
    description: 'Application Programming Interface acronym',
  },
];

/**
 * Normalizes finalized speech transcripts by correcting high-confidence technical terms.
 * Never modifies raw speech blindly. Preserves full audit metadata.
 *
 * @param transcript - The finalized speech transcript from the browser recognition engine
 * @returns NormalizedTranscriptResult containing original, corrected, and applied diffs
 */
export function normalizeTechnicalTranscript(transcript: string): NormalizedTranscriptResult {
  if (!transcript || typeof transcript !== 'string') {
    return {
      rawTranscript: transcript || '',
      correctedTranscript: transcript || '',
      corrections: [],
      hasCorrections: false,
    };
  }

  let currentText = transcript;
  const appliedCorrections: TechnicalCorrection[] = [];

  for (const rule of TECHNICAL_CORRECTION_RULES) {
    // Reset global regex index
    rule.regex.lastIndex = 0;

    // Use replace with functional tracking
    currentText = currentText.replace(rule.regex, (fullMatch, ...args) => {
      let replacementStr: string;
      if (typeof rule.replacement === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        replacementStr = (rule.replacement as any)(fullMatch, ...args);
      } else {
        replacementStr = rule.replacement;
      }

      // If replacement produces identical text, don't record as correction
      if (replacementStr !== fullMatch) {
        appliedCorrections.push({
          originalMatch: fullMatch,
          replacement: replacementStr,
          term: rule.term,
          index: args[args.length - 2] as number,
        });
      }

      return replacementStr;
    });
  }

  return {
    rawTranscript: transcript,
    correctedTranscript: currentText,
    corrections: appliedCorrections,
    hasCorrections: appliedCorrections.length > 0,
  };
}
