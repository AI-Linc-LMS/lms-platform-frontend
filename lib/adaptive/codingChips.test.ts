/**
 * A problem that needs something the course has not taught must say so.
 *
 * #940 decided a coding problem running ahead of the syllabus should still be SERVED and labelled,
 * because hiding it made the course's own counters and points disagree with what the learner could
 * see. It shipped `requires_upcoming` on both the learner and author payloads.
 *
 * Nothing on the client ever read it. Measured on production: 361 active problems across roughly
 * fifteen courses carried a list of techniques the course had not reached yet, and the learner was
 * shown none of it - just a problem they had no way to solve. The commonest were Sliding Window (91),
 * Hash Tables (86) and Two Pointers (78).
 */
import { describe, expect, it } from "vitest";

import { codingChips } from "./codingChips";
import type { AdaptiveCourseCodingProblemSummary } from "@/lib/services/adaptive-course.service";

const problem = (
  over: Partial<AdaptiveCourseCodingProblemSummary> = {},
): AdaptiveCourseCodingProblemSummary => ({
  problem_id: 1,
  title: "Longest Substring Without Repeating Characters",
  difficulty_level: "Medium",
  target_skills: ["Strings", "Hashing", "Optimisation"],
  ...over,
});

describe("codingChips", () => {
  it("says nothing extra when the problem is within the syllabus", () => {
    const chips = codingChips(problem());
    expect(chips.map((c) => c.text)).toEqual(["Medium", "Strings", "Hashing"]);
    expect(chips.some((c) => c.tone === "warn")).toBe(false);
  });

  it("names what the problem needs, ahead of everything else", () => {
    const chips = codingChips(problem({ requires_upcoming: ["Sliding Window"] }));
    expect(chips[0]).toEqual({
      icon: "mdi:alert-circle-outline",
      text: "Needs Sliding Window - not taught yet",
      tone: "warn",
    });
    // The difficulty and tags are still there behind it.
    expect(chips.map((c) => c.text).slice(1)).toEqual(["Medium", "Strings", "Hashing"]);
  });

  it("names two and three techniques, rather than counting them", () => {
    expect(codingChips(problem({ requires_upcoming: ["Hash Tables", "Two Pointers"] }))[0].text)
      .toBe("Needs Hash Tables and Two Pointers - not taught yet");
    expect(
      codingChips(problem({ requires_upcoming: ["Heaps", "Prefix Sums", "Graphs"] }))[0].text,
    ).toBe("Needs Heaps, Prefix Sums and Graphs - not taught yet");
  });

  it("falls back to a count past three, so the chip stays a chip", () => {
    expect(
      codingChips(
        problem({ requires_upcoming: ["Heaps", "Prefix Sums", "Graphs", "DP", "Tries"] }),
      )[0].text,
    ).toBe("Needs Heaps, Prefix Sums and 3 more - not taught yet");
  });

  it("treats an absent or empty list as nothing to warn about", () => {
    // An older backend does not send the key at all.
    for (const value of [undefined, [], null as unknown as string[]]) {
      const chips = codingChips(problem({ requires_upcoming: value }));
      expect(chips.some((c) => c.tone === "warn"), String(value)).toBe(false);
    }
  });

  it("shows at most two skill tags, as before", () => {
    expect(codingChips(problem()).filter((c) => c.icon === "mdi:tag-outline")).toHaveLength(2);
  });
});
