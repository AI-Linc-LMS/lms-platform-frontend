import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FitToPage, MAX_SCALE, PAGE_HEIGHT_PX } from "./FitToPage";

/**
 * Reported twice, the second time as "earlier we fixed it but the fix is not working":
 * "Except for luxsleek, on every theme the contents are going out."
 *
 * The preview shrinks the whole A4 box so it fits the screen, and FitToPage measured the resume
 * with getBoundingClientRect, which reports SCREEN pixels. So every reading came back multiplied
 * by that shrink. Measured on the live site at 1366px wide (shrink 0.8), a resume 1404px tall
 * read as 1123 and looked exactly full: Classic was GROWN to 1.235 and 18 lines of the learner's
 * own resume were hidden. 159 lines were hidden at 1000px wide.
 *
 * The fix divides the reading by the shrink, so the scale depends on the resume and not on the
 * width of the window it is being looked at in. That invariant is what these tests pin: the same
 * content must produce the same scale at every screen size.
 *
 * jsdom does no layout, so the geometry is stubbed - deliberately in SCREEN px, the way a browser
 * reports it, which is exactly the trap the code fell into.
 */

const PAGE_WIDTH_PX = 794;
const INK_TAG = "P";

let screenScale = 1;
let trueInk = PAGE_HEIGHT_PX;

const realRect = HTMLElement.prototype.getBoundingClientRect;
const realComputedStyle = window.getComputedStyle;

function stubLayout() {
  // The computed width is the LAYOUT width: a transform never changes it. That is what makes it
  // usable as the reference the screen width is divided by. jsdom does no layout and returns "",
  // so the page's own width is supplied here; everything else is the real computed style, which
  // the ink measurement reads for visibility.
  window.getComputedStyle = ((el: Element, pseudo?: string | null) => {
    const cs = realComputedStyle(el, pseudo);
    return new Proxy(cs, {
      get(target, prop) {
        if (prop === "width") return `${PAGE_WIDTH_PX}px`;
        const value = Reflect.get(target, prop, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  }) as typeof window.getComputedStyle;
  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    const bottom = (this.tagName === INK_TAG ? trueInk : PAGE_HEIGHT_PX) * screenScale;
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: PAGE_WIDTH_PX * screenScale,
      bottom,
      width: PAGE_WIDTH_PX * screenScale,
      height: bottom,
      toJSON: () => ({}),
    } as DOMRect;
  };
}

afterEach(() => {
  HTMLElement.prototype.getBoundingClientRect = realRect;
  window.getComputedStyle = realComputedStyle;
});

/** Mount a resume of `ink` layout px, looked at on a screen that shrinks the page by `scale`. */
function appliedScale(ink: number, scale: number): number {
  trueInk = ink;
  screenScale = scale;
  stubLayout();
  const { container } = render(
    <FitToPage>
      <p>a line of the learner&apos;s resume</p>
    </FitToPage>,
  );
  const inner = container.querySelector("[data-resume-fit] > div") as HTMLElement;
  const match = /scale\(([\d.]+)\)/.exec(inner.style.transform || "");
  return match ? Number(match[1]) : 1;
}

/** The four steps the preview used to apply, plus an unscaled page. */
const SCREEN_SCALES = [1, 0.95, 0.8, 0.55, 0.4];

describe("the fit does not depend on the size of the window", () => {
  it("shrinks an over-long resume at every screen size", () => {
    // 1404px is the real measurement: every over-long resume ended at exactly 1404px on a
    // 1200-1535px viewport, because the code was fitting ink to 1123/0.8.
    for (const screen of SCREEN_SCALES) {
      const k = appliedScale(1404, screen);
      expect(k, `screen scale ${screen}`).toBeLessThan(1);
      expect(1404 * k).toBeLessThanOrEqual(PAGE_HEIGHT_PX + 1);
    }
  });

  it("never grows a page that is already full, which is how text was pushed off it", () => {
    // The exact prod failure: Classic at 1366px was grown to 1.235 with 18 lines hidden.
    for (const screen of SCREEN_SCALES) {
      expect(appliedScale(1404, screen), `screen scale ${screen}`).toBeLessThan(1);
    }
  });

  it("gives one resume one scale, whatever it is viewed on", () => {
    for (const ink of [520, 900, 1100, 1404, 2200]) {
      const scales = SCREEN_SCALES.map((s) => appliedScale(ink, s));
      for (const k of scales) {
        expect(k, `ink ${ink}: ${scales.join(", ")}`).toBeCloseTo(scales[0], 5);
      }
    }
  });

  it("still grows a sparse resume to use the page", () => {
    for (const screen of SCREEN_SCALES) {
      expect(appliedScale(400, screen), `screen scale ${screen}`).toBe(MAX_SCALE);
    }
  });

  it("leaves a resume that already fits alone", () => {
    for (const screen of SCREEN_SCALES) {
      expect(appliedScale(PAGE_HEIGHT_PX, screen), `screen scale ${screen}`).toBe(1);
    }
  });
});
