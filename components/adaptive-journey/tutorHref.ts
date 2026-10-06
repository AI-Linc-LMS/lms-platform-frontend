/**
 * Opening the AI Tutor on a specific module of a course.
 *
 * Until now nothing in the product did this. `TutorSession.topic_source` had a "course"
 * choice with no reference behind it, so a lesson started from a course recorded the course
 * TITLE as free text: the tutor taught the title, and the lesson was never credited back.
 *
 * The room's URL carries the module id and the room passes it to `start`. The server checks
 * it against the learner's own enrolments before using it, so this link is a hint and not a
 * grant — a tampered id costs the learner a generic lesson, nothing more.
 */

import type { JourneyNodeView } from "@/lib/types/adaptive-journey";

/** Minutes a module lesson asks for. Long enough to teach one module, short enough to sit through. */
export const MODULE_LESSON_MINUTES = 20;

export function tutorHrefForModule(
  node: Pick<JourneyNodeView, "type" | "title" | "ref">,
  level: string = "beginner",
): string | null {
  // Only a topic has a module behind it. A checkpoint is a paper and an interview is a
  // conversation; neither is a thing to be taught.
  if (node.type !== "topic") return null;
  const submoduleId = node.ref?.submoduleId;
  const topic = (node.title || "").trim();
  if (!submoduleId || !topic) return null;

  const params = new URLSearchParams({
    topic,
    level,
    minutes: String(MODULE_LESSON_MINUTES),
    // `source` is what makes the dashboard say "From your course" rather than "You typed it".
    source: "course",
    submoduleId: String(submoduleId),
  });
  return `/ai-tutor/session/new?${params.toString()}`;
}
