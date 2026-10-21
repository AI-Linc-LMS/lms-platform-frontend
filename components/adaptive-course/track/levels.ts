/**
 * The level tree, derived from the course the server already sends.
 *
 * A level is a MODULE and a topic is a SUBMODULE. That is not a new idea imposed on the data -
 * it is what the data already is: module 2 of the DSA course holds "Arrays & Matrix Problems"
 * and "Strings", module 3 holds "Hash Maps" and "Two Pointers". So the tree needs no new model,
 * no migration and no second source of truth to drift from the course page.
 *
 * Counts are derived here rather than stored, for the reason two surfaces counting one thing
 * always drift: the course page already counts a topic's articles and problems from this exact
 * payload, and a stored `problems_count` would start disagreeing with it the first time a
 * problem was added.
 */

import type {
  AdaptiveCourseDetail,
  AdaptiveCourseModule,
  AdaptiveCourseSubModule,
} from "@/lib/services/adaptive-course.service";

export interface TrackTopic {
  submoduleId: number;
  title: string;
  articles: number;
  problems: number;
  /** Technique buckets on this topic's coding set; empty when it has not been bucketed. */
  buckets: number;
  bucketsCovered: number;
  /** Server-authored. The bonus is never recomputed from the bucket rows. */
  bonusUnlocked: boolean;
  /** Problems the learner has finished, out of `problems`. */
  solved: number;
}

export interface TrackLevel {
  level: number;
  moduleId: number;
  title: string;
  topics: TrackTopic[];
}

function topicOf(sub: AdaptiveCourseSubModule): TrackTopic {
  const sets = sub.coding_sets ?? [];
  const problems = sets.reduce((n, s) => n + s.problems.length, 0);
  const solved = sets.reduce(
    (n, s) => n + s.problems.filter((p) => p.completed).length, 0,
  );
  // A topic has at most one live coding set, so the first one carrying buckets is the one.
  const bucketed = sets.find((s) => (s.buckets?.length ?? 0) > 0);
  const buckets = bucketed?.buckets ?? [];
  return {
    submoduleId: sub.id,
    title: sub.title,
    articles: (sub.articles ?? []).length,
    problems,
    buckets: buckets.length,
    bucketsCovered: buckets.filter((b) => b.satisfied).length,
    bonusUnlocked: Boolean(bucketed?.bonus_unlocked),
    solved,
  };
}

/**
 * Levels in course order, with the empty ones dropped.
 *
 * A module that teaches no coding at all still appears if it has articles - it is part of the
 * path - but a module with neither is not a level, it is an artefact, and drawing it leaves a
 * gap in the ladder that a learner reads as something missing.
 */
export function buildLevels(course: AdaptiveCourseDetail | undefined | null): TrackLevel[] {
  const modules: AdaptiveCourseModule[] = course?.modules ?? [];
  const levels: TrackLevel[] = [];
  modules.forEach((m) => {
    const topics = (m.submodules ?? []).map(topicOf)
      .filter((t) => t.problems > 0 || t.articles > 0);
    if (topics.length === 0) return;
    levels.push({
      level: levels.length + 1,
      moduleId: m.id,
      title: m.title,
      topics,
    });
  });
  return levels;
}

/** How far through a topic the learner is, 0-1. Problems only: it is a practice ladder. */
export function topicProgress(t: TrackTopic): number {
  if (t.problems === 0) return 0;
  return Math.min(1, t.solved / t.problems);
}
