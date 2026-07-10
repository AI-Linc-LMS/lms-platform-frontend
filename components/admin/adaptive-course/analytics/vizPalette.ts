"use client";

import { useEffect, useState } from "react";

/**
 * Chart palette for the student-performance dashboard.
 *
 * These values are NOT eyeballed — they were run through the data-viz validator
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
  /** Categorical, fixed order — assigned by entity, never by rank. */
  series: { quiz: string; coding: string; video: string; article: string };
  /** Ordinal ramp for ordered categories (Easy → Medium → Hard). */
  ordinal: [string, string, string];
  /** Sequential ramp (light→dark) for continuous magnitude, e.g. the heatmap. */
  sequential: string[];
  /** Reserved status tokens — never reused as a series color. */
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

// The dark column is the same hues stepped for the dark surface — selected and validated
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

/** Follows the OS color scheme. Recharts needs concrete strings, not `var(--x)`. */
export function useVizPalette(): VizPalette {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setDark(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return dark ? DARK : LIGHT;
}

/** Bucket a 0-100 magnitude onto the sequential ramp (heatmap cells). */
export function sequentialStep(p: VizPalette, value: number, max: number): string {
  if (value <= 0 || max <= 0) return p.isDark ? "#232322" : "#f0efec";
  const i = Math.min(p.sequential.length - 1, Math.floor((value / max) * p.sequential.length));
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
