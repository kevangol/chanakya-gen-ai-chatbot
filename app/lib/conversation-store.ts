/**
 * A tiny external store for conversations, backed by `localStorage`.
 *
 * Why an external store instead of `useState` + effects?
 * - It plugs into React's `useSyncExternalStore`, which gives a separate
 *   **server snapshot** (empty list) and **client snapshot** (stored chats)
 *   with no hydration mismatch and no setState-in-effect.
 * - It listens to the `storage` event, so chats created in one browser tab
 *   show up in the others.
 *
 * Writes to `localStorage` are throttled ({@link PERSIST_DELAY_MS}) because
 * streaming updates the store once per token.
 *
 * @module lib/conversation-store
 */

import { STORAGE_KEY } from "./constants";
import type { Conversation } from "./types";

/** How long (ms) to batch updates before writing them to `localStorage`. */
const PERSIST_DELAY_MS = 250;

/** Shared empty snapshot. It must be the same reference every time, or React re-renders forever. */
const EMPTY: Conversation[] = [];

let state: Conversation[] | null = null; // null = not yet loaded from storage
let persistTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

/** Parse stored conversations, tolerating missing/corrupt data and disabled storage. */
function read(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

/** Write the current state to storage (best-effort: quota errors are ignored). */
function persist() {
  persistTimer = undefined;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state ?? EMPTY));
  } catch {
    // Quota exceeded or storage disabled — keep working in memory.
  }
}

/** Notify every subscribed component that the snapshot changed. */
function emit() {
  listeners.forEach((l) => l());
}

/** Reload from storage when another tab writes our key. */
function onStorage(e: StorageEvent) {
  if (e.key !== STORAGE_KEY) return;
  state = read();
  emit();
}

export const conversationStore = {
  /**
   * Subscribe to changes (the `subscribe` argument of `useSyncExternalStore`).
   * Attaches the cross-tab `storage` listener while at least one component is subscribed.
   *
   * @param listener - Called after every change.
   * @returns An unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    if (listeners.size === 0) window.addEventListener("storage", onStorage);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) window.removeEventListener("storage", onStorage);
    };
  },

  /**
   * Current conversations (client snapshot). Loads lazily from storage on first call.
   * Returns the same array reference until something changes.
   */
  getSnapshot(): Conversation[] {
    if (state === null) state = read();
    return state;
  },

  /** Snapshot used during SSR and hydration: always an empty list. */
  getServerSnapshot(): Conversation[] {
    return EMPTY;
  },

  /**
   * Apply an immutable update, notify subscribers and schedule a save.
   *
   * @param updater - Receives the current list and returns the next one. It must
   *   return a new array whenever anything changed.
   *
   * @example
   * conversationStore.update((cs) => cs.filter((c) => c.id !== id));
   */
  update(updater: (conversations: Conversation[]) => Conversation[]): void {
    state = updater(conversationStore.getSnapshot());
    emit();
    persistTimer ??= setTimeout(persist, PERSIST_DELAY_MS);
  },
};
