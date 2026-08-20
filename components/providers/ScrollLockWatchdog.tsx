"use client";

import { useEffect } from "react";

/**
 * Self-healing for the two halves of the orphaned-modal failure.
 *
 * A modal that dies without unmounting cleanly (deploy-stranded tab, chunk
 * 404 mid-open, hydration error) leaves TWO invisible traps behind:
 *   1. the inline `overflow: hidden` scroll-lock on <body>  → "can't scroll";
 *   2. its full-screen backdrop still intercepting pointer events while
 *      painting nothing → "my first click does nothing, the second works".
 * Both presented as recurring user reports. This watchdog detects and clears
 * both, and REPORTS every rescue (console.warn + window counters) because a
 * rescue means an upstream bug orphaned a modal — the safety net is also the
 * detector.
 *
 * Safety model: everything keys on PAINT, not geometry. A legitimately open
 * modal always paints something — a dimmed backdrop, a dialog paper, a
 * spinner — so it can never match; multi-strike timing additionally protects
 * open/close transitions. Stylesheet-driven overflow is never touched (only
 * the inline lock MUI's ModalManager sets).
 */
const CHECK_MS = 1500;
const STRIKES_TO_RELEASE = 2;

function paintsAnything(el: Element): boolean {
  const cs = getComputedStyle(el);
  if (cs.display === "none" || cs.visibility === "hidden") return false;
  if (parseFloat(cs.opacity) <= 0.05) return false;
  const rect = (el as HTMLElement).getBoundingClientRect();
  if (rect.width <= 4 || rect.height <= 4) return false;
  const paintsItself =
    (cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent") ||
    (el.textContent || "").trim().length > 0 ||
    el.tagName === "svg" ||
    el.tagName === "IMG";
  if (paintsItself) return true;
  for (const child of Array.from(el.children)) {
    if (paintsAnything(child)) return true;
  }
  return false;
}

/** A modal-layer node that visibly SHOWS something (dialog, drawer, menu…). */
function hasPaintedModalSurface(): boolean {
  const candidates = document.querySelectorAll(
    '.MuiModal-root, .MuiDialog-root, .MuiDrawer-root, [role="dialog"], [role="alertdialog"]',
  );
  for (const el of Array.from(candidates)) {
    if (paintsAnything(el)) return true;
  }
  return false;
}

/** Full-viewport, click-eating, paints nothing: always garbage. */
function isOrphanShield(el: Element): boolean {
  const cs = getComputedStyle(el);
  if (cs.pointerEvents === "none" || cs.display === "none" || cs.visibility === "hidden") {
    return false;
  }
  const rect = (el as HTMLElement).getBoundingClientRect();
  if (rect.width < innerWidth * 0.8 || rect.height < innerHeight * 0.8) return false;
  return !paintsAnything(el);
}

export function ScrollLockWatchdog() {
  useEffect(() => {
    let lockStrikes = 0;
    let shieldStrikes = 0;
    const interval = setInterval(() => {
      // ── Half 2: invisible click-shields ─────────────────────────────────
      const shields = Array.from(document.querySelectorAll(".MuiModal-root")).filter(isOrphanShield);
      if (shields.length > 0) {
        shieldStrikes += 1;
        if (shieldStrikes >= STRIKES_TO_RELEASE) {
          for (const el of shields) el.remove();
          const w = window as unknown as { __clickShieldRemovals?: number };
          w.__clickShieldRemovals = (w.__clickShieldRemovals ?? 0) + shields.length;
          // eslint-disable-next-line no-console
          console.warn(
            `[ScrollLockWatchdog] removed ${shields.length} orphaned invisible click-shield(s) on ${location.pathname} — a modal died without unmounting`,
          );
          shieldStrikes = 0;
        }
      } else {
        shieldStrikes = 0;
      }

      // ── Half 1: the inline body scroll-lock ─────────────────────────────
      const inlineLock = document.body.style.overflow === "hidden";
      if (!inlineLock || hasPaintedModalSurface()) {
        lockStrikes = 0;
        return;
      }
      lockStrikes += 1;
      if (lockStrikes >= STRIKES_TO_RELEASE) {
        const w = window as unknown as { __scrollLockRescues?: number };
        w.__scrollLockRescues = (w.__scrollLockRescues ?? 0) + 1;
        // eslint-disable-next-line no-console
        console.warn(
          `[ScrollLockWatchdog] released an orphaned body scroll-lock (#${w.__scrollLockRescues}) on ${location.pathname} — a modal was likely unmounted while open`,
        );
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
        // The same leak also strands aria-hidden="true" on the app root —
        // the whole page becomes invisible to screen readers. Only cleared
        // when no painted modal exists, so a real dialog's a11y state is
        // never touched.
        for (const el of Array.from(document.body.children)) {
          if (
            el.getAttribute("aria-hidden") === "true" &&
            !el.matches("script, style, [role='dialog'], .MuiModal-root")
          ) {
            el.removeAttribute("aria-hidden");
          }
        }
        lockStrikes = 0;
      }
    }, CHECK_MS);
    return () => clearInterval(interval);
  }, []);
  return null;
}
