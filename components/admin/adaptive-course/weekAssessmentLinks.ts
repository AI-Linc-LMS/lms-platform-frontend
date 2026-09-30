import type { AdminAdaptiveCourseWeekAssessment } from "@/lib/services/admin/admin-adaptive-course.service";

/**
 * Where each action on a week's assessment goes.
 *
 * Kept as a pure function because the destinations are the whole point of the feature: an admin
 * could see none of these before, and a wrong `tab` value silently lands on "overview" rather than
 * failing, so it is worth pinning in a test.
 *
 * All three live on the assessment edit page, which carries a `?tab=` param
 * (ASSESSMENT_EDIT_TAB_VALUES). There is no standalone submissions-list route; the submissions table
 * and the marks are that page's `submissions` tab.
 */
export type WeekAssessmentAction = "view" | "questions" | "submissions";

export function weekAssessmentHref(
  a: Pick<AdminAdaptiveCourseWeekAssessment, "assessment_id">,
  action: WeekAssessmentAction,
): string {
  const tab = action === "view" ? "overview" : action;
  return `/admin/assessment/${a.assessment_id}/edit?tab=${tab}`;
}

/** The learner-facing paper, for an admin who wants to see what the learner sees. */
export function weekAssessmentPreviewHref(
  a: Pick<AdminAdaptiveCourseWeekAssessment, "slug">,
  courseId: number,
): string | null {
  return a.slug ? `/assessments/${a.slug}?courseId=${courseId}` : null;
}

/** One line describing the paper, for under its title. */
export function weekAssessmentSummary(a: AdminAdaptiveCourseWeekAssessment): string {
  const parts: string[] = [];
  if (a.question_count > 0) {
    parts.push(`${a.question_count} question${a.question_count === 1 ? "" : "s"}`);
  }
  if (a.duration_minutes) parts.push(`${a.duration_minutes} min`);
  if (a.points > 0) parts.push(`${a.points} pts`);
  if (a.proctoring_enabled) parts.push("proctored");
  // Said plainly rather than left to a missing badge: a deactivated paper answers 404 to every
  // learner who opens it, which is not something to infer from an absent chip.
  if (!a.is_active) parts.push("not active - learners cannot open it");
  return parts.join(" · ");
}

/** The label for the paper's type, in the words an admin uses. */
export function weekAssessmentTypeLabel(
  type: AdminAdaptiveCourseWeekAssessment["type"],
): string {
  if (type === "week_final") return "Final assessment";
  if (type === "calibration") return "Calibration";
  return "Checkpoint";
}
