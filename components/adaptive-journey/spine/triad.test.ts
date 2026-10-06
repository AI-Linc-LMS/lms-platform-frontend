import { describe, expect, it } from "vitest";
import { assessmentLeg, lessonsLeg, moduleTriad, tutorLegView } from "./triad";
import { paperByModule, weekPaper } from "./weekLayout";
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
  it("says so plainly when the week has no paper", () => {
    expect(assessmentLeg(node(), null).value).toBe("No assessment");
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

  it("promises no timing just because THIS module is finished", () => {
    // The paper covers the whole week. Finishing one of its three modules does not mean it is
    // about to open, and "Opens shortly" said exactly that.
    expect(assessmentLeg(node({ status: "done" }), paper({ status: "locked" })).value)
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

describe("which paper covers a module", () => {
  // Shapes taken from production. The Impacteers DSA course (14) runs a `week_final` per week
  // titled "Week N Check", and most of its weeks hold TWO modules. Platform-wide the split is
  // 214 `checkpoint` to 118 `week_final`, so a rule that reads only one is wrong for a third
  // of the platform.

  it("finds a week's paper when it is stored as a checkpoint", () => {
    expect(weekPaper([node({ id: 1 }), paper({ id: 9 })])?.id).toBe(9);
  });

  it("finds it when it is stored as a week_final", () => {
    // `week_final` is NOT the course's final assessment - it is the week's own paper. Reading
    // only `checkpoint` is what made every module on an Impacteers course claim it had none.
    expect(weekPaper([node({ id: 1 }), paper({ id: 9, type: "week_final" })])?.id).toBe(9);
  });

  it("does not mistake the calibration for a module's paper", () => {
    // It is stored as a checkpoint node, but it is the course's entry assessment and belongs
    // to no module.
    expect(weekPaper([node({ id: 1 }), paper({ id: 9, isCalibration: true })])).toBeNull();
  });

  it("is null for a week with no paper at all", () => {
    expect(weekPaper([node({ id: 1 })])).toBeNull();
  });

  it("gives the week's paper to EVERY module in that week", () => {
    // The shape that broke: week 2 of course 14 is Arrays + Strings + one Week 2 Check. The
    // old rule handed it to the last module only, so "Arrays & Matrix Problems" reported no
    // assessment while the week's paper sat on the rail directly beneath it.
    const map = paperByModule([
      node({ id: 1, title: "Arrays & Matrix Problems" }),
      node({ id: 2, title: "Strings" }),
      paper({ id: 9, type: "week_final" }),
    ]);
    expect(map.get(1)?.id).toBe(9);
    expect(map.get(2)?.id).toBe(9);
  });

  it("maps nothing for a week that has no paper", () => {
    expect(paperByModule([node({ id: 1 }), node({ id: 2 })]).size).toBe(0);
  });

  it("never maps the paper onto a non-module step", () => {
    const map = paperByModule([node({ id: 1 }), paper({ id: 9 })]);
    expect(map.has(9)).toBe(false);
  });

  it("keeps the paper's own node untouched - it stays a station on the rail", () => {
    // It carries its weight ("counts 2x"), its question count and its result button, none of
    // which fits in a tile. The tile points at it; it is not a copy of it.
    const nodes = [node({ id: 1 }), paper({ id: 9, type: "week_final" })];
    paperByModule(nodes);
    expect(nodes.map((n) => n.id)).toEqual([1, 9]);
  });
});

describe("a module in a week that has a paper", () => {
  it("never claims it has no assessment", () => {
    const map = paperByModule([node({ id: 1 }), node({ id: 2 }), paper({ id: 9, type: "week_final" })]);
    for (const id of [1, 2]) {
      const leg = assessmentLeg(node({ id }), map.get(id) ?? null);
      expect(leg.value).not.toBe("No assessment");
    }
  });

  it("reports the paper's real state on every module it covers", () => {
    const done = paper({ id: 9, type: "week_final", status: "done", score: { earned: 17, total: 240 } });
    const map = paperByModule([node({ id: 1 }), node({ id: 2 }), done]);
    expect(assessmentLeg(node({ id: 1 }), map.get(1) ?? null).value).toBe("Scored 7%");
    expect(assessmentLeg(node({ id: 2 }), map.get(2) ?? null).value).toBe("Scored 7%");
  });
});
