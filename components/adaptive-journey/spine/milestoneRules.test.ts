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

  it("never puts the entry level-gauge at the END of the course", () => {
    // `board.interview.card` is NOT a closing interview. The server builds it only from the
    // node flagged `is_calibration_interview` (board.py:211-212) - the gauge a learner sits
    // FIRST, which has its own card above the timeline.
    //
    // Placing it as a terminal milestone said the opposite of the truth twice: it presented
    // the first thing as the last, and because the card reports that gauge's completion, a
    // learner who had sat the entry interview saw the "final" interview already ticked.
    // Reported on Impacteers.
    expect(courseMilestones(board({ interview: configuredInterview }))).toEqual([]);
  });

  it("does not resurrect it just because it was completed", () => {
    const m = courseMilestones(board({
      interview: { card: { ...configuredInterview.card, status: "done" } },
    }));
    expect(m).toEqual([]);
  });

  it("offers the certificate when the course issues one", () => {
    const m = courseMilestones(board({
      course: { certificateEnabled: true, certificateThreshold: 80 },
    }));
    expect(m).toEqual([{ kind: "certificate", reached: false }]);
  });

  it("ends on the certificate, which is the course's only real destination today", () => {
    const m = courseMilestones(board({
      interview: configuredInterview,
      course: { certificateEnabled: true, certificateThreshold: 80 },
    }));
    expect(m.map((x) => x.kind)).toEqual(["certificate"]);
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
