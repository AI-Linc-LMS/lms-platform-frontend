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
