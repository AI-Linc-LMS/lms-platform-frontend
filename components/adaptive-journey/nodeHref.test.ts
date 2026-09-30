/**
 * Where a journey step goes when a learner clicks it.
 *
 * Checkpoint and week_final cards were the null case by omission: the board sent only a numeric
 * `assessmentId`, every learner assessment route resolves by SLUG, and this rule listed `topic`
 * and `interview` and nothing else. Those cards had no href, no "Continue" button and a click
 * that did nothing -- and the board is their only doorway, because the learner assessment list
 * excludes every journey type. Platform-wide there had never been a single submission against
 * any of the 130 checkpoint or 138 week_final papers. 112 more shipped for Impacteers before
 * anyone noticed.
 */
import { describe, expect, it } from "vitest";
import { nodeHref } from "./nodeHref";
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

const node = (over: Partial<JourneyNodeView> = {}) => ({
  id: 1, type: "week_final", title: "Week 1 Check", order: 1, status: "available",
  score: { earned: 0, total: 240 }, weight: 2, basePoints: 120,
  unlockRule: "sequential", lockReason: null, isCalibration: false,
  content: null, itemCount: 0, questionCount: 20, proctored: false, durationMinutes: 30,
  ref: { assessmentId: 923, assessmentSlug: "imp-19-wk01-final" },
  ...over,
} as unknown as JourneyNodeView);

describe("nodeHref", () => {
  it("routes a week_final to its assessment by slug", () => {
    expect(nodeHref(node(), 19)).toBe("/assessments/imp-19-wk01-final?courseId=19");
  });

  it("routes a checkpoint the same way", () => {
    expect(nodeHref(node({ type: "checkpoint",
      ref: { assessmentId: 5, assessmentSlug: "calib-29-19" } } as Partial<JourneyNodeView>), 19))
      .toBe("/assessments/calib-29-19?courseId=19");
  });

  it("never builds a link from the id alone", () => {
    // An inert card is honest; a link built from an id would 404 on a slug route.
    expect(nodeHref(node({ ref: { assessmentId: 923 } } as Partial<JourneyNodeView>), 19))
      .toBeNull();
  });

  it("leaves a topic where it was", () => {
    expect(nodeHref(node({ type: "topic",
      ref: { submoduleId: 884 } } as Partial<JourneyNodeView>), 19))
      .toBe("/adaptive-courses/19/submodule/884");
  });

  it("leaves an interview where it was", () => {
    expect(nodeHref(node({ type: "interview",
      ref: { interviewTemplateId: 28 } } as Partial<JourneyNodeView>), 19))
      .toBe("/mock-interview/courses");
  });
});
