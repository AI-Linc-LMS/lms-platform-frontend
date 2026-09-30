import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

/**
 * Where a journey step goes when the learner clicks it, or null when it goes nowhere.
 *
 * Checkpoint and week_final used to be the null case by omission: the board handed the client
 * only a numeric `assessmentId`, every learner assessment route resolves by SLUG, and this
 * rule listed `topic` and `interview` and nothing else. So those cards rendered with a default
 * cursor, no "Continue" button, and a click that did nothing -- and the journey board is their
 * only doorway, since the learner assessment list excludes every journey type. Platform-wide
 * there had never been one submission against a checkpoint or week_final paper.
 *
 * A card whose slug is missing still returns null: an inert card is honest, a link built from
 * an id would 404.
 */
export function nodeHref(node: JourneyNodeView, courseId: number): string | null {
  if (node.type === "topic" && node.ref.submoduleId) {
    return `/adaptive-courses/${courseId}/submodule/${node.ref.submoduleId}`;
  }
  if (node.type === "interview") return "/mock-interview/courses";
  if (node.type === "checkpoint" || node.type === "week_final") {
    const slug = node.ref.assessmentSlug;
    return slug ? `/assessments/${slug}?courseId=${courseId}` : null;
  }
  return null;
}
