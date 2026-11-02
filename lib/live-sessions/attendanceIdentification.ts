import type { LiveActivity } from "@/lib/services/admin/admin-live-activities.service";

/**
 * The sessions whose attendance would be guessed rather than identified - the banner's list.
 *
 * Derived from the list the page already holds, so it needs no worker, no task and no extra
 * request to be right. That is the point: the first class of Agileology's batch 8027-M
 * (2026-11-02) credited 11 of 61 learners while 41 sat it, and the only thing that could have
 * warned anyone was a sweep that had nothing to say until afterwards.
 *
 * `pending` is a batch webinar nobody has registered with Zoom yet; `name_only` is a Zoom meeting
 * (registration cannot disclose addresses there) or a webinar whose registration was switched
 * off in Zoom. A session that has already run, or was cancelled, is nobody's problem any more.
 */
export function sessionsNeedingAttendanceAttention(sessions: LiveActivity[]): LiveActivity[] {
  return sessions.filter((s) => {
    const mode = s.attendance_identification?.mode;
    if (mode !== "pending" && mode !== "name_only") return false;
    if (s.zoom_status === "cancelled" || s.google_status === "cancelled") return false;
    const status = s.meeting_status ?? "scheduled";
    return status === "scheduled" || status === "live";
  });
}
