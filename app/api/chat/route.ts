/**
 * Chat API: the single endpoint the UI talks to.
 *
 * @module api/chat
 */

import type { ChatRequestMessage, StreamEvent } from "@/app/lib/types";

/** Response headers for a newline-delimited JSON stream. */
const NDJSON_HEADERS = { "Content-Type": "application/x-ndjson; charset=utf-8" };

/**
 * `POST /api/chat`: answer the last user message, streaming the reply.
 *
 * **Request body**
 * ```json
 * { "messages": [{ "role": "user", "content": "What is artha?" }] }
 * ```
 *
 * **Response**: `application/x-ndjson`, one {@link StreamEvent} per line:
 * ```
 * {"type":"sources","sources":[...]}
 * {"type":"text","delta":"Artha "}
 * {"type":"text","delta":"means…"}
 * ```
 *
 * **Modes**
 * - `RAG_BACKEND_URL` set: the body is forwarded to that URL and its response
 *   is piped back unchanged, so your backend must emit the same NDJSON format.
 *   A non-2xx upstream reply becomes an `error` event.
 * - Not set: a mock answer with sample sources is streamed, so the UI can be
 *   built and demoed without a backend.
 *
 * Client aborts (the Stop button) propagate through `req.signal` to the
 * upstream fetch and the mock stream.
 *
 * @param req - The incoming request.
 * @returns A streaming NDJSON response.
 */
export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: ChatRequestMessage[] };

  const backend = process.env.RAG_BACKEND_URL;
  if (backend) {
    const upstream = await fetch(backend, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: req.signal,
    });
    if (!upstream.ok || !upstream.body) {
      return ndjson([{ type: "error", message: `Backend error (${upstream.status})` }]);
    }
    return new Response(upstream.body, { headers: NDJSON_HEADERS });
  }

  return mockStream(messages.at(-1)?.content ?? "", req.signal);
}

/**
 * Build a complete (non-streaming) NDJSON response from a fixed list of events.
 *
 * @param events - Events to serialise, one per line.
 */
function ndjson(events: StreamEvent[]) {
  return new Response(events.map((e) => JSON.stringify(e)).join("\n") + "\n", { headers: NDJSON_HEADERS });
}

/**
 * Stream a canned RAG-style answer: wait ~600 ms ("retrieval"), send sources,
 * then send the answer word by word at ~18 ms per token.
 *
 * @param question - The user's question, echoed in the answer.
 * @param signal - Stops emitting tokens once the client disconnects.
 */
function mockStream(question: string, signal: AbortSignal) {
  const answer = `Here's what I found in your documents about **"${question.slice(0, 80)}"**.

Chanakya emphasised that a ruler's strength rests on a well-run treasury and a loyal council [1]. He advised that decisions be made only after consulting advisors, but kept secret until acted on [2].

Key ideas:
- **Artha** (material well-being) is the foundation of dharma and kama.
- A king should spend the day in fixed periods: administration, council, and review.
- Espionage and intelligence were considered essential tools of statecraft.

\`\`\`python
# This is a mock response. Set RAG_BACKEND_URL to connect your RAG pipeline.
answer = rag.query(question, top_k=4)
\`\`\`

Let me know if you'd like me to go deeper on any of these.`;

  const sources: StreamEvent = {
    type: "sources",
    sources: [
      { id: "1", title: "Arthashastra — Book I, Ch. 19", snippet: "In the happiness of his subjects lies the king's happiness…", score: 0.91 },
      { id: "2", title: "Arthashastra — Book I, Ch. 15", snippet: "All undertakings should be preceded by consultation…", score: 0.86 },
      { id: "3", title: "Chanakya Niti — Chapter 2", snippet: "Do not reveal what you have thought upon doing…", score: 0.74 },
    ],
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      await sleep(600); // simulate retrieval
      send(sources);
      for (const token of answer.match(/\S+\s*|\s+/g) ?? []) {
        if (signal.aborted) break;
        send({ type: "text", delta: token });
        await sleep(18);
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: NDJSON_HEADERS });
}

/** Resolve after `ms` milliseconds. */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
