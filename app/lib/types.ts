/**
 * Shared domain types for the Chanakya RAG chat app.
 *
 * These types are used on both sides of the wire: the client UI
 * (`app/components`, `app/hooks`) and the API route (`app/api/chat`).
 *
 * @module lib/types
 */

/**
 * A single retrieved document chunk that was used to ground an answer.
 *
 * Your RAG backend decides what goes in here; only `id` and `title` are required
 * for the UI to render a source card.
 */
export type Source = {
  /** Stable identifier of the chunk / document (used as a React key). */
  id: string;
  /** Human-readable title, e.g. `"Arthashastra — Book I, Ch. 19"`. */
  title: string;
  /** Short excerpt of the retrieved text, shown (clamped to 2 lines) under the title. */
  snippet?: string;
  /** Optional link to the original document. When set, the source card becomes clickable. */
  url?: string;
  /** Retrieval similarity score in the range `0..1`. Rendered as a percentage. */
  score?: number;
};

/** Who authored a message. */
export type Role = "user" | "assistant";

/** One turn in a conversation. */
export type Message = {
  /** Client-generated unique id (see {@link uid}). */
  id: string;
  /** Author of the message. */
  role: Role;
  /** Markdown content. For assistant messages this grows while streaming. */
  content: string;
  /** Documents retrieved for this answer (assistant messages only). */
  sources?: Source[];
  /** `true` when the request failed; the UI renders the content in an error colour. */
  error?: boolean;
};

/** A chat thread shown in the sidebar and persisted to `localStorage`. */
export type Conversation = {
  /** Client-generated unique id. */
  id: string;
  /** Title shown in the sidebar — derived from the first user message. */
  title: string;
  /** Ordered list of messages, oldest first. */
  messages: Message[];
  /** Unix epoch (ms) of the last activity, useful for sorting. */
  updatedAt: number;
};

/**
 * Minimal message shape sent to `/api/chat` (ids and UI flags are stripped).
 */
export type ChatRequestMessage = Pick<Message, "role" | "content">;

/**
 * Events streamed by `POST /api/chat`, encoded as **newline-delimited JSON**
 * (one JSON object per line, `Content-Type: application/x-ndjson`).
 *
 * @example
 * {"type":"sources","sources":[{"id":"1","title":"Doc A","score":0.9}]}
 * {"type":"text","delta":"Hello "}
 * {"type":"text","delta":"world"}
 * {"type":"error","message":"Vector store unavailable"}
 */
export type StreamEvent =
  /** Retrieved documents; normally sent once, before any text. */
  | { type: "sources"; sources: Source[] }
  /** A chunk of answer text to append to the assistant message. */
  | { type: "text"; delta: string }
  /** A fatal error; the client stops reading and shows the message. */
  | { type: "error"; message: string };
