import { topicFromReturnHref, topicHref } from "@/lib/adaptive/courseFlow";
import type { AdaptiveSessionOrigin } from "@/lib/types/adaptive-quiz";

/** The standalone quiz library - where Back goes only for a quiz that belongs to no course. */
export const QUIZ_LIBRARY_HREF = "/adaptive-quizzes";

/** The course topic an attempt belongs to, as the session detail reports it (`origin`). */
export type QuizOrigin = AdaptiveSessionOrigin;

export type QuizReturn =
  /** A course topic. `title` is its name when known, so the button can say where it goes. */
  | { kind: "topic"; href: string; title: string | null; courseId: number; submoduleId: number }
  | { kind: "roadmap"; href: string }
  | { kind: "library"; href: string }
  | { kind: "other"; href: string };

/**
 * A `from` value that is safe to navigate to: a same-origin absolute path, else null.
 *
 * The value comes from the URL bar, and a redirect target taken from user input is an open
 * redirect, so `https://evil.example` and `//evil.example` are refused - the same guard as
 * `useReturnTo` and `withFrom`.
 */
export function safeFrom(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : null;
}

const LIBRARY_PATH = /^\/adaptive-quizzes\/?(?:[?#]|$)/;

/**
 * Where the quiz results screen's Back goes.
 *
 * 1. `?from=` - the page that launched the quiz. A quiz started from a roadmap step or from the
 *    library goes back there, even when it also belongs to a course.
 * 2. The attempt's own course topic (`origin`, worked out by the server - for a re-quiz, through
 *    its original attempt). This is what makes Back survive a hop that dropped `from`, a re-quiz
 *    chain, a refresh of an old link, or a results page opened from anywhere else.
 * 3. The library, for a quiz that belongs to no course.
 */
export function resolveQuizReturn(from: string | null | undefined, origin: QuizOrigin | null | undefined): QuizReturn {
  const path = safeFrom(from);
  if (path) {
    const topic = topicFromReturnHref(path);
    if (topic) {
      const known = !!origin && origin.course_id === topic.courseId && origin.submodule_id === topic.submoduleId;
      return {
        kind: "topic", href: path, title: known ? origin.submodule_title : null,
        courseId: topic.courseId, submoduleId: topic.submoduleId,
      };
    }
    if (path.startsWith("/roadmaps/")) return { kind: "roadmap", href: path };
    if (LIBRARY_PATH.test(path)) return { kind: "library", href: path };
    return { kind: "other", href: path };
  }
  if (origin) {
    return {
      kind: "topic", href: topicHref(origin.course_id, origin.submodule_id), title: origin.submodule_title,
      courseId: origin.course_id, submoduleId: origin.submodule_id,
    };
  }
  return { kind: "library", href: QUIZ_LIBRARY_HREF };
}

/** The Back button's words (an i18n key and its values): where it goes, by name when it goes to a
 *  course topic. */
export function quizReturnLabel(back: QuizReturn): { key: string; values?: { title: string } } {
  switch (back.kind) {
    case "topic":
      return back.title
        ? { key: "adaptiveQuizRuntime.backToTopic", values: { title: back.title } }
        : { key: "adaptiveQuizRuntime.backToTopicUnnamed" };
    case "roadmap":
      return { key: "adaptiveQuizRuntime.backToRoadmap" };
    case "library":
      return { key: "adaptiveQuizRuntime.backToLibrary" };
    default:
      return { key: "adaptiveQuizRuntime.back" };
  }
}
