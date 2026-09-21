/**
 * Reading the layout jsdom will not compute.
 *
 * Every mobile defect in this module is a layout claim, and jsdom has no layout engine — which
 * is exactly why they all shipped. But MUI's `sx` breakpoints compile to real `@media` rules
 * that emotion writes into `<style>` tags, so the rule a 390px phone WOULD apply is readable
 * even though jsdom never applies it.
 *
 * `styleAt(el, 390, "display")` therefore answers a real question about a real viewport, and it
 * fails when someone "fixes" a phone by moving a desktop breakpoint. It is not a pixel
 * measurement and must never be used as one: it reports the declared value, not a computed box.
 *
 * Not named `*.test.ts`, so vitest does not collect it as a suite.
 */

/**
 * `within` scopes the read to rules written under an ancestor selector, e.g. `'[dir="rtl"]'`
 * for `'[dir="rtl"] &': {...}` in `sx`. Without it only the element's own rules are read.
 */
export interface ScopeOpts {
  within?: string;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every emitted rule, as `[minWidthPx, declarations]` pairs, for one element's emotion classes. */
export function rulesFor(el: Element, { within }: ScopeOpts = {}): Array<[number, string]> {
  const classes = Array.from(el.classList).filter((c) => c.startsWith("css-"));
  if (!classes.length) return [];
  const css = Array.from(document.querySelectorAll("style"))
    .map((s) => s.textContent ?? "")
    .join("\n");
  const out: Array<[number, string]> = [];
  for (const cls of classes) {
    // `.css-x{...}` on its own, and `@media (min-width:NNNpx){.css-x{...}}`. A nested selector
    // (`.css-x > *{...}`, `.css-x::-webkit-scrollbar{...}`) does not match, which is correct:
    // those declarations belong to the child, not to this element.
    // Unscoped, the class must open its own selector (`{` or `}` before it, or the start), so a
    // `[dir="rtl"] .css-x{...}` rule is never mistaken for one the element always applies.
    const scope = within ? `${escapeRe(within)} ` : "(?:^|(?<=[{}]))";
    const pattern = new RegExp(
      String.raw`(?:@media \(min-width:(\d+)px\)\{)?${scope}\.${cls}\{([^}]*)\}`,
      "gm",
    );
    for (const match of css.matchAll(pattern)) {
      out.push([match[1] ? Number(match[1]) : 0, match[2]]);
    }
  }
  return out;
}

/**
 * The value one CSS property resolves to at viewport `width`, after every matching media rule
 * has cascaded in source order. `null` when the element declares the property at no width.
 */
export function styleAt(
  el: Element,
  width: number,
  property: string,
  opts: ScopeOpts = {},
): string | null {
  let value: string | null = null;
  for (const [min, decls] of rulesFor(el, opts)) {
    if (min > width) continue;
    for (const decl of decls.split(";")) {
      const [name, ...rest] = decl.split(":");
      if (name?.trim() === property) value = rest.join(":").trim();
    }
  }
  return value;
}

/** iPhone 14 — the viewport the mobile audit measured. */
export const PHONE = 390;
/** Comfortably past `lg`, where the split and the desktop densities live. */
export const DESKTOP = 1440;
