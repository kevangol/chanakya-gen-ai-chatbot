/**
 * App-wide constants and static configuration.
 *
 * @module lib/constants
 */

import { Coins, Handshake, Scale, ScrollText, type LucideIcon } from "lucide-react";

/** Display name of the assistant, used in the sidebar, placeholders and disclaimers. */
export const APP_NAME = "Chanakya";

/** `localStorage` key under which all conversations are persisted as JSON. */
export const STORAGE_KEY = "chanakya.conversations";

/** Endpoint the client streams answers from. See `app/api/chat/route.ts`. */
export const CHAT_ENDPOINT = "/api/chat";

/** Max characters of the first user message used as a conversation title. */
export const TITLE_MAX_LENGTH = 60;

/** Max height (px) the composer textarea grows to before it starts scrolling. */
export const COMPOSER_MAX_HEIGHT = 240;

/**
 * Viewport width (px) below which the layout is treated as mobile:
 * the sidebar starts closed and overlays the content instead of pushing it.
 * Matches Tailwind's `md` breakpoint.
 */
export const MOBILE_BREAKPOINT = 768;

/**
 * Distance (px) from the bottom within which the message list keeps
 * auto-scrolling as new tokens arrive. If the user scrolled further up to
 * read, we leave them alone.
 */
export const AUTO_SCROLL_THRESHOLD = 200;

/** A starter prompt shown as a chip on the empty-state screen. */
export type Suggestion = {
  /** Lucide icon rendered before the text. */
  icon: LucideIcon;
  /** Prompt that is sent verbatim when the chip is clicked. */
  text: string;
};

/** Starter prompts on the welcome screen. Edit these to match your corpus. */
export const SUGGESTIONS: Suggestion[] = [
  { icon: ScrollText, text: "Summarise the key ideas of the Arthashastra" },
  { icon: Scale, text: "What did Chanakya say about good governance?" },
  { icon: Handshake, text: "Chanakya's advice on choosing friends" },
  { icon: Coins, text: "How should a treasury be managed?" },
];
