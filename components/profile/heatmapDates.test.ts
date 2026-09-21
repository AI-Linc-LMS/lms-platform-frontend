import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildYearDates, localDateKey } from "./heatmapDates";

/**
 * The heatmap keyed each day with `toISOString()` of a LOCAL midnight. In India (UTC+5:30) local
 * midnight is 18:30 the previous day in UTC, so every key was one day early: the year ran from
 * the previous Dec 31 to Dec 30, activity showed on the following day's tile, and Dec 31's
 * activity had no tile at all - on the phone month view and on the desktop year wall alike.
 *
 * These tests pin the process to Asia/Kolkata and first assert that the pin took, so they cannot
 * pass vacuously on a UTC CI runner where the old code was also correct.
 */
const originalTZ = process.env.TZ;

describe("heatmap date keys in Asia/Kolkata", () => {
  beforeAll(() => {
    process.env.TZ = "Asia/Kolkata";
  });
  afterAll(() => {
    process.env.TZ = originalTZ;
  });

  it("is actually running at UTC+5:30", () => {
    expect(new Date(2025, 11, 31).getTimezoneOffset()).toBe(-330);
  });

  it("reproduces the old bug: toISOString of a local midnight is the previous day", () => {
    const localMidnight = new Date(2025, 11, 31);
    expect(localMidnight.toISOString().split("T")[0]).toBe("2025-12-30");
    expect(localDateKey(localMidnight)).toBe("2025-12-31");
  });

  it("builds Jan 1 through Dec 31 of the selected year, nothing from the year before", () => {
    const dates = buildYearDates(2025, {});
    expect(dates).toHaveLength(365);
    expect(dates[0].date).toBe("2025-01-01");
    expect(dates[dates.length - 1].date).toBe("2025-12-31");
    expect(dates.some((d) => d.date.startsWith("2024-"))).toBe(false);
    expect(new Set(dates.map((d) => d.date)).size).toBe(365);
  });

  it("counts activity logged on Dec 31 on the Dec 31 tile", () => {
    const entry = {
      Quiz: 4, Article: 0, Assignment: 0, CodingProblem: 0, DevCodingProblem: 0, VideoTutorial: 0, total: 4,
    };
    const dates = buildYearDates(2025, { "2025-12-31": entry, "2025-03-10": { ...entry, total: 1, Quiz: 1 } });
    const dec31 = dates.find((d) => d.date === "2025-12-31");
    expect(dec31?.count).toBe(4);
    expect(dec31?.activities.Quiz).toBe(4);
    // And no neighbouring tile has stolen it.
    expect(dates.find((d) => d.date === "2025-03-11")?.count).toBe(0);
    expect(dates.find((d) => d.date === "2025-03-10")?.count).toBe(1);
  });

  it("handles a leap year", () => {
    const dates = buildYearDates(2024, {});
    expect(dates).toHaveLength(366);
    expect(dates.find((d) => d.date === "2024-02-29")).toBeDefined();
  });
});
