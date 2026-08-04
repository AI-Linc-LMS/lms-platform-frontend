import { describe, expect, it } from "vitest";

import { parseCourseBrief } from "./course-brief";

describe("parseCourseBrief", () => {
  it("reads the exact brief that was reported broken", () => {
    // "1 week, no coding" landed on a form with duration 4 and 54 coding problems promised.
    const p = parseCourseBrief("1-week System Design refresher · short articles, no coding");
    expect(p.durationWeeks).toBe(1);
    expect(p.title).toBe("System Design");
    expect(p.contentTypes).not.toContain("coding");
    expect(p.understood).toContain("no coding");
  });

  it("fills the title, which is required and was left empty", () => {
    // An empty title left Generate disabled — the composer handed you a form you could not submit.
    expect(parseCourseBrief("8-week Python for absolute beginners").title).toBe("Python");
  });

  it("keeps the writer's own capitalisation", () => {
    // The point is that "SQL" survives as "SQL" and does not become "Sql For Analysts".
    // Keeping the audience ("for analysts") is deliberate — it makes a better course title
    // than the bare subject, and audiences are not something worth trying to enumerate.
    const title = parseCourseBrief("6-week SQL for analysts").title;
    expect(title).toBe("SQL for analysts");
    expect(title).not.toBe("Sql For Analysts");
  });

  it("title-cases a brief written entirely in lower case", () => {
    expect(parseCourseBrief("8-week python basics").title).toBe("Python Basics");
  });

  it("turns each composer example chip into a usable form", () => {
    const chips = [
      "8-week Python for absolute beginners · article + quiz per topic",
      "6-week SQL for analysts · heavy on practice problems",
      "4-week Excel refresher · short articles, no coding",
    ];
    for (const chip of chips) {
      const p = parseCourseBrief(chip);
      expect(p.title).toBeTruthy();
      expect(p.durationWeeks).toBeGreaterThan(0);
    }
  });

  it("adds coding when the brief asks for practice", () => {
    expect(parseCourseBrief("6-week SQL · heavy on practice problems").contentTypes)
      .toContain("coding");
  });

  it("leaves the defaults alone when the brief says nothing about content", () => {
    // Silently narrowing what an admin gets, because they did not mention videos, would be
    // worse than not parsing at all.
    expect(parseCourseBrief("8-week Python").contentTypes).toBeNull();
  });

  it("never invents a duration", () => {
    expect(parseCourseBrief("a course about Python").durationWeeks).toBeNull();
  });

  it("ignores an absurd duration rather than passing it to the form", () => {
    expect(parseCourseBrief("400-week Python").durationWeeks).toBeNull();
  });

  it("keeps the whole brief as the description", () => {
    const brief = "4-week Excel refresher · short articles, no coding";
    expect(parseCourseBrief(brief).description).toBe(brief);
  });

  it("survives an empty or junk brief", () => {
    for (const junk of ["", "   ", "!!!"]) {
      const p = parseCourseBrief(junk);
      expect(p.durationWeeks).toBeNull();
      expect(() => p.understood.join()).not.toThrow();
    }
  });
});
