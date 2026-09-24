import type {
  Student,
  CourseCompletionStats,
} from "@/lib/services/admin/admin-student.service";

export interface RiskFlags {
  neverLoggedIn: boolean;
  neverActive: boolean;
  inactive: boolean;
  lowCompletion: boolean;
  noStreak: boolean;
  atRisk: boolean;
}

const INACTIVE_DAYS = 30;
const LOW_COMPLETION_PCT = 30;
const HIGH_COMPLETION_PCT = 75;

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

export type SegmentKey =
  | "all"
  | "never_logged_in"
  | "never_active"
  | "at_risk"
  | "inactive"
  | "low_completion"
  | "high_performers";

/** Every segment except the "all" escape hatch - the six documented signals. */
export type SignalKey = Exclude<SegmentKey, "all">;

/**
 * The ONE table of engagement-health signals. The quick-filter chips (desktop and phone), the
 * chip counts and the "how these signals are calculated" popover are all rendered from this, so
 * a signal cannot be documented without being filterable - the bug this table exists to prevent
 * was six signals in the popover and four chips under it.
 *
 * `matches` is the only definition of each signal. Nothing else may re-derive one.
 */
export interface StudentSignal {
  key: SignalKey;
  /** i18n key, with the English text as the default value. */
  labelKey: string;
  label: string;
  ruleKey: string;
  rule: string;
  icon: string;
  color: string;
  matches: (student: Student, stats?: CourseCompletionStats) => boolean;
}

const isEnrolled = (student: Student) => (student.enrollment_count ?? 0) > 0;

/** No last-login on the account. Shared with the student detail page's "Never logged in". */
export function isNeverLoggedIn(student: Pick<Student, "last_login">): boolean {
  return !student.last_login;
}

/** Nothing has ever been recorded for this student (in the selected course, if one is). */
export function isNeverActive(
  student: Pick<Student, "last_activity_date" | "activity_summary">
): boolean {
  return (
    !student.last_activity_date &&
    (student.activity_summary?.total_activities ?? 0) === 0
  );
}

/** No activity in the last 30 days - "never active" counts, it is the worst case of it. */
export function isInactive30d(
  student: Pick<Student, "last_activity_date">
): boolean {
  if (!student.last_activity_date) return true;
  const last = new Date(student.last_activity_date).getTime();
  if (Number.isNaN(last)) return true;
  return (Date.now() - last) / (1000 * 60 * 60 * 24) > INACTIVE_DAYS;
}

export const STUDENT_SIGNALS: StudentSignal[] = [
  {
    key: "at_risk",
    labelKey: "studentSegments.atRisk",
    label: "At risk",
    ruleKey: "studentSegments.atRiskRule",
    rule:
      "Enrolled and matching at least one of the server's at-risk rules. Unenrolled students are never flagged.",
    icon: "mdi:alert-circle-outline",
    color: "var(--danger-500, #ef4444)",
    matches: (student) => student.at_risk === true,
  },
  {
    key: "inactive",
    labelKey: "studentSegments.inactive",
    label: "Inactive 30d",
    ruleKey: "studentSegments.inactiveRule",
    rule:
      "Enrolled, and no activity in the last 30 days (or never active). Unenrolled students are never flagged.",
    icon: "mdi:sleep",
    color: "#f59e0b",
    // The enrolment test is part of the rule, not an extra the chip adds: an unenrolled student
    // with no activity is expected, not a concern. It used to live only in the filter, so the
    // popover promised a wider list than the chip returned.
    matches: (student) => isEnrolled(student) && isInactive30d(student),
  },
  {
    key: "low_completion",
    labelKey: "studentSegments.lowCompletion",
    label: "Low completion",
    ruleKey: "studentSegments.lowCompletionRule",
    rule: "Overall course content completion is below 30%.",
    icon: "mdi:chart-line-variant",
    color: "#a855f7",
    matches: (_student, stats) =>
      !!stats && stats.completion_percentage < LOW_COMPLETION_PCT,
  },
  {
    key: "high_performers",
    labelKey: "studentSegments.highPerformers",
    label: "High performers",
    ruleKey: "studentSegments.highPerformersRule",
    rule: "Overall content completion is 75% or higher.",
    icon: "mdi:trophy-outline",
    color: "#10b981",
    matches: (_student, stats) =>
      !!stats && stats.completion_percentage >= HIGH_COMPLETION_PCT,
  },
  {
    key: "never_logged_in",
    labelKey: "studentSegments.neverLoggedIn",
    label: "Never logged in",
    ruleKey: "studentSegments.neverLoggedInRule",
    rule: "The account has never authenticated (no last-login).",
    icon: "mdi:login-variant",
    color: "#94a3b8",
    matches: (student) => isNeverLoggedIn(student),
  },
  {
    key: "never_active",
    labelKey: "studentSegments.neverActive",
    label: "Never active",
    ruleKey: "studentSegments.neverActiveRule",
    rule: "No course / content activity has ever been recorded.",
    icon: "mdi:radar",
    color: "#f59e0b",
    matches: (student) => isNeverActive(student),
  },
];

