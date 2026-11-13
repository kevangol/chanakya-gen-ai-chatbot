/**
 * The RAG orchestrator: retrieve → prompt → stream Claude's answer as StreamEvents. Server-only.
 * @module lib/rag/answer
 */
import Anthropic from "@anthropic-ai/sdk";
import type { ChatRequestMessage, StreamEvent } from "@/app/lib/types";
import { ragConfig } from "./config";
import { buildMessages, SYSTEM_PROMPT } from "./prompt";
import { retrieve } from "./retrieve";

/** One client per server process; reads ANTHROPIC_API_KEY. */
const anthropic = new Anthropic();

/**
 * Answer the latest question in `history`, yielding events in the UI's wire format.
 * Order: one `sources` event first, then many `text` events. Errors are yielded as
 * an `error` event rather than thrown, so the HTTP stream always ends cleanly.
 *
 * @param history - Full conversation, ending with the user's new question.
 * @param signal - Aborts the Claude request when the client disconnects (Stop button).
 */
export async function* answer(
  history: ChatRequestMessage[],
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  try {
    const question = history.at(-1)?.content ?? "";
    const chunks = await retrieve(question);
    yield { type: "sources", sources: chunks.map((c) => c.source) };

    const stream = anthropic.beta.messages.stream(
      {
        model: ragConfig.model,
        max_tokens: 64000,
        system: SYSTEM_PROMPT,
        messages: buildMessages(history, chunks),
        output_config: { effort: "medium" }, // Opus 5.5 default; try "low" for faster chat replies
        // If Claude declines on a safety classifier, the API retries on a fallback model in the same call.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      },
      { signal },
    );

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield { type: "text", delta: event.delta.text };
      }
    }

    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      yield {
        type: "error",
        message: "The assistant declined to answer this request.",
      };
    } else if (final.stop_reason === "max_tokens") {
      yield { type: "text", delta: "\n\n_(Answer truncated.)_" };
    }
  } catch (err) {
    if (signal.aborted) return; // user pressed Stop: not an error
    if (err instanceof Anthropic.RateLimitError) {
      yield {
        type: "error",
        message: "Rate limited, please retry in a moment.",
      };
    } else if (err instanceof Anthropic.APIError) {
      yield {
        type: "error",
        message: `Claude API error (${err.status ?? "network"})`,
      };
    } else {
      console.error("[rag] answer failed", err);
      yield {
        type: "error",
        message: "Retrieval failed. Check the server logs.",
      };
    }
  }
}
