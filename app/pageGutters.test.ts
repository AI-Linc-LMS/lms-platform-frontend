import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Every page.tsx under app/ (no glob: the repo's @types/node predates fs.globSync). */
function pageFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? pageFiles(join(dir, e.name)) : e.name === "page.tsx" ? [join(dir, e.name)] : [],
  );
}

/**
 * One gutter on a phone, not two.
 *
 * MainLayout already pads the content column 16px on a phone. A page that wraps its content in a
 * second padded Box (`px: { xs: 2, ... }`) doubles that to 32px, and on a 390px screen the cards
 * lose 32px of width to white space. The dashboard, leaderboards, admin dashboard and two dozen
 * detail pages all did this, while the course page (`[PHONE]: { px: 0 }`) did not, and it was the
 * one that looked right. A padded wrapper directly inside MainLayout/PageShell must drop its
 * inline padding on a phone. `fullPage` layouts have no padding of their own, so they are exempt.
 */

const WRAPPER = /<(MainLayout|PageShell)\b([^>]*)>\s*\n\s*<Box[^>]*sx=\{\{([^\n]*?)\}\}\s*>/g;
const PADDED = /\b(p|px)\s*:\s*(\{\s*xs:\s*[1-9]|[1-9]\b)/;

describe("page gutters on a phone", () => {
  const pages = pageFiles("app");

  it("finds the pages it is guarding", () => {
    expect(pages.length).toBeGreaterThan(50);
  });

  it("never pads a second time inside the padded layout", () => {
    const offenders: string[] = [];
    for (const file of pages) {
      const src = readFileSync(file, "utf8");
      for (const m of src.matchAll(WRAPPER)) {
        const [, , props, sx] = m;
        if (props.includes("fullPage") || !PADDED.test(sx)) continue;
        // Centred loading/empty states (a spinner or one line of text) are not a column of cards.
        if (/py:\s*12\b/.test(sx) || /textAlign:\s*"center"/.test(sx) || /justifyContent:\s*"center"/.test(sx)) continue;
        if (!/\[PHONE\]\s*:\s*\{[^}]*\bpx:\s*0/.test(sx)) offenders.push(`${file}: ${sx.trim().slice(0, 90)}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
