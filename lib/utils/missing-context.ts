/**
 * "This question seems to refer to a figure, table or code it doesn't include."
 *
 * The backend refuses to publish an adaptive-quiz question whose stem points at something it does
 * not carry ("How many rows does the join return here?" with no tables in sight): it answers 400
 * with `code: "missing_context"` and the questions it means. The rule misfires on some legitimate
 * wording, so the wizard and both quiz editors show those questions and let the author fix them
 * or save anyway; saving anyway resends the same request with `confirm_missing_context: true`.
 */

export const MISSING_CONTEXT_CODE = "missing_context";

export interface MissingContextQuestion {
  /** Position in the list of questions the request sent (0-based). */
  index: number;
  /** The question's id, when it already existed. */
  id: number | null;
  question_text: string;
  /** The server's sentence: what the stem points at and what it does not include. */
  reason: string;
  rule?: string;
  phrase?: string;
}

function isQuestion(value: unknown): value is MissingContextQuestion {
  const q = value as Partial<MissingContextQuestion> | null;
  return (
    !!q &&
    typeof q.index === "number" &&
    typeof q.question_text === "string" &&
    typeof q.reason === "string"
  );
}

/** The flagged questions when `err` is the server's missing-context refusal, else `null`. */
export function readMissingContext(err: unknown): MissingContextQuestion[] | null {
  const response = (err as { response?: { status?: number; data?: unknown } } | null)?.response;
  const data = response?.data as { code?: unknown; questions?: unknown } | undefined;
  if (response?.status !== 400 || !data || data.code !== MISSING_CONTEXT_CODE) return null;
  const questions = Array.isArray(data.questions) ? data.questions.filter(isQuestion) : [];
  return questions.length ? questions : null;
}

/**
 * A stem as plain text, for listing it. Parsed with DOMParser, which builds an inert document:
 * unlike setting innerHTML on an element of the page, nothing in it loads or runs.
 */
export function stemText(html: string): string {
  if (!html) return "";
  let text = html;
  if (typeof DOMParser !== "undefined") {
    text = new DOMParser().parseFromString(html, "text/html").body.textContent ?? "";
  } else {
    text = html.replace(/<[^>]*>/g, " ");
  }
  return text.replace(/\s+/g, " ").trim();
}
