"use client";

/**
 * Chat orchestration: sending messages, streaming the assistant's reply into
 * the conversation store, stopping and retrying.
 *
 * @module hooks/useChat
 */

import { useCallback, useRef, useState } from "react";
import { streamChat } from "../lib/chat-client";
import { uid } from "../lib/utils";
import type { Message } from "../lib/types";
import type { ConversationStore } from "./useConversations";

/** Value returned by {@link useChat}. */
export type ChatController = {
  /** `true` while an answer is being streamed. Only one stream runs at a time. */
  isStreaming: boolean;
  /**
   * Send a user message. Starts a new conversation when none is open.
   * Ignored when `text` is blank or a reply is already streaming.
   */
  send: (text: string) => void;
  /** Abort the in-flight reply. Text received so far is kept. */
  stop: () => void;
  /**
   * Regenerate the last assistant reply: drops it and re-asks the last user
   * message with the same history. No-op while streaming.
   */
  retry: () => void;
};

/**
 * Wire a {@link ConversationStore} to the streaming chat API.
 *
 * Flow for every reply:
 * 1. An empty assistant placeholder is appended (renders the "thinking" state).
 * 2. `sources` events attach retrieved documents to the placeholder.
 * 3. `text` events append to its content token by token.
 * 4. On failure the placeholder is flagged `error: true`; aborts are silent.
 *
 * @param store - The conversation store from {@link useConversations}.
 * @returns A {@link ChatController}.
 *
 * @example
 * const store = useConversations();
 * const chat = useChat(store);
 * <Composer onSend={chat.send} onStop={chat.stop} isStreaming={chat.isStreaming} />
 */
export function useChat(store: ConversationStore): ChatController {
  const { active, create, setMessages, updateMessage } = store;
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Append an assistant placeholder after `history` and stream the reply into it.
   *
   * @param conversationId - Target conversation, or `null` to create one.
   * @param history - Messages to send, ending with the user message being answered.
   */
  const streamReply = useCallback(
    async (conversationId: string | null, history: Message[]) => {
      const reply: Message = { id: uid(), role: "assistant", content: "" };
      const thread = [...history, reply];
      const id = conversationId ?? create(thread);
      if (conversationId) setMessages(id, thread);

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      try {
        const payload = history.map(({ role, content }) => ({ role, content }));
        for await (const event of streamChat(payload, controller.signal)) {
          if (event.type === "text") {
            updateMessage(id, reply.id, (m) => ({ ...m, content: m.content + event.delta }));
          } else if (event.type === "sources") {
            updateMessage(id, reply.id, (m) => ({ ...m, sources: event.sources }));
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          const message = (err as Error).message || "Unknown error";
          updateMessage(id, reply.id, (m) => ({
            ...m,
            error: true,
            content: m.content || `Something went wrong: ${message}`,
          }));
        }
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [create, setMessages, updateMessage],
  );

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content || isStreaming) return;
      const userMessage: Message = { id: uid(), role: "user", content };
      void streamReply(active?.id ?? null, [...(active?.messages ?? []), userMessage]);
    },
    [active, isStreaming, streamReply],
  );

  const retry = useCallback(() => {
    if (!active || isStreaming) return;
    const lastUserIndex = active.messages.findLastIndex((m) => m.role === "user");
    if (lastUserIndex === -1) return;
    void streamReply(active.id, active.messages.slice(0, lastUserIndex + 1));
  }, [active, isStreaming, streamReply]);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  return { isStreaming, send, stop, retry };
}
