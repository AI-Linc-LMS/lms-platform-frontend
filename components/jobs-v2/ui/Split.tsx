"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material";
import { J } from "./jobsTokens";

/**
 * JobsSplitLayout — the results rail and the posting pane, as one instrument.
 *
 * ~500 curated roles means comparison beats exploration, and every apply is an outbound
 * hand-off, so ejecting to a full page and back is pure cost. But we **email** students their
 * assigned jobs, so the detail URL has to stay shareable and bookmarkable: the pane is a real
 * route (`/jobs-v2/[id]`), not a `?currentJobId=` query param.
 *
 * Three rules this component exists to enforce:
 *
 * 1. **`showBelowLg` is a CSS switch, never `useMediaQuery`.** Both children are always in the
 *    tree, so there is one render tree, no hydration jump, and the six `data-tour-id`s stay
 *    present at every breakpoint. `useMediaQuery` returns `false` on the server, which is what
 *    made the admin tables flash the desktop layout on a phone.
 *
 * 2. **This is the module's ONE sanctioned nested scroller**, and the exception is narrow:
 *    exactly two panes, only at `lg+`, the split's own wrapper (never `body`) carries the
 *    `overflow: hidden`, both panes carry `overscroll-behavior: contain`, and both are focusable
 *    scroll regions so a keyboard user can actually scroll them. Below `lg` the wrapper drops to
 *    `display: block` and nothing about the mobile page is a nested scroller.
 *
 * 3. **Sticky lives INSIDE the pane.** `MainLayout` gives ancestors `overflow: auto`, which makes
 *    them the sticky containing block — this is why the mobile apply bar had to become `fixed`.
 *    Inside the pane's own `overflow-y: auto` box, `position: sticky; top: 0` is reliable,
 *    because that box IS the containing block. The hero bar therefore sticks to the pane, not to
 *    the viewport.
 */

/**
 * The shortest the split is ever allowed to be at `lg+`.
 *
 * Three rail cards and a readable slice of the posting. Below this the pane stops being an
 * instrument and becomes a letterbox, and — because the wrapper clips and the document is sized
 * to the viewport — a letterbox the page cannot scroll past. Whenever this floor wins, the split
 * runs below the fold on purpose and the DOCUMENT scrolls, which is the behaviour a reader
 * expects from a page whose header has eaten most of the screen.
 */
export const SPLIT_MIN_H = 360;

/** The split's height at `lg+`, as one CSS value. Emitted by the wrapper and read by its test. */
export const SPLIT_HEIGHT_LG = `max(${SPLIT_MIN_H}px, calc(100dvh - var(--j-split-top) - 16px))`;

/* ==========================================================================
 * Context — the two scrollers, for the hooks below
 * ======================================================================== */

interface SplitPanes {
  railRef: RefObject<HTMLElement | null>;
  paneRef: RefObject<HTMLElement | null>;
  /**
   * Send the pane back to the top. It is exposed as a callback rather than letting a consumer
   * write `paneRef.current.scrollTop` because the pane's scroll position belongs to the
   * component that owns the scroller — and because the React Compiler is right that a value
   * returned from a hook should not be mutated by its consumer.
   */
  resetPaneScroll: () => void;
}

const SplitContext = createContext<SplitPanes | null>(null);

/** The rail and pane scroll elements, when the caller is inside a `JobsSplitLayout`. */
export function useSplitPanes(): SplitPanes | null {
  return useContext(SplitContext);
}

/* ==========================================================================
 * JobsSplitLayout
 * ======================================================================== */

export interface JobsSplitLayoutProps {
  rail: ReactNode;
  pane: ReactNode;
  /** Which child survives below lg. The other is `display: none` — CSS, never `useMediaQuery`. */
  showBelowLg: "rail" | "pane";
  /** Rail width at lg+. Default 400. */
  railWidth?: number;
  /** aria-label for the rail scroll region. */
  railLabel: string;
  /** aria-label for the pane scroll region. */
  paneLabel: string;
  sx?: SxProps<Theme>;
  "data-tour-id"?: string;
}

