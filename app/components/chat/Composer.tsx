"use client";

/**
 * @module components/chat/Composer
 */

import { ArrowUp, Library, Square } from "lucide-react";
import { useAutoResizeTextarea } from "@/app/hooks/useAutoResizeTextarea";
import { APP_NAME, COMPOSER_MAX_HEIGHT } from "@/app/lib/constants";
import { cn } from "@/app/lib/utils";

/** Props for {@link Composer}. */
export type ComposerProps = {
  /** Current input text (controlled). */
  value: string;
  /** Called on every keystroke with the new text. */
  onChange: (value: string) => void;
  /** Called on Enter / send-button click when the input is non-empty and nothing is streaming. */
  onSend: () => void;
  /** Called by the stop button. If omitted, no stop button is shown while streaming. */
  onStop?: () => void;
  /** Whether an answer is streaming — disables sending and swaps send for stop. */
  isStreaming: boolean;
  /**
   * `"hero"` — taller box with an inviting placeholder, for the welcome screen.
   * `"docked"` — compact box pinned under the message list.
   */
  variant?: "hero" | "docked";
  /** Focus the textarea on mount. */
  autoFocus?: boolean;
};

/**
 * The message input: an auto-growing textarea with a toolbar underneath.
 *
 * Keyboard:
 * - **Enter** sends.
 * - **Shift+Enter** inserts a newline.
 * - Enter during IME composition (e.g. typing Hindi/Japanese) is ignored so
 *   confirming a candidate word doesn't send the message.
 *
 * Clicking anywhere on the card focuses the textarea, so the whole box feels
 * like one input.
 */
export function Composer({
  value,
  onChange,
  onSend,
  onStop,
  isStreaming,
  variant = "docked",
  autoFocus,
}: ComposerProps) {
  const textareaRef = useAutoResizeTextarea(value, COMPOSER_MAX_HEIGHT);
  const canSend = value.trim().length > 0 && !isStreaming;
  const isHero = variant === "hero";

  return (
    <div
      onClick={() => textareaRef.current?.focus()}
      className={cn(
        "cursor-text rounded-2xl border border-line bg-surface transition-shadow",
        "shadow-[0_0.25rem_1.25rem_rgba(0,0,0,0.035)]",
        "focus-within:border-ink/20 focus-within:shadow-[0_0.25rem_1.25rem_rgba(0,0,0,0.075)]",
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        rows={1}
        autoFocus={autoFocus}
        aria-label="Message"
        placeholder={isHero ? "How can I help you today?" : `Reply to ${APP_NAME}…`}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        className={cn(
          "block w-full resize-none bg-transparent px-4 pt-4 text-[15px] leading-relaxed outline-none placeholder:text-muted",
          isHero ? "min-h-[4.5rem]" : "min-h-12",
        )}
      />

      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        <span className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted">
          <Library className="size-3.5" />
          Grounded in your knowledge base
        </span>

        {isStreaming && onStop ? (
          <SubmitButton label="Stop generating" onClick={onStop} className="bg-ink text-bg hover:opacity-80">
            <Square className="size-3 fill-current" />
          </SubmitButton>
        ) : (
          <SubmitButton
            label="Send message"
            onClick={onSend}
            disabled={!canSend}
            className="bg-accent text-white hover:bg-accent-hover"
          >
            <ArrowUp className="size-4" strokeWidth={2.5} />
          </SubmitButton>
        )}
      </div>
    </div>
  );
}

/**
 * The square send/stop button in the composer's bottom-right corner.
 *
 * @param props.label - Accessible name.
 * @param props.className - Colour classes for the variant (send vs stop).
 */
function SubmitButton({
  label,
  className,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg transition-all",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
