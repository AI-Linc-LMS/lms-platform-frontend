// @vitest-environment jsdom
/**
 * Practice grouped by technique, and the bonus that covering them all unlocks.
 *
 * The rule this view exists to express is "solve at least ONE problem from each bucket", and
 * every assertion below is about not quietly restating it as something else - the two easy
 * mistakes being to read a bucket as finished only when all of its problems are done, and to
 * recompute the bonus on the client where it can drift from the server's answer.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TechniqueBuckets, type BucketedItem, type TechniqueBucket } from "./TechniqueBuckets";

vi.mock("@iconify/react", () => ({ Icon: () => null }));

const bucket = (over: Partial<TechniqueBucket> = {}): TechniqueBucket => ({
  id: 1, name: "Search answer", slug: "search-answer", description: "",
  order: 0, total: 2, solved: 0, satisfied: false, ...over,
});

const item = (key: string, bucketId: number | null, over: Partial<BucketedItem> = {}): BucketedItem => ({
  key, title: key, difficulty: "Medium", requiresUpcoming: [], completed: false,
  onOpen: () => {}, bucketId, ...over,
});

describe("practice grouped by technique", () => {
  it("draws a card per bucket with its own count", () => {
    render(
      <TechniqueBuckets
        buckets={[bucket(), bucket({ id: 2, name: "Simple binary search", total: 1 })]}
        items={[item("Allocate Books", 1), item("Red Zone", 1), item("Sorted Insert", 2)]}
        bonusUnlocked={false}
        firstStep={3}
      />,
    );
    const cards = screen.getAllByTestId("technique-bucket");
    expect(cards).toHaveLength(2);
    expect(screen.getByText("Search answer")).toBeTruthy();
    expect(screen.getByText("Simple binary search")).toBeTruthy();
    expect(screen.getByText("0/2")).toBeTruthy();
  });

  it("marks a bucket satisfied on ONE solved problem, not all of them", () => {
    // The whole point of the rule. A bucket showing 1/3 is covered.
    render(
      <TechniqueBuckets
        buckets={[bucket({ total: 3, solved: 1, satisfied: true })]}
        items={[item("a", 1, { completed: true }), item("b", 1), item("c", 1)]}
        bonusUnlocked={false}
        firstStep={1}
      />,
    );
    expect(screen.getByTestId("technique-bucket").dataset.satisfied).toBe("true");
    expect(screen.getByText("1/3")).toBeTruthy();
  });

  it("takes the bonus state from the server rather than recomputing it", () => {
    // Deliberately inconsistent input: every bucket satisfied but the server says locked.
    // The client must not overrule it, or the two will disagree about finishing a module.
    render(
      <TechniqueBuckets
        buckets={[bucket({ satisfied: true, solved: 2 })]}
        items={[item("a", 1, { completed: true })]}
        bonusUnlocked={false}
        firstStep={1}
      />,
    );
    expect(screen.getByTestId("topic-bonus").dataset.unlocked).toBe("false");
    expect(screen.getByText(/at least one problem from each bucket/i)).toBeTruthy();
  });

  it("says the bonus is unlocked when the server says so", () => {
    render(
      <TechniqueBuckets
        buckets={[bucket({ satisfied: true, solved: 1 })]}
        items={[item("a", 1, { completed: true })]}
        bonusUnlocked
        firstStep={1}
      />,
    );
    expect(screen.getByTestId("topic-bonus").dataset.unlocked).toBe("true");
    expect(screen.getByText(/covered every technique/i)).toBeTruthy();
  });

  it("renders nothing at all when the set has no buckets", () => {
    // 2,776 live sets are in this state; the page falls back to the flat deck.
    const { container } = render(
      <TechniqueBuckets buckets={[]} items={[item("a", null)]} bonusUnlocked={false} firstStep={1} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("leaves an unbucketed problem out of every bucket instead of inventing one", () => {
    render(
      <TechniqueBuckets
        buckets={[bucket({ total: 1 })]}
        items={[item("in a bucket", 1), item("stray", null)]}
        bonusUnlocked={false}
        firstStep={1}
      />,
    );
    expect(screen.getByText("in a bucket")).toBeTruthy();
    expect(screen.queryByText("stray")).toBeNull();
  });

  it("numbers cards by authored order, not by position within a bucket", () => {
    // Regrouping the problems must not renumber the course.
    render(
      <TechniqueBuckets
        buckets={[bucket({ id: 2, name: "Second", order: 0, total: 1 }),
                  bucket({ id: 1, name: "First", order: 1, total: 1 })]}
        items={[item("authored-first", 1), item("authored-second", 2)]}
        bonusUnlocked={false}
        firstStep={5}
      />,
    );
    // "authored-first" is item 0, so it keeps step 05 even though its bucket is drawn second.
    expect(screen.getByText("05")).toBeTruthy();
    expect(screen.getByText("06")).toBeTruthy();
  });

  it("reports how many techniques are covered", () => {
    render(
      <TechniqueBuckets
        buckets={[bucket({ satisfied: true }), bucket({ id: 2, name: "B" }), bucket({ id: 3, name: "C" })]}
        items={[item("a", 1, { completed: true })]}
        bonusUnlocked={false}
        firstStep={1}
      />,
    );
    expect(screen.getByText(/1 of 3 techniques covered/i)).toBeTruthy();
  });
});
