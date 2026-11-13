/**
 * @module components/chat/UserMessage
 */

/** Props for {@link UserMessage}. */
export type UserMessageProps = {
  /** The user's text, shown verbatim; newlines are preserved, markdown isn't parsed. */
  content: string;
};

/** A right-aligned rounded bubble containing what the user typed. */
export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex animate-fade-up justify-end">
      <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-muted-surface px-4 py-2.5 text-[15px] leading-relaxed">
        {content}
      </div>
    </div>
  );
}
