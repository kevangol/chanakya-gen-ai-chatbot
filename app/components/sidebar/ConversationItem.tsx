/**
 * @module components/sidebar/ConversationItem
 */

import { Trash2 } from "lucide-react";
import type { Conversation } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";

/** Props for {@link ConversationItem}. */
export type ConversationItemProps = {
  /** The conversation this row represents. */
  conversation: Conversation;
  /** Highlight as the currently open conversation. */
  isActive: boolean;
  /** Open this conversation. */
  onSelect: () => void;
  /** Delete this conversation. Deletes immediately, with no confirmation. */
  onDelete: () => void;
};

/**
 * One row in the sidebar: a truncated title that opens the chat, plus a
 * delete button that appears on hover or keyboard focus.
 *
 * The two buttons are siblings rather than nested, because a button inside a
 * button is invalid HTML.
 */
export function ConversationItem({ conversation, isActive, onSelect, onDelete }: ConversationItemProps) {
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "w-full truncate rounded-lg px-2 py-1.5 pr-8 text-left text-sm transition-colors",
          isActive ? "bg-muted-surface text-ink" : "text-ink/80 hover:bg-muted-surface/60",
        )}
      >
        {conversation.title}
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete "${conversation.title}"`}
        title="Delete"
        className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-muted opacity-0 transition-opacity hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>
    </li>
  );
}
