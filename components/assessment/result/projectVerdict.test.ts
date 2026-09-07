import { describe, expect, it } from "vitest";
import { projectVerdict } from "./projectVerdict";
import type { ProjectResponseItem } from "@/lib/services/assessment.service";

/**
 * Assessment 870 ("project assessment") in prod: a project section holding two briefs,
 * "Working calculator" (id 6) and "Star rating widget" (id 15). The learner saved 3 files
 * against the calculator and passed 8 of 8 checks; they never opened the other one. Their
 * result page rendered none of it -- score 8/8 over "Attempted 0/0" and no review at all,
 * because the page only ever rendered quiz, coding and written sections.
 */

const base: ProjectResponseItem = {
  section_id: 1,
  section_title: "project assessment",
  project_id: 6,
  title: "Working calculator",
  tier: "auto",
  max_marks: 8,
  submitted: true,
  files: { "index.html": "<h1>hi</h1>" },
};

describe("an automatically checked project", () => {
  it("reports the checks that passed", () => {
    const v = projectVerdict({ ...base, passed: 8, total: 8 });
    expect(v.label).toBe("8 of 8 checks passed");
    expect(v.awaiting).toBe(false);
  });

  it("is not styled as a pass when checks failed", () => {
    const pass = projectVerdict({ ...base, passed: 8, total: 8 });
    const fail = projectVerdict({ ...base, passed: 3, total: 8 });
    expect(fail.label).toBe("3 of 8 checks passed");
    expect(fail.color).not.toBe(pass.color);
  });

  it("waits rather than inventing a verdict when the run has not reported", () => {
    expect(projectVerdict({ ...base, passed: undefined, total: undefined }).awaiting).toBe(true);
  });

  it("does not call a zero-check run a pass", () => {
    // `passed >= total` is true for 0 >= 0, which would have read "0 of 0 checks passed"
    // in success green.
    const v = projectVerdict({ ...base, passed: 0, total: 0 });
    expect(v.awaiting).toBe(true);
    expect(v.label).toBe("Awaiting review");
  });

  it("trusts the backend's awaiting_review over the numbers", () => {
    expect(projectVerdict({ ...base, passed: 8, total: 8, awaiting_review: true }).awaiting).toBe(true);
  });
});

describe("a rubric-marked project", () => {
  const rubric: ProjectResponseItem = { ...base, tier: "rubric", project_id: 15 };

  it("totals the confirmed criteria", () => {
    const v = projectVerdict({
      ...rubric,
      criteria: [
        { title: "Works", awarded: 4, max_marks: 5 },
        { title: "Readable", awarded: 2, max_marks: 3 },
      ],
    });
    expect(v.label).toBe("6 of 8 marks");
    expect(v.awaiting).toBe(false);
  });

  it("shows an unconfirmed rubric as unmarked, never as a score", () => {
    // The backend blanks `criteria` until an assessor confirms; a draft is not a mark.
    expect(projectVerdict({ ...rubric, criteria: [] }).awaiting).toBe(true);
  });
});

describe("a project the learner never opened", () => {
  it("reads as not attempted rather than awaiting review", () => {
    // Brief 15 in the prod case: a workspace exists holding starter files, but save_count
    // is 0, so the backend sends submitted:false.
    const v = projectVerdict({ ...base, project_id: 15, submitted: false, files: {} });
    expect(v.label).toBe("Not attempted");
    expect(v.awaiting).toBe(false);
  });

  it("still reviews work that was saved even if the flag says otherwise", () => {
    const v = projectVerdict({ ...base, submitted: false, files: { "a.js": "x" }, passed: 1, total: 2 });
    expect(v.label).toBe("1 of 2 checks passed");
  });
});
