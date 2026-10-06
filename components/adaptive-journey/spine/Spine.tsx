"use client";

/**
 * The course, as one path.
 *
 * Before this, each week was its own bordered card with its steps inside, and each step drew a
 * short rail stub of its own. The line therefore broke at every week boundary, and a learner
 * looking at a twelve-week course saw twelve unrelated boxes. Here there is one rail: week
 * headings are waypoints on it, steps hang off it in order, and the colour of each segment
 * says whether that stretch is behind the learner or ahead.
 *
 * The step numbers continue across weeks (`startStep`) because they always have -- "step 14 of
 * 40" is the course-wide count, not a per-week one.
 */

import { Box } from "@mui/material";
import type { JourneyWeekView } from "@/lib/types/adaptive-journey";
import { NodeRow } from "./NodeRow";
import { SpineRow } from "./SpineRow";
import { WeekBand, WeekMarker } from "./WeekBand";
import { railEnds, sameRung } from "./railEnds";
import { paperByModule } from "./weekLayout";
import { Milestones } from "./Milestones";
import { courseMilestones } from "./milestoneRules";
import type { JourneyBoard as JourneyBoardData } from "@/lib/types/adaptive-journey";

/** A week is behind the learner once every step in it is done, and lit from the moment any
 *  step in it has been touched. An empty week is never "done" -- nothing was completed. */
export function weekTone(week: JourneyWeekView): "done" | "active" | "ahead" {
  if (week.nodes.length === 0) return "ahead";
  if (week.nodes.every((n) => n.status === "done")) return "done";
  if (week.nodes.some((n) => n.status === "done" || n.status === "current")) return "active";
  return "ahead";
}

export function Spine({
  weeks,
  courseId,
  stepStarts,
  unitNoun = "Week",
  fieldTier,
  board,
}: {
  weeks: JourneyWeekView[];
  courseId: number;
  /** Running step count at the start of each week, so numbering is course-wide. */
  stepStarts: number[];
  unitNoun?: string;
  fieldTier?: string | null;
  /** The whole board, for the terminal milestones. */
  board: JourneyBoardData;
}) {
  // The rail begins at the first marker and ends at the last, with no loose ends. See
  // `railEnds` for why those are read off the data rather than assumed.
  // The week's paper keeps its own station on the rail - it covers the whole week, carries its
  // own weight and question count, and a week often holds several modules - and every module in
  // that week points at it, so none of them claims to have no assessment while it sits below
  // them.
  const papers = weeks.map((w) => paperByModule(w.nodes));
  const { first, last } = railEnds(weeks);
  // Modules are numbered across the whole course, the way a learner refers to them.
  let moduleCounter = 0;
  const moduleNoById = new Map<number, number>();
  for (const w of weeks) {
    for (const n of w.nodes) {
      if (n.type === "topic") moduleNoById.set(n.id, ++moduleCounter);
    }
  }
  // A milestone at the end takes over as the rail's bottom end, so the line runs through the
  // last module and into the destination rather than stopping short of it.
  const hasMilestones = courseMilestones(board).length > 0;
  const lastStepRung = hasMilestones ? undefined : last;

  return (
    <Box>
      {weeks.map((week, wi) => {
        const band = { week: wi, node: null };
        return (
          <Box key={week.weekNo}>
            <SpineRow
              marker={<WeekMarker done={weekTone(week) === "done"} started={weekTone(week) !== "ahead"} />}
              tone={weekTone(week)}
              first={sameRung(band, first)}
              last={sameRung(band, lastStepRung)}
            >
              <WeekBand week={week} unitNoun={unitNoun} />
            </SpineRow>
            {week.nodes.map((n, ni) => {
              const rung = { week: wi, node: ni };
              return (
                <NodeRow
                  key={n.id}
                  node={n}
                  courseId={courseId}
                  stepNo={(stepStarts[wi] ?? 0) + ni + 1}
                  dueAt={week.schedule?.dueAt}
                  fieldTier={fieldTier}
                  first={sameRung(rung, first)}
                  last={sameRung(rung, lastStepRung)}
                  checkpoint={papers[wi].get(n.id) ?? null}
                  moduleNo={moduleNoById.get(n.id)}
                />
              );
            })}
          </Box>
        );
      })}
      <Milestones board={board} courseId={courseId} startsTheRail={!first} />
    </Box>
  );
}
