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

export function splitByReadiness(items: PracticeCardItem[], firstStep: number): Bucket[] {
  // The step number belongs to the authored position, not to a card's place in a bucket, so
  // grouping never renumbers the course.
  const step = new Map(items.map((item, i) => [item.key, firstStep + i]));
  const stepOf = (item: PracticeCardItem) => step.get(item.key) ?? 0;

  const ready = items.filter((i) => i.requiresUpcoming.length === 0);
  const stretch = items.filter((i) => i.requiresUpcoming.length > 0);

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
