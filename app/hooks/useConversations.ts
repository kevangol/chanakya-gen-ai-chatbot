"use client";

/**
 * Conversation state for components: every chat thread, which one is
 * open, and functions to change them.
 *
 * @module hooks/useConversations
 */

import { useCallback, useState, useSyncExternalStore } from "react";
import { conversationStore } from "../lib/conversation-store";
import { TITLE_MAX_LENGTH } from "../lib/constants";
import { makeTitle, uid } from "../lib/utils";
import type { Conversation, Message } from "../lib/types";

/** Value returned by {@link useConversations}. */
export type ConversationStore = {
  /** All conversations, newest first. */
  conversations: Conversation[];
  /** Id of the open conversation, or `null` on the welcome screen. */
  activeId: string | null;
  /** The open conversation object, or `null`. */
  active: Conversation | null;
  /** Open a conversation by id, or pass `null` to return to the welcome screen. */
  select: (id: string | null) => void;
  /**
   * Create a conversation, put it at the top of the list and open it.
   * The title is derived from the first user message in `messages`.
   * @returns The new conversation id.
   */
  create: (messages: Message[]) => string;
  /** Replace the whole message list of a conversation (also bumps `updatedAt`). */
  setMessages: (conversationId: string, messages: Message[]) => void;
  /**
   * Immutably update a single message. Called for every streamed token, so
   * only the conversation and message that changed get new objects.
   */
  updateMessage: (conversationId: string, messageId: string, update: (m: Message) => Message) => void;
  /** Delete a conversation; if it was open, go back to the welcome screen. */
  remove: (conversationId: string) => void;
};

/**
 * Read and change chat threads. Saving happens automatically through
 * {@link conversationStore}.
 *
 * The server and the first client render see an empty list. Stored chats appear
 * right after hydration, so there's no mismatch warning.
 *
 * The open conversation (`activeId`) is per-tab UI state and is not saved.
 *
 * @returns A {@link ConversationStore}.
 *
 * @example
 * const store = useConversations();
 * const id = store.create([{ id: uid(), role: "user", content: "Hi" }]);
 * store.updateMessage(id, msgId, (m) => ({ ...m, content: m.content + "!" }));
 */
export function useConversations(): ConversationStore {
  const conversations = useSyncExternalStore(
    conversationStore.subscribe,
    conversationStore.getSnapshot,
    conversationStore.getServerSnapshot,
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const create = useCallback((messages: Message[]) => {
    const id = uid();
    const firstUser = messages.find((m) => m.role === "user");
    const conversation: Conversation = {
      id,
      title: makeTitle(firstUser?.content ?? "New chat", TITLE_MAX_LENGTH),
      messages,
      updatedAt: Date.now(),
    };
    conversationStore.update((cs) => [conversation, ...cs]);
    setActiveId(id);
    return id;
  }, []);

  const setMessages = useCallback((conversationId: string, messages: Message[]) => {
    conversationStore.update((cs) =>
      cs.map((c) => (c.id === conversationId ? { ...c, messages, updatedAt: Date.now() } : c)),
    );
  }, []);

  const updateMessage = useCallback(
    (conversationId: string, messageId: string, update: (m: Message) => Message) => {
      conversationStore.update((cs) =>
        cs.map((c) =>
          c.id === conversationId
            ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? update(m) : m)) }
            : c,
        ),
      );
    },
    [],
  );

  const remove = useCallback((conversationId: string) => {
    conversationStore.update((cs) => cs.filter((c) => c.id !== conversationId));
    setActiveId((current) => (current === conversationId ? null : current));
  }, []);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  return { conversations, activeId, active, select: setActiveId, create, setMessages, updateMessage, remove };
}
