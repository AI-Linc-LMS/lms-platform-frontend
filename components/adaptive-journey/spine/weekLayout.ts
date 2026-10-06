/**
 * How a week's steps are laid out, and which paper covers which module.
 *
 * A week's assessment is drawn ONLY as the third leg of its modules' triads - `3 · ASSESSMENT ·
 * Scored 7%` - and not also as a card of its own below them. Both at once is the same paper
 * twice, once as a pill and once as a card, which reads as two different tests.
 *
 * The paper belongs to EVERY module in its week, not one of them. On production a week commonly
 * holds two or three modules and exactly one paper: the Impacteers DSA course runs
 * `topic("Arrays & Matrix Problems") + topic("Strings") + week_final("Week 2 Check")`. An
 * earlier rule handed it to the week's last module alone, so every other module in the week
 * said "None for this module" with the week's paper sitting right beneath it.
 *
 * It is stored under either type. `week_final` is NOT "the course's final assessment" - it is
 * the week's own paper, titled "Week N Check" - and platform-wide the split is 214 `checkpoint`
 * to 118 `week_final`. A rule that reads only one of them is wrong for a third of the platform.
 *
 * The calibration is never absorbed. It is stored as a checkpoint node but it is the course's
 * entry assessment, with its own card above the timeline, and it belongs to no module.
 */

import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

/** The paper that covers this week, or null when the week has none. */
export function weekPaper(nodes: JourneyNodeView[]): JourneyNodeView | null {
  return (
    nodes.find(
      (n) => (n.type === "checkpoint" || n.type === "week_final") && !n.isCalibration,
    ) ?? null
  );
}

/** That paper, keyed by every module it covers, so each module can state its real status. */
export function paperByModule(nodes: JourneyNodeView[]): Map<number, JourneyNodeView> {
  const paper = weekPaper(nodes);
  const out = new Map<number, JourneyNodeView>();
  if (!paper) return out;
  for (const n of nodes) {
    if (n.type === "topic") out.set(n.id, paper);
  }
  return out;
}

/**
 * The rows to draw for a week.
 *
 * The paper comes out when at least one module is showing it in a triad. With no module to
 * show it, it keeps its row - otherwise the week's only assessment would vanish from the page
 * entirely, which is worse than showing it twice.
 */
export function weekRows(nodes: JourneyNodeView[]): JourneyNodeView[] {
  const paper = weekPaper(nodes);
  if (!paper) return nodes;
  const shownInATriad = nodes.some((n) => n.type === "topic");
  if (!shownInATriad) return nodes;
  return nodes.filter((n) => n.id !== paper.id);
}
