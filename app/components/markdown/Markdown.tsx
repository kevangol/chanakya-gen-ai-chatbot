/**
 * A tiny, dependency-free markdown renderer tuned for streamed LLM answers.
 *
 * @module components/markdown/Markdown
 */

import type { ReactNode } from "react";
import { CodeBlock } from "./CodeBlock";
import { renderInline } from "./InlineMarkdown";

/** Props for {@link Markdown}. */
export type MarkdownProps = {
  /** Markdown source. May be incomplete while streaming — that's handled. */
  text: string;
};

/** Line starts a list item: `- `, `* ` or `1. `. */
const LIST_ITEM = /^\s*([-*]|\d+\.)\s+/;
/** Line starts any block other than a paragraph (used to end paragraphs). */
const BLOCK_START = /^(```|#{1,3}\s|\s*([-*]|\d+\.)\s|>)/;
/** Tailwind text size per heading level (`#`, `##`, `###`). */
const HEADING_SIZES = ["text-xl", "text-lg", "text-base"] as const;

/**
 * Render markdown as React elements.
 *
 * Block-level syntax:
 * - ```` ```lang ```` fenced code → {@link CodeBlock}. An **unclosed** fence
 *   (common mid-stream) renders everything after it as code.
 * - `#`, `##`, `###` headings
 * - `-` / `*` bullet lists and `1.` ordered lists (single level)
 * - `>` block quotes
 * - Paragraphs: consecutive non-blank lines are joined with spaces.
 *
 * Inline syntax is handled by {@link renderInline}.
 *
 * Blocks are direct children of the wrapper `div`; the streaming caret
 * (see `.is-streaming` in `globals.css`) relies on that structure.
 *
 * @example
 * <Markdown text={"# Title\n\nSome **bold** text [1]"} />
 */
export function Markdown({ text }: MarkdownProps) {
  return <div className="space-y-4">{parseBlocks(text)}</div>;
}

/**
 * Single-pass, line-based block parser. Each branch consumes the lines that
 * belong to its block and advances `i`, then pushes one element.
 *
 * @param text - Markdown source.
 * @returns One React element per block.
 */
function parseBlocks(text: string): ReactNode[] {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const key = blocks.length;

    // Fenced code block
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++; // skip closing fence (if any)
      blocks.push(<CodeBlock key={key} language={fence[1]} code={code.join("\n")} />);
      continue;
    }

    // Heading
    const heading = line.match(/^(#{1,3})\s+(.*)/);
    if (heading) {
      blocks.push(
        <p key={key} className={`${HEADING_SIZES[heading[1].length - 1]} pt-1 font-semibold`}>
          {renderInline(heading[2])}
        </p>,
      );
      i++;
      continue;
    }

    // List (ordered-ness is decided by the first item)
    if (LIST_ITEM.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && LIST_ITEM.test(lines[i])) items.push(lines[i++].replace(LIST_ITEM, ""));
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={key} className={`${ordered ? "list-decimal" : "list-disc"} space-y-1.5 pl-6 marker:text-muted`}>
          {items.map((item, j) => (
            <li key={j} className="pl-1">
              {renderInline(item)}
            </li>
          ))}
        </List>,
      );
      continue;
    }

    // Block quote
    if (line.startsWith(">")) {
      const quote: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) quote.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(
        <blockquote key={key} className="border-l-2 border-line pl-4 italic text-muted">
          {renderInline(quote.join(" "))}
        </blockquote>,
      );
      continue;
    }

    // Blank line — block separator
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph
    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && !BLOCK_START.test(lines[i])) paragraph.push(lines[i++]);
    // Safety net: never loop forever on a line no branch consumed.
    if (paragraph.length === 0) paragraph.push(lines[i++]);
    blocks.push(<p key={key}>{renderInline(paragraph.join(" "))}</p>);
  }

  return blocks;
}
