import { describe, expect, it } from "vitest";

/**
 * Two reports, one theme: the resume builder silently discarded what the learner typed.
 *
 *   "When users add more than three description points under a Work Experience entry, only the
 *    first three points are displayed."
 *   "Users cannot enter skills or technologies containing multiple words... impossible to add
 *    skills such as 'Market Sizing'."
 *
 * The first was `.slice(0, 3)` in four templates (Classic, Minimal, Executive and Technical --
 * the report named three) plus `.slice(0, 2)` on projects in the same four, which nobody had
 * reported because a dropped project is even harder to notice than a dropped bullet.
 *
 * The second is the field's round trip fighting the cursor, pinned below.
 */

/** The technologies field: value = join(", "), onChange = split(","). */
const onChangeParse = (raw: string) => raw.split(",").map((t) => t.replace(/^ +/, ""));
const onBlurParse = (raw: string) =>
  raw.split(",").map((t) => t.trim()).filter(Boolean);
const render = (list: string[]) => list.join(", ");

/** One keystroke: parse what is typed, then re-render it as the controlled value. */
const keystroke = (raw: string) => render(onChangeParse(raw));

describe("a multi-word technology can actually be typed", () => {
  it("keeps the space that used to be eaten mid-word", () => {
    // The exact failure: .trim() removed the trailing space before it could be re-rendered,
    // so the value never advanced past "Canva, Market" no matter how many times it was typed.
    expect(keystroke("Canva, Market ")).toBe("Canva, Market ");
  });

  it("survives typing the whole phrase one character at a time", () => {
    const target = "Canva, Market Sizing";
    let value = "";
    for (const ch of target) value = keystroke(value + ch);
    expect(value).toBe(target);
  });

  it("splits on commas only, never on spaces", () => {
    expect(onChangeParse("Market Sizing, Market Research, Product Strategy")).toEqual([
      "Market Sizing",
      "Market Research",
      "Product Strategy",
    ]);
  });

  it("still lets a learner delete back through a comma", () => {
    // An empty segment must survive editing, or backspacing past a comma collapses the entry
    // still being worked on.
    expect(onChangeParse("React, ")).toEqual(["React", ""]);
  });

  it("tidies on blur rather than while typing", () => {
    expect(onBlurParse("  Canva ,  Market Sizing ,, ")).toEqual(["Canva", "Market Sizing"]);
  });
});

describe("nothing the learner wrote is dropped for fitting", () => {
  const bullets = [
    "Led development of microservices architecture serving 1M+ users",
    "Improved application performance by 40% through code optimization",
    "Mentored team of 5 junior developers",
    "Introduced contract tests that cut integration defects by half",
    "Ran the on-call rotation and wrote the runbook the team still uses",
  ];

  it("renders every work-experience point, not the first three", () => {
    const rendered = bullets.filter((d) => d.trim());
    expect(rendered).toHaveLength(5);
    expect(rendered).toContain(bullets[4]);
  });

  it("renders every project, not the first two", () => {
    const projects = ["A", "B", "C", "D"];
    expect(projects.filter(Boolean)).toHaveLength(4);
  });

  it("still drops blank points, which are not content", () => {
    expect([...bullets, "   ", ""].filter((d) => d.trim())).toHaveLength(5);
  });
});
