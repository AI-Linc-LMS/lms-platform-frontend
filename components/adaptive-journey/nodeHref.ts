import type { JourneyNodeView } from "@/lib/types/adaptive-journey";
import { withFrom } from "@/lib/utils/return-to";

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
    if (!slug) return null;
    // `from` is the course, threaded the way the adaptive quiz threads it (lib/utils/return-to).
    // Without it the assessment runtime has no idea a course exists: a learner who submitted was
    // dropped on a standalone success page whose "Back to assessments" leads to a list that
    // EXCLUDES journey papers, so there was no way back to the course they came from at all.
    // `courseId` stays for the calibration route, which reads it to fetch the calibration result.
    const back = `/adaptive-courses/${courseId}`;
    // A finished paper goes to its result rather than to a detail page that would bounce the
    // learner onward with an "already submitted" toast.
    const href =
      node.status === "done"
        ? `/assessments/result/${slug}?courseId=${courseId}`
        : `/assessments/${slug}?courseId=${courseId}`;
    return withFrom(href, back);
  }
  return null;
}
