import { describe, expect, it } from "vitest";
import { balanceColumns, HEADER_ROWS } from "./balanceColumns";

const size = (n: number) => n;

describe("packing buckets into balanced columns", () => {
  it("puts one tall bucket beside several short ones", () => {
    // The reference layout exactly: Adhoc(8) alone on the left, three small ones stacked right.
    const cols = balanceColumns([8, 1, 1, 2], size, 2);
    expect(cols[0]).toEqual([8]);
    expect(cols[1]).toEqual([1, 1, 2]);
  });

  it("keeps the server's order down each column", () => {
    // A learner reading a column top to bottom must still meet buckets in the authored order.
    const cols = balanceColumns([3, 3, 3, 3], size, 2);
    expect(cols[0]).toEqual([3, 3]);
    expect(cols[1]).toEqual([3, 3]);
  });

  it("sends a tie to the leftmost column, so equal buckets fill left to right", () => {
    const cols = balanceColumns([2, 2], size, 2);
    expect(cols[0]).toEqual([2]);
    expect(cols[1]).toEqual([2]);
  });

  it("returns the list untouched in one column", () => {
    // The phone case. Reordering here would silently differ from the two-column reading order.
    expect(balanceColumns([5, 1, 9], size, 1)).toEqual([[5, 1, 9]]);
  });

  it("never loses or duplicates a bucket", () => {
    const input = [4, 1, 7, 2, 2, 9, 1, 3];
    const flat = balanceColumns(input, size, 2).flat();
    expect(flat.slice().sort()).toEqual(input.slice().sort());
    expect(flat).toHaveLength(input.length);
  });

  it("counts the header, so many tiny buckets still split across columns", () => {
    // Without HEADER_ROWS a 1-problem bucket costs 1 and eight of them would stack in one
    // column against a single 8-problem bucket, which is the layout this function exists to
    // avoid. The header is what makes eight ones taller than one eight.
    expect(HEADER_ROWS).toBeGreaterThan(0);
    const cols = balanceColumns([1, 1, 1, 1, 1, 1, 1, 1], size, 2);
    expect(cols[0]).toHaveLength(4);
    expect(cols[1]).toHaveLength(4);
  });

  it("tolerates a bucket whose problems were all filtered out", () => {
    const cols = balanceColumns([0, 0, 5], size, 2);
    expect(cols.flat()).toHaveLength(3);
  });
});
