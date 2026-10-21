// @vitest-environment jsdom
/**
 * Practice grouped by technique, and the bonus that covering them all unlocks.
 *
 * The rule this view exists to express is "solve at least ONE problem from each bucket", and
 * most of the assertions below are about not quietly restating it as something else - the two
 * easy mistakes being to read a bucket as finished only when all of its problems are done, and
 * to recompute the bonus on the client where it can drift from the server's answer.
 *
 * The rest pin the dense-row redesign: a row is the control, it carries the figures a learner
 * compares before picking one problem out of a bucket, and it must stay legible when those
 * figures are missing - `typical_minutes` is omitted for most problems and points arrive in a
 * second request that is allowed to fail.
 */

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TechniqueBuckets, type BucketedItem, type TechniqueBucket } from "./TechniqueBuckets";

vi.mock("@iconify/react", () => ({ Icon: () => null }));

/**
 * jsdom has no `matchMedia`, so `useMediaQuery` reports false and the component renders its
 * single-column form. That is the right default to test against, but the two-column packing is
 * the layout almost every learner sees, so it has to be reachable here too.
 */
function atWidth(wide: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true, configurable: true,
    value: (query: string) => ({
      matches: wide && query.includes("min-width:900px"),
      media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

afterEach(() => {
  // @ts-expect-error - putting jsdom back the way it was found
  delete window.matchMedia;
});

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
      />,
    );
    expect(screen.getAllByTestId("technique-bucket")).toHaveLength(2);
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
      />,
    );
    expect(screen.getByTestId("topic-bonus").dataset.unlocked).toBe("true");
    expect(screen.getByText(/covered every technique/i)).toBeTruthy();
  });

  it("renders nothing at all when the set has no buckets", () => {
    // 2,776 live sets are in this state; the page falls back to the flat deck.
    const { container } = render(
      <TechniqueBuckets buckets={[]} items={[item("a", null)]} bonusUnlocked={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("leaves an unbucketed problem out of every bucket instead of inventing one", () => {
    render(
      <TechniqueBuckets
        buckets={[bucket({ total: 1 })]}
        items={[item("in a bucket", 1), item("stray", null)]}
        bonusUnlocked={false}
      />,
    );
    expect(screen.getByText("in a bucket")).toBeTruthy();
    expect(screen.queryByText("stray")).toBeNull();
  });

  it("reports how many techniques are covered", () => {
    render(
      <TechniqueBuckets
        buckets={[bucket({ satisfied: true }), bucket({ id: 2, name: "B" }), bucket({ id: 3, name: "C" })]}
        items={[item("a", 1, { completed: true })]}
        bonusUnlocked={false}
      />,
    );
    expect(screen.getByText(/1 of 3 techniques covered/i)).toBeTruthy();
  });
});

describe("the dense problem row", () => {
  it("is itself the control, with no nested button inside it", () => {
    // A `Solve` button inside a clickable row is both a nested-interactive a11y fault and, at
    // four rows a bucket, pure noise. The row is the only control.
    render(
      <TechniqueBuckets
        buckets={[bucket({ total: 1 })]}
        items={[item("Allocate Books", 1)]}
        bonusUnlocked={false}
      />,
    );
    const row = screen.getByTestId("bucket-problem-row");
    expect(row.tagName).toBe("BUTTON");
    expect(within(row).queryByRole("button")).toBeNull();
  });

  it("opens the problem when the row is activated", async () => {
    const onOpen = vi.fn();
    render(
      <TechniqueBuckets
        buckets={[bucket({ total: 1 })]}
        items={[item("Allocate Books", 1, { onOpen })]}
        bonusUnlocked={false}
      />,
    );
    await userEvent.click(screen.getByTestId("bucket-problem-row"));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("carries difficulty, minutes and points as comparable figures", () => {
    render(
      <TechniqueBuckets
        buckets={[bucket({ total: 1 })]}
        items={[item("Allocate Books", 1, { difficulty: "Hard", typicalMinutes: 31, onOffer: 200 })]}
        bonusUnlocked={false}
      />,
    );
    const row = screen.getByTestId("bucket-problem-row");
    expect(within(row).getByText("Hard")).toBeTruthy();
    expect(within(row).getByText(/31 min/)).toBeTruthy();
    expect(within(row).getByText(/200 pts/)).toBeTruthy();
  });

  it("says nothing rather than estimating when minutes and points are missing", () => {
    // `typical_minutes` is omitted for most problems, and the points request is allowed to
    // fail silently - so a row with neither must still read as a complete row.
    render(
      <TechniqueBuckets
        buckets={[bucket({ total: 1 })]}
        items={[item("Allocate Books", 1)]}
        bonusUnlocked={false}
      />,
    );
    const row = screen.getByTestId("bucket-problem-row");
    expect(within(row).getByText("Allocate Books")).toBeTruthy();
    expect(within(row).queryByText(/min/)).toBeNull();
    expect(within(row).queryByText(/pts/)).toBeNull();
  });

  it("shows the points EARNED once a problem is done, not what it was worth", () => {
    render(
      <TechniqueBuckets
        buckets={[bucket({ total: 1, solved: 1, satisfied: true })]}
        items={[item("Allocate Books", 1, { completed: true, onOffer: 200, earned: 150 })]}
        bonusUnlocked={false}
      />,
    );
    const row = screen.getByTestId("bucket-problem-row");
    expect(row.dataset.done).toBe("true");
    expect(within(row).getByText(/150 pts/)).toBeTruthy();
    expect(within(row).queryByText(/200 pts/)).toBeNull();
  });

  it("keeps the reach-ahead warning as words, never shortened to an icon", () => {
    // It changes whether to start at all, so it may not be compressed away in a dense row.
    render(
      <TechniqueBuckets
        buckets={[bucket({ total: 1 })]}
        items={[item("Log Analysis", 1, { requiresUpcoming: ["Hash Tables"] })]}
        bonusUnlocked={false}
      />,
    );
    expect(screen.getByText(/Hash Tables · taught later/)).toBeTruthy();
  });

  it("names its own action and expands its figures for a screen reader", () => {
    // The visible text is a title and three abbreviations; none of them says what pressing does.
    render(
      <TechniqueBuckets
        buckets={[bucket({ total: 1 })]}
        items={[item("Log Analysis", 1, {
          difficulty: "Hard", typicalMinutes: 31, onOffer: 200, requiresUpcoming: ["Hash Tables"],
        })]}
        bonusUnlocked={false}
      />,
    );
    const label = screen.getByTestId("bucket-problem-row").getAttribute("aria-label") ?? "";
    expect(label).toMatch(/^Try anyway: Log Analysis\. Hard\./);
    expect(label).toMatch(/Typically 31 minutes/);
    expect(label).toMatch(/200 points/);
    expect(label).toMatch(/taught later/);
  });
});

describe("the bucket layout", () => {
  it("packs a tall bucket into one column and the short ones into the other", () => {
    atWidth(true);
    render(
      <TechniqueBuckets
        buckets={[
          bucket({ id: 1, name: "Adhoc", total: 4 }),
          bucket({ id: 2, name: "Hash Search", total: 1 }),
          bucket({ id: 3, name: "Bit play", total: 1 }),
        ]}
        items={[
          item("a", 1), item("b", 1), item("c", 1), item("d", 1),
          item("e", 2), item("f", 3),
        ]}
        bonusUnlocked={false}
      />,
    );
    const cols = screen.getByTestId("bucket-columns").children;
    expect(cols).toHaveLength(2);
    expect(within(cols[0] as HTMLElement).getAllByTestId("technique-bucket")).toHaveLength(1);
    expect(within(cols[1] as HTMLElement).getAllByTestId("technique-bucket")).toHaveLength(2);
  });

  it("drops to ONE column below 900px, keeping the authored bucket order", () => {
    // Two balanced columns stacked would read 1,1,8 for an authored 1,8,1 - the packer fills
    // the shortest column, so flattening it is not the order the course author chose. Narrow
    // must therefore be a single unpacked column, not the wide layout collapsed by CSS.
    atWidth(false);
    render(
      <TechniqueBuckets
        buckets={[
          bucket({ id: 1, name: "First", total: 1 }),
          bucket({ id: 2, name: "Second", total: 8 }),
          bucket({ id: 3, name: "Third", total: 1 }),
        ]}
        items={[
          item("a", 1),
          ...Array.from({ length: 8 }, (_, i) => item(`b${i}`, 2)),
          item("c", 3),
        ]}
        bonusUnlocked={false}
      />,
    );
    const cols = screen.getByTestId("bucket-columns").children;
    expect(cols).toHaveLength(1);
    const names = screen.getAllByTestId("technique-bucket")
      .map((el) => within(el as HTMLElement).getByText(/First|Second|Third/).textContent);
    expect(names).toEqual(["First", "Second", "Third"]);
  });

  it("keeps the explanation behind the (i) rather than spending a line on every card", () => {
    render(
      <TechniqueBuckets
        buckets={[bucket({ total: 1 })]}
        items={[item("a", 1)]}
        bonusUnlocked={false}
      />,
    );
    expect(screen.queryByText(/Solving/)).toBeNull();
  });

  it("opens that explanation when the (i) is pressed", async () => {
    render(
      <TechniqueBuckets
        buckets={[bucket({ total: 1, description: "Problems where the answer is searched for." })]}
        items={[item("a", 1)]}
        bonusUnlocked={false}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /What the Search answer bucket is for/i }));
    expect(screen.getByText(/Problems where the answer is searched for\./)).toBeTruthy();
    expect(screen.getByText(/covering every bucket completes the topic/i)).toBeTruthy();
  });
});
