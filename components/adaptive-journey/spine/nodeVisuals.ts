/**
 * What each kind of journey step is called and how it is coloured.
 *
 * Lifted out of `JourneyBoard.tsx` unchanged. `contentSummary` and `isAssessmentNode` are
 * re-exported from there because two test files and the view-result rule import them by that
 * path; this file is the definition, that one is the doorway.
 */

import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

/** Nodes whose completion has a result worth re-reading. */
export function isAssessmentNode(n: JourneyNodeView): boolean {
  return n.type === "checkpoint" || n.type === "week_final";
}

export function contentSummary(n: JourneyNodeView): string {
  if (n.type === "topic" && n.content) {
    const c = n.content;
    const p: string[] = [];
    if (c.videos) p.push(`${c.videos} video${c.videos > 1 ? "s" : ""}`);
    if (c.quizzes) p.push(`${c.quizzes} quiz${c.quizzes > 1 ? "zes" : ""}`);
    if (c.articles) p.push(`${c.articles} article${c.articles > 1 ? "s" : ""}`);
    if (c.coding) p.push(`${c.coding} coding`);
    return p.join(" · ");
  }
  if (n.type === "checkpoint" || n.type === "week_final") {
    // `n.proctored`, not an assumption. This line asserted "Proctored" unconditionally while
    // `nodeLabel` below read the real flag, so a non-proctored paper carried the word with no
    // PROCTORED tag above it - true of all 112 Impacteers papers and every other paper
    // generated with proctoring off.
    const p = n.proctored ? ["Proctored"] : [];
    if (n.questionCount) p.push(`${n.questionCount} Qs`);
    p.push(n.weight > 1 ? `counts ${n.weight}×` : "same for all");
    return p.join(" · ");
  }
  if (n.type === "interview") return `AI interviewer · ~${n.durationMinutes ?? 15} min`;
  return "";
}

export function nodeLabel(n: JourneyNodeView): { main: string; sub?: string; ai?: boolean } {
  if (n.isCalibration) return { main: "CALIBRATION", sub: "PROCTORED · NON-ADAPTIVE" };
  if (n.type === "topic") return { main: "TOPIC" };
  if (n.type === "checkpoint" || n.type === "week_final")
    return { main: "CHECKPOINT ASSESSMENT", sub: n.proctored ? "PROCTORED · NON-ADAPTIVE" : undefined };
  if (n.type === "interview") return { main: "MOCK INTERVIEW", ai: true };
  return { main: "STEP" };
}

/** The hatching on the calibration card, reused so "like the calibration card" is literal. */
export const STRIPES =
  "repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 12px)";

/** Ink for a card painted dark, and for one painted as a pale wash. */
export const DARK_INK = {
  title: "#ffffff",
  body: "rgba(255,255,255,0.72)",
  dim: "rgba(255,255,255,0.55)",
  tile: "rgba(255,255,255,0.08)",
  hairline: "rgba(255,255,255,0.12)",
  good: "#4ade80",
} as const;

export const LIGHT_INK = {
  title: "#0f172a",
  // slate-600, not slate-500. `#64748b` clears AA on pure white at 4.76:1, but these cards are
  // no longer white: on the checkpoint tint it falls to 4.15:1. Tinting the card moved the text
  // too, which is the kind of thing a palette change quietly takes with it.
  body: "#475569",
  dim: "#475569",
  tile: "",
  hairline: "#e2e8f0",
  good: "#15803d",
} as const;

export type NodeTone = "light" | "dark";

