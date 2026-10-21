/**
 * Pack bucket cards into balanced columns.
 *
 * The reference layout (InterviewBit's topic page) is a masonry: one tall bucket of eight
 * problems on the left, three short ones stacked on the right. CSS multi-column would do that
 * for free, but it is free only until a card is taller than the column, and then
 * `break-inside: avoid` is a *request* - Blink and WebKit both split the card anyway and a
 * bucket's rows end up under someone else's heading. That failure is invisible in jsdom and
 * only appears at one particular viewport width, which is the worst kind of layout bug to own.
 *
 * So the packing is decided here, in data, where it can be asserted. Each bucket goes into
 * whichever column is currently shortest, measured in rows rather than pixels: a bucket's
 * height is its problem count plus a constant for the header, which is exactly proportional to
 * what it will actually draw because every row is the same height.
 *
 * Ties go to the leftmost column, so the result is deterministic and the server order is
 * preserved down each column - a learner reading top-to-bottom, left-to-right still meets the
 * buckets in the order the course author chose.
 */

/** A bucket header is about this many problem-rows tall. Used only to compare columns. */
export const HEADER_ROWS = 1.6;

export function balanceColumns<T>(
  items: readonly T[],
  size: (item: T) => number,
  columns: number,
): T[][] {
  const n = Math.max(1, Math.floor(columns));
  // One column is the phone case and the identity case; skipping the loop keeps it allocation-free
  // and, more importantly, makes "the order is untouched" true by construction rather than by luck.
  if (n === 1) return [items.slice()];

  const cols: T[][] = Array.from({ length: n }, () => []);
  const heights = new Array<number>(n).fill(0);

  for (const item of items) {
    let target = 0;
    for (let i = 1; i < n; i += 1) {
      // Strictly less-than: equal heights keep the leftmost column, so a row of same-sized
      // buckets fills left to right the way reading order expects.
      if (heights[i] < heights[target]) target = i;
    }
    cols[target].push(item);
    heights[target] += HEADER_ROWS + Math.max(0, size(item));
  }

  return cols;
}

export default balanceColumns;
