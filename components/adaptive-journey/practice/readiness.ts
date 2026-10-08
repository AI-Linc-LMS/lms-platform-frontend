import type { PracticeCardItem } from "./PracticeCard";

/**
 * Grouping a topic's practice by whether a learner can actually do it today.
 *
 * The authored order answers "what did the course builder put first". A learner opening this
 * page is asking something else: what can I start right now, and how much of it fits in the
 * time I have. Those are different questions and the second one is theirs.
 *
 * The signal is already on the wire. `requires_upcoming` names the techniques a problem needs
 * that this course does not teach until a later week, and the backend has sent it since it was
 * decided to SERVE such a problem and label it rather than hide it - hiding made the topic's
 * counters and its points disagree with what the learner could see. Nothing read the field for
 * a while; the cards read it now, and this turns it from a warning on one card into the shape
 * of the page.
 *
 * Nothing is locked. "A stretch" is a description, not a gate: the card still opens.
 */

export type BucketKey = "ready" | "stretch";

export interface Bucket {
  key: BucketKey;
  title: string;
  /** One line under the title saying what put these here. */
  why: string;
  items: PracticeCardItem[];
  /** Step numbers are authored order, so each card keeps the one it had. */
  stepOf: (item: PracticeCardItem) => number;
}

/** Minutes a learner says they have. `null` is "show me everything". */
export type TimeBudget = 10 | 30 | 60 | null;

export const BUDGETS: { label: string; value: TimeBudget }[] = [
  { label: "10 min", value: 10 },
  { label: "30 min", value: 30 },
  { label: "An hour", value: 60 },
  { label: "Any", value: null },
];

/**
 * Does this problem fit the time on offer?
 *
 * A problem with no measured median is ALWAYS kept. Only 68 of 611 problems had enough
 * attempts to publish one when this shipped, so filtering the unmeasured ones out would empty
 * the page to prove a point. An unknown length is not a long one.
 */
export function fitsBudget(item: PracticeCardItem, budget: TimeBudget): boolean {
  if (budget === null) return true;
  if (item.typicalMinutes == null) return true;
  return item.typicalMinutes <= budget;
}

export function splitByReadiness(
  items: PracticeCardItem[],
  budget: TimeBudget,
  firstStep: number,
): Bucket[] {
  // The step number belongs to the authored position, so it is taken BEFORE any filtering or
  // regrouping. Numbering the buckets instead would renumber a problem every time the learner
  // changed the filter.
  const step = new Map(items.map((item, i) => [item.key, firstStep + i]));
  const stepOf = (item: PracticeCardItem) => step.get(item.key) ?? 0;

  const visible = items.filter((i) => fitsBudget(i, budget));
  const ready = visible.filter((i) => i.requiresUpcoming.length === 0);
  const stretch = visible.filter((i) => i.requiresUpcoming.length > 0);

  const buckets: Bucket[] = [];
  if (ready.length > 0) {
    buckets.push({
      key: "ready", title: "Ready now", items: ready, stepOf,
      why: "Everything these need, this topic has taught you.",
    });
  }
  if (stretch.length > 0) {
    buckets.push({
      key: "stretch", title: "A stretch", items: stretch, stepOf,
      why: "These reach past this topic. You can still try one.",
    });
  }
  return buckets;
}

/**
 * What the time filter is hiding, so the page can say so.
 *
 * A filter that silently removes things reads as a page with less on it. DESIGN-adjacent rule
 * from this codebase's own audits: no silent caps.
 */
export function hiddenByBudget(items: PracticeCardItem[], budget: TimeBudget): number {
  return items.length - items.filter((i) => fitsBudget(i, budget)).length;
}
