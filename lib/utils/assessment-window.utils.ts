/**
 * Client-side scheduling window for assessments (authoritative enforcement remains on the API).
 */

export type AssessmentWindowStatus = "not_started" | "open" | "ended";

export function getAssessmentWindowStatus(
  startTime?: string | null,
  endTime?: string | null,
  nowMs: number = Date.now(),
): AssessmentWindowStatus {
  if (startTime?.trim()) {
    const s = new Date(startTime.trim()).getTime();
    if (!Number.isNaN(s) && nowMs < s) return "not_started";
  }
  if (endTime?.trim()) {
    const e = new Date(endTime.trim()).getTime();
    if (!Number.isNaN(e) && nowMs > e) return "ended";
  }
  return "open";
}
