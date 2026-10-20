/**
 * The side rail sticks, and the three things that make it stick stay joined up.
 *
 * On a long course the spine scrolls for several screens while the rail - progress, leaderboard -
 * stays at the top, leaving an empty gutter beside most of the page. `position: sticky` alone
 * does NOT fix that here, and the reason is invisible from the component:
 *
 *   The app shell wraps every page in boxes carrying `overflow: auto`. That is deliberate and
 *   load-bearing - dropping it is what forced the #1148 revert. But any `overflow` other than
 *   `visible` makes an element a scroll container, and a sticky child is offset against its
 *   NEAREST scroll container. Those boxes are auto-height, so they never scroll, so a sticky
 *   child of them never sticks. Measured in Chromium on this exact geometry: the rail scrolled
 *   away to -820px instead of holding at 80px; with the columns `visible` it held at 80px.
 *
 * So the mechanism spans three files, and a change to any one of them silently un-sticks the
 * rail with nothing failing. jsdom implements neither `:has()` nor sticky layout, so there is
 * no DOM assertion that can stand in for this - the invariant is checked where it lives.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = join(__dirname, "..", "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");

describe("the sticky side rail", () => {
  it("marks the rail with the attribute the stylesheet keys on", () => {
    const board = read("components/adaptive-journey/JourneyBoard.tsx");
    expect(board).toContain("data-sticky-rail");
    // Sticky only from `lg`, where the rail is its own column; below that it follows the weeks.
    expect(board).toMatch(/position:\s*\{\s*lg:\s*"sticky"\s*\}/);
    // A grid item stretches to the row height by default, and a full-height item has nothing
    // to stick within.
    expect(board).toMatch(/alignSelf:\s*\{\s*lg:\s*"start"\s*\}/);
  });

  it("relaxes the shell's scroll columns, and only on a page that has such a rail", () => {
    const css = read("app/globals.css");
    expect(css).toContain("body:has([data-sticky-rail]) .app-scroll-column");
    // Scoped by the `body:has(...)`: every other route keeps `overflow: auto` untouched.
    const rule = css.slice(css.indexOf("body:has([data-sticky-rail])"));
    expect(rule.slice(0, 120)).toContain("overflow: visible");
  });

  it("keeps the class on every scroll column between the page and the viewport", () => {
    // Three of them on the live path: AppChrome's row, AppChrome's <main>, and the per-page
    // content column. Miss one and it is still a scroll container, and the rail stops sticking.
    const chrome = read("components/layout/AppChrome.tsx");
    const layout = read("components/layout/MainLayout.tsx");
    const count = (s: string) => s.split('className="app-scroll-column"').length - 1;
    expect(count(chrome), "AppChrome scroll columns").toBeGreaterThanOrEqual(2);
    expect(count(layout), "MainLayout scroll columns").toBeGreaterThanOrEqual(2);
  });
});
