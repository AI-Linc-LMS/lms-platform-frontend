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

export const NODE_STYLE: Record<string, { color: string; bg: string; icon: string }> = {
  topic: { color: "#6366f1", bg: "#eef2ff", icon: "mdi:book-open-page-variant" },
  checkpoint: { color: "#a855f7", bg: "#f5f3ff", icon: "mdi:shield-check" },
  week_final: { color: "#f59e0b", bg: "#fff7ed", icon: "mdi:flag-checkered" },
  interview: { color: "#db2777", bg: "#fdf2f8", icon: "mdi:account-voice" },
};
