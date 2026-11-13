/**
 * Central configuration for the RAG pipeline. Server-only.
 * @module lib/rag/config
 */

/** Read a required env var or fail fast with a clear message. */
function requiredENV(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`Missing environment variable ${name}. Add it to .env`);
  return value;
}

interface _ragConfig {
  indexName: string;
  namespace: string;
  embeddingModel: string;
  dimension: number;
  topK: number;
  minScore: number;
  model: string;
  assertKeys: () => void;
}

export const ragConfig: _ragConfig = {
  /** Pinecone index name (must already exist; see scripts/create-index.ts). */
  indexName: process.env.PINECONE_INDEX as string,
  /** Namespace inside the index, so several corpora can share one index. */
  namespace: process.env.PINECONE_NAMESPACE as string,
  /** Pinecone-hosted embedding model. 1024-dim, multilingual. */
  embeddingModel: "multilingual-e5-large",
  /** Must match the embedding model's output size. */
  dimension: 1024,
  /** Chunks retrieved per question. */
  topK: 5,
  /** Drop matches below this cosine similarity (0..1). Tune after looking at real scores. */
  minScore: 0.75,
  /** Claude model used for answering. */
  model: "claude-opus-5-5",
  /** Throws early if keys are missing. Call at the start of every entry point. */
  assertKeys() {
    requiredENV("PINECONE_API_KEY");
    requiredENV("ANTHROPIC_API_KEY");
  },
} as const;
