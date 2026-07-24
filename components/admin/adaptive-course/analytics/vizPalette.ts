"use client";

import { useEffect, useState } from "react";

/**
 * Chart palette for the student-performance dashboard.
 *
 * These values are NOT eyeballed - they were run through the data-viz validator
 * (lightness band, chroma floor, CVD separation, contrast vs surface):
 *
 *   categorical (quiz/coding/video/article)  light CVD ΔE 51.8 PASS · dark 42.1 PASS
 *   ordinal (Easy→Hard)                      monotone L, single hue (3° spread) PASS
 *
 * Two consequences baked into the components:
 *  - Light mode flags a sub-3:1 contrast WARN on aqua + magenta, so the RELIEF RULE
 *    applies: every chart ships a legend, selective direct labels, and a table view.
 *  - Difficulty is an ORDERED category, so it uses the one-hue ordinal ramp, never
 *    the categorical hues (a value-ramp on nominal categories is an anti-pattern, and
 *    categorical hues on ordered data throw away the ordering).
 *
 * Status colors are RESERVED for risk signals and always ship with an icon + label,
 * so a color never carries meaning alone.
 */

export interface VizPalette {
  isDark: boolean;
  surface: string;
  grid: string;
  axis: string;
  inkPrimary: string;
  inkSecondary: string;
  inkMuted: string;
  /** Categorical, fixed order - assigned by entity, never by rank. */
  series: { quiz: string; coding: string; video: string; article: string };
  /** Ordinal ramp for ordered categories (Easy → Medium → Hard). */
  ordinal: [string, string, string];
  /** Sequential ramp (light→dark) for continuous magnitude, e.g. the heatmap. */
  sequential: string[];
  /** Reserved status tokens - never reused as a series color. */
  status: { good: string; warning: string; serious: string; critical: string };
}

const LIGHT: VizPalette = {
  isDark: false,
  surface: "#ffffff",
  grid: "#e1e0d9",
  axis: "#c3c2b7",
  inkPrimary: "#0b0b0b",
  inkSecondary: "#52514e",
  inkMuted: "#898781",
  series: { quiz: "#2a78d6", coding: "#1baf7a", video: "#4a3aa7", article: "#e87ba4" },
  ordinal: ["#86b6ef", "#3987e5", "#184f95"],
  sequential: ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#104281"],
  status: { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" },
};

// The dark column is the same hues stepped for the dark surface - selected and validated
// as a set, not an automatic flip of the light values.
const DARK: VizPalette = {
  isDark: true,
  surface: "#1a1a19",
  grid: "#2c2c2a",
  axis: "#383835",
  inkPrimary: "#ffffff",
  inkSecondary: "#c3c2b7",
  inkMuted: "#898781",
  series: { quiz: "#3987e5", coding: "#199e70", video: "#9085e9", article: "#d55181" },
  ordinal: ["#86b6ef", "#3987e5", "#184f95"],
  sequential: ["#104281", "#184f95", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4"],
  status: { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b" },
};

/** Series color keyed by the backend's `activity_type`. */
export const ACTIVITY_LABEL: Record<string, string> = {
  quiz: "Quizzes",
  coding: "Coding",
  video: "Videos",
  article: "Articles",
};

/** Parse `#rgb`, `#rrggbb` or `rgb(r,g,b)` into [r,g,b]; null if unrecognised. */
function parseColor(raw: string): [number, number, number] | null {
  const s = raw.trim();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgb = s.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

/** WCAG relative luminance. */
function luminance([r, g, b]: [number, number, number]): number {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

/** True when the chart's actual surface is dark. */
function surfaceIsDark(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--card-bg");
  const rgb = parseColor(raw || "");
  return rgb ? luminance(rgb) < 0.5 : false;
}

/**
 * Picks the palette from the SURFACE THE CHART ACTUALLY RENDERS ON, not the OS.
 *
 * This used to follow `prefers-color-scheme`. That was wrong: this app has no dark theme -
 * `--card-bg` is `#ffffff` unconditionally - so a viewer whose OS was in dark mode got the
 * dark ramp painted onto a white card. Every empty heatmap cell rendered near-black and the
 * Less→More legend ran backwards. Reading the resolved surface token is correct today, adapts
 * to tenant theming, and will pick up a real dark theme automatically if one is ever added.
 *
 * Recharts needs concrete color strings, not `var(--x)`, hence resolving to hex here.
 */
export function useVizPalette(): VizPalette {
  // Light on the server and first paint: the app's surface is light, so this never flashes.
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const sync = () => setDark(surfaceIsDark());
    sync();

    // Re-read whenever the theme could have changed the resolved token.
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme", "data-hydrated"],
    });
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener("change", sync);

    return () => {
      observer.disconnect();
      mq?.removeEventListener("change", sync);
    };
  }, []);

  return dark ? DARK : LIGHT;
}

/** Empty (zero-activity) heatmap cell - recedes toward the surface, never a dark block. */
export const emptyCell = (p: VizPalette) => (p.isDark ? "#232322" : "#eceef2");

/** Bucket a magnitude onto the sequential ramp (heatmap cells).
 *
 * Uses ceil-then-decrement so the ends are exact: the smallest non-zero count lands on the
 * lightest step and `value === max` lands on the darkest. (A plain `floor(value/max * n)`
 * skips step 0, and `floor((value-1)/max * n)` paints the busiest day as the emptiest when
 * max is 1.)
 */
export function sequentialStep(p: VizPalette, value: number, max: number): string {
  if (value <= 0 || max <= 0) return emptyCell(p);
  const n = p.sequential.length;
  const i = Math.min(n - 1, Math.max(0, Math.ceil((value / max) * n) - 1));
  return p.sequential[i];
}

/** Khan-style mastery ladder → an ordered swatch + human label. */
export const MASTERY_LADDER: { key: string; label: string }[] = [
  { key: "not_started", label: "Not started" },
  { key: "attempted", label: "Attempted" },
  { key: "familiar", label: "Familiar" },
  { key: "proficient", label: "Proficient" },
  { key: "mastered", label: "Mastered" },
];
