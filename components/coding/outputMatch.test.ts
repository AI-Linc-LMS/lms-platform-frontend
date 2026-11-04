/**
 * The scratch pad's comparison must agree with the grader's, case for case.
 *
 * `outputMatch.ts` is a port of the backend's `verdict.normalize_output`. If the two ever drift,
 * the scratch pad tells a learner their output matches and Submit then marks the same string
 * Wrong Answer - which destroys the point of having the scratch pad. Every case below is one the
 * Python docstring calls out, plus the one it warns against "fixing".
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { normalizeOutput, outputsMatch } from "./outputMatch";

describe("normalizeOutput", () => {
  it("drops a trailing newline, however many", () => {
    expect(normalizeOutput("5\n")).toBe("5");
    expect(normalizeOutput("5\n\n\n")).toBe("5");
  });

  it("treats CRLF and CR as LF, so a value pasted from Windows still matches", () => {
    expect(normalizeOutput("a\r\nb")).toBe("a\nb");
    expect(normalizeOutput("a\rb")).toBe("a\nb");
  });

  it("strips trailing whitespace from every line, not just the last", () => {
    expect(normalizeOutput("a   \nb\t\nc")).toBe("a\nb\nc");
  });

  it("KEEPS leading whitespace, because indentation can be the answer", () => {
    expect(normalizeOutput("  *\n *")).toBe("  *\n *");
  });

  it("maps empty-ish input to the empty string", () => {
    for (const v of ["", "\n", "   \n  \n", null, undefined]) {
      expect(normalizeOutput(v)).toBe("");
    }
  });
});

describe("outputsMatch", () => {
  it("matches a correct answer that differs only in trailing newline", () => {
    expect(outputsMatch("5\n", "5")).toBe(true);
  });

  it("matches when the program printed nothing and nothing was expected", () => {
    // The empty-output trap: Judge0 itself gets this wrong, which is why the grader re-judges.
    expect(outputsMatch("", "")).toBe(true);
    expect(outputsMatch("", "\n")).toBe(true);
  });

  it("does NOT match a genuinely different answer", () => {
    expect(outputsMatch("5", "6")).toBe(false);
    expect(outputsMatch("1 2", "1  2")).toBe(false); // interior spacing is real
  });

  it("does NOT match when only the indentation differs", () => {
    expect(outputsMatch("  *", "*")).toBe(false);
  });
});

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

describe("the scratch pad's expected-output field", () => {
  const src = () => read("components/coding/AdaptiveCodingSolve.tsx");

  it("never sends an expected output to the server", () => {
    // The whole reason run_code_with_custom_input exists: Judge0 COMPARES stdout against any
    // expected_output it is given, so sending one would make every printing program come back
    // Wrong Answer. The comparison is ours, client-side, after the run.
    const call = src().slice(src().indexOf("runWithCustomInput"), src().indexOf("runWithCustomInput") + 400);
    expect(call).not.toMatch(/expected/i);
  });

  it("gives no verdict when the learner left the expected output blank", () => {
    expect(src()).toMatch(/customExpectedText !== ""/);
  });

  it("gives no verdict when the program crashed, because the error is the answer", () => {
    expect(src()).toMatch(/customRanCleanly/);
  });

  it("uses the shared comparison rather than a second ===", () => {
    expect(src()).toMatch(/outputsMatch\(/);
  });
});
