"use client";

/**
 * @module components/chat/MessageActions
 */

import { Check, Copy, RotateCcw } from "lucide-react";
import { IconButton } from "../ui/IconButton";
import { useCopyToClipboard } from "@/app/hooks/useCopyToClipboard";

/** Props for {@link MessageActions}. */
export type MessageActionsProps = {
  /** Raw markdown of the message — what "Copy" puts on the clipboard. */
  content: string;
  /** Regenerate handler. The retry button only appears when this is set. */
  onRetry?: () => void;
};

/**
 * Toolbar under an assistant answer (Copy, Retry).
 *
 * Hidden until the parent message (which must have the `group` class) is
 * hovered, or until a button inside receives keyboard focus.
 */
export function MessageActions({ content, onRetry }: MessageActionsProps) {
  const [copied, copy] = useCopyToClipboard();

  return (
    <div className="mt-3 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
      <IconButton size="sm" label={copied ? "Copied" : "Copy"} onClick={() => copy(content)}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </IconButton>
      {onRetry && (
        <IconButton size="sm" label="Retry" onClick={onRetry}>
          <RotateCcw className="size-4" />
        </IconButton>
      )}
    </div>
  );
}
