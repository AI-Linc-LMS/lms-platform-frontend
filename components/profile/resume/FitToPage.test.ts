import { describe, expect, it } from "vitest";
import {
  computeFitScale,
  PAGE_HEIGHT_PX,
  MIN_SCALE,
  MAX_SCALE,
  GROW_BELOW,
} from "./FitToPage";

/**
 * Reported: "Resume content is not properly contained within the page in some themes, while
 * in other themes the page has excessive empty space and does not use the available area."
 *
 * Both halves, measured in a headless browser at true A4 width with the page's own box-sizing:
 *
 *   containment  Technical rendered 1291px against a 1123px page - 168px of the learner's
 *                own resume was not drawn, and the PDF export captures the same box.
 *   empty space  Ink coverage on a sparse resume ran 29% (LuxSleek) to 60% (Technical).
 *                Every template is a fixed 297mm box, so short content just trails off.
 */

describe("an over-long resume is shrunk instead of cut off", () => {
  it("scales the measured Technical overflow (1291px) down to the page", () => {
    const s = computeFitScale(1291);
    expect(s).toBeLessThan(1);
    expect(1291 * s).toBeLessThanOrEqual(PAGE_HEIGHT_PX + 0.5);
  });

  it("never shrinks below the readability floor", () => {
    expect(computeFitScale(5000)).toBe(MIN_SCALE);
  });
});

describe("a short resume grows to use the page", () => {
  it("grows the real sparse-resume measurements rather than leaving them stranded", () => {
    // Measured ink heights for the thin variant: LuxSleek 29%, Bubble 30%, TwoColumn 34%.
    for (const pct of [0.29, 0.3, 0.34, 0.6]) {
      expect(computeFitScale(PAGE_HEIGHT_PX * pct)).toBeGreaterThan(1);
    }
  });

  it("never grows past the cap, however empty the page", () => {
    // A three-line resume must look sparse, not like a poster.
    expect(computeFitScale(50)).toBe(MAX_SCALE);
    expect(computeFitScale(PAGE_HEIGHT_PX * 0.1)).toBe(MAX_SCALE);
  });

  it("leaves a nearly-full page alone", () => {
    // Nudging 95% up to 100% buys nothing and risks pushing it over.
    expect(computeFitScale(PAGE_HEIGHT_PX * 0.95)).toBe(1);
    expect(computeFitScale(PAGE_HEIGHT_PX * (GROW_BELOW + 0.01))).toBe(1);
  });

  it("grows just below the threshold", () => {
    expect(computeFitScale(PAGE_HEIGHT_PX * (GROW_BELOW - 0.01))).toBeGreaterThan(1);
  });
});

describe("the page is never overflowed in either direction", () => {
  it("keeps every scaled height inside one page", () => {
    for (let h = 100; h <= 2000; h += 50) {
      const s = computeFitScale(h);
      // MIN_SCALE is a deliberate floor: past it a pathological resume clips rather than
      // becoming unreadable, so exclude only that case.
      if (s > MIN_SCALE) {
        expect(h * s).toBeLessThanOrEqual(PAGE_HEIGHT_PX + 1);
      }
    }
  });

  it("is exactly one page at exactly one page", () => {
    expect(computeFitScale(PAGE_HEIGHT_PX)).toBe(1);
  });

  it("ignores sub-pixel overflow rather than scaling for rounding", () => {
    expect(computeFitScale(PAGE_HEIGHT_PX + 1)).toBe(1);
  });

  it("handles an unmeasured element without dividing by zero", () => {
    expect(computeFitScale(0)).toBe(1);
  });
});
