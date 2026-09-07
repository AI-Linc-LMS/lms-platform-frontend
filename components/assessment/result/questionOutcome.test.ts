import { describe, expect, it } from "vitest";
import { isUnanswered, questionOutcome, OUTCOME_STYLE } from "./questionOutcome";

/**
 * Reported: the evaluation page should show what was answered incorrectly.
 *
 * Part of that was already built - the correct answer, the learner's answer and the
 * explanation all render. What did not exist was any distinction between a question answered
 * WRONGLY and one never answered at all: the badge asked `is_correct ? tick : cross`, so a
 * skipped question drew a red cross.
 *
 * In production 44,993 of 635,733 submitted MCQ answers are blank, across 2,902 submissions.
 */

describe("a question nobody answered is not a wrong answer", () => {
  it("treats a blank string as unanswered", () => {
    // How the response sheet actually stores a skipped MCQ.
    expect(questionOutcome("", false)).toBe("unanswered");
  });

  it("treats whitespace as unanswered", () => {
    expect(questionOutcome("   ", false)).toBe("unanswered");
  });

  it("treats null and undefined as unanswered", () => {
    expect(questionOutcome(null, false)).toBe("unanswered");
    expect(questionOutcome(undefined, false)).toBe("unanswered");
  });

  it("treats an empty multi-select as unanswered", () => {
    expect(questionOutcome([], false)).toBe("unanswered");
    expect(questionOutcome(["", "  "], false)).toBe("unanswered");
  });

  it("wins even when the API also says is_correct false", () => {
    // The exact shape that used to render as a wrong answer.
    expect(questionOutcome("", false)).toBe("unanswered");
  });
});

describe("a real answer is still judged on its merits", () => {
  it("keeps correct and incorrect intact", () => {
    expect(questionOutcome("b", true)).toBe("correct");
    expect(questionOutcome("b", false)).toBe("incorrect");
    expect(questionOutcome(["a", "c"], true)).toBe("correct");
  });

  it("does not mistake option zero for a skip", () => {
    // "0" is a legitimate option; treating it as blank would erase a real answer.
    expect(isUnanswered("0")).toBe(false);
    expect(questionOutcome("0", false)).toBe("incorrect");
  });

  it("does not mistake the letter a for a skip", () => {
    expect(questionOutcome("a", true)).toBe("correct");
  });
});

describe("the three outcomes read differently", () => {
  it("gives unanswered its own neutral badge rather than the error colour", () => {
    expect(OUTCOME_STYLE.unanswered.label).toBe("Not answered");
    expect(OUTCOME_STYLE.unanswered.color).not.toBe(OUTCOME_STYLE.incorrect.color);
    expect(OUTCOME_STYLE.unanswered.icon).not.toBe(OUTCOME_STYLE.incorrect.icon);
  });
});
