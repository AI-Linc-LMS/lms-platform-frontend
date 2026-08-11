"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { RM } from "./roadmapTokens";

/**
 * The drawn path through a section: ONE continuous trail through the steps, plus a tree of
 * curved limbs from each step out to its sub-steps.
 *
 * It has to MEASURE rather than be laid out with borders, because a continuous line cannot be
 * assembled from per-cell CSS: each segment needs to know where the previous box actually ended,
 * and box heights vary with how many sub-steps each step has and how many titles wrap. Earlier
 * attempts drew per-cell connector elements, which is why one ended up floating in empty canvas
 * with nothing to attach to.
 *
 * Two routing rules carry the whole look:
 *
 *   1. A turn between rows exits the SIDE of the step and sweeps around the OUTSIDE of the
 *      column. Dropping from the bottom would run the line straight through the sub-step stack,
 *      which is exactly what it looked like on the first render.
 *   2. Sub-steps hang off a trunk as separate curved limbs, so the relationship reads as a tree
 *      branch rather than as a list with a rule down its side.
 */

type Rect = { l: number; r: number; t: number; b: number; cx: number; cy: number };

export type TrailRegistry = {
  /** Register a step box. `order` is its position in the section's sequence. */
  step: (order: number) => (el: HTMLElement | null) => void;
  /** Register a sub-step box under a given step order. */
  sub: (stepOrder: number, index: number) => (el: HTMLElement | null) => void;
};

export function useTrail() {
  const wrap = useRef<HTMLDivElement | null>(null);
  const steps = useRef<Map<number, HTMLElement>>(new Map());
  const subs = useRef<Map<string, HTMLElement>>(new Map());
  const [paths, setPaths] = useState<{ trail: string; limbs: string; w: number; h: number }>({
    trail: "",
    limbs: "",
    w: 0,
    h: 0,
  });

  const registry: TrailRegistry = {
    step: (order) => (el) => {
      if (el) steps.current.set(order, el);
      else steps.current.delete(order);
    },
    sub: (stepOrder, index) => (el) => {
      const key = `${stepOrder}:${index}`;
      if (el) subs.current.set(key, el);
      else subs.current.delete(key);
    },
  };

  const measure = useCallback(() => {
    const host = wrap.current;
    if (!host) return;
    const W = host.getBoundingClientRect();
    if (!W.width) return;
    const R = (el: HTMLElement): Rect => {
      const b = el.getBoundingClientRect();
      return {
        l: b.left - W.left,
        r: b.right - W.left,
        t: b.top - W.top,
        b: b.bottom - W.top,
        cx: b.left - W.left + b.width / 2,
        cy: b.top - W.top + b.height / 2,
      };
    };

    const ordered = [...steps.current.entries()].sort((a, b) => a[0] - b[0]).map(([o, el]) => ({
      order: o,
      rect: R(el),
    }));

    let trail = "";
    ordered.forEach(({ rect: p }, i) => {
      if (i === 0) return;
      const q = ordered[i - 1].rect;
      // Same row when the two boxes share a baseline. A generous tolerance because a step with
      // a long wrapped title is a few pixels taller than its neighbour.
      const sameRow = Math.abs(p.cy - q.cy) < 48;
      if (sameRow) {
        const mx = (q.r + p.l) / 2;
        trail += ` M${q.r},${q.cy} C${mx},${q.cy} ${mx},${p.cy} ${p.l},${p.cy}`;
      } else {
        const right = q.cx > W.width / 2;
        const ox = right ? Math.max(q.r, p.r) + 72 : Math.min(q.l, p.l) - 72;
        const qx = right ? q.r : q.l;
        const px = right ? p.r : p.l;
        trail += ` M${qx},${q.cy} C${ox},${q.cy} ${ox},${p.cy} ${px},${p.cy}`;
      }
    });

    let limbs = "";
    ordered.forEach(({ order, rect: step }) => {
      const mine = [...subs.current.entries()]
        .filter(([k]) => k.startsWith(`${order}:`))
        .sort((a, b) => Number(a[0].split(":")[1]) - Number(b[0].split(":")[1]))
        .map(([, el]) => R(el));
      if (!mine.length) return;
      const tx = step.l + 20;
      const last = mine[mine.length - 1];
      limbs += `M${step.cx},${step.b} C${step.cx},${step.b + 10} ${tx},${step.b + 10} ${tx},${step.b + 18} `;
      limbs += `M${tx},${step.b + 18} L${tx},${last.cy} `;
      mine.forEach((s) => {
        limbs += `M${tx},${s.cy - 22} C${tx},${s.cy} ${tx + 2},${s.cy} ${s.l},${s.cy} `;
      });
    });

    // BAIL OUT when nothing moved. This is load-bearing, not an optimisation: the layout effect
    // below runs after every render, so returning a fresh object unconditionally meant
    // setPaths -> render -> effect -> setPaths forever. That shipped, and it took the whole
    // roadmap page down with React error #185 (maximum update depth exceeded). Returning `prev`
    // makes React bail out of the re-render and the loop terminates on the first stable measure.
    setPaths((prev) =>
      prev.trail === trail &&
      prev.limbs === limbs &&
      prev.w === W.width &&
      prev.h === W.height
        ? prev
        : { trail, limbs, w: W.width, h: W.height }
    );
  }, []);

  // Runs after every render on purpose: box positions change for reasons that are not props
  // (a title wrapping, a font loading, the drawer opening). Safe only because `measure` bails
  // out above when the geometry is unchanged.
  useLayoutEffect(() => {
    measure();
  });

  useEffect(() => {
    const host = wrap.current;
    if (!host || typeof ResizeObserver === "undefined") return;
    // Remeasure on any layout change: a wrapped title, an expanded drawer, a window resize.
    const ro = new ResizeObserver(() => measure());
    ro.observe(host);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const Trail = (
    <Box
      component="svg"
      aria-hidden
      viewBox={`0 0 ${paths.w || 1} ${paths.h || 1}`}
      // The path is measured in the container's own pixel space, so the viewBox must map to the
      // element 1:1. The default "meet" would uniformly scale and centre it, which silently
      // offsets every line the moment the measured size and the rendered size disagree by even
      // a pixel (during a resize, or before fonts settle).
      preserveAspectRatio="none"
      sx={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
        display: { xs: "none", sm: "block" },
      }}
    >
      <path d={paths.limbs} fill="none" stroke={RM.railSoft} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
      <path d={paths.trail} fill="none" stroke={RM.rail} strokeWidth="3"
            strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );

  return { wrap, registry, Trail };
}
