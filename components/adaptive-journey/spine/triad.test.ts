import { describe, expect, it } from "vitest";
import { assessmentLeg, checkpointForModule, lessonsLeg, moduleTriad, tutorLegView } from "./triad";
import { layOutWeek } from "./weekLayout";
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

/**
 * The module triad. Every tile states something READ, never estimated - that is the whole
 * rule. "0 min with the tutor" and "0 of 0 lessons" both describe a learner who has failed at
 * something, when the truth is that nothing has happened yet.
 */

const node = (over: Partial<JourneyNodeView> = {}): JourneyNodeView =>
  ({
    id: 1, type: "topic", title: "Recursion", order: 1, status: "available",
    score: { earned: 0, total: 30 }, weight: 1, basePoints: 30,
    unlockRule: "sequential", lockReason: null, isCalibration: false,
    content: null, itemCount: 4, questionCount: 0, proctored: false,
    durationMinutes: null, tutor: { state: "ready", sessions: 0, minutes: 0 },
    ref: { submoduleId: 912 },
    ...over,
  }) as JourneyNodeView;

describe("the lessons leg", () => {
  it("counts the module's items while it is unfinished", () => {
    expect(lessonsLeg(node({ itemCount: 5 })).value).toBe("5 lessons");
  });

  it("says one lesson, not one lessons", () => {
    expect(lessonsLeg(node({ itemCount: 1 })).value).toBe("1 lesson");
  });

  it("reads them all done once the module is", () => {
    expect(lessonsLeg(node({ itemCount: 5, status: "done" })).value).toBe("5 of 5");
  });

  it("does not invent a partial count the board does not carry", () => {
    // The board scores a module as one step. "3 of 5" would be precision we do not have.
    expect(lessonsLeg(node({ itemCount: 5, status: "current" })).value).toBe("5 lessons");
  });

  it("says a module has no lessons rather than showing 0 of 0", () => {
    expect(lessonsLeg(node({ itemCount: 0 })).value).toBe("No lessons yet");
  });
});

describe("the tutor leg", () => {
  it("shows nothing at all for a tenant without the tutor", () => {
    expect(tutorLegView(node(), false)).toBeNull();
  });

  it("shows nothing on a board served before the tutor knew about modules", () => {
    expect(tutorLegView(node({ tutor: undefined }), true)).toBeNull();
    expect(tutorLegView(node({ tutor: null }), true)).toBeNull();
  });

  it("offers a session on an open module", () => {
    expect(tutorLegView(node(), true)?.value).toBe("Session ready");
  });

  it("reports the minutes the learner really spent", () => {
    const leg = tutorLegView(node({ tutor: { state: "done", sessions: 1, minutes: 22 } }), true);
    expect(leg?.value).toBe("22 min session");
    expect(leg?.state).toBe("done");
  });

  it("pluralises several sessions", () => {
    expect(tutorLegView(node({ tutor: { state: "done", sessions: 3, minutes: 54 } }), true)?.value)
      .toBe("54 min sessions");
  });

  it("never says 0 min for a session that did happen", () => {
    // A session under a minute rounds to zero. "0 min session" reads as a failure.
    expect(tutorLegView(node({ tutor: { state: "done", sessions: 1, minutes: 0 } }), true)?.value)
      .toBe("1 session");
  });

  it("says what would unlock it on a locked module", () => {
    expect(tutorLegView(node({ tutor: { state: "locked", sessions: 0, minutes: 0 } }), true)?.value)
      .toBe("Unlocks with module");
  });
});

const paper = (over: Partial<JourneyNodeView> = {}): JourneyNodeView =>
  node({ id: 9, type: "checkpoint", title: "Checkpoint", questionCount: 10,
    ref: { assessmentId: 5, assessmentSlug: "wk1" }, ...over });

describe("the assessment leg", () => {
  it("says so plainly when the module has no paper", () => {
    expect(assessmentLeg(node(), null).value).toBe("None for this module");
  });

  it("counts the questions on an open paper", () => {
    expect(assessmentLeg(node(), paper({ status: "available" })).value).toBe("10 questions");
  });

  it("reports the real score on a finished one", () => {
    const done = paper({ status: "done", score: { earned: 43, total: 50 } });
    expect(assessmentLeg(node(), done).value).toBe("Scored 86%");
  });

  it("does not render 0% for a paper worth nothing", () => {
    // 0/0 is not 0%. A learner told they scored 0% on a paper they passed would be right to
    // complain, and the board does carry zero-weight nodes.
    const done = paper({ status: "done", score: { earned: 0, total: 0 } });
    expect(assessmentLeg(node(), done).value).toBe("Submitted");
  });

  it("says what opens it while it is locked", () => {
    expect(assessmentLeg(node({ status: "current" }), paper({ status: "locked" })).value)
      .toBe("After all lessons");
  });
});

describe("the triad as a whole", () => {
  it("is three legs on a module with the tutor on", () => {
    expect(moduleTriad(node(), paper(), true).map((l) => l.label))
      .toEqual(["LESSONS", "AI TUTOR", "ASSESSMENT"]);
  });

  it("drops to two when the tenant has no tutor, rather than showing a dead tile", () => {
    expect(moduleTriad(node(), paper(), false).map((l) => l.label))
      .toEqual(["LESSONS", "ASSESSMENT"]);
  });

  it("numbers the legs in the order a module is worked through", () => {
    expect(moduleTriad(node(), paper(), true).map((l) => l.step)).toEqual([1, 2, 3]);
  });
});

describe("laying out a week", () => {
  it("folds the module's checkpoint into its last module instead of drawing it twice", () => {
    const m1 = node({ id: 1 });
    const m2 = node({ id: 2 });
    const cp = paper({ id: 9 });
    const out = layOutWeek([m1, m2, cp]);
    expect(out.rows.map((n) => n.id)).toEqual([1, 2]);
    expect(out.checkpointFor.get(2)?.id).toBe(9);
    expect(out.checkpointFor.get(1)).toBeUndefined();
  });

  it("leaves the calibration as its own step - it is not a module's test", () => {
    const calib = paper({ id: 9, isCalibration: true });
    const out = layOutWeek([node({ id: 1 }), calib]);
    expect(out.rows.map((n) => n.id)).toEqual([1, 9]);
    expect(out.checkpointFor.size).toBe(0);
  });

  it("leaves a week-final as its own station on the rail", () => {
    const final = paper({ id: 9, type: "week_final" });
    const out = layOutWeek([node({ id: 1 }), final]);
    expect(out.rows.map((n) => n.id)).toEqual([1, 9]);
  });

  it("keeps a paper that has no module to fold into, rather than losing it", () => {
    const out = layOutWeek([paper({ id: 9 })]);
    expect(out.rows.map((n) => n.id)).toEqual([9]);
  });

  it("finds the paper that closes a week", () => {
    expect(checkpointForModule([node({ id: 1 }), paper({ id: 9 })])?.id).toBe(9);
    expect(checkpointForModule([node({ id: 1 })])).toBeNull();
  });
});
