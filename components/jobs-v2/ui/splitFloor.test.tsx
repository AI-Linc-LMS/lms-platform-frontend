/**
 * The split can never collapse to a sliver the page cannot scroll past.
 *
 * Reported as "after applying a job filter, the page stops scrolling properly, and removing the
 * filter does not restore the page scrolling". Measured on demo at 1366x640: the board's header,
 * tabs and filter card put the split's top at 567px, so its height —
 * `calc(100dvh - var(--j-split-top) - 16px)` — was 57px. Applying one filter adds the active
 * chip row and the "N of M" summary, moving the top to 617px and the rail to **6px**. The
 * wrapper clips (`overflow: hidden`) and is exactly as tall as the space left under the header,
 * so the document itself could only scroll 16px: nothing on the page moved. Clearing the filter
 * gave back 57px, which is why scrolling never appeared to come back.
 *
 * jsdom computes no layout, but MUI's `sx` breakpoints are emitted as real CSS, so the DECLARED
 * height at 1440px is readable — and the arithmetic in it can be evaluated for the viewport that
 * broke. That is what these tests do.
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DESKTOP, PHONE, styleAt } from "../responsiveSx.testutil";
import { JobsSplitLayout, SPLIT_MIN_H } from "./Split";

function renderSplit() {
  const { container } = render(
    <JobsSplitLayout
      rail={<div>rail</div>}
      pane={<div>pane</div>}
      showBelowLg="rail"
      railLabel="Job results"
      paneLabel="Job posting"
    />,
  );
  const rail = container.querySelector("[data-jobs-rail]")!;
  return rail.parentElement!;
}

/**
 * Resolve the declared height for one real viewport. Understands only the two forms this
 * component has ever emitted: a bare `calc(100dvh - var(--j-split-top) - Npx)` and that same
 * calc inside a `max(Mpx, …)`.
 */
function resolve(css: string, viewportH: number, splitTop: number): number {
  const calc = /calc\(100dvh\s*-\s*var\(--j-split-top\)\s*-\s*(\d+)px\)/.exec(css);
  expect(calc, `unrecognised height declaration: ${css}`).not.toBeNull();
  const natural = viewportH - splitTop - Number(calc![1]);
  const floor = /max\(\s*(\d+)px/.exec(css);
  return floor ? Math.max(Number(floor[1]), natural) : natural;
}

describe("the split's height at lg+", () => {
  it("never resolves below the floor on the viewport that broke", () => {
    const css = styleAt(renderSplit(), DESKTOP, "height")!;
    // 1366x640, one filter applied: the exact numbers measured on demo.
    expect(resolve(css, 640, 617)).toBeGreaterThanOrEqual(SPLIT_MIN_H);
    // And unfiltered on the same screen, which was already only 57px.
    expect(resolve(css, 640, 567)).toBeGreaterThanOrEqual(SPLIT_MIN_H);
    // A short laptop window, filtered.
    expect(resolve(css, 768, 617)).toBeGreaterThanOrEqual(SPLIT_MIN_H);
  });

  it("still fits the viewport exactly when there is room for it", () => {
    const css = styleAt(renderSplit(), DESKTOP, "height")!;
    // A tall screen: the natural height wins and the instrument is unchanged.
    expect(resolve(css, 1200, 567)).toBe(1200 - 567 - 16);
  });

  it("leaves the phone an ordinary block, with no nested scroller", () => {
    const grid = renderSplit();
    expect(styleAt(grid, PHONE, "height")).toBe("auto");
    expect(styleAt(grid, PHONE, "overflow")).toBe("visible");
    expect(styleAt(grid, PHONE, "display")).toBe("block");
  });
});
