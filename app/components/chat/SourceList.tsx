"use client";

/**
 * Retrieved-document citations shown above an assistant answer.
 *
 * @module components/chat/SourceList
 */

import { useState } from "react";
import { ChevronDown, ExternalLink, FileText } from "lucide-react";
import type { Source } from "@/app/lib/types";
import { cn } from "@/app/lib/utils";

/** Props for {@link SourceList}. */
export type SourceListProps = {
  /** Sources in citation order: `sources[0]` is cited as `[1]` in the answer. */
  sources: Source[];
};

/**
 * A collapsible "N sources" pill. Expanding it shows a grid of
 * {@link SourceCard}s. Collapsed by default so the answer stays the focus.
 */
export function SourceList({ sources }: SourceListProps) {
  const [open, setOpen] = useState(false);
  if (sources.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:bg-surface hover:text-ink"
      >
        <FileText className="size-3.5" />
        {sources.length} {sources.length === 1 ? "source" : "sources"}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-2 grid animate-fade-up gap-2 sm:grid-cols-2">
          {sources.map((source, i) => (
            <SourceCard key={source.id} source={source} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Props for {@link SourceCard}. */
export type SourceCardProps = {
  /** The retrieved document. */
  source: Source;
  /** 1-based number matching the `[n]` citations in the answer text. */
  index: number;
};

/**
 * One retrieved document: number, title, relevance score and a 2-line snippet.
 * Rendered as a link (opening in a new tab) when `source.url` is set,
 * otherwise as a static card.
 */
export function SourceCard({ source, index }: SourceCardProps) {
  const className =
    "block rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-ink/20";

  const body = (
    <>
      <div className="flex items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted-surface text-[10px] font-medium">
          {index}
        </span>
        <span className="truncate text-sm font-medium">{source.title}</span>
        {source.url && <ExternalLink className="size-3 shrink-0 text-muted" />}
        {source.score != null && (
          <span className="ml-auto shrink-0 text-[10px] text-muted">{Math.round(source.score * 100)}%</span>
        )}
      </div>
      {source.snippet && <p className="mt-1.5 line-clamp-2 text-xs text-muted">{source.snippet}</p>}
    </>
  );

  return source.url ? (
    <a href={source.url} target="_blank" rel="noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}
