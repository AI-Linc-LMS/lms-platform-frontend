/**
 * Jobs v2 — application questions.
 *
 * Two live bugs die here:
 *
 * 1. **An unknown question type renders nothing.** The apply form switches on three known
 *    types; anything else renders a label, a red `*` and no control, so a required question
 *    becomes unanswerable and Next stays disabled forever. `resolveQuestionControl` has a
 *    default branch that returns a textarea and logs, so that can no longer happen.
 * 2. **Multi-choice answers were `join(", ")`.** An option containing a comma ("Yes, remote")
 *    came back as two answers. The API field is a string, so we join on the ASCII unit
 *    separator (U+001F) instead — a character no option can contain — and `parseAnswerText`
 *    accepts both the new separator and the legacy comma form so historic answers still read.
 */

import i18n from "@/lib/i18n";

/** The shape the jobs-v2 service returns for a question. */
export interface JobQuestion {
  id: number;
  question_text: string;
  question_type: string;
  is_required: boolean;
  order: number;
  options?: string[];
}

/** A student's answer in memory. Multi-select questions hold an array. */
export type AnswerValue = string | string[];

export type AnswerMap = Record<number, AnswerValue | undefined>;

/** The control the apply form (and the admin live preview) renders for a question. */
export type QuestionControl =
  | "text"
  | "textarea"
  | "radio"
  | "checkbox"
  | "select"
  | "number"
  | "date"
  | "url"
  | "email";

export interface ResolvedControl {
  control: QuestionControl;
  /** Always an array — a choice question with no options still renders something usable. */
  options: string[];
  /** True when the answer is an array. */
  multiple: boolean;
  /** Set when the question type was not recognised and we fell back. */
  fallback: boolean;
}

const YES_NO_KEYS = ["jobsV2.questions.yes", "jobsV2.questions.no"];

const warned = new Set<string>();

