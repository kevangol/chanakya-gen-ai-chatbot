/**
 * Browser client for the streaming `/api/chat` endpoint.
 *
 * @module lib/chat-client
 */

import { CHAT_ENDPOINT } from "./constants";
import type { ChatRequestMessage, StreamEvent } from "./types";

/**
 * POST the conversation to `/api/chat` and yield {@link StreamEvent}s as they arrive.
 *
 * The response body is newline-delimited JSON. Network chunks don't line up
 * with JSON lines, so we keep a buffer and only parse complete lines; the
 * trailing partial line is carried over to the next chunk.
 *
 * An `error` event from the server is converted into a thrown `Error` so
 * callers have a single failure path.
 *
 * @param messages - Full conversation history, oldest first, ending with the new user message.
 * @param signal - Abort signal; aborting cancels the fetch and throws an `AbortError`.
 * @yields Each parsed stream event, in order.
 * @throws {Error} When the HTTP status is not OK, the body is missing, or the
 *   server emits an `error` event.
 * @throws {DOMException} `AbortError` when `signal` is aborted.
 *
 * @example
 * for await (const ev of streamChat(history, controller.signal)) {
 *   if (ev.type === "text") answer += ev.delta;
 * }
 */
export async function* streamChat(
  messages: ChatRequestMessage[],
  signal: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const res = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const parse = (line: string): StreamEvent | null => {
    if (!line.trim()) return null;
    const event = JSON.parse(line) as StreamEvent;
    if (event.type === "error") throw new Error(event.message);
    return event;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const event = parse(line);
      if (event) yield event;
    }
  }

  // Flush a final line that wasn't newline-terminated.
  const last = parse(buffer + decoder.decode());
  if (last) yield last;
}
