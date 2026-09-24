import { describe, expect, it } from "vitest";
import type { PointsBreakdownItem } from "@/lib/services/adaptive-course.service";
import { displayEarned, displayTopicEarned, pointsFactors } from "./pointsFactors";

type Breakdown = NonNullable<PointsBreakdownItem["breakdown"]>;
const quiz = (over: Omit<Partial<PointsBreakdownItem>, "breakdown"> & { breakdown?: Partial<Breakdown> }): PointsBreakdownItem => ({
  kind: "quiz",
  title: "Java Fundamentals & Complexity Analysis — Adaptive Quiz",
  detail: "Easy · 25 questions",
  content_key: "quiz:736",
  on_offer: 250,
  earned: 160,
  status: "earned",
  ...over,
  breakdown: {
    base: 250, after_decay: 250, correctness_factor: 0.64, late_penalty_mult: 1, weight: 1, earned_at: null,
    ...over.breakdown,
  },
});

const texts = (item: PointsBreakdownItem) => pointsFactors(item)?.factors.map((f) => f.text);

describe("quiz points card", () => {
  it("16 of 25 correct reads 250 base, 64% correct, 160 pts, 160/250", () => {
    const item = quiz({});
    expect(texts(item)).toEqual(["250 base", "64% correct"]);
    expect(pointsFactors(item)?.earned).toBe(160);
    expect(displayEarned(item)).toBe(160);
  });

  it("shows the pay for harder questions so the chips multiply out to the points", () => {
    // 12 served, 10 right, 6 of them hard at 13: 118 paid = 120 base x 1.18 x 83% correct.
    const item = quiz({ on_offer: 120, earned: 118, breakdown: { base: 120, after_decay: 120, difficulty_mult: 1.18, correctness_factor: 0.83 } });
    expect(texts(item)).toEqual(["120 base", "harder questions ×1.18", "83% correct"]);
    expect(pointsFactors(item)?.earned).toBe(118);
    // Flat rows (and rows from before the weighting) show no such chip.
    expect(texts(quiz({ breakdown: { difficulty_mult: 1 } }))).toEqual(["250 base", "64% correct"]);
  });

  it("shows the time lost when answers were slow", () => {
    // 140 paid for 16/25: after_decay x 0.64 = 140.
    const item = quiz({ earned: 140, breakdown: { after_decay: 218.75 } });
    expect(texts(item)).toEqual(["250 base", "time −31", "64% correct"]);
    expect(pointsFactors(item)?.earned).toBe(140);
  });

  it("never shows more than the maximum printed beside it (a pre-fix ledger row)", () => {
    // The reported card: "350 base › 100% correct = 350 pts" and "350/250 earned".
    const item = quiz({ earned: 350, breakdown: { base: 350, after_decay: 350, correctness_factor: 1 } });
    expect(displayEarned(item)).toBe(250);
    expect(pointsFactors(item)?.earned).toBe(250);
    expect(texts(item)?.[0]).toBe("250 base");
  });

  it("the topic total is the sum of what each row shows", () => {
    const rows = [quiz({ earned: 350 }), { ...quiz({}), content_key: "article:1", kind: "article" as const, on_offer: 25, earned: 25 }];
    expect(displayTopicEarned(rows)).toBe(275);
  });

  it("an unearned item has no chips", () => {
    expect(pointsFactors({ ...quiz({}), breakdown: undefined, status: "available", earned: 0 })).toBeNull();
  });

  it("an article has no accuracy chip; late and weight still show", () => {
    const art: PointsBreakdownItem = {
      kind: "article", title: "A", detail: "Read", content_key: "article:1", on_offer: 25, earned: 25, status: "earned",
      breakdown: { base: 25, after_decay: 25, correctness_factor: 1, late_penalty_mult: 0.5, weight: 2, earned_at: null },
    };
    expect(texts(art)).toEqual(["25 base", "late −50%", "×2 weight"]);
  });
});
