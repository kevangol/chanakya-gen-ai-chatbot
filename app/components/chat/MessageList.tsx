"use client";

/**
 * @module components/chat/MessageList
 */

import { useAutoScroll } from "@/app/hooks/useAutoScroll";
import type { Message } from "@/app/lib/types";
import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";

/** Props for {@link MessageList}. */
export type MessageListProps = {
  /** Messages of the open conversation, oldest first. */
  messages: Message[];
  /** Whether the last message is still streaming. */
  isStreaming: boolean;
  /** Regenerate the last answer. */
  onRetry: () => void;
};

/**
 * The scrollable transcript. Fills the space between the header and the
 * docked composer, centres content in a readable column, and follows new
 * tokens via {@link useAutoScroll} (unless the user scrolled up).
 *
 * Only the **last** message can be streaming, and only the last assistant
 * message gets a Retry button.
 */
export function MessageList({ messages, isStreaming, onRetry }: MessageListProps) {
  const scrollRef = useAutoScroll<HTMLDivElement>(messages);
  const lastIndex = messages.length - 1;

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 pb-8 pt-4">
        {messages.map((message, i) => {
          if (message.role === "user") return <UserMessage key={message.id} content={message.content} />;
          const isLast = i === lastIndex;
          return (
            <AssistantMessage
              key={message.id}
              message={message}
              isStreaming={isStreaming && isLast}
              onRetry={isLast && !isStreaming ? onRetry : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
