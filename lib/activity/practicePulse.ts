/**
 * "The learner is still working" for surfaces that produce no input events.
 *
 * Time tracking treats pointer/keyboard/scroll as the sign that someone is actually there, which
 * is right for reading and coding and wrong for video: a learner watching a ten minute lecture
 * touches nothing, and an idle rule strict enough to stop an abandoned article from banking
 * practice minutes would stop their video too. The player already knows the difference - it
 * receives a tick for every fraction of a second of PLAYBACK - so it reports it here rather than
 * time tracking having to guess from the route.
 *
 * A bare timestamp rather than an event: the reader polls it at flush time, so there is nothing
 * to subscribe to, nothing to tear down, and a tick costs one assignment even at four a second.
 */
let lastPulseAt = 0;

/** Called by a media surface while content is genuinely playing. */
export function pulsePractice(): void {
  lastPulseAt = Date.now();
}

/** Epoch ms of the last playback tick, or 0 if nothing has ever played. */
export function lastPracticePulse(): number {
  return lastPulseAt;
}

/** Test seam - never call from app code. */
export function resetPracticePulse(): void {
  lastPulseAt = 0;
}
