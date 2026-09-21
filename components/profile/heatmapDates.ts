import type { HeatmapData } from "@/lib/services/profile.service";

export interface HeatmapDay {
  date: string;
  count: number;
  level: number;
  activities: Record<string, number>;
}

/**
 * YYYY-MM-DD of a Date as the viewer's calendar reads it.
 *
 * Not `toISOString()`: that is the UTC calendar. For a local midnight east of Greenwich (every
 * learner in India, UTC+5:30) the UTC date is still yesterday, so a year built that way was keyed
 * one day early from Jan 1 to Dec 31 - activity landed on the next day's tile, Dec 31 never got a
 * tile at all, and the grid started on the wrong weekday.
 */
export const localDateKey = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const heatLevel = (count: number): number => {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
};

/** One entry per calendar day of `year`, Jan 1 through Dec 31, keyed by local Y-M-D. */
export function buildYearDates(year: number, heatmapData: HeatmapData): HeatmapDay[] {
  const dates: HeatmapDay[] = [];
  // Walk by day-of-month from local calendar components, so no DST or UTC offset can skip or
  // repeat a day.
  for (let d = new Date(year, 0, 1); d.getFullYear() === year; d = new Date(year, d.getMonth(), d.getDate() + 1)) {
    const date = localDateKey(d);
    const activityData = heatmapData[date];
    const count = activityData?.total || 0;
    dates.push({
      date,
      count,
      level: heatLevel(count),
      activities: {
        Quiz: activityData?.Quiz || 0,
        Article: activityData?.Article || 0,
        Assignment: activityData?.Assignment || 0,
        CodingProblem: activityData?.CodingProblem || 0,
        DevCodingProblem: activityData?.DevCodingProblem || 0,
        VideoTutorial: activityData?.VideoTutorial || 0,
      },
    });
  }
  return dates;
}
