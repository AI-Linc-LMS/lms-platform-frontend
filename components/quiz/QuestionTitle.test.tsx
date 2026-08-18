import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A question stem must never be invisible.
 *
 * `titleSx.color` was `#111827` (near-black). Three of the four surfaces that render a question sit
 * on a light card, so it looked correct everywhere anyone happened to look. The fourth is the
 * calibration assessment, which is a deliberately dark surface: `bgcolor: "#0b1220"`, and its
 * question card composites to `#121927`.
 *
 * #111827 on #121927 is 1.01:1. Not "low contrast" - the same colour. Learners saw the options and
 * nothing to answer.
 */

const ROOT = path.join(__dirname, "..", "..");
const read = (rel: string) => readFileSync(path.join(ROOT, rel), "utf8");

/** WCAG relative luminance / contrast, so the assertion is a measurement rather than an opinion. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)];
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** Composite a translucent white over an opaque background, as the calibration card does. */
function over(fg: string, alpha: number, bg: string): string {
  const [f, b] = [fg.replace("#", ""), bg.replace("#", "")];
  return (
    "#" +
    [0, 2, 4]
      .map((i) => {
        const fv = parseInt(f.slice(i, i + 2), 16);
        const bv = parseInt(b.slice(i, i + 2), 16);
        return Math.round(fv * alpha + bv * (1 - alpha))
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  );
}

describe("the question stem is readable on every surface it renders on", () => {
  it("does not hardcode a colour", () => {
    const src = read("components/quiz/QuestionTitle.tsx");
    const titleSx = src.slice(src.indexOf("const titleSx"), src.indexOf("};", src.indexOf("const titleSx")));
    const colorLine = titleSx.split("\n").find((l) => /^\s*color:/.test(l)) ?? "";
    expect(
      /#[0-9a-fA-F]{3,8}|rgba?\(/.test(colorLine),
      "titleSx.color must not be a fixed colour - it renders on both light cards and the dark " +
        "calibration surface, and a fixed value is invisible on one of them.",
    ).toBe(false);
    expect(colorLine).toContain("inherit");
  });

  it("the dark calibration surface establishes a colour to inherit", () => {
    // `inherit` only works because the page sets one. If this root ever loses its colour, the stem
    // silently falls back to the theme default and the bug returns.
    const src = read("app/assessments/[slug]/calibration/page.tsx");
    expect(src).toMatch(/bgcolor:\s*"#0b1220",\s*color:\s*"white"/);
  });

  it("the colour that used to be hardcoded really was invisible there", () => {
    const card = over("#ffffff", 0.03, "#0b1220"); // the calibration question card
    expect(card).toBe("#121927");
    expect(contrast("#111827", card)).toBeLessThan(1.1); // the bug: same colour
    expect(contrast("#ffffff", card)).toBeGreaterThan(4.5); // WCAG AA, comfortably
  });

  it("the light layouts stay readable", () => {
    expect(contrast("#111827", "#ffffff")).toBeGreaterThan(4.5);
  });
});