/**
 * How each kind of step is coloured.
 *
 * Two families, because they are two kinds of thing.
 *
 * **Course content is a pale wash.** A topic, a checkpoint and a week-final are the body of
 * the course, and ten of them in a column have to read as a list rather than a paint chart.
 * `surface` and `border` tint the card; `bg` tints the small icon tile.
 *
 * **The AI and career steps are dark, like the calibration card.** The mock interview, the
 * resume nudge and the roles card are events, not rows, and they now carry the same treatment
 * the calibration card already used at the top of the page: a `#0f172a` base under the same
 * `STRIPES` hatching, a 135 degree gradient toward the kind's own hue, a hairline white border
 * and white ink. `onDark` is the accent brightened for a dark ground, because the accents
 * chosen for white (`#db2777`, `#0d9488`, `#2563eb`) do not carry on `#0f172a`.
 *
 * **The light surfaces are chosen by measurement, not by eye.** The first attempt gave every
 * kind a different hex and a test asserted exactly that, while three were the same colour to a
 * human: topic, checkpoint and jobs all sit in the blue-violet region, and at a 4% wash
 * topic-vs-jobs came out at dE 1.06 and topic-vs-checkpoint at 1.49 in CIE Lab, both under the
 * just-noticeable difference. The page is pure white, so "distinct hex" and "distinct colour"
 * are not the same claim and only the second is what was asked for. cardContrast.test.tsx
 * asserts, in Lab: every pair at least dE 3 apart, every kind at least dE 4 from `topic`, and
 * body text clearing 4.5:1 on every surface - measured on the composited text colour, light or
 * dark, rather than inferred from the surface's luminance.
 */
export const NODE_STYLE: Record<
  string,
  {
    color: string; bg: string; icon: string; surface: string; border: string;
    tone: NodeTone; surfaceTo?: string; onDark?: string; onLight?: string;
  }
> = {
  topic: { color: "#6366f1", bg: "#eef2ff", icon: "mdi:book-open-page-variant",
           surface: "#fafaff", border: "#dadafc", tone: "light", onLight: "#4f46e5" },
  checkpoint: { color: "#a855f7", bg: "#f5f3ff", icon: "mdi:shield-check",
                surface: "#f5ecfe", border: "#ead6fd", tone: "light", onLight: "#7e22ce" },
  week_final: { color: "#f59e0b", bg: "#fff7ed", icon: "mdi:flag-checkered",
                surface: "#fef9f0", border: "#fde8c4", tone: "light", onLight: "#b45309" },
  interview: { color: "#db2777", bg: "#fdf2f8", icon: "mdi:account-voice",
               surface: "#0f172a", surfaceTo: "#3b0f2e", border: "rgba(255,255,255,0.08)",
               tone: "dark", onDark: "#f9a8d4" },
  /** The two career halves. Not node types - the station reads them by name. */
  resume: { color: "#0d9488", bg: "#ecfdf7", icon: "mdi:file-account-outline",
            surface: "#0f172a", surfaceTo: "#0b3330", border: "rgba(255,255,255,0.08)",
            tone: "dark", onDark: "#5eead4" },
  jobs: { color: "#2563eb", bg: "#eff6ff", icon: "mdi:briefcase-outline",
          surface: "#0f172a", surfaceTo: "#13295a", border: "rgba(255,255,255,0.08)",
          tone: "dark", onDark: "#93c5fd" },
};

/** The ink that goes on a given kind's card, and the accent that stays visible on it. */
export function nodeInk(kind: string) {
  const ns = NODE_STYLE[kind] ?? NODE_STYLE.topic;
  const dark = ns.tone === "dark";
  return {
    dark,
    ink: dark ? DARK_INK : LIGHT_INK,
    // `color` is the STRUCTURAL hue - the 4px edge, the icon tile, the rail marker - where a
    // bright tint is wanted and nothing is read off it. `accent` is the hue used for TEXT, and
    // text has to clear 4.5:1 on the card it sits on. They part company on both families:
    // `#f59e0b` is 2.05:1 on its own amber wash, and `#db2777` is unreadable on `#3b0f2e`.
    accent: dark ? (ns.onDark ?? "#ffffff") : (ns.onLight ?? ns.color),
    // The flat colour under the gradient. It is the kind's OWN dark hue rather than the shared
    // `#0f172a`, so two dark cards side by side differ even where a gradient is not painted -
    // a printed page, a forced-colours mode, or a test reading computed `backgroundColor`.
    baseColor: dark ? (ns.surfaceTo ?? ns.surface) : ns.surface,
    /** The full background for the card: a flat wash, or the calibration treatment. */
    background: dark
      ? `${STRIPES}, linear-gradient(135deg, ${ns.surface} 0%, ${ns.surfaceTo ?? ns.surface} 100%)`
      : ns.surface,
  };
}
