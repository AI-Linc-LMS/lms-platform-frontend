import { describe, expect, it } from "vitest";
import {
  describeSectionCount,
  discardWarning,
  sectionCounts,
  totalDiscarded,
} from "./sectionServedCount";

/**
 * Assessment 879 ("Plants") in prod: a section configured for 8 with 10 in the bank.
 * The overview header read "8 Questions" and the section row under it read "10
 * questions". The one submission on it was served 8 MCQ ids; ids 186548 and 186555
 * were never shown. Prod-wide, 380 sections were dropping 10,944 questions this way.
 */

describe("the reported case: 8 configured, 10 in the bank", () => {
  const c = sectionCounts(8, 10);

  it("serves the configured count", () => {
    expect(c.served).toBe(8);
  });

  it("reports the 2 that never get shown", () => {
    expect(c.discarded).toBe(2);
  });

  it("says so in the section row instead of printing a bare 10", () => {
    expect(describeSectionCount(c)).toBe("8 of 10 drawn per attempt");
  });

  it("warns before publishing, naming the count and the randomness", () => {
    const w = discardWarning([c]);
    expect(w).toContain("8 of the 10");
    expect(w).toContain("2 questions");
    expect(w).toMatch(/random/i);
  });
});

describe("a section that is not sampling stays as it was", () => {
  it("shows a plain count when the bank matches the configured number", () => {
    expect(describeSectionCount(sectionCounts(12, 12))).toBe("12 questions");
  });

  it("shows a plain count when no number is configured", () => {
    expect(describeSectionCount(sectionCounts(null, 7))).toBe("7 questions");
  });

  it("singularises", () => {
    expect(describeSectionCount(sectionCounts(null, 1))).toBe("1 question");
  });

  it("raises no publish warning", () => {
    expect(discardWarning([sectionCounts(12, 12), sectionCounts(null, 7)])).toBeNull();
  });
});

describe("asking for more than the bank holds", () => {
  // The other direction of the same lie: the header advertised the ask, not the pool.
  const c = sectionCounts(50, 10);

  it("cannot serve more than exists", () => {
    expect(c.served).toBe(10);
  });

  it("discards nothing - there is nothing left over", () => {
    expect(c.discarded).toBe(0);
  });

  it("does not warn about questions that were never there", () => {
    expect(discardWarning([c])).toBeNull();
  });
});

describe("rolled up across sections", () => {
  const all = [sectionCounts(8, 10), sectionCounts(5, 25), sectionCounts(4, 4)];

  it("totals what is left out", () => {
    expect(totalDiscarded(all)).toBe(22);
  });

  it("counts only the sections actually dropping questions", () => {
    expect(discardWarning(all)).toContain("2 sections");
  });

  it("reports served and bank totals", () => {
    expect(discardWarning(all)).toContain("17 of the 39");
  });
});

describe("degenerate input does not produce nonsense", () => {
  it("handles an empty bank", () => {
    expect(sectionCounts(8, 0)).toEqual({ served: 0, pool: 0, discarded: 0 });
  });

  it("ignores a negative or non-finite pool", () => {
    expect(sectionCounts(8, -3).pool).toBe(0);
    expect(sectionCounts(8, Number.NaN).pool).toBe(0);
  });

  it("treats a zero configured count as unset", () => {
    expect(sectionCounts(0, 9).served).toBe(9);
  });
});
