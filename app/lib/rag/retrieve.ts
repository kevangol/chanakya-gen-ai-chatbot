/**
 * Retrieval: question → top-K relevant chunks from Pinecone. Server-only.
 * @module lib/rag/retrieve
 */
import type { Source } from "@/app/lib/types";
import { ragConfig } from "./config";
import { getVectorStore } from "./pinecone";

/** A retrieved chunk: the text for the prompt plus the card shown in the UI. */
export type RetrievedChunk = {
  /** Chunk text that goes into Claude's context. */
  text: string;
  /** UI-facing citation (id is "1", "2", … matching the [n] markers). */
  source: Source;
};

/**
 * Embed the question, run a similarity search and keep only confident matches.
 * @returns Chunks sorted by score (best first), at most ragConfig.topK.
 */
export async function retrieve(question: string): Promise<RetrievedChunk[]> {
  // Fresh "query" store per request: see the embedQuery gotcha in pinecone.ts.
  const store = await getVectorStore("query");
  const results = await store.similaritySearchWithScore(
    question,
    ragConfig.topK,
  );

  return results
    .filter(([, score]) => score >= ragConfig.minScore)
    .map(([doc, score], i) => {
      const { title, page } = doc.metadata as { title?: string; page?: number };
      return {
        text: doc.pageContent,
        source: {
          id: String(i + 1),
          title: page
            ? `${title ?? "Document"} — p. ${page}`
            : (title ?? "Document"),
          snippet: doc.pageContent.slice(0, 200),
          score,
        },
      };
    });
}
