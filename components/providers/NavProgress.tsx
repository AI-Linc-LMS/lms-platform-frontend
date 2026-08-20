"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * A thin top progress bar for route transitions.
 *
 * The app router updates the URL the moment a navigation starts, but keeps the
 * OLD page on screen until the new route's payload arrives. When that payload
 * is a cache miss (first visit after a deploy, cold function), the gap is
 * seconds long with ZERO feedback — users reported "the URL changes but the
 * page doesn't, so I click again". This bar starts the instant the URL changes
 * (history.pushState/replaceState/popstate) and finishes when the new route
 * actually commits (usePathname fires after React commits the new tree), so
 * every click acknowledges itself immediately.
 */
export function NavProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const startedFor = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Navigation START: the router touches history before content arrives.
  useEffect(() => {
    const begin = (url: string | URL | null | undefined) => {
      // State-only history updates pass url as null/undefined/'' — they are
      // NOT navigations. Treating them as one froze the bar mid-flight on
      // every module that stores UI state in history (tabs, panels).
      if (url === null || url === undefined || url === "") return;
      try {
        const next = new URL(String(url), window.location.href);
        if (next.pathname === window.location.pathname) return; // same-page (query/hash)
        startedFor.current = next.pathname;
      } catch {
        return; // unparseable → not a navigation we can track
      }
      setVisible(true);
      setProgress(12);
      if (timer.current) clearInterval(timer.current);
      // Ease toward 90% while the payload is in flight; never complete on its own.
      const startedAt = Date.now();
      timer.current = setInterval(() => {
        // Failsafe: never let the bar live past 8s. If the navigation was
        // cancelled, redirected to the same path, or otherwise never commits
        // a pathname change, finish rather than sit at 90% forever.
        if (Date.now() - startedAt > 8000) {
          if (timer.current) clearInterval(timer.current);
          setProgress(100);
          setTimeout(() => {
            setVisible(false);
            setProgress(0);
          }, 220);
          return;
        }
        setProgress((p) => (p < 90 ? p + (90 - p) * 0.12 : p));
      }, 180);
    };
    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);
    history.pushState = (data, unused, url) => {
      begin(url);
      return origPush(data, unused, url);
    };
    history.replaceState = (data, unused, url) => {
      // replaceState is also used for non-nav bookkeeping; only signal when the path changes.
      begin(url);
      return origReplace(data, unused, url);
    };
    const onPop = () => begin(window.location.href);
    window.addEventListener("popstate", onPop);
    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
      window.removeEventListener("popstate", onPop);
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  // Navigation END: usePathname changes only after the new tree commits.
  useEffect(() => {
    if (!visible) return;
    setProgress(100);
    const t = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);
    if (timer.current) clearInterval(timer.current);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!visible) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 3,
        width: `${progress}%`,
        zIndex: 20000,
        background:
          "linear-gradient(90deg, var(--primary-400, #2a8cb0), var(--primary-600, #1e4a63))",
        boxShadow: "0 0 8px color-mix(in srgb, var(--primary-400, #2a8cb0) 60%, transparent)",
        transition: "width 180ms ease, opacity 220ms ease",
        opacity: progress >= 100 ? 0 : 1,
        pointerEvents: "none",
      }}
    />
  );
}
