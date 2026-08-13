import type { RoadmapNodeTarget } from "@/lib/services/roadmaps.service";

export type StepUnitKind = "article" | "quiz" | "coding";

/**
 * The URL a roadmap step uses to open one of its content units.
 *
 * Extracted and tested because getting it wrong is silent: the first cut only deep-linked the
 * article and let quiz and coding fall through to
 * `/adaptive-courses/{courseId}/submodule/{submoduleId}`, which is the course surface the
 * roadmap step route exists to avoid. It looked like it worked.
 *
 * The three runtimes do NOT share a path shape:
 *   - article: under the submodule, addressed by article id
 *   - quiz:    a top-level runner, addressed by config id
 *   - coding:  under the submodule, addressed by PROBLEM id, with the config as a query param
 *
 * Returns null when the unit cannot be addressed, so the caller can decline to offer the link
 * rather than send the learner somewhere plausible but wrong.
 */
export function stepUnitHref(
  target: RoadmapNodeTarget,
  kind: StepUnitKind,
  returnTo: string
): string | null {
  const from = `from=${encodeURIComponent(returnTo)}`;
  const base = `/adaptive-courses/${target.courseId}/submodule/${target.submoduleId}`;
  const c = target.content ?? {};

  if (kind === "article") {
    return c.articleId ? `${base}/article/${c.articleId}?${from}` : null;
  }
  if (kind === "quiz") {
    return c.quizConfigId ? `/adaptive-quizzes/start?configId=${c.quizConfigId}&${from}` : null;
  }
  if (kind === "coding") {
    return c.codingProblemId
      ? `${base}/coding/${c.codingProblemId}?configId=${c.codingConfigId}&${from}`
      : null;
  }
  return null;
}
