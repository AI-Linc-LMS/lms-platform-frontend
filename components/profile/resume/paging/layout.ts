/**
 * One page or two: the decision, and the measurements it is made from.
 *
 * The product rule, decided 2026-09-07: a resume stays on one page where it can, and may run onto
 * a second when there is genuinely too much content. One page is a recommendation, not a cap - so
 * the shrink that keeps it on one page has a floor, and past that floor the answer is another page
 * rather than type nobody can read.
 */

/** Never grow past this. Three lines of resume should look sparse, not like a poster. */
export const MAX_SCALE = 1.25;
/** Only grow a page with real dead space on it. */
export const GROW_BELOW = 0.92;
/** Sub-pixel rounding must not trigger a scale. */
export const SLACK_PX = 2;
/** Body text may not be shrunk below this. 9px is 6.75pt, about the floor for print. */
export const MIN_BODY_PX = 9;
/** However large a template's type is, never shrink the page more than this. */
export const ABS_MIN_SCALE = 0.85;

export type Layout =
  | { mode: "fit"; scale: number; widthPct: number; pages: 1 }
  | { mode: "paged"; scale: 1; widthPct: 100; pages: number };

/**
 * How far down the document the resume actually reaches.
 *
 * Not scrollHeight: the templates used to fix their own root at exactly one page, so the BOX was
 * always full whatever was in it. This measures ink - the lowest edge of anything that renders.
 * A background colour deliberately does not count, or every template with a full-height coloured
 * sidebar would report itself as full.
 *
 * The host must not be scaled. getBoundingClientRect reports screen pixels, and measuring the
 * displayed page - which is shrunk to fit the window - is what made the resume overflow at some
 * window sizes and not others.
 */
export function inkHeight(root: HTMLElement): number {
  const top = root.getBoundingClientRect().top;
  let bottom = 0;
  for (const node of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    const cs = getComputedStyle(node);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.opacity === "0") continue;
    const hasText = Array.from(node.childNodes).some(
      (c) => c.nodeType === 3 && (c.textContent || "").trim().length > 0,
    );
    if (!hasText && node.tagName !== "IMG" && node.tagName !== "SVG" && node.tagName !== "svg") continue;
    const r = node.getBoundingClientRect();
    if (!r.height || !r.width) continue;
    bottom = Math.max(bottom, r.bottom - top);
  }
  return Math.round(bottom);
}

/**
 * The 10th-percentile font size in the document, weighted by how many characters are set in it:
 * the size of the small print, rather than of a heading that appears once.
 *
 * It is read from the rendered document rather than from a table of templates, so it follows the
 * template, the tenant's font and anything either of them changes later. Measured today it runs
 * from 9.28px (Bubble) to 12px (Executive).
 */
export function smallTextPx(root: HTMLElement): number {
  const sizes: Array<{ px: number; chars: number }> = [];
  for (const node of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
    const chars = Array.from(node.childNodes)
      .filter((c) => c.nodeType === 3)
      .reduce((n, c) => n + (c.textContent || "").trim().length, 0);
    if (!chars) continue;
    const cs = getComputedStyle(node);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    const px = parseFloat(cs.fontSize);
    if (px > 0) sizes.push({ px, chars });
  }
  if (!sizes.length) return 10;
  sizes.sort((a, b) => a.px - b.px);
  const total = sizes.reduce((n, s) => n + s.chars, 0);
  let seen = 0;
  for (const s of sizes) {
    seen += s.chars;
    if (seen >= total * 0.1) return s.px;
  }
  return sizes[sizes.length - 1].px;
}

/** How far this particular resume may be shrunk before its small print stops being readable. */
export function legibilityFloor(smallPx: number): number {
  if (!smallPx) return ABS_MIN_SCALE;
  return Math.min(1, Math.max(ABS_MIN_SCALE, MIN_BODY_PX / smallPx));
}

/**
 * Decide the layout from measurements taken at scale 1, never from the scale currently applied -
 * a decision that reads its own output is a loop.
 *
 * `measureAtWidth(pct)` sets the document's layout width to that percentage of the page and
 * returns the ink height. Width matters because scaling is compensated: a page drawn at 90% has
 * to be laid out 1/0.9 as wide so that, once scaled, it still covers the full 210mm - otherwise
 * a shrunken page leaves white strips down both sides and cuts every full-height sidebar short.
 */
export function decideLayout(
  pageHeight: number,
  measureAtWidth: (widthPct: number) => number,
  floor: number,
): Layout {
  const ink1 = measureAtWidth(100);
  if (!ink1) return { mode: "fit", scale: 1, widthPct: 100, pages: 1 };

  // Scales are computed against a page one pixel short. Ink is measured in whole pixels, so a
  // scale derived from the exact page height can land the last line a fraction past the edge -
  // measured on Western with a real student profile, where the GPA line ended 0.5px over and the
  // page clipped it.
  const target = pageHeight - 1;

  if (ink1 <= pageHeight + SLACK_PX) {
    if (ink1 >= pageHeight * GROW_BELOW) return { mode: "fit", scale: 1, widthPct: 100, pages: 1 };
    // Dead space: grow. Growing narrows the layout box, so the text reflows into more lines and
    // ends up taller than the first reading predicted; take the scale from a second reading at the
    // width actually being used, and keep the width from the first, or it reflows again forever.
    const first = Math.min(MAX_SCALE, target / ink1);
    const widthPct = 100 / first;
    const reflowed = measureAtWidth(widthPct);
    const scale = reflowed > 0 ? Math.min(first, target / reflowed) : first;
    return { mode: "fit", scale, widthPct, pages: 1 };
  }

  // Too tall for one page. Try a shrink, but only a small one.
  const naive = target / ink1;
  if (naive < floor - 0.03) return { mode: "paged", scale: 1, widthPct: 100, pages: 0 };
  const inkA = measureAtWidth(100 / naive);
  const s1 = inkA > 0 ? target / inkA : naive;
  const inkB = measureAtWidth(100 / s1);
  const s2 = inkB > 0 ? target / inkB : s1;
  if (s2 >= floor) return { mode: "fit", scale: Math.min(s2, 1), widthPct: 100 / s1, pages: 1 };

  // A second page, at full size. Never shrink a resume that is going to spill anyway: that would
  // shrink every line AND leave page 2 emptier.
  return { mode: "paged", scale: 1, widthPct: 100, pages: 0 };
}
