/**
 * @module components/sidebar/ConversationList
 */

import { MessageSquare } from "lucide-react";
import { ConversationItem } from "./ConversationItem";
import type { Conversation } from "@/app/lib/types";

/** Props for {@link ConversationList}. */
export type ConversationListProps = {
  /** Conversations to list, in display order. */
  conversations: Conversation[];
  /** Id of the open conversation, for highlighting. */
  activeId: string | null;
  /** Open a conversation. */
  onSelect: (id: string) => void;
  /** Delete a conversation. */
  onDelete: (id: string) => void;
};

/**
 * The scrollable "Recents" section of the sidebar. Takes the remaining height
 * between the New-chat button and the footer. Shows a hint when empty.
 */
export function ConversationList({ conversations, activeId, onSelect, onDelete }: ConversationListProps) {
  return (
    <nav className="mt-4 flex-1 overflow-y-auto px-3">
      {conversations.length === 0 ? (
        <p className="flex items-center gap-2 px-2 text-xs text-muted">
          <MessageSquare className="size-3.5" />
          Your chats will appear here
        </p>
      ) : (
        <>
          <p className="px-2 pb-1 text-xs font-medium text-muted">Recents</p>
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <ConversationItem
                key={c.id}
                conversation={c}
                isActive={c.id === activeId}
                onSelect={() => onSelect(c.id)}
                onDelete={() => onDelete(c.id)}
              />
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}
