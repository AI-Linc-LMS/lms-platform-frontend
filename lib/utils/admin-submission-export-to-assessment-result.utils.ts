import type { AssessmentResult } from "@/lib/services/assessment.service";
import type {
  SubmissionsExportResponse,
  SubmissionsExportSubmission,
} from "@/lib/services/admin/admin-assessment.service";

function numOr(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v != null && typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function firstFiniteNumber(...vals: unknown[]): number {
  for (const v of vals) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return 0;
}

function hasProctoringPayload(
  p: SubmissionsExportSubmission["proctoring"],
): boolean {
  if (!p || typeof p !== "object") return false;
  return Object.keys(p).length > 0;
}

/**
 * Map admin submissions-export row + assessment metadata into {@link AssessmentResult}
 * for {@link generateAssessmentResultPdfVector}.
 */
export function mapSubmissionsExportRowToAssessmentResult(
  res: SubmissionsExportResponse,
  sub: SubmissionsExportSubmission,
): AssessmentResult {
  const a = res.assessment;
  const st = sub.stats;

  const totalQuestions = numOr(
    st?.total_questions,
    numOr(sub.total_questions, 0),
  );
  const attemptedQuestions = numOr(
    st?.attempted_questions,
    numOr(sub.attempted_questions, 0),
  );
  const correctAnswers = numOr(st?.correct_answers, 0);
  const incorrectAnswers = numOr(st?.incorrect_answers, 0);
  const maxMarks = numOr(
    st?.maximum_marks,
    numOr(sub.maximum_marks, numOr(a.maximum_marks, 0)),
  );

  const statsScore = firstFiniteNumber(
    st?.score,
    sub.overall_score,
    sub.score,
    0,
  );

  const stats: AssessmentResult["stats"] = {
    total_questions: totalQuestions,
    attempted_questions: attemptedQuestions,
    correct_answers: correctAnswers,
    score: statsScore,
    incorrect_answers: incorrectAnswers,
    accuracy_percent: numOr(st?.accuracy_percent, 0),
    placement_readiness: numOr(st?.placement_readiness, 0),
    maximum_marks: maxMarks,
    topic_wise_stats: st?.topic_wise_stats ?? {},
    top_skills: (st?.top_skills ?? []) as AssessmentResult["stats"]["top_skills"],
    low_skills: (st?.low_skills ?? []) as AssessmentResult["stats"]["low_skills"],
    percentile: numOr(st?.percentile, 0),
    time_taken_minutes: numOr(st?.time_taken_minutes, 0),
    total_time_minutes: numOr(st?.total_time_minutes, 0),
    percentage_time_taken: numOr(st?.percentage_time_taken, 0),
  };

  const proctoring = hasProctoringPayload(sub.proctoring)
    ? {
        tab_switches_count: sub.proctoring!.tab_switches_count,
        face_violations_count: sub.proctoring!.face_violations_count,
        fullscreen_exits_count: sub.proctoring!.fullscreen_exits_count,
        eye_movement_count: sub.proctoring!.eye_movement_count,
        face_validation_failures_count:
          sub.proctoring!.face_validation_failures_count,
        multiple_face_detections_count:
          sub.proctoring!.multiple_face_detections_count,
        total_violation_count: sub.proctoring!.total_violation_count,
      }
    : undefined;

  return {
    message: "",
    status: sub.status?.trim() || "submitted",
    score: stats.score,
    assessment_id: String(a.id),
    assessment_name: a.title,
    maximum_marks: maxMarks,
    student_name: sub.name,
    student_email: sub.email,
    student_phone:
      sub.phone != null && String(sub.phone).trim()
        ? String(sub.phone).trim()
        : undefined,
    show_result: a.show_result,
    stats,
    user_responses: sub.user_responses as AssessmentResult["user_responses"],
    proctoring,
  };
}

export function safeAssessmentPdfFileName(
  assessmentSlug: string,
  studentName: string,
): string {
  const slugPart = (assessmentSlug || "assessment").replace(
    /[^a-zA-Z0-9._-]+/g,
    "-",
  );
  const namePart = (studentName || "student")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return `${slugPart}-${namePart || "student"}-report.pdf`;
}
