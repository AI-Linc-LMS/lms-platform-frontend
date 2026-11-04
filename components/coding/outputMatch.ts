/**
 * Are these two outputs the same answer?
 *
 * A port of `normalize_output` / `outputs_match` in the backend's
 * `activity/utils/code_compiler/verdict.py`, which is the authority: the grader re-judges every
 * Judge0 "Wrong Answer" with exactly this comparison before deciding a test case failed.
 *
 * The scratch pad under the editor uses it so its "matches your expected output" can never
 * disagree with the verdict Submit would reach for the same two strings. A scratch pad that says
 * it matches where the grader says Wrong Answer is worse than having no scratch pad at all.
 *
 * Keep the two in step. The rules, and why each one exists:
 *  - CRLF and lone CR both become LF, so an expected value pasted from Windows is not a mismatch.
 *  - Trailing whitespace comes off EACH line: a stray space before a newline is not a wrong answer.
 *  - Trailing blank lines are dropped, so a final newline — or three — does not matter.
 *  - Leading whitespace is KEPT, deliberately. Indentation can be the answer (a pattern-printing
 *    problem), and trimming it would pass a wrong one.
 */
export function normalizeOutput(text: string | null | undefined): string {
  const body = (text ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return body
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

/** Whether these two outputs are the same answer, ignoring trailing-whitespace noise. */
export function outputsMatch(
  stdout: string | null | undefined,
  expected: string | null | undefined,
): boolean {
  return normalizeOutput(stdout) === normalizeOutput(expected);
}
