"use client";

/**
 * @module components/markdown/CodeBlock
 */

import { Check, Copy } from "lucide-react";
import { useCopyToClipboard } from "@/app/hooks/useCopyToClipboard";

/** Props for {@link CodeBlock}. */
export type CodeBlockProps = {
  /** Language from the opening fence (e.g. `"python"`); empty when unspecified. */
  language: string;
  /** Raw code, without the surrounding fences. */
  code: string;
};

/**
 * A fenced code block with a language label and a copy button.
 *
 * Code is rendered as plain monospace text (no syntax highlighting, to keep
 * the bundle small). Long lines scroll horizontally instead of wrapping.
 */
export function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, copy] = useCopyToClipboard();

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-code font-sans">
      <div className="flex items-center justify-between px-4 py-2 text-xs text-muted">
        <span>{language || "code"}</span>
        <button
          type="button"
          onClick={() => copy(code)}
          className="flex items-center gap-1.5 rounded px-2 py-0.5 transition-colors hover:bg-muted-surface hover:text-ink"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 pb-4 font-mono text-[13px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}
