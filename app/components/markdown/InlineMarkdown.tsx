/**
 * Inline-level markdown: the styling *inside* a paragraph, list item or heading.
 *
 * @module components/markdown/InlineMarkdown
 */

import type { ReactNode } from "react";

/**
 * Matches every supported inline token. The capture group makes
 * `String.split` keep the tokens in the result array, interleaved with the
 * plain text between them.
 *
 * Order matters: `**bold**` must be tried before `*italic*`.
 */
const INLINE_TOKEN = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|\[\d+\])/g;

/**
 * Convert one line of inline markdown into React nodes.
 *
 * Supported syntax:
 * | Syntax          | Output                                       |
 * |-----------------|----------------------------------------------|
 * | `` `code` ``    | inline code                                  |
 * | `**bold**`      | `<strong>`                                   |
 * | `*italic*`      | `<em>`                                       |
 * | `[text](url)`   | external link (new tab, `rel="noreferrer"`)  |
 * | `[1]`           | citation badge pointing at source #1         |
 *
 * Tokens don't nest (e.g. bold inside a link renders literally). Text is
 * always rendered as React text nodes, never as HTML, so model output can't
 * inject markup.
 *
 * @param text - A single line / paragraph of markdown.
 * @returns An array of strings and elements, suitable as `children`.
 */
export function renderInline(text: string): ReactNode[] {
  return text.split(INLINE_TOKEN).map((part, i) => {
    if (!part) return null;

    if (part.startsWith("`")) {
      return (
        <code key={i} className="rounded-md bg-code px-1.5 py-0.5 font-mono text-[0.85em] text-accent">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;

    const citation = part.match(/^\[(\d+)\]$/);
    if (citation) return <Citation key={i} index={citation[1]} />;

    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={i}
          href={link[2]}
          target="_blank"
          rel="noreferrer"
          className="underline decoration-line underline-offset-2 hover:decoration-accent"
        >
          {link[1]}
        </a>
      );
    }

    return part;
  });
}

/**
 * A small numbered badge marking which retrieved source supports a claim.
 *
 * @param props.index - The 1-based source number as written in the text.
 */
function Citation({ index }: { index: string }) {
  return (
    <sup
      title={`Source ${index}`}
      className="mx-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted-surface px-1 font-sans text-[10px] font-medium text-muted"
    >
      {index}
    </sup>
  );
}
