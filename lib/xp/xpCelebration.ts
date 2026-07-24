"use client";

/**
 * XP celebration store - a tiny module-level store (no provider) so any flow that
 * earns points can fire a Duolingo-style level-up "+N points" burst from anywhere,
 * including immersive pages with no layout. Mirrors lib/streak/streakCelebration.
 *
 * The card animates the learner's running TOTAL from oldTotal -> newTotal while the
 * +delta chip visibly feeds it. celebrateXp stays backward-compatible: callers that
 * only know the delta still produce a valid card (oldTotal derives to max(0, new-amt)).
 *
 * Usage: `celebrateXp(pointsEarned, { oldTotal, newTotal })` after a server-confirmed
 * earn; the global <XpCelebrationOverlay/> (mounted in app/layout) plays the burst.
 */
import { useSyncExternalStore } from "react";

export interface XpCelebrationState {
  amount: number;
  /** The learner's total BEFORE this earn (what the count-up starts from). */
  oldTotal: number;
  /** The learner's total AFTER this earn (what the count-up ends on). */
  newTotal: number;
  /** Increments on every trigger so the overlay re-plays even for the same amount. */
  token: number;
}

let state: XpCelebrationState = { amount: 0, oldTotal: 0, newTotal: 0, token: 0 };
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
function getSnapshot() {
  return state;
}

/**
 * Fire a level-up "+N points" burst. No-op for non-positive / invalid amounts.
 * `totals` is optional metadata: when both are known (the common case, since
 * pointsWatcher tracks the running total) the card counts oldTotal -> newTotal.
 * When omitted, oldTotal derives to max(0, newTotal - amount) so a delta-only
 * caller still gets a correct, non-misleading count (e.g. 0 -> amount first-ever).
 */
export function celebrateXp(amount: number, totals?: { oldTotal?: number; newTotal?: number }) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return;
  const amt = Math.round(amount);
  const newTotal = Number.isFinite(totals?.newTotal) ? Math.round(totals!.newTotal!) : amt;
  const oldTotal = Number.isFinite(totals?.oldTotal)
    ? Math.round(totals!.oldTotal!)
    : Math.max(0, newTotal - amt);
  state = { amount: amt, oldTotal, newTotal, token: state.token + 1 };
  listeners.forEach((l) => l());
}

export function useXpCelebration(): XpCelebrationState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
