import type { AdaptiveCourseCodingProblemSummary } from "@/lib/services/adaptive-course.service";
import { asStringList } from "@/lib/utils/as-list";

export interface FlowChip {
  icon: string;
  text: string;
  /** `warn` is for something the learner should read before starting, not another tag. */
  tone?: "default" | "warn";
}

/**
 * The chips under a coding problem on the topic page.
 *
 * `requires_upcoming` is the reason this is its own function. #940 decided that a problem running
 * ahead of the syllabus should still be SERVED and labelled, because hiding it made the course's
 * counters and points disagree with what the learner could see - and it shipped the label on both
 * surfaces. But nothing on the client ever read it: 361 active problems across roughly fifteen
 * courses carried a list of techniques the course had not taught yet, and the learner was told none
 * of it. The commonest were Sliding Window (91), Hash Tables (86) and Two Pointers (78).
 *
 * The warning goes first. It changes whether the learner should attempt the problem at all, which the
 * difficulty and the skill tags do not.
 */
export function codingChips(p: AdaptiveCourseCodingProblemSummary): FlowChip[] {
  const chips: FlowChip[] = [];
  const needs = asStringList(p.requires_upcoming);
  if (needs.length > 0) {
    chips.push({
      icon: "mdi:alert-circle-outline",
      // Named, not counted: "needs 2 more techniques" tells the learner nothing they can act on.
      text: `Needs ${formatList(needs)} - not taught yet`,
      tone: "warn",
    });
  }
  chips.push({ icon: "mdi:speedometer", text: p.difficulty_level });
  for (const skill of asStringList(p.target_skills).slice(0, 2)) {
    chips.push({ icon: "mdi:tag-outline", text: skill });
  }
  return chips;
}

/** "a", "a and b", "a, b and c" - and beyond three, a count, so the chip stays a chip. */
function formatList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  if (items.length === 3) return `${items[0]}, ${items[1]} and ${items[2]}`;
  return `${items[0]}, ${items[1]} and ${items.length - 2} more`;
}
