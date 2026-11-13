/**
 * Ingestion pipeline: load files from ./docs, split into chunks, embed with
 * Pinecone inference and upsert into the index.
 *
 * Run: npx tsx --env-file=.env scripts/ingest.ts
 * Re-running is safe: chunk ids are deterministic, so vectors are overwritten, not duplicated.
 */
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Document } from "@langchain/core/documents";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getVectorStore } from "../app/lib/rag/pinecone";
import { ragConfig } from "../app/lib/rag/config";

const DOCS_DIR = path.resolve("docs");
/** Pinecone inference accepts at most 96 inputs per embed call for multilingual-e5-large. */
const BATCH_SIZE = 96;

/** Metadata we store with every chunk. Pinecone allows only flat string/number/boolean/string[] values. */
type ChunkMetadata = {
  source: string; // file path relative to docs/, e.g. "arthashastra.pdf"
  title: string; // human-readable, shown in the UI's source cards
  page: number; // 1-based page (0 for non-paginated files)
  chunk: number; // index of the chunk within its page/file
};

/** Recursively list every file under `dir`. */
async function listFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) =>
      e.isDirectory()
        ? listFiles(path.join(dir, e.name))
        : [path.join(dir, e.name)],
    ),
  );
  return nested.flat();
}

/** Turn "the-arthashastra_book1.pdf" into "The Arthashastra Book1". */
function titleFromFile(file: string): string {
  return path
    .basename(file, path.extname(file))
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Extract text from a PDF, one entry per page.
 * Uses pdf-parse v2 directly; `destroy()` frees the underlying pdf.js document.
 */
async function readPdfPages(
  file: string,
): Promise<{ num: number; text: string }[]> {
  const parser = new PDFParse({ data: await readFile(file) });
  try {
    const result = await parser.getText();
    return result.pages; // [{ num: 1, text: "..." }, ...]
  } finally {
    await parser.destroy();
  }
}

/**
 * Load one file into page-level Documents with clean, flat metadata
 * (Pinecone only accepts string / number / boolean / string[] values).
 */
async function loadFile(file: string): Promise<Document<ChunkMetadata>[]> {
  const source = path.relative(DOCS_DIR, file).replaceAll("\\", "/");
  const title = titleFromFile(file);
  const ext = path.extname(file).toLowerCase();

  if (ext === ".pdf") {
    const pages = await readPdfPages(file);
    return pages.map(
      (p) =>
        new Document<ChunkMetadata>({
          pageContent: p.text,
          metadata: { source, title, page: p.num, chunk: 0 },
        }),
    );
  }
  if (ext === ".md" || ext === ".txt") {
    const text = await readFile(file, "utf8");
    return [
      new Document<ChunkMetadata>({
        pageContent: text,
        metadata: { source, title, page: 0, chunk: 0 },
      }),
    ];
  }
  console.warn(`  skipping unsupported file: ${source}`);
  return [];
}

/** Stable id per chunk: same file + page + chunk index + text always gives the same id. */
function chunkId(doc: Document<ChunkMetadata>): string {
  const { source, page, chunk } = doc.metadata;
  return createHash("sha1")
    .update(`${source}|${page}|${chunk}|${doc.pageContent}`)
    .digest("hex");
}

async function main() {
  ragConfig.assertKeys();

  // 1. Load
  const files = await listFiles(DOCS_DIR);
  console.log(`Found ${files.length} files in ${DOCS_DIR}`);
  const pages = (await Promise.all(files.map(loadFile)))
    .flat()
    .filter((d) => d.pageContent.trim());

  // 2. Split: ~1000 chars ≈ 250 tokens, well under the e5 limit (~507 tokens).
  //    Overlap stops sentences being cut in half at chunk boundaries.
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
  });
  const chunks: Document<ChunkMetadata>[] = [];
  for (const page of pages) {
    const parts = await splitter.splitText(page.pageContent);
    parts.forEach((text, i) =>
      chunks.push(
        new Document<ChunkMetadata>({
          pageContent: text,
          metadata: { ...page.metadata, chunk: i },
        }),
      ),
    );
  }
  console.log(`Split ${pages.length} pages into ${chunks.length} chunks`);

  // 3. Embed + upsert in batches (embedding API limit + progress output).
  const store = await getVectorStore("passage");
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    await store.addDocuments(batch, { ids: batch.map(chunkId) });
    console.log(
      `  upserted ${Math.min(i + BATCH_SIZE, chunks.length)}/${chunks.length}`,
    );
  }
  console.log("Done ✅");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
