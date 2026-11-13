/**
 * Small, framework-agnostic helpers.
 *
 * @module lib/utils
 */

/**
 * Generate a short random id for client-side entities (messages, conversations).
 *
 * Not cryptographically secure — only meant to be unique within one browser's
 * local history.
 *
 * @returns An 8-character base-36 string, e.g. `"k3j9x0ab"`.
 */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Join class names, skipping falsy values. A tiny `clsx` alternative.
 *
 * @param classes - Class strings or falsy values (`false`, `null`, `undefined`, `""`).
 * @returns A single space-separated class string.
 *
 * @example
 * cn("px-2", isActive && "bg-accent", undefined) // "px-2 bg-accent" (when active)
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Pick a greeting based on the visitor's local time of day.
 *
 * Must only be called on the client — on the server the time zone is unknown
 * and calling `new Date()` would block static prerendering.
 *
 * @returns `"Good morning"` before 12:00, `"Good afternoon"` before 18:00,
 *   otherwise `"Good evening"`.
 */
export function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Derive a sidebar title from the first user message.
 *
 * @param text - The raw message text.
 * @param max - Maximum length before truncating with an ellipsis.
 * @returns A single-line title.
 */
export function makeTitle(text: string, max: number): string {
  const line = text.replace(/\s+/g, " ").trim();
  return line.length > max ? line.slice(0, max - 1) + "…" : line;
}
