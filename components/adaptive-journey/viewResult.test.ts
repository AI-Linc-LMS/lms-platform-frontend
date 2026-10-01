/**
 * A finished assessment must offer a way back to its result.
 *
 * Reported: "After an assessment is submitted, users can return to the assessment page but there is
 * no option to view or recheck their submitted results... in the adaptive page itself we can view
 * result - add view result button there where on journey nodes the assessments are coming per week."
 *
 * Two dead ends, both real:
 *
 *   journey board  - the card was clickable, but only the CURRENT step rendered a button, so a
 *                    completed assessment row showed a score and no affordance at all.
 *   assessment page - the CTA reads "Already submitted" and is disabled, which is right (the paper
 *                    is over) but left nothing to do for someone who came back to see how they did.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { nodeHref } from "./nodeHref";
import { isAssessmentNode } from "./JourneyBoard";
import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const node = (over: Partial<JourneyNodeView> = {}) =>
  ({
    id: 1, type: "week_final", title: "Week 1 Check", order: 1, status: "done",
    score: { earned: 180, total: 240 }, weight: 2, basePoints: 120,
    unlockRule: "sequential", lockReason: null, isCalibration: false,
    content: null, itemCount: 0, questionCount: 20, proctored: false, durationMinutes: 30,
    ref: { assessmentId: 923, assessmentSlug: "imp-19-wk01-final" },
    ...over,
  }) as unknown as JourneyNodeView;

describe("which nodes have a result worth re-reading", () => {
  it("covers both assessment kinds", () => {
    expect(isAssessmentNode(node({ type: "week_final" } as Partial<JourneyNodeView>))).toBe(true);
    expect(isAssessmentNode(node({ type: "checkpoint" } as Partial<JourneyNodeView>))).toBe(true);
  });

  it("excludes the kinds whose result lives elsewhere", () => {
    for (const type of ["topic", "interview"]) {
      expect(isAssessmentNode(node({ type } as Partial<JourneyNodeView>))).toBe(false);
    }
  });
});

describe("the journey card", () => {
  it("sends a finished assessment to its result, carrying the way back", () => {
    expect(nodeHref(node(), 19)).toBe(
      "/assessments/result/imp-19-wk01-final?courseId=19&from=%2Fadaptive-courses%2F19",
    );
  });

  it("renders a View result button on a done assessment", () => {
    const src = read("components/adaptive-journey/JourneyBoard.tsx");
    expect(src).toMatch(/\{done && isAssessmentNode\(node\) && navigable && \(/);
    expect(src).toMatch(/View result/);
  });
});

describe("the assessment page", () => {
  it("offers the result once submitted, instead of only a disabled button", () => {
    const src = read("app/assessments/[slug]/page.tsx");
    expect(src).toMatch(/isAlreadySubmitted && !canReattempt && assessment\?\.show_result !== false/);
    expect(src).toMatch(/\/assessments\/result\/\$\{slug\}/);
  });

  it("still withholds the result when an admin turned it off", () => {
    // show_result === false is a deliberate decision, not an oversight.
    const src = read("app/assessments/[slug]/page.tsx");
    expect(src).toMatch(/show_result !== false/);
  });
});
