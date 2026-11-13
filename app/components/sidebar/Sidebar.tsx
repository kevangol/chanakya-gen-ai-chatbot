/**
 * @module components/sidebar/Sidebar
 */

import { PanelLeftClose, Plus } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { Logo } from "../ui/Logo";
import { ConversationList } from "./ConversationList";
import { SidebarFooter } from "./SidebarFooter";
import { APP_NAME } from "@/app/lib/constants";
import type { Conversation } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";

/** Props for {@link Sidebar}. */
export type SidebarProps = {
  /** Whether the sidebar is visible. */
  isOpen: boolean;
  /** Hide the sidebar (close button, or tapping the mobile backdrop). */
  onClose: () => void;
  /** All conversations, newest first. */
  conversations: Conversation[];
  /** Id of the open conversation, for highlighting. */
  activeId: string | null;
  /** Open a conversation. */
  onSelect: (id: string) => void;
  /** Start a new chat. */
  onNewChat: () => void;
  /** Delete a conversation. */
  onDelete: (id: string) => void;
};

/**
 * Left navigation panel: brand, "New chat", recent conversations and a
 * workspace footer.
 *
 * Responsive behaviour:
 * - **Desktop (`md+`)**: sits in the layout and pushes the chat. Hiding
 *   slides it out with a negative margin, so the chat smoothly widens.
 * - **Mobile**: fixed overlay that slides in over the chat, with a
 *   dimmed backdrop that closes it on tap.
 */
export function Sidebar({ isOpen, onClose, conversations, activeId, onSelect, onNewChat, onDelete }: SidebarProps) {
  return (
    <>
      {isOpen && <div aria-hidden className="fixed inset-0 z-10 bg-black/20 md:hidden" onClick={onClose} />}

      <aside
        aria-label="Conversations"
        className={cn(
          "fixed inset-y-0 left-0 z-20 flex w-72 flex-col border-r border-line bg-sidebar",
          "transition-[margin,transform] duration-300 md:relative",
          isOpen ? "translate-x-0 md:ml-0" : "-translate-x-full md:-ml-72 md:translate-x-0",
        )}
      >
        <div className="flex h-14 items-center justify-between px-3">
          <div className="flex items-center gap-2 px-2">
            <Logo className="size-5" />
            <span className="font-serif text-lg font-medium tracking-tight">{APP_NAME}</span>
          </div>
          <IconButton label="Close sidebar" onClick={onClose}>
            <PanelLeftClose className="size-[18px]" />
          </IconButton>
        </div>

        <div className="px-3">
          <NewChatButton onClick={onNewChat} />
        </div>

        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={onSelect}
          onDelete={onDelete}
        />

        <SidebarFooter />
      </aside>
    </>
  );
}

/**
 * The prominent accent-coloured "New chat" action at the top of the sidebar.
 *
 * @param props.onClick - Starts a new chat.
 */
function NewChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-accent transition-colors hover:bg-muted-surface"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-accent text-white">
        <Plus className="size-4" strokeWidth={2.5} />
      </span>
      New chat
    </button>
  );
}
