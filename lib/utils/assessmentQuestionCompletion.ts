import { normalizeSubjectiveAnswer } from "@/utils/assessment.utils";

/**
 * Whether a single question counts as "addressed" for pre-submit checklist
 * (aligned with take page / submission UX).
 */
export function isAssessmentQuestionCompleted(
  sectionType: string,
  response: unknown,
): boolean {
  if (sectionType === "quiz") {
    return response !== undefined && response !== null && response !== "";
  }
  if (sectionType === "coding") {
    if (!response || typeof response !== "object") return false;
    const r = response as Record<string, unknown>;
    const isSubmitted = r.submitted === true;
    const totalCount = Number(r.total_tc ?? r.total_test_cases ?? 0) || 0;
    const passedCount = Number(r.tc_passed ?? r.passed ?? 0) || 0;
    // Align with coding sidebar (take page): starter/template code alone is not "done".
    // Count as addressed only after explicit submit, or after a run with ≥1 passing test.
    if (isSubmitted) return true;
    if (totalCount > 0 && passedCount > 0) return true;
    return false;
  }
  if (sectionType === "subjective") {
    const text =
      typeof response === "string"
        ? response
        : normalizeSubjectiveAnswer(response);
    return text.trim().length > 0;
  }
  return false;
}

export function getResponseForQuestion(
  responses: Record<string, Record<string, unknown>>,
  sectionType: string,
  questionId: string | number,
): unknown {
  const bucket = responses[sectionType] || {};
  return bucket[questionId] ?? bucket[String(questionId)];
}

export function formatChecklistQuestionLabel(
  sectionType: string,
  question: Record<string, unknown>,
  index: number,
): string {
  if (sectionType === "quiz") {
    const raw =
      (typeof question.question === "string" && question.question) ||
      (typeof question.question_text === "string" && question.question_text) ||
      "";
    const oneLine = raw.replace(/\s+/g, " ").trim();
    if (!oneLine) return `Question ${index + 1}`;
    return oneLine.length > 100 ? `${oneLine.slice(0, 97)}…` : oneLine;
  }
  if (sectionType === "coding") {
    const t =
      (typeof question.title === "string" && question.title) ||
      (typeof question.name === "string" && question.name) ||
      "";
    return t.trim() || `Problem ${index + 1}`;
  }
  if (sectionType === "subjective") {
    const raw =
      (typeof question.question_text === "string" && question.question_text) ||
      "";
    const oneLine = raw.replace(/\s+/g, " ").trim();
    if (!oneLine) return `Written ${index + 1}`;
    return oneLine.length > 120 ? `${oneLine.slice(0, 117)}…` : oneLine;
  }
  return `Item ${index + 1}`;
}
