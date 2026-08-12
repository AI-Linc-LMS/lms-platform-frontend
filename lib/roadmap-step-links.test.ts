import { describe, expect, it } from "vitest";
import { stepUnitHref } from "./roadmap-step-links";
import type { RoadmapNodeTarget } from "@/lib/services/roadmaps.service";

const RETURN = "/roadmaps/infosys/step/1125";
const target = (content: RoadmapNodeTarget["content"]): RoadmapNodeTarget => ({
  type: "submodule",
  courseId: 168,
  courseTitle: "Infosys Placement Preparation",
  submoduleId: 3161,
  title: "Syllogism",
  accessible: true,
  selfEnrollable: false,
  content,
});

describe("stepUnitHref", () => {
  it("opens the quiz runner, which is NOT under the submodule path", () => {
    // The real prod payload for node 1125.
    const href = stepUnitHref(target({ questions: 23, quizConfigId: 2996 }), "quiz", RETURN);
    expect(href).toBe(
      "/adaptive-quizzes/start?configId=2996&from=%2Froadmaps%2Finfosys%2Fstep%2F1125"
    );
  });

  it("addresses coding by problem id, with the config as a query param", () => {
    const href = stepUnitHref(
      target({ codingProblems: 3, codingConfigId: 55, codingProblemId: 900 }),
      "coding",
      RETURN
    );
    expect(href).toBe(
      "/adaptive-courses/168/submodule/3161/coding/900?configId=55&from=%2Froadmaps%2Finfosys%2Fstep%2F1125"
    );
  });

  it("opens the article under the submodule", () => {
    const href = stepUnitHref(target({ article: true, articleId: 77 }), "article", RETURN);
    expect(href).toBe(
      "/adaptive-courses/168/submodule/3161/article/77?from=%2Froadmaps%2Finfosys%2Fstep%2F1125"
    );
  });

  it.each([
    ["quiz", { questions: 23 }],
    ["coding", { codingProblems: 3, codingConfigId: 55 }],
    ["article", { article: true }],
  ] as const)(
    "returns null for %s when the unit cannot be addressed, rather than the course page",
    (kind, content) => {
      // THE regression: falling back to the submodule page sent the learner back onto the
      // course surface, which is the whole thing this route exists to avoid.
      expect(stepUnitHref(target(content), kind, RETURN)).toBeNull();
    }
  );

  it("never falls back to a bare submodule URL", () => {
    for (const kind of ["article", "quiz", "coding"] as const) {
      const href = stepUnitHref(target({}), kind, RETURN);
      expect(href).not.toBe("/adaptive-courses/168/submodule/3161");
    }
  });
});
