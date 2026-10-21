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

/** One technique bucket as the ladder draws it. The server decides `satisfied`. */
export interface TrackBucket {
  id: number;
  name: string;
  total: number;
  solved: number;
  /** At least one solved. The rule is one PER bucket, never solved === total. */
  satisfied: boolean;
}

export interface TrackTopic {
  submoduleId: number;
  title: string;
  problems: number;
  /** Technique buckets on this topic's coding set; empty when it has not been bucketed. */
  bucketRows: TrackBucket[];
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
    problems,
    bucketRows: buckets.map((b) => ({
      id: b.id, name: b.name, total: b.total, solved: b.solved, satisfied: b.satisfied,
    })),
    buckets: buckets.length,
    bucketsCovered: buckets.filter((b) => b.satisfied).length,
    bonusUnlocked: Boolean(bucketed?.bonus_unlocked),
    solved,
  };
}

/**
 * Levels in course order, with everything that is not coding practice dropped.
 *
 * This ladder is the PRACTICE surface: a topic earns a place on it by having coding problems,
 * and nothing else does. It used to admit any submodule carrying articles, which made it a
 * second rendering of the journey - the same 28 modules, drawn as a tree. The journey tab
 * already does that, and doing it twice gave a learner two maps of one course and no reason to
 * prefer either.
 *
 * So a topic with no problems is not a level here even when it has plenty of reading. A module
 * left with no coding topics at all is dropped entirely rather than drawn empty.
 */
export function buildLevels(course: AdaptiveCourseDetail | undefined | null): TrackLevel[] {
  const modules: AdaptiveCourseModule[] = course?.modules ?? [];
  const levels: TrackLevel[] = [];
  modules.forEach((m) => {
    const topics = (m.submodules ?? []).map(topicOf)
      .filter((t) => t.problems > 0);
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
