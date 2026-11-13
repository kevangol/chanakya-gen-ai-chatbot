/**
 * Pinecone client, embeddings and LangChain vector store factories. Server-only.
 * @module lib/rag/pinecone
 */
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeEmbeddings, PineconeStore } from "@langchain/pinecone";
import { ragConfig } from "./config";

/** One shared Pinecone client per server process (reads PINECONE_API_KEY). */
let client: Pinecone | undefined;
export function getPinecone(): Pinecone {
  client ??= new Pinecone();
  return client;
}

/**
 * Create a Pinecone-hosted embeddings instance.
 *
 * IMPORTANT: create a *fresh instance per purpose*. `PineconeEmbeddings.embedQuery()`
 * permanently flips its internal `inputType` to "query", so reusing one instance
 * for ingestion after a query would silently embed documents as queries.
 *
 * @param purpose - "passage" for documents being stored, "query" for user questions.
 */
export function createEmbeddings(
  purpose: "passage" | "query",
): PineconeEmbeddings {
  return new PineconeEmbeddings({
    model: ragConfig.embeddingModel,
    // truncate: "END" cuts inputs longer than the model limit (~507 tokens) instead of erroring.
    params: { inputType: purpose, truncate: "END" },
  });
}

/**
 * Get a LangChain vector store bound to our existing index + namespace.
 * @param purpose - Passed through to {@link createEmbeddings}.
 */
export async function getVectorStore(
  purpose: "passage" | "query",
): Promise<PineconeStore> {
  const pineconeIndex = getPinecone().index(ragConfig.indexName);
  return PineconeStore.fromExistingIndex(createEmbeddings(purpose), {
    pineconeIndex,
    namespace: ragConfig.namespace,
    maxConcurrency: 5,
  });
}
