import { describe, expect, it } from "vitest";
import { computeFitScale, PAGE_HEIGHT_PX, MIN_SCALE } from "./FitToPage";

/**
 * Reported: "Resume content is not properly contained within the page in some themes."
 *
 * The page box sets overflow:hidden, so a template taller than 297mm was silently CUT OFF.
 * Measured in a headless browser against the sample resume, at true A4 width and with the
 * same box-sizing the page applies: Technical rendered 1291px against a 1123px page - 168px
 * of the learner's own resume simply not drawn. Executive overran by 4px. The rest fit.
 */

describe("an over-long resume is shrunk instead of cut off", () => {
  it("scales the measured Technical overflow (1291px) down to the page", () => {
    const s = computeFitScale(1291);
    expect(s).toBeLessThan(1);
    expect(1291 * s).toBeLessThanOrEqual(PAGE_HEIGHT_PX + 0.5);
    expect(s).toBeCloseTo(1123 / 1291, 3); // ~0.87, the scale the browser actually applied
  });

  it("never shrinks below the readability floor", () => {
    // A pathologically long resume must not become unreadable; it clips instead.
    expect(computeFitScale(5000)).toBe(MIN_SCALE);
  });
});

describe("a resume that already fits is left completely alone", () => {
  it("is a no-op at exactly one page", () => {
    expect(computeFitScale(PAGE_HEIGHT_PX)).toBe(1);
  });

  it("is a no-op for every template measured as fitting", () => {
    // Real measured heights, all templates except Technical.
    for (const h of [835, 868, 823, 1103, 989, 952, 723, 646, 527]) {
      expect(computeFitScale(h)).toBe(1);
    }
  });

  it("ignores sub-pixel overflow rather than scaling for rounding", () => {
    expect(computeFitScale(PAGE_HEIGHT_PX + 1)).toBe(1);
  });

  it("handles an unmeasured element without dividing by zero", () => {
    expect(computeFitScale(0)).toBe(1);
  });
});
