/**
 * @module components/chat/ChatHeader
 */

import { PanelLeftOpen, SquarePen } from "lucide-react";
import { IconButton } from "../ui/IconButton";

/** Props for {@link ChatHeader}. */
export type ChatHeaderProps = {
  /** Title of the open conversation; omitted on the welcome screen. */
  title?: string;
  /**
   * Whether the sidebar is hidden. When it is, the header shows its own
   * "open sidebar" and "new chat" buttons so those actions stay reachable.
   */
  sidebarHidden: boolean;
  /** Open the sidebar. */
  onOpenSidebar: () => void;
  /** Start a new chat. */
  onNewChat: () => void;
};

/** Slim top bar of the main panel. */
export function ChatHeader({ title, sidebarHidden, onOpenSidebar, onNewChat }: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-1 px-3">
      {sidebarHidden && (
        <>
          <IconButton label="Open sidebar" onClick={onOpenSidebar}>
            <PanelLeftOpen className="size-[18px]" />
          </IconButton>
          <IconButton label="New chat" onClick={onNewChat}>
            <SquarePen className="size-4" />
          </IconButton>
        </>
      )}
      {title && <h1 className="truncate px-2 text-sm font-medium text-ink/80">{title}</h1>}
    </header>
  );
}
