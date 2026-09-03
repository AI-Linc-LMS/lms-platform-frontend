import { describe, expect, it } from "vitest";
import { journeyScoreDisplay, journeyAvailabilityLine } from "./journeyScoreDisplay";

/**
 * Reported: "Even after completing the course materials and quiz, the marks remain at 0 in
 * the learning path. This issue is resolved on this page but not outside."
 *
 * The two numbers below are real. On production course 218 the learner held 759 points on
 * node 3691 ("for loops & range") and 345 on node 3692 ("while loops"); neither node was
 * "done", so the board showed the full total "on offer" and told them to "earn full 675 pts".
 */

describe("a topic in progress shows what has been banked", () => {
  it("shows earned points on the real 'while loops' node (345 of 675, not done)", () => {
    const d = journeyScoreDisplay({ earned: 345, total: 675 }, false);
    expect(d.mode).toBe("earned");
    expect(d).toMatchObject({ earned: 345, total: 675, label: "earned so far" });
  });

  it("shows earned points on the real 'for loops & range' node (759, not done)", () => {
    expect(journeyScoreDisplay({ earned: 759, total: 875 }, false).mode).toBe("earned");
  });

  it("still says 'earned' once the topic is done", () => {
    expect(journeyScoreDisplay({ earned: 675, total: 675 }, true).label).toBe("earned");
  });

  it("only offers the total when genuinely nothing has been earned", () => {
    const d = journeyScoreDisplay({ earned: 0, total: 675 }, false);
    expect(d.mode).toBe("on-offer");
    expect(d.label).toBe("on offer");
  });

  it("treats a finished topic worth zero as earned, not on offer", () => {
    expect(journeyScoreDisplay({ earned: 0, total: 0 }, true).mode).toBe("earned");
  });
});

describe("the call to action does not promise points already banked", () => {
  it("counts down the remainder once work has started", () => {
    expect(journeyAvailabilityLine({ earned: 345, total: 675 }))
      .toBe("Available now · 330 of 675 pts still to earn");
  });

  it("offers the full total only from a standing start", () => {
    expect(journeyAvailabilityLine({ earned: 0, total: 675 }))
      .toBe("Available now · earn full 675 pts");
  });

  it("never reports a negative remainder", () => {
    // Late penalties and re-attempts can push earned past the headline total.
    expect(journeyAvailabilityLine({ earned: 700, total: 675 })).toContain("0 of 675");
  });
});
