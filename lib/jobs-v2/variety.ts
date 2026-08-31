/**
 * Jobs v2 — company variety on the default board.
 *
 * **Why this exists.** The API returns the board newest-first, and an employer who bulk-posts
 * lands twenty roles in one minute. On the live board that produced six consecutive GitLab
 * cards above the fold: a learner scrolling a page of 20 openings saw, in effect, one employer.
 * Nothing was broken — the sort was exactly what it claimed — but the page failed at the only
 * job it has, which is to show a learner the range of what is open to them.
 *
 * **What this is not.** It is not a ranking, and it does not decide which jobs a learner sees.
 * It reorders the page that has ALREADY been selected and sliced, so:
 *   - no job is added, dropped or duplicated — the output is a permutation of the input;
 *   - pagination is untouched: page 3 holds exactly the jobs page 3 held before;
 *   - it is skipped the moment the learner expresses an intent of their own. An explicit sort
 *     ("Closing soonest") or a search is an instruction, and quietly reordering the answer to
 *     an instruction is the kind of helpfulness that reads as a bug.
 *
 * The order is a deterministic greedy: at each step take the next job from whichever employer
 * still has the most waiting, never the employer that just went. That spreads a bulk poster
 * evenly instead of parking their remainder in a block at the end, which is what a plain
 * round-robin does.
 */

export interface CompanyBearing {
  company_name?: string | null;
}

/** Jobs with no company name are one bucket; they are still real jobs and must not vanish. */
function companyKey(job: CompanyBearing): string {
  return String(job.company_name ?? "").trim().toLowerCase();
}

/**
 * Reorder one page so consecutive cards come from different employers where possible.
 * Returns a permutation of `jobs` — same length, same items.
 */
export function interleaveByCompany<T extends CompanyBearing>(jobs: readonly T[]): T[] {
  if (jobs.length < 3) return [...jobs];

  // Buckets in first-appearance order, each preserving the incoming order of its own jobs.
  const order: string[] = [];
  const buckets = new Map<string, T[]>();
  for (const job of jobs) {
    const key = companyKey(job);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(job);
    else {
      buckets.set(key, [job]);
      order.push(key);
    }
  }

  // One employer, or one job each: there is nothing to interleave and the input order stands.
  if (buckets.size === 1 || buckets.size === jobs.length) return [...jobs];

  // A cursor per bucket rather than shift(), so this stays linear on a page of any size.
  const cursor = new Map<string, number>(order.map((key) => [key, 0]));
  const remaining = (key: string) => (buckets.get(key)?.length ?? 0) - (cursor.get(key) ?? 0);

  const out: T[] = [];
  let previous: string | null = null;

  while (out.length < jobs.length) {
    let pick: string | null = null;
    let fallback: string | null = null;
    for (const key of order) {
      const left = remaining(key);
      if (left === 0) continue;
      // `order` is stable and the comparison is strict, so ties resolve to first appearance and
      // the whole function is deterministic for a given input.
      if (fallback === null || left > remaining(fallback)) fallback = key;
      if (key === previous) continue;
      if (pick === null || left > remaining(pick)) pick = key;
    }
    // `pick` is null only when everything left belongs to the employer that just went — the
    // tail of a page one company dominates. Taking it is correct: dropping it is not an option.
    const key: string | null = pick ?? fallback;
    if (key === null) break;
    out.push(buckets.get(key)![cursor.get(key)!]);
    cursor.set(key, (cursor.get(key) ?? 0) + 1);
    previous = key;
  }

  return out;
}
