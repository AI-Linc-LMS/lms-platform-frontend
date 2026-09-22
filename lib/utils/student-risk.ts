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
 * What "at risk" means. The SERVER decides it (admin_dashboard/insights/at_risk.py) and both the
 * dashboard's "Needs attention" list and this directory's "At risk" segment read that one
 * verdict. This copy is only the wording shown next to the chip; both payloads also ship the
 * server's own text, which wins when present.
 */
export const AT_RISK_RULES: Record<string, string> = {
  never_started: "Enrolled for 21+ days with no activity recorded yet.",
  gone_quiet: "No activity for 14 days or more.",
  behind_peers:
    "Fewer activities done in the last 90 days than most active students here (bottom quarter).",
  struggling:
    "Under 50% correct on first attempts at quizzes and coding in the last 30 days (3+ attempts).",
};

export const AT_RISK_ELIGIBILITY =
  "Checked: active student accounts enrolled in a course, on the platform for 21+ days. A student is at risk when they match at least one rule.";

/**
 * The Manage Students URL that lists every at-risk student - the dashboard's "View all".
 * `courseId` is the dashboard's ADAPTIVE course filter; the directory evaluates the same rule
 * for that course so the two lists are the same set.
 */
export function atRiskSegmentHref(courseId?: number | null): string {
  const params = new URLSearchParams({ segment: "at_risk" });
  if (courseId != null) params.set("riskCourse", String(courseId));
  return `/admin/manage-students?${params.toString()}`;
}

/**
 * Engagement-health flags for a student, derived from data the directory
 * already has. `atRisk` is the server's verdict, not a browser-side guess:
 * the browser rule (legacy enrolment + legacy completion) disagreed with the
 * dashboard on most students.
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
  const atRisk = student.at_risk === true;
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
