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
}: {
  weeks: JourneyWeekView[];
  courseId: number;
  /** Running step count at the start of each week, so numbering is course-wide. */
  stepStarts: number[];
  unitNoun?: string;
  fieldTier?: string | null;
}) {
  // The rail begins at the first marker and ends at the last, with no loose ends. See
  // `railEnds` for why those are read off the data rather than assumed.
  const { first, last } = railEnds(weeks);

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
              last={sameRung(band, last)}
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
                  last={sameRung(rung, last)}
                />
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
