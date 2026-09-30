/**
 * "Proctored" is a claim about exam conditions, so the card must not assert it unasked.
 *
 * `contentSummary` opened the checkpoint case with a literal `["Proctored"]` while `nodeLabel`, twelve
 * lines below it in the same file, read the real `n.proctored` flag. So a paper generated with
 * proctoring off rendered "Proctored · 20 Qs · same for all" with no PROCTORED tag above it - true of
 * all 112 Impacteers papers, and of every other journey paper created with the flag off.
 */
import { describe, expect, it } from "vitest";

import { contentSummary } from "./JourneyBoard";
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

const node = (over: Partial<JourneyNodeView> = {}) =>
  ({
    id: 1, type: "week_final", title: "Week 1 Final", order: 1, status: "available",
    score: { earned: 0, total: 240 }, weight: 2, basePoints: 120,
    unlockRule: "sequential", lockReason: null, isCalibration: false,
    content: null, itemCount: 0, questionCount: 20, proctored: true, durationMinutes: 30,
    ref: { assessmentId: 923, assessmentSlug: "imp-19-wk01-final" },
    ...over,
  }) as unknown as JourneyNodeView;

describe("contentSummary for an assessment card", () => {
  it("says Proctored when the paper is proctored", () => {
    expect(contentSummary(node())).toBe("Proctored · 20 Qs · counts 2×");
  });

  it("does NOT say Proctored when it is not", () => {
    const summary = contentSummary(node({ proctored: false } as Partial<JourneyNodeView>));
    expect(summary).not.toContain("Proctored");
    expect(summary).toBe("20 Qs · counts 2×");
  });

  it("still reads sensibly for an unproctored checkpoint of weight 1", () => {
    expect(
      contentSummary(
        node({ type: "checkpoint", proctored: false, weight: 1 } as Partial<JourneyNodeView>),
      ),
    ).toBe("20 Qs · same for all");
  });

  it("omits the question count when the paper has none configured", () => {
    expect(
      contentSummary(node({ proctored: false, questionCount: 0 } as Partial<JourneyNodeView>)),
    ).toBe("counts 2×");
  });
});