export function JobsSplitLayout({
  rail,
  pane,
  showBelowLg,
  railWidth = 400,
  railLabel,
  paneLabel,
  sx,
  ...rest
}: JobsSplitLayoutProps) {
  const railRef = useRef<HTMLElement | null>(null);
  const paneRef = useRef<HTMLElement | null>(null);
  const resetPaneScroll = useCallback(() => {
    const node = paneRef.current;
    if (node) node.scrollTop = 0;
  }, []);
  const panes = useMemo<SplitPanes>(
    () => ({ railRef, paneRef, resetPaneScroll }),
    [resetPaneScroll],
  );

  // Each pane is its own scroller at lg+ and an ordinary block below it. `dvh`, never `vh`:
  // mobile browser chrome makes `100vh` taller than the visible viewport.
  const scroller = {
    minWidth: 0,
    overflowY: { xs: "visible", lg: "auto" },
    overscrollBehavior: "contain",
    height: { xs: "auto", lg: "100%" },
  } as const;

  return (
    <SplitContext.Provider value={panes}>
      <Box
        {...rest}
        sx={[
          {
            display: { xs: "block", lg: "grid" },
            gridTemplateColumns: { lg: `${railWidth}px minmax(520px, 1fr)` },
            // No gutter and no card gap between the columns: one continuous hairline is what
            // makes two panes read as one instrument.
            gap: 0,
            // `--j-split-top` is the app bar + header + filter rail, set once in `.jobs-scope`.
            //
            // The FLOOR is why "applying a filter stops the page scrolling". Without it the
            // split takes whatever is left of the viewport under a ~570px page header, and
            // applying a filter adds the active-chip row and the "N of M" summary — about 50px,
            // straight out of the results rail. Measured at 1366x640 the rail went from 56px to
            // 6px, and since the wrapper is `overflow: hidden` at exactly the remaining viewport
            // height the document could only ever scroll 16px: nothing on the page moved.
            // Clearing the filter put the rail back to 56px, which is why it never felt
            // restored.
            //
            // With a floor the split can be TALLER than the space under the header, and that is
            // the point: the document then grows, the page scrolls the header away, and the
            // whole rail is reachable. With a 567px top the floor wins below a 943px viewport,
            // so most laptops now carry a small page scroll they did not have; above that the
            // natural height still wins and nothing about the instrument changes.
            height: { xs: "auto", lg: SPLIT_HEIGHT_LG },
            // The wrapper's own overflow, NEVER `body`'s.
            overflow: { xs: "visible", lg: "hidden" },
            minWidth: 0,
            borderTop: { lg: `1px solid ${J.hairline}` },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      >
        <Box
          ref={railRef}
          component="section"
          role="region"
          aria-label={railLabel}
          // A scroll region a keyboard user cannot focus is a scroll region they cannot scroll.
          tabIndex={0}
          data-jobs-rail=""
          sx={{
            ...scroller,
            display: { xs: showBelowLg === "rail" ? "block" : "none", lg: "block" },
          }}
        >
          {rail}
        </Box>

        <Box
          ref={paneRef}
          component="section"
          role="region"
          aria-label={paneLabel}
          tabIndex={0}
          data-jobs-pane=""
          sx={{
            ...scroller,
            display: { xs: showBelowLg === "pane" ? "block" : "none", lg: "block" },
            borderInlineStart: { lg: `1px solid ${J.hairline}` },
          }}
        >
          {pane}
        </Box>
      </Box>
    </SplitContext.Provider>
  );
}

/* ==========================================================================
 * usePaneScrolled — the hero bar's shadow
 * ======================================================================== */

/**
 * `true` once the pane has been scrolled past `threshold`. rAF-throttled, so a fast scroll costs
 * one state write per frame at most.
 *
 * `boxShadow: SHADOW.sticky` is applied only once this is true: a permanently shadowed bar reads
 * as a modal header. Below `lg` the pane is not a scroller, so this falls back to the window's
 * own scroll position and the same rule still holds.
 */
export function usePaneScrolled(threshold = 8): boolean {
  const panes = useSplitPanes();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const node = panes?.paneRef.current ?? null;
    const target: HTMLElement | Window = node ?? window;
    let frame = 0;

    const read = () => {
      frame = 0;
      const top = node ? node.scrollTop : window.scrollY;
      setScrolled((prev) => (prev === top > threshold ? prev : top > threshold));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    read();
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      target.removeEventListener("scroll", onScroll);
    };
    // `panes` is a stable memo; the pane element is read at subscribe time.
  }, [panes, threshold]);

  return scrolled;
}

/**
 * Reset the pane to the top. Called on every selection, so a new posting starts at its own
 * beginning rather than at the previous one's scroll depth. The rail's scroll position is
 * deliberately untouched.
 */
export function usePaneScrollReset(key: unknown) {
  const reset = useSplitPanes()?.resetPaneScroll;
  useEffect(() => {
    reset?.();
  }, [reset, key]);
}

/* ==========================================================================
 * useRailKeys — j/k, arrows, Enter, Esc
 * ======================================================================== */

/** A keystroke inside a text field belongs to the text field. All of them, always. */
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export interface UseRailKeysOptions {
  /** The ids on the current page, in the order they are rendered. */
  ids: number[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** Set false to suspend the bindings entirely (a modal is open, say). */
  enabled?: boolean;
}

/**
 * `j`/`k` or the arrow keys move the cursor within the rail, `Enter` opens, `Esc` returns focus
 * to the search input. **All suppressed while focus is in a text field**, and all scoped to the
 * rail: a keystroke with focus in the pane, or anywhere else on the page, is not ours.
 *
 * Moving the cursor moves DOM focus to that rail card, which is what makes the arrow keys and
 * the screen reader agree about where you are — and it is why the move is not itself a
 * navigation. `Enter` is the navigation, so browser history stays one entry per real choice.
 */
export function useRailKeys({ ids, selectedId, onSelect, enabled = true }: UseRailKeysOptions) {
  const panes = useSplitPanes();
  const cursorRef = useRef<number | null>(selectedId);

  // Keep the cursor on the selected row whenever selection changes underneath us, and drop it
  // when the page it pointed into is gone.
  useEffect(() => {
    if (selectedId !== null) cursorRef.current = selectedId;
    else if (cursorRef.current !== null && !ids.includes(cursorRef.current)) {
      cursorRef.current = null;
    }
  }, [selectedId, ids]);

  const focusRailItem = useCallback(
    (id: number) => {
      const root = panes?.railRef.current ?? document;
      const node = root.querySelector<HTMLElement>(`[data-rail-id="${id}"]`);
      node?.focus();
      node?.scrollIntoView?.({ block: "nearest" });
    },
    [panes],
  );

  useEffect(() => {
    if (!enabled || typeof document === "undefined" || ids.length === 0) return;

    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const rail = panes?.railRef.current;
      const active = document.activeElement;
      // Scoped to the rail. When there is no split (below lg, or a caller outside one) the
      // bindings still work, but only while focus is on a rail card.
      const inRail = rail
        ? rail === active || (active instanceof Node && rail.contains(active))
        : Boolean(
            active instanceof HTMLElement && active.closest("[data-rail-id]"),
          );
      if (!inRail) return;

      if (event.key === "Escape") {
        const search = document.querySelector<HTMLElement>('[role="searchbox"]');
        if (!search) return;
        event.preventDefault();
        search.focus();
        return;
      }

      const isDown = event.key === "ArrowDown" || event.key === "j";
      const isUp = event.key === "ArrowUp" || event.key === "k";

      if (isDown || isUp) {
        event.preventDefault();
        const current = cursorRef.current;
        const index = current === null ? -1 : ids.indexOf(current);
        const next = isDown
          ? Math.min(index + 1, ids.length - 1)
          : Math.max(index <= 0 ? 0 : index - 1, 0);
        const id = ids[next];
        if (id === undefined) return;
        cursorRef.current = id;
        focusRailItem(id);
        return;
      }

      if (event.key === "Enter") {
        const id = cursorRef.current;
        if (id === null || !ids.includes(id)) return;
        // A focused link handles its own Enter; intercepting would double-navigate.
        if (
          document.activeElement instanceof HTMLElement &&
          document.activeElement.closest("a[href]")
        ) {
          return;
        }
        event.preventDefault();
        onSelect(id);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled, ids, onSelect, panes, focusRailItem]);
}
