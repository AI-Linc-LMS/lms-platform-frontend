/**
 * A course assessment must lead back into the course, at every hop.
 *
 * Reported: "the result is coming inside the assessment section not like the quiz result which comes
 * inside course".
 *
 * The assessment runtime had no idea a course existed. The journey card linked with `?courseId=`, the
 * detail page read neither that nor `from` and forwarded neither, and the submit hop navigated
 * unconditionally to `/assessments/{slug}/submission-success` whose "Back to assessments" goes to a
 * list the server EXCLUDES journey papers from. So a learner who finished a course assessment was
 * left in the standalone section with no route back to the course at all.
 *
 * The adaptive quiz already solved this - `lib/utils/return-to` threads `?from=` across its three
 * hops, and its own header comment says why: "a param dropped at any hop is a learner who finishes a
 * quiz launched from inside a course and is returned to the standalone quiz library instead of the
 * lesson they came from". It had eleven call sites and not one of them was in `app/assessments`.
 *
 * These tests assert on the source of each hop rather than rendering six pages: what matters is that
 * no hop hard-codes a destination that drops the return target. A rendering test of any single page
 * would have passed throughout the bug.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { safeFrom, withFrom } from "@/lib/utils/return-to";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

const HOPS: Array<{ name: string; file: string }> = [
  { name: "the paper's detail page", file: "app/assessments/[slug]/page.tsx" },
  { name: "the device check", file: "app/assessments/[slug]/device-check/page.tsx" },
  { name: "the player", file: "app/assessments/[slug]/take/page.tsx" },
  { name: "the submit hop", file: "lib/hooks/useAssessmentSubmission.ts" },
  { name: "the success page", file: "app/assessments/[slug]/submission-success/page.tsx" },
  { name: "the result page", file: "app/assessments/result/[slug]/page.tsx" },
];

describe("every hop of the assessment runtime carries the return target", () => {
  it.each(HOPS)("$name uses the shared return-to utility", ({ file }) => {
    expect(read(file)).toMatch(/from "@\/lib\/(utils\/return-to|hooks\/useReturnTo)"/);
  });

  it("no hop sends the learner to a hard-coded assessment list any more", () => {
    for (const { name, file } of [HOPS[4], HOPS[5]]) {
      const src = read(file);
      expect(src, `${name} still pushes a bare /assessments`).not.toMatch(
        /router\.push\((["'`])\/assessments\1\)/,
      );
    }
  });

  it("the submit hop no longer navigates to a bare success page", () => {
    const src = read(HOPS[3].file);
    // The one place a submitted learner is moved.
    expect(src).toMatch(/withFrom\(\s*`\/assessments\/\$\{slug\}\/submission-success`/);
    expect(src).not.toMatch(
      /window\.location\.replace\(\s*`\/assessments\/\$\{slug\}\/submission-success`\s*\)/,
    );
  });

  it("the detail page forwards the target into BOTH entry paths", () => {
    const src = read(HOPS[0].file);
    expect(src).toMatch(/withFrom\(`\/assessments\/\$\{slug\}\/take`/);
    expect(src).toMatch(/withFrom\(`\/assessments\/\$\{slug\}\/device-check`/);
  });
});

describe("the target itself survives the round trip", () => {
  it("builds a link a course can be read back out of", () => {
    const href = withFrom("/assessments/imp-19-wk01-final?courseId=19", "/adaptive-courses/19");
    const from = new URLSearchParams(href.split("?")[1]).get("from");
    expect(safeFrom(from)).toBe("/adaptive-courses/19");
  });

  it("appends with & when the href already has a query", () => {
    expect(withFrom("/a?b=1", "/adaptive-courses/19")).toBe(
      "/a?b=1&from=%2Fadaptive-courses%2F19",
    );
  });

  it("refuses an off-site target rather than carrying it", () => {
    // `from` arrives in the URL bar; these are the shapes safeFrom exists to stop.
    for (const evil of ["https://evil.example", "//evil.example", "/\\evil.example", "/\tx"]) {
      expect(withFrom("/assessments/x", evil)).toBe("/assessments/x");
    }
  });
});
