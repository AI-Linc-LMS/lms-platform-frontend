import { describe, expect, it } from "vitest";
import { courseMilestones } from "./milestoneRules";
import type { JourneyBoard } from "@/lib/types/adaptive-journey";

/**
 * Which destinations a course really has. The failure to avoid is a greyed-out promise: a
 * milestone for an interview no admin configured, or a certificate on a course that does not
 * issue one, is worse than no milestone - it advertises something the learner cannot reach.
 */

const board = (over: Record<string, unknown> = {}) =>
  ({
    course: { certificateEnabled: false, certificateThreshold: 80, certificateTitle: "" },
    progressCard: { completionPct: 0 },
    interview: { card: null },
    weeks: [],
    ...over,
  }) as unknown as JourneyBoard;

const configuredInterview = {
  card: { templateId: 28, configured: true, status: "not_started", topic: "SQL", difficulty: "Medium", durationMinutes: 10 },
};

describe("what a course ends with", () => {
  it("has no milestones when it has neither an interview nor a certificate", () => {
    expect(courseMilestones(board())).toEqual([]);
  });

  it("offers the interview when one is configured", () => {
    const m = courseMilestones(board({ interview: configuredInterview }));
    expect(m).toEqual([{ kind: "interview", reached: false }]);
  });

  it("does not offer an interview the instructor has not finished setting up", () => {
    // The top card is the surface that explains "your instructor is still setting this up".
    // A destination the learner cannot reach is not a destination.
    const m = courseMilestones(board({
      interview: { card: { templateId: 28, configured: false, status: "not_configured" } },
    }));
    expect(m).toEqual([]);
  });

  it("does not offer an interview whose template is gone", () => {
    const m = courseMilestones(board({
      interview: { card: { templateId: null, configured: true, status: "not_started" } },
    }));
    expect(m).toEqual([]);
  });

  it("does not show the same interview twice when it is already a step on the timeline", () => {
    const m = courseMilestones(board({
      interview: configuredInterview,
      weeks: [{ nodes: [{ type: "topic" }, { type: "interview" }] }],
    }));
    expect(m).toEqual([]);
  });

  it("marks a finished interview as reached", () => {
    const m = courseMilestones(board({
      interview: { card: { ...configuredInterview.card, status: "done" } },
    }));
    expect(m[0]).toEqual({ kind: "interview", reached: true });
  });

  it("offers the certificate when the course issues one", () => {
    const m = courseMilestones(board({
      course: { certificateEnabled: true, certificateThreshold: 80 },
    }));
    expect(m).toEqual([{ kind: "certificate", reached: false }]);
  });

  it("puts the certificate last, after the interview", () => {
    const m = courseMilestones(board({
      interview: configuredInterview,
      course: { certificateEnabled: true, certificateThreshold: 80 },
    }));
    expect(m.map((x) => x.kind)).toEqual(["interview", "certificate"]);
  });

  it("lights the certificate diamond once the learner is past the threshold", () => {
    const m = courseMilestones(board({
      course: { certificateEnabled: true, certificateThreshold: 80 },
      progressCard: { completionPct: 80 },
    }));
    expect(m[0].reached).toBe(true);
  });

  it("treats a missing completion number as zero rather than as earned", () => {
    // A board served without progressCard must not light the certificate green.
    const m = courseMilestones(board({
      course: { certificateEnabled: true, certificateThreshold: 80 },
      progressCard: undefined,
    }));
    expect(m[0].reached).toBe(false);
  });

  it("falls back to 80% when the course carries no threshold", () => {
    const below = courseMilestones(board({
      course: { certificateEnabled: true, certificateThreshold: null },
      progressCard: { completionPct: 79 },
    }));
    const at = courseMilestones(board({
      course: { certificateEnabled: true, certificateThreshold: null },
      progressCard: { completionPct: 80 },
    }));
    expect(below[0].reached).toBe(false);
    expect(at[0].reached).toBe(true);
  });
});
