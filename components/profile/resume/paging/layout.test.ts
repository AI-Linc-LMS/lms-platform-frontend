import { describe, expect, it } from "vitest";
import {
  ABS_MIN_SCALE,
  decideLayout,
  GROW_BELOW,
  legibilityFloor,
  MAX_SCALE,
  MIN_BODY_PX,
  decideLayout as decide,
} from "./layout";

/**
 * Two reports decided this behaviour.
 *
 *   containment  "Resume content is not properly contained within the page in some themes, while
 *                 in other themes the page has excessive empty space."
 *   page 2       "If the contents are not coming in one page then let the user move to a second
 *                 page."
 *
 * And the rule the user gave: one page is the recommendation, not a cap, and the shrink that keeps
 * a resume on one page must not push its type below the point of being readable.
 *
 * The measurements below are the real ones, taken from the twelve templates in a browser at true
 * A4 (page = 1122.52px).
 */

const PAGE = 1122.52;

/** A resume of a fixed height, which reflows a little when the layout box changes width. */
const resume = (inkAt100: number, reflow = 0.0) => (widthPct: number) => {
  // A wider layout box means fewer lines: the ink gets shorter, never taller.
  const widthFactor = 100 / widthPct;
  return Math.round(inkAt100 * (1 - reflow * (widthFactor - 1)));
};

describe("the legibility floor follows the template's own type size", () => {
  it("lets a template with larger type shrink further, down to the hard floor", () => {
    expect(legibilityFloor(12.0)).toBe(ABS_MIN_SCALE); // Executive
    expect(legibilityFloor(11.2)).toBe(ABS_MIN_SCALE); // Technical, Creative
  });

  it("barely shrinks a template that is already set small", () => {
    expect(legibilityFloor(9.28)).toBeCloseTo(0.97, 2); // Bubble
    expect(legibilityFloor(9.6)).toBeCloseTo(0.94, 2); // TwoColumn, AccentBar
    expect(legibilityFloor(10.0)).toBeCloseTo(0.9, 2); // Modern, Classic, Minimal
  });

  it("never allows body text below the readable minimum", () => {
    for (const px of [9, 9.6, 10, 11.2, 12, 14]) {
      const floored = px * legibilityFloor(px);
      expect(floored, `${px}px`).toBeGreaterThanOrEqual(Math.min(px, MIN_BODY_PX) - 0.001);
    }
  });

  it("never grows type to reach the floor", () => {
    expect(legibilityFloor(8)).toBe(1);
  });
});

describe("one page where it can be", () => {
  it("leaves a resume that already fills the page alone", () => {
    const layout = decideLayout(PAGE, resume(PAGE - 10), 0.9);
    expect(layout).toMatchObject({ mode: "fit", scale: 1, pages: 1 });
  });

  it("grows a sparse resume to use the page instead of trailing off", () => {
    // The measured sparse fill ran from 23% (Bubble) to 37% (Executive).
    for (const fill of [0.23, 0.3, 0.37, 0.6]) {
      const layout = decideLayout(PAGE, resume(PAGE * fill), 0.9);
      expect(layout.mode).toBe("fit");
      expect(layout.scale).toBeGreaterThan(1);
      expect(layout.scale).toBeLessThanOrEqual(MAX_SCALE);
    }
  });

  it("does not nudge a nearly-full page", () => {
    expect(decideLayout(PAGE, resume(PAGE * (GROW_BELOW + 0.01)), 0.9).scale).toBe(1);
  });

  it("shrinks a resume that is a little too long, and it then fits", () => {
    const ink = PAGE * 1.06;
    const layout = decideLayout(PAGE, resume(ink), 0.9);
    expect(layout.mode).toBe("fit");
    expect(layout.scale).toBeLessThan(1);
    expect(ink * layout.scale).toBeLessThanOrEqual(PAGE + 1);
  });

  it("compensates the width of whatever it scales, so the page still covers the paper", () => {
    // An uncompensated shrink leaves a white strip down both sides - measured at 40px at 0.9 -
    // and cuts every full-height sidebar short of the page edge.
    const shrunk = decideLayout(PAGE, resume(PAGE * 1.06), 0.9);
    expect(shrunk.widthPct * shrunk.scale).toBeGreaterThan(99);
    const grown = decideLayout(PAGE, resume(PAGE * 0.4), 0.9);
    expect(grown.widthPct * grown.scale).toBeGreaterThan(99);
  });
});

describe("a second page when there is genuinely too much", () => {
  it("paginates rather than shrinking type into illegibility", () => {
    // Executive with a four-job resume measured 1866px: fitting it on one page needs 0.60.
    const layout = decideLayout(PAGE, resume(1866), legibilityFloor(12));
    expect(layout.mode).toBe("paged");
    expect(layout.scale).toBe(1);
  });

  it("never shrinks or grows a resume that is going to spill anyway", () => {
    // Shrinking a two-page resume shrinks every line AND leaves page 2 emptier.
    for (const ink of [1500, 2247, 3000]) {
      const layout = decideLayout(PAGE, resume(ink), 0.9);
      expect(layout.mode).toBe("paged");
      expect(layout.scale).toBe(1);
      expect(layout.widthPct).toBe(100);
    }
  });

  it("takes the one-page option when a small shrink is enough, on the same measurements", () => {
    // Technical's sample resume measured 1254px and fits at 0.895, above its 0.85 floor.
    const layout = decide(PAGE, resume(1254), legibilityFloor(11.2));
    expect(layout.mode).toBe("fit");
    expect(layout.scale).toBeGreaterThanOrEqual(ABS_MIN_SCALE);
  });

  it("decides from the resume, never from the size of the window it is viewed in", () => {
    // The whole of "except luxsleek, on every theme the contents are going out": the old code
    // measured the page after the preview had shrunk it to fit the screen, so the same resume got
    // a different scale at every window width. The decision now takes measurements only.
    const ink = 1254;
    const floor = legibilityFloor(11.2);
    const first = decideLayout(PAGE, resume(ink), floor);
    for (let i = 0; i < 5; i += 1) {
      expect(decideLayout(PAGE, resume(ink), floor)).toEqual(first);
    }
  });

  it("handles an unmeasured document without dividing by zero", () => {
    expect(decideLayout(PAGE, () => 0, 0.9)).toMatchObject({ mode: "fit", scale: 1 });
  });
});
