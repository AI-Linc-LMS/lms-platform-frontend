import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The generated-practice cards must fit the page.
 *
 * Reported: "In the additional questions section the questions are going out of the page but
 * there is no scrolling present to move right and see the complete question card."
 *
 * Two causes, and the second is the one that matters to the learner.
 *
 * 1. The cards sit in a CSS grid, and a grid track is `min-width: auto` by default - it
 *    refuses to shrink below its content. The grid ITEM had no `minWidth: 0` (only the text
 *    box inside it did), so a card wider than its share pushed the row past the container
 *    rather than fitting inside it.
 *
 * 2. The title was `whiteSpace: nowrap` on a single line. These titles are the topic's own
 *    name - "Types of operators, programs using operators, and an introduction to
 *    conditionals" - so one line could never show one, whatever the width. The report asked
 *    for a horizontal scrollbar; a scrollbar would let someone chase the text sideways, and
 *    fitting it is better. It wraps to two lines, and `title` carries the whole string.
 *
 * Asserted against the source: jsdom performs no layout, so a render test cannot measure an
 * overflow. What it CAN pin is the two properties that cause one.
 */

const SRC = readFileSync(
  join(process.cwd(), "components/adaptive-journey/AdditionalPractice.tsx"),
  "utf8",
);

/** The <Stack> that is the grid item for one generated-practice card. */
const cardItem = () => SRC.match(/<Stack key=\{it\.id\}[^>]*>/)?.[0] ?? "";

/** The title <Typography> - anchored on the opening tag through its closing brace. */
const titleBlock = () =>
  SRC.match(/<Typography\s+title=\{it\.title\}[\s\S]*?<\/Typography>/)?.[0] ?? "";

describe("the generated-practice cards", () => {
  it("let the grid track shrink, so a card cannot push the row off the page", () => {
    expect(cardItem()).toContain("minWidth: 0");
  });

  it("does not pin the title to one unreadable line", () => {
    const title = titleBlock();
    expect(title, "the title Typography").toBeTruthy();
    expect(title).not.toContain('whiteSpace: "nowrap"');
    expect(title).toContain("WebkitLineClamp");
  });

  it("keeps the whole title reachable on hover", () => {
    expect(SRC).toMatch(/title=\{it\.title\}/);
  });

  it("does not reach for a horizontal scrollbar", () => {
    // The ask was a scrollbar; the fix is that nothing falls off the edge to scroll to. If
    // one appears here later it means the fitting stopped working.
    const section = SRC.match(/YOUR GENERATED PRACTICE[\s\S]*?\n {10}\)\}/)?.[0] ?? SRC;
    expect(section).not.toContain("overflowX");
  });

  it("still truncates rather than growing a card without limit", () => {
    // Two lines, not unbounded: a runaway title would make one card taller than the row.
    const title = titleBlock();
    expect(title).toMatch(/WebkitLineClamp:\s*2/);
    expect(title).toContain('overflow: "hidden"');
  });

  it("gives the Open control a real tap target on a phone", () => {
    const btn = SRC.match(/<ButtonBase onClick=\{\(\) => openItem\(it\)\}[\s\S]{0,320}?>/)?.[0] ?? "";
    expect(btn).toContain("minHeight: 44");
  });
});
