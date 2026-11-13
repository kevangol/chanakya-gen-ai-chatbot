"use client";

/**
 * @module hooks/useSidebar
 */

import { useCallback, useState, useSyncExternalStore } from "react";
import { MOBILE_BREAKPOINT } from "../lib/constants";

/** Value returned by {@link useSidebar}. */
export type SidebarState = {
  /** Whether the sidebar is visible. */
  isOpen: boolean;
  /** Show the sidebar. */
  open: () => void;
  /** Hide the sidebar. */
  close: () => void;
  /** Flip visibility. */
  toggle: () => void;
  /** Hide the sidebar only on mobile. Call it after navigating so the sidebar gets out of the way. */
  closeOnMobile: () => void;
};

const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

/** Subscribe to viewport changes that cross the mobile breakpoint. */
function subscribeViewport(onChange: () => void) {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}
const getIsMobile = () => window.matchMedia(MOBILE_QUERY).matches;
/** On the server we assume desktop, so the sidebar is in the initial HTML. */
const getIsMobileServer = () => false;

/**
 * Open/closed state for the conversation sidebar.
 *
 * The default depends on the viewport: **open on desktop, closed on
 * mobile**, where it would cover the chat. Once the user toggles it, their
 * choice wins. Crossing the breakpoint (rotating a tablet, resizing the
 * window) resets to the default for the new size.
 *
 * @returns A {@link SidebarState}.
 */
export function useSidebar(): SidebarState {
  const isMobile = useSyncExternalStore(subscribeViewport, getIsMobile, getIsMobileServer);
  /** User override, remembered per viewport class. `null` means "use the default". */
  const [override, setOverride] = useState<{ mobile: boolean; open: boolean } | null>(null);

  const isOpen = override && override.mobile === isMobile ? override.open : !isMobile;

  const open = useCallback(() => setOverride({ mobile: getIsMobile(), open: true }), []);
  const close = useCallback(() => setOverride({ mobile: getIsMobile(), open: false }), []);
  const toggle = useCallback(() => {
    const mobile = getIsMobile();
    setOverride((o) => {
      const current = o && o.mobile === mobile ? o.open : !mobile;
      return { mobile, open: !current };
    });
  }, []);
  const closeOnMobile = useCallback(() => {
    if (getIsMobile()) setOverride({ mobile: true, open: false });
  }, []);

  return { isOpen, open, close, toggle, closeOnMobile };
}
