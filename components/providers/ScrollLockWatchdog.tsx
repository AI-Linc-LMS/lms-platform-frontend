"use client";

import { useEffect } from "react";

/**
 * Release orphaned body scroll-locks.
 *
 * MUI modals (dialogs, the onboarding tour, blockers) set inline
 * `overflow: hidden` on <body> while open — correct while a modal is
 * visible. But a modal that mounts and then dies without unmounting cleanly
 * (a deploy-stranded tab whose chunk 404s mid-open, a hydration error inside
 * the dialog, an exception in a transition) leaves the lock behind with
 * nothing on screen. The page looks completely normal and cannot scroll —
 * on EVERY route, because the lock lives on <body>. This exact state was
 * reported twice as "pages stopped scrolling".
 *
 * Every ~2s: if body carries an inline overflow lock but no visible
 * modal/dialog exists for 3 consecutive checks (~6s), clear the inline lock
 * (stylesheet values return on their own). A genuinely open modal always has
 * a visible surface, so this can never unlock a real dialog; the multi-strike
 * requirement rides out open/close transitions.
 */
const CHECK_MS = 1500;
const STRIKES_TO_RELEASE = 2;

function hasVisibleModalSurface(): boolean {
  const candidates = document.querySelectorAll(
    '.MuiModal-root, .MuiDialog-root, .MuiDrawer-root, [role="dialog"], [role="alertdialog"]',
  );
  for (const el of Array.from(candidates)) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    // position: fixed elements report offsetParent null — use the rect.
    const rect = (el as HTMLElement).getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return true;
  }
  return false;
}

export function ScrollLockWatchdog() {
  useEffect(() => {
    let strikes = 0;
    const interval = setInterval(() => {
      // ONLY the inline lock (what MUI's ModalManager sets). A stylesheet
      // that intentionally hides body overflow on some route must never be
      // overridden by this watchdog.
      const inlineLock = document.body.style.overflow === "hidden";
      if (!inlineLock || hasVisibleModalSurface()) {
        strikes = 0;
        return;
      }
      strikes += 1;
      if (strikes >= STRIKES_TO_RELEASE) {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
        // The same leak (a modal unmounted while open) also strands
        // aria-hidden="true" on the app root — the whole page becomes
        // invisible to screen readers. Only cleared when no visible modal
        // exists (checked above), so a real dialog's a11y state is never
        // touched.
        for (const el of Array.from(document.body.children)) {
          if (
            el.getAttribute("aria-hidden") === "true" &&
            !el.matches("script, style, [role='dialog'], .MuiModal-root")
          ) {
            el.removeAttribute("aria-hidden");
          }
        }
        strikes = 0;
      }
    }, CHECK_MS);
    return () => clearInterval(interval);
  }, []);
  return null;
}
