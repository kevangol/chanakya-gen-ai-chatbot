/**
 * One-time setup: create the serverless Pinecone index.
 * Run: npx tsx --env-file=.env scripts/create-index.ts
 */
import { getPinecone } from "../app/lib/rag/pinecone";
import { ragConfig } from "../app/lib/rag/config";

async function main() {
  ragConfig.assertKeys();
  const pc = getPinecone();

  await pc.createIndex({
    name: ragConfig.indexName,
    dimension: ragConfig.dimension, // 1024 for multilingual-e5-large
    metric: "cosine",
    spec: { serverless: { cloud: "aws", region: "us-east-1" } },
    waitUntilReady: true, // resolve only when the index can accept data
    suppressConflicts: true, // don't throw if it already exists
  });

  const info = await pc.describeIndex(ragConfig.indexName);
  console.log(
    `Index "${info.name}" ready: dim=${info.dimension}, metric=${info.metric}, host=${info.host}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
