"use client";

import { useEffect, useRef } from "react";

/**
 * Run `fn` when the tab becomes visible again, at most once per `minIntervalMs`.
 *
 * Why this exists: several screens refetch on tab return by registering BOTH
 * `document.visibilitychange` AND `window.focus`. Those two fire together when you alt-tab back, so
 * the same request went out twice. Combined with background-throttled `setInterval` polls all firing
 * their catch-up tick at the same moment, returning to a tab produced a request burst that competed
 * with whatever the user actually clicked — a big part of "coming back after a while is slow".
 *
 * `visibilitychange` alone already covers tab return (and, unlike `focus`, does not fire when the
 * user merely clicks back into the window from another app pane). The throttle additionally protects
 * against rapid tab flipping.
 */
export function useVisibilityRefresh(
  fn: () => void,
  { minIntervalMs = 30_000, enabled = true }: { minIntervalMs?: number; enabled?: boolean } = {}
) {
  // Keep the latest callback without re-registering the listener (which would reset the throttle).
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const lastRunRef = useRef(0);

  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastRunRef.current < minIntervalMs) return;
      lastRunRef.current = now;
      fnRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [minIntervalMs, enabled]);
}
