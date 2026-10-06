/**
 * How a week's steps are laid out on the spine.
 *
 * A module's checkpoint is drawn INSIDE that module, as the third leg of its triad, the way
 * the design shows it: "3 · ASSESSMENT · Scored 86%". So it must not also be drawn as its own
 * row below the module - the same paper twice, once as a tile and once as a card, reads as two
 * different tests.
 *
 * Two things are deliberately NOT absorbed:
 *
 * * The calibration. It is stored as a checkpoint node but it is not a module's test - it is
 *   the course's entry assessment, with its own card above the timeline.
 * * `week_final`. The design keeps the final assessment as its own station on the rail, and a
 *   week-final is a bigger thing than the module it follows.
 */

import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

export interface WeekLayout {
  /** The rows to draw, in order. */
  rows: JourneyNodeView[];
  /** The paper folded into each module's triad, by that module's node id. */
  checkpointFor: Map<number, JourneyNodeView>;
}

export function layOutWeek(nodes: JourneyNodeView[]): WeekLayout {
  const modules = nodes.filter((n) => n.type === "topic");
  const absorbable = nodes.find(
    (n) => n.type === "checkpoint" && !n.isCalibration,
  );

  // With no module to attach to, the paper has to keep its own row or it would vanish.
  if (!absorbable || modules.length === 0) {
    return { rows: nodes, checkpointFor: new Map() };
  }

  // It closes the week, so it belongs to the week's LAST module.
  const owner = modules[modules.length - 1];
  return {
    rows: nodes.filter((n) => n.id !== absorbable.id),
    checkpointFor: new Map([[owner.id, absorbable]]),
  };
}
