/**
 * What a video page should remember from the learner's earlier visits.
 *
 * Reported as "the progress bar is not moving as per the video" and "once it is done it should
 * show complete even if they revisit". Every visit drew its bar from this visit's playhead alone:
 * a half-watched video reopened at 0:00 with an empty bar, and a finished one reopened looking
 * untouched, its concepts locked again.
 */

/** Closer than this to either end, resuming is not worth a jump. */
const RESUME_MARGIN_SECONDS = 10;

/**
 * Where to pick the video up, or null to start from the beginning.
 *
 * Only an ACTIVE session resumes: a finished one starts over, which is what rewatching is.
 * `duration` may still be 0 while the player loads; the end-margin check waits for it.
 */
export function resumePoint(
  session: { status?: string; current_timestamp?: number } | null | undefined,
  duration: number,
): number | null {
  if (!session || session.status !== "active") return null;
  const at = Number(session.current_timestamp ?? 0);
  if (!Number.isFinite(at) || at < RESUME_MARGIN_SECONDS) return null;
  if (duration > 0 && at > duration - RESUME_MARGIN_SECONDS) return null;
  return at;
}

/** How much of the video the bar should show as watched: the best of any visit, 0-100. */
export function watchedPercent(savedPct: number | null | undefined, thisVisitPct: number): number {
  const best = Math.max(Number(savedPct) || 0, Number(thisVisitPct) || 0);
  return Math.min(Math.max(best, 0), 100);
}

/**
 * Has this learner finished this video on an earlier visit?
 *
 * `my_completed` is the completion record — the same one the topic page's tick reads — so the two
 * screens cannot disagree about whether a video is done. `rewatch_available` answers a different
 * question (may this learner watch it with no check-ins?), and reading completion off it tied the
 * badge to a watch-MODE rule: tightening who gets a question-free rewatch would then have quietly
 * un-completed videos. It stays here only as the fallback for a backend that predates the field,
 * so the page behaves during the deploy gap rather than calling every finished video unwatched.
 */
export function finishedBefore(
  companion: { my_completed?: boolean; rewatch_available?: boolean } | null | undefined,
): boolean {
  if (!companion) return false;
  return companion.my_completed ?? Boolean(companion.rewatch_available);
}

function idSet(ids: number[] | null | undefined): Set<number> {
  return new Set((ids ?? []).filter((id) => Number.isFinite(id)));
}

/**
 * The check-ins spent for THIS watch - the ones already asked, which must not be asked again.
 *
 * Per WATCH, deliberately. It used to be seeded from the learner's lifetime passes
 * (`my_passed_check_in_ids`) so that returning to a video did not re-ask what they had got right.
 * But every questioning mode reads this set, so on a video whose check-ins were all passed there
 * was nothing left for Normal pace to ask: it played straight through in silence, which is what
 * Rewatch is for, and the counter opened at "5/5 checks" on a watch that had asked nothing.
 *
 * What to ask is the watch's business; what to score is the learner's history. A reload resumes
 * the same session, so what it answered is still spent - and a new watch starts empty and is asked
 * the video's check-ins again. The server records a repeat of one already passed as practice, so
 * asking again cannot be scored twice.
 */
export function answeredThisWatch(
  session: { answered_check_in_ids?: number[] } | null | undefined,
): Set<number> {
  return idSet(session?.answered_check_in_ids);
}

/**
 * The check-ins this learner has PASSED, on any visit. For showing - never for suppressing.
 *
 * It marks the timeline and fills the "N checks passed" chip in Rewatch, where no check-in is in
 * force. Feeding it to `answeredThisWatch`'s set instead is the bug above.
 */
export function passedBefore(
  companion: { my_passed_check_in_ids?: number[] } | null | undefined,
): Set<number> {
  return idSet(companion?.my_passed_check_in_ids);
}
