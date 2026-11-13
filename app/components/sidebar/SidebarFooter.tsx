/**
 * @module components/sidebar/SidebarFooter
 */

import { UserRound } from "lucide-react";

/**
 * Bottom of the sidebar: workspace / account card.
 *
 * Currently static. Once auth is added, this is the place for the signed-in
 * user's name, avatar and a settings menu.
 */
export function SidebarFooter() {
  return (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
        <span className="flex size-7 items-center justify-center rounded-full bg-ink text-bg">
          <UserRound className="size-4" />
        </span>
        <div className="text-sm leading-tight">
          <p className="font-medium">Your workspace</p>
          <p className="text-xs text-muted">RAG assistant</p>
        </div>
      </div>
    </div>
  );
}
