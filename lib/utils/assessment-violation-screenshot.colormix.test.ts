// @vitest-environment jsdom
/**
 * 30,901 violation screenshots in prod are the placeholder image. 7 are real captures.
 *
 * html2canvas 1.4.1 cannot parse the CSS Color 4 `color()` function, and getComputedStyle
 * resolves every one of the app's 66 `color-mix()` declarations to `color(srgb ...)`. So on any
 * page carrying those design tokens - which is every page - the capture threw immediately and
 * the code fell back to a 320x180 JPEG reading "Full-page capture unavailable (browser)".
 *
 * Proven in headless Chromium against real html2canvas before the fix was written: it throws on
 * color-mix in background, colour or border; it does not throw when the color-mix sits outside
 * the captured subtree; and with this rewrite applied in onclone it returns a real image.
 *
 * jsdom cannot resolve color-mix() itself, so these tests drive the rewrite through an explicit
 * computed-style stub. What they pin is the part that was wrong: the conversion, and the fact
 * that the rewrite is applied to every element rather than only the root.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { sanitizeUnsupportedColorFunctions } from "./assessment-violation-screenshot.utils";

/** Stub getComputedStyle so a given element reports the resolved color() the browser would. */
function stubComputedStyles(doc: Document, byElement: Map<Element, Record<string, string>>) {
  const view = doc.defaultView as Window & typeof globalThis;
  vi.spyOn(view, "getComputedStyle").mockImplementation(
    ((el: Element) =>
      ({ ...(byElement.get(el) ?? {}) }) as unknown as CSSStyleDeclaration) as typeof view.getComputedStyle,
  );
}

describe("sanitizeUnsupportedColorFunctions", () => {
  let doc: Document;

  beforeEach(() => {
    vi.restoreAllMocks();
    doc = document.implementation.createHTMLDocument("clone");
    doc.body.innerHTML = `<div id="a"><span id="b">x</span></div><p id="c">y</p>`;
    Object.defineProperty(doc, "defaultView", { value: window, configurable: true });
  });

  it("rewrites a resolved color() background to rgba", () => {
    const a = doc.getElementById("a")!;
    stubComputedStyles(doc, new Map([[a, { backgroundColor: "color(srgb 0.4 0.4 0.9 / 0.12)" }]]));

    expect(sanitizeUnsupportedColorFunctions(doc)).toBe(1);
    expect(a.style.backgroundColor.replace(/\s/g, "")).toBe("rgba(102,102,230,0.12)");
  });

  it("defaults alpha to 1 when the color() carries none", () => {
    const a = doc.getElementById("a")!;
    stubComputedStyles(doc, new Map([[a, { color: "color(srgb 1 0 0)" }]]));

    sanitizeUnsupportedColorFunctions(doc);
    // The CSSOM canonicalises a fully opaque rgba() back to rgb(), so assert the colour
    // rather than the spelling - both forms are the same opaque red.
    expect(a.style.color.replace(/\s/g, "")).toMatch(/^rgba?\(255,0,0(,1)?\)$/);
  });

  it("reads a percentage alpha as a fraction", () => {
    const a = doc.getElementById("a")!;
    stubComputedStyles(doc, new Map([[a, { backgroundColor: "color(srgb 0 0 0 / 50%)" }]]));

    sanitizeUnsupportedColorFunctions(doc);
    expect(a.style.backgroundColor.replace(/\s/g, "")).toBe("rgba(0,0,0,0.5)");
  });

  it("walks EVERY element, not just the root", () => {
    // The throw comes from whichever element html2canvas reaches first, so a root-only fix
    // would still abort on a nested chip - which is exactly where these tokens are used.
    const [a, b, c] = ["a", "b", "c"].map((id) => doc.getElementById(id)!);
    stubComputedStyles(
      doc,
      new Map([
        [a, { backgroundColor: "color(srgb 0.1 0.1 0.1)" }],
        [b, { color: "color(srgb 0.2 0.2 0.2)" }],
        [c, { borderTopColor: "color(srgb 0.3 0.3 0.3)" }],
      ]),
    );

    expect(sanitizeUnsupportedColorFunctions(doc)).toBe(3);
    expect(b.style.color).not.toBe("");
    expect(c.style.borderTopColor).not.toBe("");
  });

  it("leaves ordinary colours untouched", () => {
    const a = doc.getElementById("a")!;
    stubComputedStyles(doc, new Map([[a, { backgroundColor: "rgb(1, 2, 3)", color: "#fff" }]]));

    expect(sanitizeUnsupportedColorFunctions(doc)).toBe(0);
    expect(a.getAttribute("style")).toBeNull();
  });

  it("rewrites a color() embedded in a gradient rather than dropping the gradient", () => {
    const a = doc.getElementById("a")!;
    stubComputedStyles(
      doc,
      new Map([[a, { backgroundImage: "linear-gradient(color(srgb 1 1 1 / 0.5), rgb(0, 0, 0))" }]]),
    );

    sanitizeUnsupportedColorFunctions(doc);
    expect(a.style.backgroundImage).toContain("rgba(255, 255, 255, 0.5)");
    expect(a.style.backgroundImage).toContain("linear-gradient");
  });

  it("leaves a malformed color() alone rather than inventing a colour", () => {
    // Silently turning an unparseable value into transparent black would blank real content.
    const a = doc.getElementById("a")!;
    stubComputedStyles(doc, new Map([[a, { backgroundColor: "color(srgb nope)" }]]));

    sanitizeUnsupportedColorFunctions(doc);
    expect(a.style.backgroundColor).toBe("");
  });

  it("is a no-op on a document with no view rather than throwing", () => {
    const detached = document.implementation.createHTMLDocument("d");
    expect(sanitizeUnsupportedColorFunctions(detached)).toBe(0);
  });
});
