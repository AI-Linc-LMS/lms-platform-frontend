import type { Assessment } from "@/lib/services/assessment.service";

const MANUAL_POST_SUBMIT_REVIEW_STATUSES = new Set<
  NonNullable<Assessment["review_status"]>
>(["pending_evaluation", "evaluated", "published"]);

/** Aligns API quirks with UI: finalized/completed → submitted; manual review pipeline implies submitted. */
export function normalizeLearnerAssessmentStatus(
  assessment: Pick<Assessment, "status">,
): string {
  const raw = assessment.status ?? "not_started";
  if (raw === "finalized" || raw === "completed") return "submitted";
  return raw;
}

/** True when the learner has finished the assessment (including manual submit awaiting publication). */
export function isLearnerAssessmentSubmissionComplete(
  assessment: Pick<
    Assessment,
    "status" | "evaluation_mode" | "review_status"
  >,
): boolean {
  const normalized = normalizeLearnerAssessmentStatus(assessment);
  if (normalized === "submitted") return true;

  const rs = assessment.review_status;
  if (
    assessment.evaluation_mode === "manual" &&
    rs &&
    MANUAL_POST_SUBMIT_REVIEW_STATUSES.has(rs) &&
    normalized !== "in_progress"
  ) {
    return true;
  }
  return false;
}

/**
 * List/catalog filter: learner has submitted or legacy `is_attempted` without `status`
 * (same breadth the assessments list previously used for “completed”).
 */
export function isLearnerAssessmentSubmittedForCatalog(
  assessment: Pick<
    Assessment,
    "status" | "evaluation_mode" | "review_status" | "is_attempted" | "has_attempted"
  >,
): boolean {
  if (isLearnerAssessmentSubmissionComplete(assessment)) return true;
  if (assessment.status === "submitted" || assessment.status === "completed") {
    return true;
  }
  if (assessment.status === undefined || assessment.status === null) {
    return !!(assessment.is_attempted || assessment.has_attempted);
  }
  return false;
}

/** Learner may open results (list/catalog semantics; includes legacy attempted rows). */
export function canViewLearnerAssessmentResults(
  assessment: Pick<
    Assessment,
    | "status"
    | "evaluation_mode"
    | "review_status"
    | "show_result"
    | "is_attempted"
    | "has_attempted"
  >,
): boolean {
  if (!isLearnerAssessmentSubmittedForCatalog(assessment)) return false;
  if (assessment.show_result === false) return false;
  if (assessment.evaluation_mode === "manual") {
    return assessment.review_status === "published";
  }
  return true;
}

/** Submitted for catalog but results not available yet (manual grading, hidden scores, etc.). */
export function isLearnerAssessmentSubmittedUnderReview(
  assessment: Pick<
    Assessment,
    | "status"
    | "evaluation_mode"
    | "review_status"
    | "show_result"
    | "is_attempted"
    | "has_attempted"
  >,
): boolean {
  return (
    isLearnerAssessmentSubmittedForCatalog(assessment) &&
    !canViewLearnerAssessmentResults(assessment)
  );
}
