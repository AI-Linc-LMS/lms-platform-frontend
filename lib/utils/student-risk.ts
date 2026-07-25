import type {
  Student,
  CourseCompletionStats,
} from "@/lib/services/admin/admin-student.service";

export interface RiskFlags {
  inactive: boolean;
  lowCompletion: boolean;
  noStreak: boolean;
  atRisk: boolean;
}

const INACTIVE_DAYS = 30;
const LOW_COMPLETION_PCT = 30;

/**
 * Engagement-health flags for a student, derived from data the directory
 * already has. Shared by the directory's at-risk badge and the "segment"
 * quick-filters so both agree on what "at risk" means.
 */
export function studentRiskFlags(
  student: Student,
  stats?: CourseCompletionStats
): RiskFlags {
  let inactive = true;
  if (student.last_activity_date) {
    const last = new Date(student.last_activity_date).getTime();
    if (!Number.isNaN(last)) {
      const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
      inactive = days > INACTIVE_DAYS;
    }
  }
  const lowCompletion =
    !!stats && stats.completion_percentage < LOW_COMPLETION_PCT;
  const noStreak = (student.current_streak ?? 0) === 0;
  // Only flag enrolled students as at-risk - an unenrolled student with no
  // activity is expected, not a concern.
  const enrolled = (student.enrollment_count ?? 0) > 0;
  const atRisk = enrolled && (inactive || lowCompletion);
  return { inactive, lowCompletion, noStreak, atRisk };
}

export type SegmentKey =
  | "all"
  | "at_risk"
  | "inactive"
  | "low_completion"
  | "high_performers";

/** Whether a student matches a directory segment quick-filter. */
export function matchesSegment(
  segment: SegmentKey,
  student: Student,
  stats?: CourseCompletionStats
): boolean {
  if (segment === "all") return true;
  const flags = studentRiskFlags(student, stats);
  switch (segment) {
    case "at_risk":
      return flags.atRisk;
    case "inactive":
      return flags.inactive && (student.enrollment_count ?? 0) > 0;
    case "low_completion":
      return flags.lowCompletion;
    case "high_performers":
      return !!stats && stats.completion_percentage >= 75;
    default:
      return true;
  }
}
