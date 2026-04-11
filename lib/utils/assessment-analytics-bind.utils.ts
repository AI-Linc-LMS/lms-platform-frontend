import type {
  AssessmentAnalyticsQuestionLevelResults,
  AssessmentAnalyticsResponse,
  AssessmentAnalyticsStudentSectionScore,
} from "@/lib/services/admin/admin-assessment.service";

export function hasQuestionLevelResults(
  data: AssessmentAnalyticsResponse,
): boolean {
  const ql = data.question_level_results;
  if (!ql) return false;
  return (
    (ql.mcq?.length ?? 0) > 0 ||
    (ql.coding?.length ?? 0) > 0 ||
    (ql.subjective?.length ?? 0) > 0
  );
}

/** Flatten `students[].section_scores` (or legacy `student_section_scores`) for tables / PDF. */
export function flattenStudentSectionScores(
  data: AssessmentAnalyticsResponse,
): AssessmentAnalyticsStudentSectionScore[] {
  if (data.student_section_scores?.length) {
    return data.student_section_scores;
  }
  const out: AssessmentAnalyticsStudentSectionScore[] = [];
  for (const s of data.students ?? []) {
    for (const sec of s.section_scores ?? []) {
      out.push({
        user_profile_id: s.user_profile_id,
        name: s.name,
        section_title: sec.section_title,
        score: sec.score,
        max_score: sec.max_score,
        percentage: sec.percentage,
        questions_attempted: sec.questions_attempted,
        questions_correct: sec.questions_correct,
      });
    }
  }
  return out;
}

export function questionLevelResultsSummary(
  ql: AssessmentAnalyticsQuestionLevelResults,
): string {
  const n =
    (ql.mcq?.length ?? 0) +
    (ql.coding?.length ?? 0) +
    (ql.subjective?.length ?? 0);
  return `${n} item(s) across MCQ, coding, and subjective; ${ql.completed_submissions_used} completed submission(s) used.`;
}
