"use client";

/**
 * @module hooks/useCopyToClipboard
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Copy text to the clipboard and expose a temporary "copied" flag for UI feedback
 * (e.g. swapping a copy icon for a check mark).
 *
 * @param resetAfter - How long (ms) `copied` stays `true` after a successful copy.
 * @returns A tuple `[copied, copy]`:
 *   - `copied` — `true` for `resetAfter` ms after the last successful copy.
 *   - `copy(text)` — writes `text` to the clipboard. Failures (no permission,
 *     insecure context) are swallowed and leave `copied` as `false`.
 *
 * @example
 * const [copied, copy] = useCopyToClipboard();
 * <button onClick={() => copy(code)}>{copied ? <Check /> : <Copy />}</button>
 */
export function useCopyToClipboard(resetAfter = 1500): [boolean, (text: string) => Promise<void>] {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), resetAfter);
      } catch {
        setCopied(false);
      }
    },
    [resetAfter],
  );

  return [copied, copy];
}
