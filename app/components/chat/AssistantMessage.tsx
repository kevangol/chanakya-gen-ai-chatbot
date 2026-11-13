/**
 * @module components/chat/AssistantMessage
 */

import { Markdown } from "../markdown/Markdown";
import { MessageActions } from "./MessageActions";
import { SourceList } from "./SourceList";
import { ThinkingIndicator } from "./ThinkingIndicator";
import type { Message } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";

/** Props for {@link AssistantMessage}. */
export type AssistantMessageProps = {
  /** The assistant message to render. */
  message: Message;
  /** `true` while this message is still receiving tokens. */
  isStreaming: boolean;
  /** Regenerate handler, passed only for the latest answer. */
  onRetry?: () => void;
};

/**
 * An assistant answer, rendered full-width without a bubble, in serif type.
 *
 * Layout, top to bottom:
 * 1. {@link SourceList} — once the backend has sent sources.
 * 2. {@link ThinkingIndicator} while there's no text yet, otherwise the
 *    rendered {@link Markdown}. While streaming, an accent caret is drawn
 *    after the last block (the `.is-streaming` rule in `globals.css`).
 * 3. {@link MessageActions} — after streaming finishes.
 *
 * Failed requests (`message.error`) are shown in red.
 */
export function AssistantMessage({ message, isStreaming, onRetry }: AssistantMessageProps) {
  const isThinking = isStreaming && !message.content;

  return (
    <div className="group animate-fade-up">
      {message.sources && <SourceList sources={message.sources} />}

      {isThinking ? (
        <ThinkingIndicator phase={message.sources ? "generating" : "retrieving"} />
      ) : (
        <div
          className={cn(
            "font-serif text-[16.5px] leading-[1.7]",
            message.error && "text-red-600 dark:text-red-400",
            isStreaming && "is-streaming",
          )}
        >
          <Markdown text={message.content} />
        </div>
      )}

      {!isStreaming && message.content && <MessageActions content={message.content} onRetry={onRetry} />}
    </div>
  );
}