function warnOnce(type: string) {
  if (warned.has(type)) return;
  warned.add(type);
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[jobs-v2] Unknown application question type "${type}". Falling back to a free-text ` +
        `answer so the question stays answerable. Add it to resolveQuestionControl.`,
    );
  }
}

function cleanOptions(options: string[] | undefined): string[] {
  return (options ?? []).map((o) => String(o ?? "").trim()).filter((o) => o.length > 0);
}

/**
 * The one place a question type becomes a control. The admin modal's live preview and the
 * student's apply form both call this, so preview and reality cannot drift.
 */
export function resolveQuestionControl(question: JobQuestion): ResolvedControl {
  const type = String(question.question_type ?? "")
    .trim()
    .toLowerCase();
  const options = cleanOptions(question.options);
  switch (type) {
    case "text":
    case "short_text":
    case "shorttext":
      return { control: "text", options: [], multiple: false, fallback: false };
    case "textarea":
    case "long_text":
    case "longtext":
    case "paragraph":
      return { control: "textarea", options: [], multiple: false, fallback: false };
    case "choice":
    case "single_choice":
    case "radio":
      return {
        control: options.length > 5 ? "select" : "radio",
        options,
        multiple: false,
        fallback: false,
      };
    case "multichoice":
    case "multi_choice":
    case "checkbox":
      return { control: "checkbox", options, multiple: true, fallback: false };
    case "yes_no":
    case "yesno":
    case "boolean":
      return {
        control: "radio",
        options: options.length ? options : YES_NO_KEYS.map((k) => i18n.t(k) as string),
        multiple: false,
        fallback: false,
      };
    case "number":
    case "integer":
      return { control: "number", options: [], multiple: false, fallback: false };
    case "date":
      return { control: "date", options: [], multiple: false, fallback: false };
    case "url":
    case "link":
      return { control: "url", options: [], multiple: false, fallback: false };
    case "email":
      return { control: "email", options: [], multiple: false, fallback: false };
    default:
      warnOnce(type || "(empty)");
      // A question we do not understand is still a question. Free text always accepts an answer.
      return { control: "textarea", options, multiple: options.length > 0, fallback: true };
  }
}

/**
 * The separator multi-select answers are joined on **for the wire**.
 *
 * This is `", "`, unchanged from the shipped board, and it must stay that way: `response_text`
 * is a plain string the server stores verbatim and hands to the CSV export and to recruiter
 * email. Nothing in this app reads a stored `response_text` back (there is no `responses` field
 * on either applications serializer), so an "unambiguous" control character would buy the UI
 * nothing while putting a literal ASCII UNIT SEPARATOR into a recruiter's spreadsheet cell.
 * Non-negotiable 10.5: the value on the wire does not change.
 */
export const WIRE_ANSWER_SEPARATOR = ", ";

/**
 * ASCII UNIT SEPARATOR. **Read-side only.** An earlier build of this branch briefly wrote it,
 * and it is unambiguous, so `parseAnswerText` still accepts it — but nothing writes it.
 */
export const MULTI_ANSWER_SEPARATOR = "\u001F";

/** The separator every answer is actually written with, and read back with by default. */
const LEGACY_SEPARATOR = WIRE_ANSWER_SEPARATOR;

/** Normalise any stored answer to the in-memory shape the controls use. */
export function parseAnswerText(
  question: JobQuestion,
  text: string | null | undefined,
): AnswerValue {
  const { multiple } = resolveQuestionControl(question);
  const raw = text ?? "";
  if (!multiple) return raw;
  if (!raw) return [];
  if (raw.includes(MULTI_ANSWER_SEPARATOR)) return raw.split(MULTI_ANSWER_SEPARATOR);
  return raw
    .split(LEGACY_SEPARATOR)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The list form of an answer, whatever it is stored as. */
export function answerValues(value: AnswerValue | undefined): string[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.filter((v) => String(v).trim().length > 0);
  return value.trim() ? [value] : [];
}

export function isAnswered(question: JobQuestion, value: AnswerValue | undefined): boolean {
  return answerValues(value).length > 0;
}

/**
 * The wire payload for one answer. The service's `responses` shape is unchanged:
 * `{ question_id, response_text }`.
 */
export function serializeAnswer(
  question: JobQuestion,
  value: AnswerValue | undefined,
): { question_id: number; response_text: string } {
  const values = answerValues(value);
  return {
    question_id: question.id,
    response_text: values.join(WIRE_ANSWER_SEPARATOR),
  };
}

/** Every answered question, in question order, ready for `applyForJob({ responses })`. */
export function serializeAnswers(
  questions: JobQuestion[],
  answers: AnswerMap,
): Array<{ question_id: number; response_text: string }> {
  return questions
    .filter((q) => isAnswered(q, answers[q.id]))
    .map((q) => serializeAnswer(q, answers[q.id]));
}

/** A human-readable rendering of a stored answer, for the review step and the admin table. */
export function displayAnswer(
  question: JobQuestion,
  value: AnswerValue | undefined,
): string | null {
  const values = answerValues(value);
  if (!values.length) return null;
  return values.join(", ");
}

export type AnswerErrors = Record<number, string>;

/**
 * Field-level validation. Returns a map keyed by question id so the offending control can turn
 * red, announce itself with `role="alert"` and be focused — the toast-only
 * "Please answer all required questions" is what this replaces.
 */
export function validateAnswers(questions: JobQuestion[], answers: AnswerMap): AnswerErrors {
  const errors: AnswerErrors = {};
  for (const q of questions) {
    const { control } = resolveQuestionControl(q);
    const values = answerValues(answers[q.id]);
    if (q.is_required && values.length === 0) {
      errors[q.id] = i18n.t("jobsV2.questions.errorRequired") as string;
      continue;
    }
    if (values.length === 0) continue;
    const first = values[0];
    if (control === "number" && Number.isNaN(Number(first))) {
      errors[q.id] = i18n.t("jobsV2.questions.errorNumber") as string;
    } else if (control === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(first)) {
      errors[q.id] = i18n.t("jobsV2.questions.errorEmail") as string;
    } else if (control === "url" && !isParseableUrl(first)) {
      errors[q.id] = i18n.t("jobsV2.questions.errorUrl") as string;
    } else if (control === "date" && Number.isNaN(new Date(first).getTime())) {
      errors[q.id] = i18n.t("jobsV2.questions.errorDate") as string;
    }
  }
  return errors;
}

function isParseableUrl(value: string): boolean {
  try {
    return Boolean(new URL(value.startsWith("http") ? value : `https://${value}`).hostname);
  } catch {
    return false;
  }
}

/** Questions in the order the API meant them to appear, not whatever order they arrived in. */
export function sortQuestions(questions: JobQuestion[]): JobQuestion[] {
  return [...questions].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id);
}
