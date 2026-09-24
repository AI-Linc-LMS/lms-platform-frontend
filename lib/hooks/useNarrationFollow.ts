"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NARRATE_ATTR, NARRATING_ATTR } from "@/lib/utils/article-speech";

/**
 * Keeps the article looking at whatever Read aloud is saying - and hands control straight
 * back the moment the learner scrolls.
 *
 * The reported bug is that the page did not follow the voice at all. The obvious fix is
 * worse than the bug if it is done carelessly: a page that scrolls itself while the
 * learner is reading somewhere else, or that drags them back after they scroll away, is a
 * page they cannot use. So:
 *
 *  - A real scroll gesture (wheel, touch drag, a scrolling key) SUSPENDS following. It is
 *    never resumed automatically; `resume()` is wired to a visible control.
 *  - Only user-intent events are listened for, never `scroll` itself. Smooth scrolling
 *    emits a long tail of `scroll` events, and a handler that could not tell those from a
 *    gesture would either suspend itself on its own scroll or need a timer to paper over
 *    it. `wheel`/`touchmove`/`keydown` are never synthesised by scrollIntoView, so the
 *    distinction is exact and costs no timer.
 *  - The page is only scrolled when the block is actually out of the comfortable band,
 *    and the geometry is read ONCE per block, never during a scroll. This repo has a
 *    render loop in its history caused by a component measuring itself as it laid out;
 *    nothing here writes React state from a measurement.
 *  - The highlight is applied to the DOM directly. The body is rendered by assigning
 *    innerHTML, so re-rendering it to move a highlight would throw away the hydrated
 *    code blocks and the reveal.
 */

/** The fixed AppBar is 56px on a phone and 64px above it; leave it and a little air. */
const HEADER_SAFE = 88;
/** The floating MobileNav (components/layout/MobileNav.tsx) sits at the bottom below `md`. */
const FOOTER_SAFE_MOBILE = 108;
const FOOTER_SAFE_DESKTOP = 48;
const MOBILE_NAV_MAX_WIDTH = 900; // MUI `md`

/** Keys that scroll. A learner using these is steering, exactly like a wheel gesture. */
const SCROLL_KEYS = new Set([
  "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar",
]);

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Ids are minted by buildNarrationSegments as `ns-<n>`; refuse anything else rather than
 *  interpolating an arbitrary string into a selector. */
const SAFE_ID = /^ns-\d+$/;

export interface NarrationFollowOptions {
  /** The block being spoken, from useArticleNarration. */
  activeId: string | null;
  /** The element the article body is rendered into. */
  containerRef: React.RefObject<HTMLElement | null>;
  /** True while narration is running. Following re-arms each time playback starts. */
  active: boolean;
}

export function useNarrationFollow({ activeId, containerRef, active }: NarrationFollowOptions) {
  /** "The learner has taken the page over." Stored as the negative because that is the
   *  thing an event causes; `following` is derived from it. */
  const [suspended, setSuspended] = useState(false);
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    // React's documented way to adjust state when an input changes: it re-renders this
    // component before committing, with no extra paint and no effect. Doing it in an
    // effect instead would be a cascading render - and doing it not at all would leave
    // the NEXT run of the narration suspended because of a scroll during the last one.
    setWasActive(active);
    if (active) setSuspended(false);
  }
  const following = !suspended;
  /** Mirrored so the highlight effect can read it WITHOUT listing it as a dependency:
   *  depending on it would re-run that effect when following is switched back on and
   *  scroll a second time. Synced from an effect, never written during render. */
  const followingRef = useRef(true);
  useEffect(() => {
    followingRef.current = following;
  }, [following]);
  /** The element currently highlighted, so the class can be cleared even after the body
   *  has been re-rendered out from under us. */
  const markedRef = useRef<HTMLElement | null>(null);

  const scrollTo = useCallback((el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const top = HEADER_SAFE;
    const bottom =
      window.innerHeight -
      (window.innerWidth < MOBILE_NAV_MAX_WIDTH ? FOOTER_SAFE_MOBILE : FOOTER_SAFE_DESKTOP);
    const band = bottom - top;
    if (band <= 0) return;
    // A block taller than the band can never sit inside it, so for those "comfortable"
    // means the block STARTS near the top - otherwise every long paragraph would scroll
    // on arrival and again as soon as it was centred.
    const tall = rect.height > band;
    const comfortable = tall
      ? rect.top >= top - 8 && rect.top <= top + band * 0.45
      : rect.top >= top && rect.bottom <= bottom;
    if (comfortable) return;
    el.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: tall ? "start" : "center",
    });
  }, []);

  // Highlight the spoken block, and scroll to it while following is on.
  useEffect(() => {
    const previous = markedRef.current;
    if (previous) {
      previous.removeAttribute(NARRATING_ATTR);
      markedRef.current = null;
    }
    const container = containerRef.current;
    if (!container || !activeId || !SAFE_ID.test(activeId)) return;
    const el = container.querySelector<HTMLElement>(`[${NARRATE_ATTR}="${activeId}"]`);
    if (!el) return;
    el.setAttribute(NARRATING_ATTR, "true");
    markedRef.current = el;
    if (followingRef.current) scrollTo(el);
  }, [activeId, containerRef, scrollTo]);

  // Clear the highlight when narration stops. (Re-arming following is done above, as a
  // render-time adjustment, so it never costs an extra render.)
  useEffect(() => {
    if (!active) markedRef.current?.removeAttribute(NARRATING_ATTR);
  }, [active]);

  // Give the page back the moment the learner steers it. No timers, no `scroll` handler.
  useEffect(() => {
    if (!active) return;
    const suspend = () => setSuspended((s) => (s ? s : true));
    const onKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) suspend();
    };
    window.addEventListener("wheel", suspend, { passive: true });
    window.addEventListener("touchmove", suspend, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", suspend);
      window.removeEventListener("touchmove", suspend);
      window.removeEventListener("keydown", onKey);
    };
  }, [active]);

  // Drop the highlight on unmount - the element outlives this hook only in tests, but a
  // stale attribute would survive a tier switch that reuses the node.
  useEffect(
    () => () => {
      markedRef.current?.removeAttribute(NARRATING_ATTR);
      markedRef.current = null;
    },
    [],
  );

  /** Turn following back on and catch up with the voice. Wired to a visible control:
   *  auto-resuming would be the "page that fights you" this hook exists to avoid. */
  const resume = useCallback(() => {
    setSuspended(false);
    const container = containerRef.current;
    if (!container || !activeId || !SAFE_ID.test(activeId)) return;
    const el = container.querySelector<HTMLElement>(`[${NARRATE_ATTR}="${activeId}"]`);
    if (el) el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
  }, [activeId, containerRef]);

  /** Let the page hand over an explicit navigation (a table-of-contents jump) as the
   *  learner taking control, which it is. */
  const suspend = useCallback(() => setSuspended(true), []);

  return { following, resume, suspend };
}
