import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { PracticeCard, type PracticeCardItem } from "./practice/PracticeCard";
import { PracticeDeck } from "./practice/PracticeDeck";
import { aheadLabel, difficultyKey } from "./practice/practiceTokens";

/**
 * A topic's coding problems, as a deck of cards instead of the tail of the numbered path.
 *
 * The asked-for change was visual. The part worth pinning is what it must NOT break: coding is
 * always last within a topic (`lib/adaptive/courseFlow.ts` orders videos, articles, quizzes, then
 * coding, and documents that this page and every Next button walk that single order), which is
 * the only reason the practice items can be lifted out of the path at all. If that order ever
 * changes, the deck would renumber steps that still live above it, so the numbering is asserted
 * rather than assumed.
 */

const item = (over: Partial<PracticeCardItem> = {}): PracticeCardItem => ({
  key: "c:1",
  title: "Find the Maximum Value in an Array",
  difficulty: "Easy",
  requiresUpcoming: [],
  completed: false,
  onOpen: vi.fn(),
  ...over,
});

describe("a practice card", () => {
  it("opens its problem when the whole card is clicked, not only a button", () => {
    const onOpen = vi.fn();
    render(<PracticeCard item={item({ onOpen })} index={4} />);
    fireEvent.click(screen.getByTestId("practice-card"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("is a real button, so it is reachable by keyboard", () => {
    render(<PracticeCard item={item()} index={4} />);
    expect(screen.getByTestId("practice-card").tagName).toBe("BUTTON");
  });

  it("tells assistive tech what activating it does", () => {
    // The visible verb is aria-hidden - it decorates a control that is already the whole card -
    // so without a label the card reads as a title and a number with no action in it.
    render(<PracticeCard item={item({ requiresUpcoming: ["Hash Tables"] })} index={4} />);
    const label = screen.getByTestId("practice-card").getAttribute("aria-label") ?? "";
    expect(label).toContain("Try anyway");
    expect(label).toContain("Find the Maximum Value in an Array");
    expect(label).toContain("taught later");
  });

  it("carries its step number from the path above it", () => {
    render(<PracticeCard item={item()} index={7} />);
    expect(screen.getByTestId("practice-card").textContent).toContain("07");
  });

  it("offers to Solve a problem the learner is ready for", () => {
    render(<PracticeCard item={item({ onOffer: 150 })} index={4} />);
    const card = screen.getByTestId("practice-card");
    expect(card.textContent).toContain("Solve");
    expect(card.textContent).toContain("150 pts");
    expect(screen.queryByTestId("practice-ahead")).toBeNull();
  });

  /**
   * The reach-ahead case. The backend has sent `requires_upcoming` since #940 decided to SERVE a
   * problem that runs past the syllabus rather than hide it - hiding it made the topic's counters
   * and its points disagree with what the learner could see.
   */
  it("says what a problem reaches ahead to, and still lets the learner try it", () => {
    render(<PracticeCard item={item({ requiresUpcoming: ["Hash Tables"] })} index={5} />);
    const card = screen.getByTestId("practice-card");
    expect(within(card).getByTestId("practice-ahead").textContent).toBe("Hash Tables · taught later");
    expect(card.textContent).toContain("Try anyway");
  });

  it("does not claim WHICH topic teaches it, because the payload does not say", () => {
    // `requires_upcoming` is a list of display labels and carries no position in the syllabus.
    // An earlier draft of this card read "taught in topic 4", which was invented.
    expect(aheadLabel(["Hash Tables"])).not.toMatch(/topic\s*\d|week\s*\d/i);
  });

  it("names every technique up to three, then counts the rest, so the chip stays a chip", () => {
    expect(aheadLabel(["Hash Tables"])).toBe("Hash Tables · taught later");
    expect(aheadLabel(["Hash Tables", "Two Pointers"])).toBe("Hash Tables and Two Pointers · taught later");
    expect(aheadLabel(["A", "B", "C", "D"])).toBe("A, B and 2 more · taught later");
  });

  it("reviews a solved problem instead of restarting it, and shows what it earned", () => {
    render(<PracticeCard item={item({ completed: true, earned: 150, onOffer: 150 })} index={4} />);
    const card = screen.getByTestId("practice-card");
    expect(card.textContent).toContain("Review");
    expect(card.textContent).toContain("Solved · 150 earned");
  });

  it("reads difficulty whatever case the wire sends", () => {
    for (const v of ["Easy", "easy", "EASY"]) expect(difficultyKey(v)).toBe("easy");
    for (const v of ["Hard", "hard"]) expect(difficultyKey(v)).toBe("hard");
    // Anything unrecognised is Medium rather than blank: an unlabelled card tells nobody anything.
    for (const v of ["", undefined, "Spicy"]) expect(difficultyKey(v as string)).toBe("medium");
  });
});

describe("the deck", () => {
  const three = [
    item({ key: "a", title: "One", completed: true }),
    item({ key: "b", title: "Two" }),
    item({ key: "c", title: "Three" }),
  ];

  it("continues the path's numbering rather than starting again at one", () => {
    render(<PracticeDeck items={three} firstStep={4} />);
    const text = screen.getByTestId("practice-deck").textContent ?? "";
    expect(text).toContain("04");
    expect(text).toContain("06");
    expect(text).not.toContain("01");
  });

  it("counts what is solved", () => {
    render(<PracticeDeck items={three} firstStep={4} />);
    expect(screen.getByTestId("practice-deck").textContent).toContain("1 of 3 solved");
  });

  it("renders nothing at all for a topic with no coding, rather than an empty heading", () => {
    const { container } = render(<PracticeDeck items={[]} firstStep={1} />);
    expect(container).toBeEmptyDOMElement();
  });
});

/**
 * jsdom performs no layout and computes no gradients, so these are read off the source. Each
 * corresponds to a named deletion in DESIGN.md §3 that the rows this deck replaces were doing.
 */
describe("the deck obeys the design system the rest of the product is moving to", () => {
  const CARD = readFileSync(
    join(process.cwd(), "components/adaptive-journey/practice/PracticeCard.tsx"), "utf8");
  const DECK = readFileSync(
    join(process.cwd(), "components/adaptive-journey/practice/PracticeDeck.tsx"), "utf8");
  /** Source with comments removed, so an assertion cannot fire on a line describing the bug. */
  const code = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  it("has no gradient anywhere", () => {
    // "Its light half fails WCAG AA on white text at 15px. Disabled state measures 2.13:1."
    expect(code(CARD)).not.toContain("linear-gradient");
  });

  it("has no coloured edge strip", () => {
    // "The colored edge strip is the single most reliable AI tell."
    expect(code(CARD)).not.toMatch(/borderLeft(Color)?\s*:/);
  });

  it("uses only the three weights the type system has", () => {
    // Comments first: this file documents the `fontWeight: 800` it replaced, and an earlier
    // draft of this assertion failed on its own prose.
    const weights = [...code(CARD).matchAll(/fontWeight:\s*(\d+)/g)].map((m) => Number(m[1]));
    expect(weights.length).toBeGreaterThan(0);
    expect(weights.every((w) => w === 400 || w === 500 || w === 600)).toBe(true);
  });

  it("lets a grid track shrink, so a long title cannot push the page sideways", () => {
    expect(DECK).toContain("minWidth: 0");
  });

  it("gives the card a visible focus ring", () => {
    expect(CARD).toContain("&:focus-visible");
  });
});

/**
 * Grouping by what the learner can do today, rather than by the order the course was authored
 * in. The signal is `requires_upcoming`, which the backend has sent for a long time and nothing
 * read until the cards did.
 */
describe("readiness grouping", () => {
  const mixed = [
    item({ key: "r1", title: "Ready one", completed: true }),
    item({ key: "r2", title: "Ready two" }),
    item({ key: "s1", title: "Stretch one", requiresUpcoming: ["Hash Tables"] }),
    item({ key: "s2", title: "Stretch two", requiresUpcoming: ["Graphs"] }),
  ];

  it("separates what the topic has taught from what it has not", () => {
    render(<PracticeDeck items={mixed} firstStep={4} />);
    const text = screen.getByTestId("practice-deck").textContent ?? "";
    expect(text).toContain("Ready now");
    expect(text).toContain("A stretch");
  });

  it("counts each bucket on its own", () => {
    render(<PracticeDeck items={mixed} firstStep={4} />);
    const text = screen.getByTestId("practice-deck").textContent ?? "";
    expect(text).toContain("1/2");   // ready: one solved of two
    expect(text).toContain("0/2");   // stretch: none solved of two
  });

  /**
   * The bug this prevents: numbering the buckets instead of the authored order would renumber
   * a problem every time the learner changed the filter, and the Next button walks the authored
   * order, so the page would start disagreeing with it.
   */
  it("keeps each card's authored step number, not its position in a bucket", () => {
    render(<PracticeDeck items={mixed} firstStep={4} />);
    const cards = screen.getAllByTestId("practice-card");
    // The number opens the card's text and runs straight into the title ("04Ready one"), so
    // there is no word boundary to anchor on.
    const numbers = cards.map((c) => c.textContent?.match(/^0\d/)?.[0]);
    // Ready renders first and holds the authored 1st and 2nd; stretch holds the 3rd and 4th.
    expect(numbers).toEqual(["04", "05", "06", "07"]);
  });

  it("shows only one heading when every problem is ready", () => {
    render(<PracticeDeck items={[item({ key: "a" }), item({ key: "b" })]} firstStep={1} />);
    const text = screen.getByTestId("practice-deck").textContent ?? "";
    expect(text).toContain("Ready now");
    expect(text).not.toContain("A stretch");
  });
});

describe("the time filter", () => {
  const timed = [
    item({ key: "a", title: "Quick", typicalMinutes: 5 }),
    item({ key: "b", title: "Slow", typicalMinutes: 40 }),
    item({ key: "c", title: "Unmeasured" }),
  ];

  it("is not offered at all when nothing has a measured time", () => {
    render(<PracticeDeck items={[item({ key: "x" })]} firstStep={1} />);
    expect(screen.queryByTestId("practice-budget")).toBeNull();
  });

  it("narrows to what fits, and says what it hid", () => {
    render(<PracticeDeck items={timed} firstStep={1} />);
    fireEvent.click(screen.getByRole("button", { name: "10 min" }));
    const text = screen.getByTestId("practice-deck").textContent ?? "";
    expect(text).toContain("Quick");
    expect(text).not.toContain("Slow");
    // No silent caps: a filter that quietly removes work reads as a thinner topic.
    expect(text).toContain("1 longer one hidden");
  });

  /**
   * Only 68 of 611 problems had enough attempts to publish a median when this shipped, so
   * treating "unmeasured" as "too long" would empty the page to prove a point.
   */
  it("keeps a problem whose length nobody has measured", () => {
    render(<PracticeDeck items={timed} firstStep={1} />);
    fireEvent.click(screen.getByRole("button", { name: "10 min" }));
    expect(screen.getByTestId("practice-deck").textContent).toContain("Unmeasured");
  });

  it("offers a way back when the filter leaves nothing", () => {
    render(<PracticeDeck items={[item({ key: "b", title: "Slow", typicalMinutes: 40 })]} firstStep={1} />);
    fireEvent.click(screen.getByRole("button", { name: "10 min" }));
    expect(screen.getByTestId("practice-deck").textContent).toContain("Nothing here fits");
    fireEvent.click(screen.getByRole("button", { name: "Show everything" }));
    expect(screen.getByTestId("practice-deck").textContent).toContain("Slow");
  });
});

describe("the measured minute figure", () => {
  it("is shown when it was measured", () => {
    render(<PracticeCard item={item({ onOffer: 150, typicalMinutes: 6 })} index={4} />);
    expect(screen.getByTestId("practice-card").textContent).toContain("~6 min");
  });

  it("is absent, not estimated, when it was not", () => {
    render(<PracticeCard item={item({ onOffer: 150 })} index={4} />);
    const text = screen.getByTestId("practice-card").textContent ?? "";
    expect(text).toContain("150 pts");
    expect(text).not.toMatch(/min/);
  });
});
