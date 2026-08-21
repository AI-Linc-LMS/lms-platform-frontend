import type { StudentLiveSession } from "./types";

export interface NextSitting {
  /** The occurrence this resolves to; null for a single (non-recurring) session. */
  id: number | null;
  startIso: string;
  startMs: number;
  durationMin: number;
  /** The clock is inside [start, start + duration] right now. */
  live: boolean;
}

const DEFAULT_DURATION_MIN = 60;

/**
 * When this session next sits, resolved against its occurrences.
 *
 * A recurring series is ONE row whose `class_datetime` is frozen at occurrence #1 by the backend's
 * documented contract, so it is usually long past - reading it as "the time of the class" makes a
 * months-old series read as starting now, forever. The dates that can actually arrive are the
 * occurrences'.
 *
 * Returns the sitting in progress if there is one, otherwise the soonest future sitting, otherwise
 * null (nothing left to come). A session cancelled by notice returns null: the meeting still exists
 * and is joinable, so anything offering a Join button must drop it rather than advertise a class
 * that is off.
 */
export function nextSitting(s: StudentLiveSession, now: number = Date.now()): NextSitting | null {
  if (s.notice_type === "cancelled") return null;

  const occs = s.occurrences ?? [];
  const candidates: { id: number | null; iso: string; durationMin: number }[] = [];

  if (s.zoom_is_recurring && occs.length > 0) {
    for (const o of occs) {
      if (o.status === "cancelled" || o.meeting_status === "cancelled") continue;
      if (!o.occurrence_datetime) continue;
      candidates.push({
        id: o.id,
        iso: o.occurrence_datetime,
        durationMin: o.duration_minutes ?? s.duration_minutes ?? DEFAULT_DURATION_MIN,
      });
    }
  } else if (s.class_datetime) {
    candidates.push({
      id: null,
      iso: s.class_datetime,
      durationMin: s.duration_minutes ?? DEFAULT_DURATION_MIN,
    });
  }

  let inProgress: NextSitting | null = null;
  let upcoming: NextSitting | null = null;

  for (const c of candidates) {
    const startMs = new Date(c.iso).getTime();
    if (Number.isNaN(startMs)) continue;
    const endMs = startMs + c.durationMin * 60_000;

    if (startMs <= now && now <= endMs) {
      // Earliest sitting still running wins, so overlapping dates cannot flap.
      if (!inProgress || startMs < inProgress.startMs) {
        inProgress = { id: c.id, startIso: c.iso, startMs, durationMin: c.durationMin, live: true };
      }
    } else if (startMs > now && (!upcoming || startMs < upcoming.startMs)) {
      upcoming = { id: c.id, startIso: c.iso, startMs, durationMin: c.durationMin, live: false };
    }
  }

  return inProgress ?? upcoming;
}
