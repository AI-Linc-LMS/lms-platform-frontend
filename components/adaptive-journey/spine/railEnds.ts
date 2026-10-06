/**
 * Where the rail starts and where it stops.
 *
 * The spine is drawn as one segment per rung, each abutting the next, which only reads as a
 * single unbroken line if the very first rung starts its segment at its own marker and the very
 * last one stops at its own marker. Everything in between draws edge to edge.
 *
 * Which rungs those are is not "the first week's band" and "the last week's last step": a
 * course can open with a week that has no steps yet, and its final week can be empty too (the
 * backfill runs per GET, and an admin can add an empty module at either end). Getting it wrong
 * leaves the rail hanging off the top or bottom of the page, so it is worked out from the data.
 */

export interface RungKey {
  /** Index into `weeks`. */
  week: number;
  /** Index into that week's nodes, or null for the week's own band. */
  node: number | null;
}

export function rungs(weeks: { nodes: unknown[] }[]): RungKey[] {
  const out: RungKey[] = [];
  weeks.forEach((w, wi) => {
    out.push({ week: wi, node: null });
    w.nodes.forEach((_, ni) => out.push({ week: wi, node: ni }));
  });
  return out;
}

export function sameRung(a: RungKey, b: RungKey | undefined): boolean {
  return !!b && a.week === b.week && a.node === b.node;
}

/** The two ends of the rail, or undefined for a course with no weeks at all. */
export function railEnds(weeks: { nodes: unknown[] }[]): {
  first: RungKey | undefined;
  last: RungKey | undefined;
} {
  const all = rungs(weeks);
  return { first: all[0], last: all[all.length - 1] };
}
