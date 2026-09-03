import type { InstructorLiveSession } from "@/lib/services/instructor.service";

/**
 * These must stay in step with InstructorLiveSession["status"] in instructor.service.ts,
 * which has always included "cancelled". The page used to narrow it away to three values,
 * which made a cancelled session unrepresentable: statusOf() matched none of them and fell
 * through to deriving status from the clock, so an admin-cancelled future class kept reading
 * "Scheduled" to its instructor.
 */
export type SessionStatus = "live" | "scheduled" | "ended" | "cancelled";

/**
 * The server decides. Its rule is evidence-first - cancelled, then "the host hung up", then
 * the clock - so a class the trainer has already ended reads Ended instead of staying Live
 * until its scheduled finish. The clock is only a fallback for a payload that predates the
 * server field.
 */
export function statusOf(s: InstructorLiveSession, now: number): SessionStatus {
  // "cancelled" is evidence and outranks the clock: a cancelled class is cancelled whether
  // its slot is in the future or the past.
  if (s.status === "cancelled") return "cancelled";
  if (s.status === "live" || s.status === "scheduled" || s.status === "ended") return s.status;
  // The server also emits "expired" (past its end, never explicitly ended). That is Ended as
  // far as an instructor is concerned, but say so rather than leaving it to the fallback.
  if (s.status === "expired") return "ended";
  const start = new Date(s.class_datetime).getTime();
  const end = start + (s.duration_minutes || 0) * 60_000;
  if (now >= start && now <= end) return "live";
  if (now < start) return "scheduled";
  return "ended";
}