const SIGNAL_BY_KEY: Record<SignalKey, StudentSignal> = STUDENT_SIGNALS.reduce(
  (acc, signal) => {
    acc[signal.key] = signal;
    return acc;
  },
  {} as Record<SignalKey, StudentSignal>
);

/**
 * Engagement-health flags for a student, derived from data the directory already has. Every
 * flag is the segment's own predicate, so a badge and its chip can never disagree. `atRisk` is
 * the server's verdict, not a browser-side guess: the browser rule (legacy enrolment + legacy
 * completion) disagreed with the dashboard on most students.
 */
export function studentRiskFlags(
  student: Student,
  stats?: CourseCompletionStats
): RiskFlags {
  return {
    neverLoggedIn: SIGNAL_BY_KEY.never_logged_in.matches(student, stats),
    neverActive: SIGNAL_BY_KEY.never_active.matches(student, stats),
    inactive: isInactive30d(student),
    lowCompletion: SIGNAL_BY_KEY.low_completion.matches(student, stats),
    noStreak: (student.current_streak ?? 0) === 0,
    atRisk: SIGNAL_BY_KEY.at_risk.matches(student, stats),
  };
}

/**
 * Whether a student matches a directory segment quick-filter.
 *
 * Exactly one segment is ever selected: the chips are a single choice, not a set, so there is no
 * AND/OR to decide. Picking a second chip replaces the first and picking the selected one clears
 * it. The signals overlap by design ("At risk" is a compound, "Inactive 30d" includes "never
 * active"), and an implicit AND across overlapping rules would answer questions nobody asked.
 */
export function matchesSegment(
  segment: SegmentKey,
  student: Student,
  stats?: CourseCompletionStats
): boolean {
  if (segment === "all") return true;
  const signal = SIGNAL_BY_KEY[segment];
  return signal ? signal.matches(student, stats) : true;
}

/**
 * How many of `students` each chip would return. Computed from the same predicate the filter
 * uses, over the same population, so a chip's number always equals the rows it opens.
 */
export function segmentCounts(
  students: Student[],
  statsFor: (student: Student) => CourseCompletionStats | undefined
): Record<SignalKey, number> {
  const counts = STUDENT_SIGNALS.reduce((acc, signal) => {
    acc[signal.key] = 0;
    return acc;
  }, {} as Record<SignalKey, number>);
  for (const student of students) {
    const stats = statsFor(student);
    for (const signal of STUDENT_SIGNALS) {
      if (signal.matches(student, stats)) counts[signal.key] += 1;
    }
  }
  return counts;
}

/**
 * The completion row for a student.
 *
 * The course-completion endpoint keys its rows by UserProfile id, which is `Student.id`.
 * Looking `user_id` up first could land on a DIFFERENT student whose profile id happens to
 * equal this student's user id - and then the row's % column, the chip count and the chip
 * filter would each be answering about someone else.
 */
export function completionStatsFor(
  stats: Record<number, CourseCompletionStats>,
  student: Pick<Student, "id" | "user_id">
): CourseCompletionStats | undefined {
  return stats[student.id] ?? stats[student.user_id];
}
