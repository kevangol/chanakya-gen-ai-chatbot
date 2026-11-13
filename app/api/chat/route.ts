/**
 * Chat API: streams a grounded answer as NDJSON. See app/lib/types.ts → StreamEvent.
 * @module api/chat
 */
import { answer } from "@/app/lib/rag/answer";
import type { ChatRequestMessage } from "@/app/lib/types";

// No `export const runtime`: this app has `cacheComponents: true`, which forbids that
// segment config. Route handlers already run on Node.js by default (Edge is deprecated),
// which is what the Pinecone + Anthropic SDKs need.

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    messages?: ChatRequestMessage[];
  } | null;
  const messages = body?.messages?.filter((m) => m.content?.trim());
  if (!messages?.length || messages.at(-1)?.role !== "user") {
    return Response.json(
      { error: "Body must be { messages: [...] } ending with a user message" },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of answer(messages, req.signal)) {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
