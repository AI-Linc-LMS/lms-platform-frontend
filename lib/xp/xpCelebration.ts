"use client";

/**
 * XP celebration store - a tiny module-level store (no provider) so any flow that
 * earns points can fire a Duolingo-style lightning "+N XP" burst from anywhere,
 * including immersive pages with no layout. Mirrors lib/streak/streakCelebration.
 *
 * Usage: `celebrateXp(pointsEarned)` after a server-confirmed earn; the global
 * <XpCelebrationOverlay/> (mounted in app/layout) plays the lightning burst.
 */
import { useSyncExternalStore } from "react";

export interface XpCelebrationState {
  amount: number;
  /** Increments on every trigger so the overlay re-plays even for the same amount. */
  token: number;
}

let state: XpCelebrationState = { amount: 0, token: 0 };
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

/** Fire a lightning "+N XP" burst. No-op for non-positive / invalid amounts. */
export function celebrateXp(amount: number) {
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return;
  state = { amount: Math.round(amount), token: state.token + 1 };
  listeners.forEach((l) => l());
}

export function useXpCelebration(): XpCelebrationState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
