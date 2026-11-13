/**
 * @module components/chat/ThinkingIndicator
 */

import { Logo } from "../ui/Logo";

/** Props for {@link ThinkingIndicator}. */
export type ThinkingIndicatorProps = {
  /**
   * Which RAG phase we're in:
   * - `"retrieving"` — waiting for sources from the vector store.
   * - `"generating"` — sources arrived, waiting for the first token.
   */
  phase: "retrieving" | "generating";
};

/** Status text for each phase. */
const LABELS: Record<ThinkingIndicatorProps["phase"], string> = {
  retrieving: "Searching your documents",
  generating: "Writing answer",
};

/**
 * Placeholder shown in an assistant message before its first token arrives:
 * a spinning logo, the current phase and three pulsing dots.
 *
 * Announced to screen readers via `role="status"`.
 */
export function ThinkingIndicator({ phase }: ThinkingIndicatorProps) {
  return (
    <div role="status" className="flex items-center gap-3 py-2 text-sm text-muted">
      <Logo spinning className="size-5" />
      {LABELS[phase]}
      <span aria-hidden className="flex gap-1">
        {[0, 1, 2].map((d) => (
          <span
            key={d}
            className="thinking-dot size-1.5 rounded-full bg-muted"
            style={{ animationDelay: `${d * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  );
}
