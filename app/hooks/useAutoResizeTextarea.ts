"use client";

/**
 * @module hooks/useAutoResizeTextarea
 */

import { useLayoutEffect, useRef } from "react";

/**
 * Grow a `<textarea>` with its content, up to a maximum height, after which it scrolls.
 *
 * Works by resetting the height to `auto` (so it can also shrink) and then
 * setting it to `scrollHeight`. Runs in a layout effect so there is no visible
 * jump between keystrokes.
 *
 * @param value - The textarea's current value; resizing runs whenever it changes.
 * @param maxHeight - Maximum height in px.
 * @returns A ref to attach to the textarea.
 */
export function useAutoResizeTextarea(value: string, maxHeight: number) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  return ref;
}
