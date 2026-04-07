/**
 * Whether an assessment can show the admin "Live monitor" entry:
 * proctoring on, assessment active flag on, and current time within optional window.
 */
export function isProctoredAssessmentInLiveWindow(a: {
  proctoring_enabled?: boolean;
  is_active: boolean;
  start_time?: string | null;
  end_time?: string | null;
}): boolean {
  if (!a.proctoring_enabled || !a.is_active) return false;
  const now = Date.now();
  if (a.start_time) {
    const start = new Date(a.start_time).getTime();
    if (!Number.isNaN(start) && now < start) return false;
  }
  if (a.end_time) {
    const end = new Date(a.end_time).getTime();
    if (!Number.isNaN(end) && now > end) return false;
  }
  return true;
}
