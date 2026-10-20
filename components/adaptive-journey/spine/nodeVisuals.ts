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

/**
 * How each kind of step is coloured.
 *
 * `bg` tints the small icon tile. `surface` and `border` tint the CARD, which until now was
 * white for every kind - so a checkpoint, an interview and a resume nudge were distinguishable
 * only by a 4px stripe down the left edge, and on a near-white page they all read as one
 * undifferentiated stack. Each kind now carries its own hue at card scale: indigo for a topic,
 * violet for a checkpoint, amber for a week-final, pink for the interview, emerald for the
 * resume and blue for the roles.
 *
 * The tints are deliberately shallow (roughly a 4% wash). They have to separate the cards from
 * the page and from each other without competing with the text on them, and anything stronger
 * turns a list of ten steps into a paint chart.
 */
export const NODE_STYLE: Record<
  string,
  { color: string; bg: string; icon: string; surface: string; border: string }
> = {
  topic: { color: "#6366f1", bg: "#eef2ff", icon: "mdi:book-open-page-variant",
           surface: "#f8f9ff", border: "#e0e4fb" },
  checkpoint: { color: "#a855f7", bg: "#f5f3ff", icon: "mdi:shield-check",
                surface: "#fbf8ff", border: "#ebe1fb" },
  week_final: { color: "#f59e0b", bg: "#fff7ed", icon: "mdi:flag-checkered",
                surface: "#fffaf3", border: "#fae8d2" },
  interview: { color: "#db2777", bg: "#fdf2f8", icon: "mdi:account-voice",
               surface: "#fff7fb", border: "#fbdcea" },
  /** The two career halves. Not node types - the station reads them by name. */
  resume: { color: "#0d9488", bg: "#ecfdf7", icon: "mdi:file-account-outline",
            surface: "#f4fdfa", border: "#cdeee4" },
  jobs: { color: "#2563eb", bg: "#eff6ff", icon: "mdi:briefcase-outline",
          surface: "#f5f9ff", border: "#d8e6fd" },
};
