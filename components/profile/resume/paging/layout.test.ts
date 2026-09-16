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

describe("a second page, not smaller type", () => {
  it("shrinks every template by at most a few percent before taking another page", () => {
    // Reported after the first release: "page 2 only comes on the Technical theme; on the others,
    // if you put in more content the font size decreases". A per-template floor allowed 10% on
    // Modern and 15% on Technical, so more content bought smaller text on most templates.
    for (const px of [9.28, 9.6, 9.92, 10.0, 10.4, 11.2, 12.0]) {
      expect(legibilityFloor(px), `${px}px`).toBeGreaterThanOrEqual(ABS_MIN_SCALE);
    }
    expect(ABS_MIN_SCALE).toBeGreaterThanOrEqual(0.95);
  });

  it("still refuses to shrink a template whose type is already tiny", () => {
    expect(legibilityFloor(8)).toBe(1);
  });

  it("never allows body text below the readable minimum", () => {
    for (const px of [9, 9.6, 10, 11.2, 12, 14]) {
      const floored = px * legibilityFloor(px);
      expect(floored, `${px}px`).toBeGreaterThanOrEqual(Math.min(px, MIN_BODY_PX) - 0.001);
    }
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

  it("never shrinks a resume that already fits, however the reflow lands", () => {
    // The grow path measures again at the compensated width, and that reading can come back taller
    // than the page. Measured on LuxSleek: ink 1031px on a 1123px page, grown to 1.088, reflowed to
    // 1218 - and the old code applied 0.92, so a resume that fitted was rendered smaller.
    const layout = decideLayout(PAGE, resume(1031, 0.35), 0.97);
    expect(layout.mode).toBe("fit");
    expect(layout.scale).toBeGreaterThanOrEqual(1);
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

  it("takes the one-page option when the resume is only a line or two over", () => {
    // 1140px against a 1122.5px page: a couple of lines. Nobody wants a second sheet for that.
    const layout = decide(PAGE, resume(1140), legibilityFloor(11.2));
    expect(layout.mode).toBe("fit");
    expect(layout.scale).toBeGreaterThanOrEqual(ABS_MIN_SCALE);
  });

  it("paginates a resume that would need a visible shrink to fit", () => {
    // Technical's sample resume measured 1254px: fitting it needs 0.895, which is the shrink the
    // report was about. It takes a second page now.
    expect(decide(PAGE, resume(1254), legibilityFloor(11.2)).mode).toBe("paged");
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
