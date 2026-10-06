import { describe, expect, it } from "vitest";
import { railEnds, rungs, sameRung } from "./railEnds";
import { weekTone } from "./Spine";
import type { JourneyWeekView, NodeStatus } from "@/lib/types/adaptive-journey";

/**
 * The spine is one line only if its two ends are the real ends. Each of these is a shape that
 * actually occurs in production - an empty leading module, an empty trailing one - and in each
 * the naive answer ("the first week's band", "the last week's last step") leaves the rail
 * hanging off the page.
 */

const w = (nodes: number) => ({ nodes: Array.from({ length: nodes }, (_, i) => i) });

describe("where the rail starts and stops", () => {
  it("runs from the first week's band to the last week's last step", () => {
    const { first, last } = railEnds([w(2), w(3)]);
    expect(first).toEqual({ week: 0, node: null });
    expect(last).toEqual({ week: 1, node: 2 });
  });

  it("stops at the band of a trailing week that has no steps yet", () => {
    // An admin adding next month's empty module must not leave the rail dangling past it.
    const { last } = railEnds([w(2), w(0)]);
    expect(last).toEqual({ week: 1, node: null });
  });

  it("starts at the band of a leading week that has no steps yet", () => {
    const { first } = railEnds([w(0), w(2)]);
    expect(first).toEqual({ week: 0, node: null });
  });

  it("marks exactly one rung as each end", () => {
    const weeks = [w(1), w(0), w(2)];
    const all = rungs(weeks);
    const { first, last } = railEnds(weeks);
    expect(all.filter((r) => sameRung(r, first))).toHaveLength(1);
    expect(all.filter((r) => sameRung(r, last))).toHaveLength(1);
  });

  it("is a single rung for a one-step course, so that rung is both ends", () => {
    const { first, last } = railEnds([w(0)]);
    expect(first).toEqual({ week: 0, node: null });
    expect(last).toEqual({ week: 0, node: null });
  });

  it("has no ends at all for a course with no weeks", () => {
    expect(railEnds([])).toEqual({ first: undefined, last: undefined });
  });
});

const week = (statuses: NodeStatus[]): JourneyWeekView =>
  ({ nodes: statuses.map((status) => ({ status })) }) as unknown as JourneyWeekView;

describe("how far the rail is lit through a week", () => {
  it("is behind the learner once every step is done", () => {
    expect(weekTone(week(["done", "done"]))).toBe("done");
  });

  it("is lit from the first step they have touched", () => {
    expect(weekTone(week(["done", "locked"]))).toBe("active");
    expect(weekTone(week(["current", "locked"]))).toBe("active");
  });

  it("stays ahead of them while nothing in it has been started", () => {
    expect(weekTone(week(["available", "locked"]))).toBe("ahead");
    expect(weekTone(week(["locked", "locked"]))).toBe("ahead");
  });

  it("never calls an empty week done - nothing in it was completed", () => {
    // `[].every(...)` is true, so the obvious implementation lights an empty trailing module
    // green and tells the learner they finished a week that has no content.
    expect(weekTone(week([]))).toBe("ahead");
  });
});
