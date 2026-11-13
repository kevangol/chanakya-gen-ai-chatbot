/**
 * @module components/chat/SuggestionChips
 */

import type { Suggestion } from "@/app/lib/constants";

/** Props for {@link SuggestionChips}. */
export type SuggestionChipsProps = {
  /** Prompts to show, each with an icon. */
  suggestions: Suggestion[];
  /** Called with the suggestion's text when a chip is clicked. */
  onSelect: (text: string) => void;
};

/**
 * A wrapping row of starter-prompt chips for the empty state. Clicking a
 * chip sends its text immediately; it doesn't just fill the input.
 */
export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {suggestions.map(({ icon: Icon, text }) => (
        <button
          key={text}
          type="button"
          onClick={() => onSelect(text)}
          className="flex items-center gap-2 rounded-lg border border-line bg-bg px-3 py-1.5 text-sm text-muted transition-colors hover:border-ink/20 hover:bg-surface hover:text-ink"
        >
          <Icon className="size-4" strokeWidth={1.75} />
          {text}
        </button>
      ))}
    </div>
  );
}
