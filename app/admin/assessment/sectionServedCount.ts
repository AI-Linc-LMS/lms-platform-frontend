/**
 * How many questions a section actually serves, versus how many sit in its bank.
 *
 * A section stores `number_of_questions` and draws that many at random from its pool
 * each attempt; the backend sampler clamps with `min(number_to_pick, len(pool))`. So a
 * section configured for 8 with 10 in the bank serves 8, and the other 2 are never seen
 * by that student -- and because the draw is random rather than ordered, they are not
 * "the last 2 added", they are a different 2 every attempt.
 *
 * The overview used to print `s.questions.length` (the bank) in the section row while
 * the header stat printed the configured count, so one screen showed both 8 and 10 with
 * nothing to explain the gap. Everything that renders a question count goes through
 * here so the two cannot drift apart again.
 */

export interface SectionCounts {
  /** Questions this section actually puts in front of a student. */
  served: number;
  /** Questions available in the bank. */
  pool: number;
  /** Bank questions that will not be served this attempt. */
  discarded: number;
}

export function sectionCounts(
  configured: number | null | undefined,
  pool: number,
): SectionCounts {
  const safePool = Number.isFinite(pool) && pool > 0 ? Math.floor(pool) : 0;
  const wanted =
    typeof configured === "number" && Number.isFinite(configured) && configured > 0
      ? Math.floor(configured)
      : null;
  const served = wanted === null ? safePool : Math.min(wanted, safePool);
  return { served, pool: safePool, discarded: Math.max(safePool - served, 0) };
}

/** The section row's caption: honest when sampling is on, unchanged when it is not. */
export function describeSectionCount(counts: SectionCounts): string {
  const { served, pool, discarded } = counts;
  if (discarded > 0) return `${served} of ${pool} drawn per attempt`;
  return `${pool} question${pool === 1 ? "" : "s"}`;
}

/** Rolled up across sections, for the warning banner and the publish confirmation. */
export function totalDiscarded(all: SectionCounts[]): number {
  return all.reduce((n, c) => n + c.discarded, 0);
}

/**
 * The sentence shown before publishing. Null when nothing is being dropped, so the
 * caller can skip the extra confirm entirely.
 */
export function discardWarning(all: SectionCounts[]): string | null {
  const dropped = totalDiscarded(all);
  if (dropped <= 0) return null;
  const sections = all.filter((c) => c.discarded > 0).length;
  const served = all.reduce((n, c) => n + c.served, 0);
  const pool = all.reduce((n, c) => n + c.pool, 0);
  return (
    `This paper serves ${served} of the ${pool} questions in its bank. ` +
    `${dropped} question${dropped === 1 ? "" : "s"} across ${sections} section` +
    `${sections === 1 ? "" : "s"} will not be shown, and the ones left out are ` +
    `picked at random for each student. Raise the section's question count to include them.`
  );
}
