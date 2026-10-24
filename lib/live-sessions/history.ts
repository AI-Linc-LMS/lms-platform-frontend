import type { StudentLiveSession } from "@/lib/services/live-sessions";

/** Meeting states a History entry can be in: the class already happened, or its window closed. */
export const PAST_MEETING_STATES = new Set(["ended", "expired"]);

/**
 * The learner's History: every past sitting of the batches and courses they can see, newest first.
 *
 * It used to drop sittings flagged `before_enrolment` (held before the learner was added to the
 * batch), so they could not be stamped "Missed". That hid them entirely, and with them the
 * recording and the study material on each card: on Agileology 113 learners had batch classes
 * missing from History (2,876 class-dates), and for anyone added after a batch started the tab was
 * simply empty. Sixteen of those hidden classes were ones the learner had actually attended,
 * because "added to the batch" is when the membership row was created, which moves when someone
 * is re-added. So they are listed now and the row labels them instead (HistoryRow: "Before you
 * joined", or "Attended" when there is an attendance record). Attendance percentages are
 * unaffected: the server already leaves these sittings out of the denominator.
 */
export function selectHistory(
  instances: StudentLiveSession[],
  matchesSelectedDay: (s: StudentLiveSession) => boolean,
): StudentLiveSession[] {
  return instances
    .filter((s) => PAST_MEETING_STATES.has(s.meeting_status ?? "") && matchesSelectedDay(s))
    .sort((a, b) => (b.class_datetime || "").localeCompare(a.class_datetime || ""));
}
