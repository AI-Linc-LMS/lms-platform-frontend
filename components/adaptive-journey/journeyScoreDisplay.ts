/**
 * What a topic card should say about points.
 *
 * The board used to decide this on `done` alone: a topic that was not finished advertised
 * its whole total as "on offer" and said "earn full N pts", no matter how much the learner
 * had already banked on it. Two real nodes on one production course held 759 and 345 earned
 * points while showing exactly that, which is why this read as "marks remain at 0".
 *
 * Points are awarded per item (read, quiz, coding), so partial credit is the normal state of
 * a topic in progress - not an edge case.
 */
export type JourneyScoreDisplay =
  | { mode: "earned"; earned: number; total: number; label: string }
  | { mode: "on-offer"; total: number; label: string };

export function journeyScoreDisplay(
  score: { earned: number; total: number },
  done: boolean,
): JourneyScoreDisplay {
  if (done || score.earned > 0) {
    return {
      mode: "earned",
      earned: score.earned,
      total: score.total,
      label: done ? "earned" : "earned so far",
    };
  }
  return { mode: "on-offer", total: score.total, label: "on offer" };
}

/** The call-to-action line. Never promises "full" to someone already part-way. */
export function journeyAvailabilityLine(score: { earned: number; total: number }): string {
  if (score.earned > 0) {
    const remaining = Math.max(0, score.total - score.earned);
    return `Available now · ${remaining} of ${score.total} pts still to earn`;
  }
  return `Available now · earn full ${score.total} pts`;
}
