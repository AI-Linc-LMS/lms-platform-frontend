/**
 * A finished custom-input run must not look like a pending test run.
 *
 * Reported: "this issue is coming inside coding problem when I have executed a custom test case -
 * though it is executed successfully in custom input section, the test case section started giving
 * this... and when the code is ran for the inbuilt test cases this issue is gone."
 *
 * `AssessmentCodingLayout` puts a custom-input run into the SAME `testResults` state the Test Cases
 * panel reads, tagged `custom_input: true`. A custom run has no per-case results by its nature, so
 * the panel saw "a result exists, with zero cases" and showed "Code executed. Waiting for test
 * results..." - for something that had already finished, and whose output was sitting in the tab
 * next to it. Running the built-in tests replaced the state and cleared the message, which is what
 * made it look intermittent rather than wrong.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

describe("the Test Cases panel", () => {
  it("does not claim to be waiting when the result came from a custom run", () => {
    const src = read("components/coding/TestResults.tsx");
    const waiting = src
      .split("\n")
      .find((l) => l.includes("totalCount === 0 && testResults &&"));
    expect(waiting, "the waiting alert's condition").toBeTruthy();
    expect(
      waiting,
      "a custom-input run has no cases by design; it is finished, not pending",
    ).toMatch(/!testResults\.custom_input/);
  });

  it("points the learner at the tab that actually has their output", () => {
    const src = read("components/coding/TestResults.tsx");
    expect(src).toMatch(/custom-input run - its output is in the Custom Input tab/);
  });

  it("still waits when a real test run produced no cases", () => {
    // The genuine case the message was written for must survive.
    const src = read("components/coding/TestResults.tsx");
    expect(src).toMatch(/Code executed\. Waiting for test results\.\.\./);
  });

  it("the assessment layout is what tags a custom run", () => {
    const src = read("components/assessment/AssessmentCodingLayout.tsx");
    expect(src).toMatch(/custom_input: true/);
  });
});
