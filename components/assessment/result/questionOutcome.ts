/**
 * What actually happened to one question, for the post-assessment review.
 *
 * The review used to ask `is_correct ? tick : cross`, which has only two answers for three
 * different things. A question the learner never reached is not incorrect - they did not get
 * it wrong, they did not get to it - and in production 44,993 of 635,733 submitted MCQ answers
 * are blank, across 2,902 submissions. Every one of those was drawn as a red cross next to the
 * right answer, so a learner who ran out of time read a page telling them they had answered
 * twenty questions wrongly.
 */
export type QuestionOutcome = "correct" | "incorrect" | "unanswered";

/** The learner's answer, in every shape the API returns it. */
export type SelectedAnswer = string | string[] | null | undefined;

/**
 * True when the learner submitted nothing for this question.
 *
 * Blank strings and whitespace count as nothing: the sheet stores a skipped MCQ as "", and an
 * empty multi-select arrives as an empty array. `0` is deliberately NOT nothing - it is a
 * legitimate option index, and treating it as a skip would erase a real answer.
 */
export function isUnanswered(selected: SelectedAnswer): boolean {
  if (selected === null || selected === undefined) return true;
  if (Array.isArray(selected)) {
    return selected.every((v) => String(v ?? "").trim() === "");
  }
  return String(selected).trim() === "";
}

export function questionOutcome(
  selected: SelectedAnswer,
  isCorrect: boolean | null | undefined,
): QuestionOutcome {
  // Unanswered is checked FIRST and wins outright. A blank answer can still arrive with
  // is_correct false, which is exactly how it used to be mistaken for a wrong one.
  if (isUnanswered(selected)) return "unanswered";
  return isCorrect ? "correct" : "incorrect";
}

/** Badge presentation per outcome. Grey, not red: not answering is not a wrong answer. */
export const OUTCOME_STYLE: Record<
  QuestionOutcome,
  { icon: string; color: string; label: string }
> = {
  correct: { icon: "mdi:check", color: "var(--success-500)", label: "Correct" },
  incorrect: { icon: "mdi:close", color: "var(--error-500)", label: "Incorrect" },
  unanswered: { icon: "mdi:minus", color: "var(--font-tertiary, #94a3b8)", label: "Not answered" },
};
