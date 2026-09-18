import type {
  AdaptiveCourseArticleSummary,
  AdaptiveCourseCodingProblemSummary,
  AdaptiveCourseCodingSet,
  AdaptiveCourseDetail,
  AdaptiveCourseQuizSummary,
  AdaptiveCourseSubModule,
  AdaptiveCourseVideoCompanionSummary,
} from "@/lib/services/adaptive-course.service";
import { withFrom } from "@/lib/utils/return-to";

/**
 * The order a learner moves through an adaptive course, and what comes after any step in it.
 *
 * Two screens depend on this order: the topic page lists a topic's steps in it, and the Next
 * button on every step walks it. If they worked out the order separately, a Next button could
 * skip a step the list shows or land on one out of turn, so both are built from these functions.
 *
 * Within a topic the order is videos, then articles, then quizzes, then coding problems.
 * Across topics it is modules by week number, and topics within a module by their order.
 */

export type FlowKind = "video" | "article" | "quiz" | "coding";

/** One step, with the raw summary it came from so a screen can render kind-specific detail. */
export type FlowStep =
  | FlowStepBase<"video", AdaptiveCourseVideoCompanionSummary>
  | FlowStepBase<"article", AdaptiveCourseArticleSummary>
  | FlowStepBase<"quiz", AdaptiveCourseQuizSummary>
  | (FlowStepBase<"coding", AdaptiveCourseCodingProblemSummary> & { set: AdaptiveCourseCodingSet });

interface FlowStepBase<K extends FlowKind, S> {
  kind: K;
  /** `kind:id` - the same key the points breakdown uses, and how a page names "the step I am on". */
  key: string;
  title: string;
  href: string;
  completed: boolean;
  source: S;
}

export const topicHref = (courseId: number, submoduleId: number) =>
  `/adaptive-courses/${courseId}/submodule/${submoduleId}`;

export const courseHref = (courseId: number) => `/adaptive-courses/${courseId}`;

/**
 * A topic's steps in the order the learner takes them.
 *
 * `selfHref` is where the shared quiz runtime should send the learner back to. The quiz engine is
 * also reached from the standalone quiz library, so it has to be told; without it the results
 * screen sends an in-course learner out of the course.
 */
export function flowSteps(
  sm: AdaptiveCourseSubModule,
  courseId: number,
  selfHref: string = topicHref(courseId, sm.id),
): FlowStep[] {
  const steps: FlowStep[] = [];
  (sm.video_companions ?? []).forEach((vc) =>
    steps.push({
      kind: "video", key: `video:${vc.id}`, title: vc.title, completed: !!vc.completed, source: vc,
      href: `/adaptive-courses/${courseId}/submodule/${sm.id}/video/${vc.id}`,
    }),
  );
  (sm.articles ?? []).forEach((a) =>
    steps.push({
      kind: "article", key: `article:${a.article_id}`, title: a.title, completed: !!a.completed, source: a,
      href: `/adaptive-courses/${courseId}/submodule/${sm.id}/article/${a.article_id}`,
    }),
  );
  (sm.quizzes ?? []).forEach((q) =>
    steps.push({
      kind: "quiz", key: `quiz:${q.config_id}`, title: q.quiz_title, completed: !!q.completed, source: q,
      href: withFrom(`/adaptive-quizzes/start?configId=${q.config_id}`, selfHref),
    }),
  );
  (sm.coding_sets ?? []).forEach((set) =>
    set.problems.forEach((p) =>
      steps.push({
        kind: "coding", key: `coding:${p.problem_id}`, title: p.title, completed: !!p.completed,
        source: p, set,
        href: `/adaptive-courses/${courseId}/submodule/${sm.id}/coding/${p.problem_id}?configId=${set.config_id}`,
      }),
    ),
  );
  return steps;
}

export interface CourseTopic {
  submodule: AdaptiveCourseSubModule;
  moduleId: number;
  moduleTitle: string;
  weekno: number;
}

/** Every topic in the course, in the order a learner takes them. */
export function courseTopics(course: Pick<AdaptiveCourseDetail, "modules">): CourseTopic[] {
  // Sorted copies: the API returns these in order today, but nothing promises it, and a Next
  // button that silently followed insertion order would be wrong the day an admin reorders.
  const modules = [...(course.modules ?? [])].sort((a, b) => a.weekno - b.weekno || a.id - b.id);
  return modules.flatMap((m) =>
    [...(m.submodules ?? [])]
      .sort((a, b) => a.order - b.order || a.id - b.id)
      .map((submodule) => ({ submodule, moduleId: m.id, moduleTitle: m.title, weekno: m.weekno })),
  );
}

export type NextStep =
  /** Another step in the same topic. */
  | { kind: "step"; title: string; href: string; step: FlowKind }
  /**
   * The next topic's page. It goes to the topic rather than straight to its first step so the
   * learner sees what the topic covers, and so a journey-locked topic can explain the lock
   * instead of the step failing. `newModule` is set when that topic starts the next module.
   */
  | { kind: "topic"; title: string; href: string; moduleTitle: string; newModule: boolean }
  /** Nothing left: this was the last step of the last topic. */
  | { kind: "end"; href: string };

/**
 * What comes after the step `currentKey` in topic `submoduleId`.
 *
 * Returns `null` when the step cannot be placed - the topic or the step is not in this course. A
 * Next button that guessed there would send the learner somewhere arbitrary, so the caller shows
 * nothing instead.
 */
export function nextStep(
  course: Pick<AdaptiveCourseDetail, "id" | "modules">,
  submoduleId: number,
  currentKey: string,
): NextStep | null {
  const topics = courseTopics(course);
  const at = topics.findIndex((t) => t.submodule.id === submoduleId);
  if (at < 0) return null;

  const here = topics[at];
  const steps = flowSteps(here.submodule, course.id);
  const index = steps.findIndex((s) => s.key === currentKey);
  if (index < 0) return null;

  const following = steps[index + 1];
  if (following) {
    return { kind: "step", title: following.title, href: following.href, step: following.kind };
  }

  // A topic with nothing in it is not somewhere to send anyone: it would be a page with an empty
  // list and nothing to do but press Next again.
  const nextTopic = topics.slice(at + 1).find((t) => flowSteps(t.submodule, course.id).length > 0);
  if (!nextTopic) return { kind: "end", href: courseHref(course.id) };

  return {
    kind: "topic",
    title: nextTopic.submodule.title,
    href: topicHref(course.id, nextTopic.submodule.id),
    moduleTitle: nextTopic.moduleTitle,
    newModule: nextTopic.moduleId !== here.moduleId,
  };
}

/**
 * The course and topic a quiz was launched from, read from its `?from=` link.
 *
 * The quiz runtime is shared with the standalone quiz library, so this is the only way its results
 * screen knows it belongs to a course. `null` means it was not launched from a course topic, and
 * that screen should show no Next at all.
 */
export function topicFromReturnHref(from: string | null | undefined): { courseId: number; submoduleId: number } | null {
  if (!from) return null;
  const match = /^\/adaptive-courses\/(\d+)\/submodule\/(\d+)(?:[/?#]|$)/.exec(from);
  if (!match) return null;
  return { courseId: Number(match[1]), submoduleId: Number(match[2]) };
}
