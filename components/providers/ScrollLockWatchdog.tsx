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

/**
 * An orphaned modal's OTHER half: its full-screen backdrop keeps eating
 * pointer events even when nothing is visibly painted — the page looks normal
 * but the FIRST click lands on the invisible shield and does nothing ("I have
 * to click twice"). Remove any full-viewport modal node that intercepts
 * clicks while painting nothing and containing nothing visible. A real open
 * dialog always paints (a dimmed backdrop and/or a visible paper), so it can
 * never match.
 */
function removeOrphanClickShields(): number {
  let removed = 0;
  for (const el of Array.from(document.querySelectorAll(".MuiModal-root"))) {
    const cs = getComputedStyle(el);
    if (cs.pointerEvents === "none" || cs.display === "none") continue;
    const rect = (el as HTMLElement).getBoundingClientRect();
    if (rect.width < innerWidth * 0.8 || rect.height < innerHeight * 0.8) continue;
    // Does the node itself paint? (a dimming backdrop has opacity + bg alpha)
    const paintsItself =
      parseFloat(cs.opacity) > 0.05 &&
      cs.backgroundColor !== "rgba(0, 0, 0, 0)" &&
      cs.backgroundColor !== "transparent";
    if (paintsItself) continue;
    // Any visible painted descendant? (dialog paper, drawer, spinner...)
    let visibleChild = false;
    for (const child of Array.from(el.querySelectorAll("*"))) {
      const ccs = getComputedStyle(child);
      if (ccs.display === "none" || ccs.visibility === "hidden") continue;
      if (parseFloat(ccs.opacity) <= 0.05) continue;
      const cr = (child as HTMLElement).getBoundingClientRect();
      if (cr.width > 4 && cr.height > 4) {
        const paints =
          (ccs.backgroundColor !== "rgba(0, 0, 0, 0)" && ccs.backgroundColor !== "transparent") ||
          (child.textContent || "").trim().length > 0 ||
          child.tagName === "svg" || child.tagName === "IMG";
        if (paints) { visibleChild = true; break; }
      }
    }
    if (visibleChild) continue;
    el.remove();
    removed += 1;
  }
  return removed;
}

export function ScrollLockWatchdog() {
  useEffect(() => {
    let strikes = 0;
    let shieldStrikes = 0;
    const interval = setInterval(() => {
      // Invisible click-shield sweep runs on EVERY tick (independent of the
      // scroll lock): two consecutive sightings of the same orphan state
      // before removal, so open/close transitions are never touched.
      const hasOrphanShield = (() => {
        for (const el of Array.from(document.querySelectorAll(".MuiModal-root"))) {
          const cs = getComputedStyle(el);
          if (cs.pointerEvents === "none" || cs.display === "none") continue;
          const rect = (el as HTMLElement).getBoundingClientRect();
          if (rect.width >= innerWidth * 0.8 && rect.height >= innerHeight * 0.8) return true;
        }
        return false;
      })();
      if (hasOrphanShield && !hasVisibleModalSurface()) {
        shieldStrikes += 1;
        if (shieldStrikes >= 2) {
          const n = removeOrphanClickShields();
          if (n > 0) {
            const w = window as unknown as { __clickShieldRemovals?: number };
            w.__clickShieldRemovals = (w.__clickShieldRemovals ?? 0) + n;
            // eslint-disable-next-line no-console
            console.warn(
              `[ScrollLockWatchdog] removed ${n} orphaned invisible click-shield(s) on ${location.pathname} — a modal died without unmounting`,
            );
          }
          shieldStrikes = 0;
        }
      } else {
        shieldStrikes = 0;
      }

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
        // A rescue means something ORPHANED a lock — that is a bug upstream,
        // not business as usual. Make it observable: the console line shows
        // in any debugging session, and the counter lets the e2e suite (and
        // support) assert "zero rescues" instead of users reporting freezes.
        const w = window as unknown as { __scrollLockRescues?: number };
        w.__scrollLockRescues = (w.__scrollLockRescues ?? 0) + 1;
        // eslint-disable-next-line no-console
        console.warn(
          `[ScrollLockWatchdog] released an orphaned body scroll-lock (#${w.__scrollLockRescues}) on ${location.pathname} — a modal was likely unmounted while open`,
        );
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
