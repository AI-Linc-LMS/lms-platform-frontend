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
