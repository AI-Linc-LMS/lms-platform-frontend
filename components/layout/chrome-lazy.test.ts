import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The chrome shell is ~2,700 lines of AppBar + Sidebar that a chromeless route never renders:
 * /login, /signup, the public credential pages, the assessment runner. It shipped to all of them
 * because AppChrome imported the leaves statically.
 *
 * The obvious fix — make the whole ChromeShell `dynamic()` — was tried and reverted. It delays
 * ChromeProvider by a tick, so MainLayout renders its full non-nested layout and then collapses:
 * the jobs-board suite went from 43 passing in 35s to 2 timeouts in 142s. It is also the shape
 * that forced the #1148 production revert, where the Box geometry disappeared and no ancestor
 * was a scroll container any more.
 *
 * So the invariant is narrow and worth pinning: the LEAVES are lazy, the PROVIDER and the
 * GEOMETRY are not.
 */
const src = () =>
  readFileSync(join(process.cwd(), "components/layout/AppChrome.tsx"), "utf8");

describe("the chrome leaves load on demand", () => {
  it.each(["./AppBar", "./Sidebar", "./BottomNavigation",
           "StreakCelebrationOverlay", "ReportIssueFAB"])(
    "%s is behind a dynamic import", (mod) => {
      const s = src();
      const staticImports = s.split("\n").filter((l) => l.startsWith("import "));
      expect(staticImports.join("\n"), `${mod} must not be statically imported`)
        .not.toContain(mod);
      expect(s, `${mod} must be loaded via next/dynamic`).toMatch(
        new RegExp(`dynamic\\([\\s\\S]{0,80}${mod.replace("./", "\\./")}`),
      );
    });

  it("the drawer width comes from its own module, not from Sidebar", () => {
    // Importing the number from Sidebar.tsx is what dragged 1,460 lines back in.
    const staticImports = src().split("\n").filter((l) => l.startsWith("import "));
    expect(staticImports.join("\n")).toContain("./chromeMetrics");
    expect(staticImports.join("\n")).not.toMatch(/DRAWER_WIDTH.*from "\.\/Sidebar"/);
  });
});

describe("the provider and the geometry stay synchronous", () => {
  it("ChromeProvider is a static import", () => {
    const staticImports = src().split("\n").filter((l) => l.startsWith("import "));
    expect(staticImports.join("\n"),
      "a lazy ChromeProvider makes MainLayout render its full layout then collapse")
      .toContain("./ChromeContext");
  });

  it("ChromeShell itself is NOT dynamic", () => {
    expect(src()).not.toMatch(/dynamic\([^)]*ChromeShell/);
  });

  it("the scroll-container geometry is still declared inline", () => {
    // Dropping `overflow`/`height` here is the exact #1148 bug: content past the viewport
    // became unreachable because nothing was a scroll container.
    const s = src();
    expect(s).toContain('overflow: "auto"');
    expect(s).toContain("DRAWER_WIDTH");
  });
});
