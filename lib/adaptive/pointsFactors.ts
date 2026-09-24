import type { PointsBreakdownItem, PointsKind } from "@/lib/services/adaptive-course.service";

/**
 * What the learning-path card says about the points an item earned: the "earned / on offer"
 * figure and the "base › time › % correct › late › weight = pts" chips.
 *
 * Kept pure so the card cannot drift from what it claims to show. The card once read
 * "350 base › 100% correct = 350 pts" and "350/250 earned" for a learner who got 16 of 25 right:
 * the quiz award summed each question's own difficulty price while the maximum used the bank's,
 * and the ledger said 100% correct. The backend now prices both the same way and records the
 * real accuracy; this side guarantees the card never shows more than the maximum it prints
 * beside it, whatever an older ledger row says.
 */

/** The "% correct"-style factor only means something for graded/timed content; articles are flat. */
export const KIND_CORRECTNESS: Partial<Record<PointsKind, string>> = {
  quiz: "correct", coding: "tests passed", video: "watched",
};

export type FactorTone = "muted" | "warn" | "good";
export interface PointsFactor { text: string; tone?: FactorTone }

/** Earned points as displayed: never above the item's stated maximum. */
export function displayEarned(item: Pick<PointsBreakdownItem, "earned" | "on_offer">): number {
  const earned = Math.max(0, Math.round(item.earned || 0));
  return item.on_offer > 0 ? Math.min(earned, item.on_offer) : earned;
}

/** Topic total as displayed: the sum of the per-item figures the learner can see. */
export function displayTopicEarned(items: Pick<PointsBreakdownItem, "earned" | "on_offer">[]): number {
  return items.reduce((sum, i) => sum + displayEarned(i), 0);
}

/** The chip trail for an earned item, or null when nothing has been earned yet. */
export function pointsFactors(item: PointsBreakdownItem): { factors: PointsFactor[]; earned: number } | null {
  const b = item.breakdown;
  if (!b) return null;
  // A base can only be above the maximum on a row written before the fix; show the maximum.
  const base = item.on_offer > 0 ? Math.min(b.base, item.on_offer) : b.base;
  const afterDecay = Math.min(b.after_decay, base);
  const factors: PointsFactor[] = [{ text: `${Math.round(base)} base` }];
  if (afterDecay < base) factors.push({ text: `time −${Math.round(base - afterDecay)}`, tone: "warn" });
  // A quiz pays harder right answers more; without this chip the factors would not multiply out
  // to the points shown.
  const diff = b.difficulty_mult ?? 1;
  if (item.kind === "quiz" && diff > 1.004) factors.push({ text: `harder questions ×${diff.toFixed(2)}`, tone: "good" });
  const accLabel = KIND_CORRECTNESS[item.kind];
  if (accLabel) {
    const pct = Math.round(Math.max(0, Math.min(1, b.correctness_factor)) * 100);
    factors.push({ text: `${pct}% ${accLabel}` });
  }
  if (b.late_penalty_mult < 1) factors.push({ text: `late −${Math.round((1 - b.late_penalty_mult) * 100)}%`, tone: "warn" });
  if (b.weight > 1) factors.push({ text: `×${b.weight} weight` });
  return { factors, earned: displayEarned(item) };
}
