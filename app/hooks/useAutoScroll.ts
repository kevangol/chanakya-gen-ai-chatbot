"use client";

/**
 * @module hooks/useAutoScroll
 */

import { useEffect, useRef } from "react";
import { AUTO_SCROLL_THRESHOLD } from "../lib/constants";

/**
 * Keep a scroll container pinned to the bottom as content grows — but only
 * if the user is already near the bottom. Scrolling up to read earlier
 * messages pauses auto-scroll until they return.
 *
 * @typeParam T - Element type of the scroll container.
 * @param dependency - Value whose change signals new content (e.g. the messages array).
 * @param threshold - Distance from the bottom (px) still considered "at the bottom".
 * @returns A ref to attach to the scrollable element.
 *
 * @example
 * const ref = useAutoScroll<HTMLDivElement>(messages);
 * <div ref={ref} className="overflow-y-auto">…</div>
 */
export function useAutoScroll<T extends HTMLElement>(dependency: unknown, threshold = AUTO_SCROLL_THRESHOLD) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < threshold) el.scrollTop = el.scrollHeight;
  }, [dependency, threshold]);

  return ref;
}
