/**
 * Which paper covers a week, and which modules it covers.
 *
 * A week's assessment is a WEEK-level thing. On production a week commonly holds two or three
 * modules and exactly one paper: the Impacteers DSA course runs
 * `topic("Arrays & Matrix Problems") + topic("Strings") + week_final("Week 2 Check")`. So the
 * paper belongs to every module in its week, not to one of them.
 *
 * It is stored under either type. `week_final` is NOT "the course's final assessment" - it is
 * the week's own paper, titled "Week N Check" - and platform-wide the split is 214 `checkpoint`
 * to 118 `week_final`. A rule that reads only one of them is wrong for a third of the platform.
 *
 * The calibration is excluded. It is stored as a checkpoint node but it is the course's entry
 * assessment, with its own card above the timeline, and it belongs to no module.
 *
 * This file replaced one that folded the paper INTO the week's last module and dropped its row.
 * That was modelled on a design where each week held exactly one module; on real data it left
 * every other module in the week saying "None for this module" while the week's paper sat
 * directly below them, and it only ever recognised `checkpoint`.
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
