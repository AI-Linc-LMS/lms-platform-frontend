"use client";

/**
 * Streak celebration store - a tiny module-level store (no provider needed) so any
 * content-completion flow can deterministically trigger the celebration, and the nav
 * streak chip + the celebration overlay both read from one source of truth.
 *
 * Flow: a completion calls `reportContentCompleted()`, which refetches the streak and,
 * if it went up, fires the celebration (without bumping the nav yet). The overlay plays,
 * then calls `commitNavBump()` as its flame lands on the nav - so the nav number ticks
 * +1 exactly when the animation arrives. No increase => the nav number just syncs.
 */

import { useSyncExternalStore } from "react";
import { profileService } from "@/lib/services/profile.service";
import { invalidateStreakCache } from "@/lib/hooks/useLeaderboardAndStreak";

export interface StreakCelebrationState {
  celebrating: boolean;
  celebrateCount: number; // the new streak being celebrated
  navCount: number;       // the value the nav chip should show right now
  primed: boolean;        // nav has reported its real value at least once
}

let state: StreakCelebrationState = { celebrating: false, celebrateCount: 0, navCount: 0, primed: false };
const listeners = new Set<() => void>();

function set(next: Partial<StreakCelebrationState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
function getSnapshot() { return state; }

/**
 * The nav reports the server streak once on load to seed navCount. Only the FIRST prime
 * takes effect - after that navCount is owned by the store (moved by `commitNavBump` when
 * the celebration lands, or synced by `reportContentCompleted`). This avoids a race where
 * the nav's own streak refetch would bump the number before the celebration arrives.
 */
export function primeNavStreak(n: number) {
  if (typeof n !== "number" || n < 0) return;
  if (!state.primed) set({ navCount: n, primed: true });
}

let inFlight = false;
/** Call right after any content completion is confirmed by the server. */
export async function reportContentCompleted(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    invalidateStreakCache();
    const s = await profileService.getMonthlyStreak();
    const next = s.current_streak ?? 0;
    if (next > state.navCount) {
      // Defer the nav bump to the overlay's flame-landing for a satisfying +1. Seed
      // navCount to next-1 so the tick is a clean +1 even when the nav was never primed
      // (e.g. the completion happened on an immersive page with no nav).
      set({ celebrating: true, celebrateCount: next, navCount: Math.max(state.navCount, next - 1), primed: true });
    } else {
      set({ navCount: next, primed: true });
    }
  } catch {
    /* streak is non-critical; never surface an error here */
  } finally {
    inFlight = false;
  }
}

/** Overlay calls this when its flame reaches the nav - nav number ticks to the new value. */
export function commitNavBump() {
  if (state.celebrateCount > state.navCount) set({ navCount: state.celebrateCount });
}

export function dismissCelebration() {
  set({ celebrating: false });
}

/**
 * Fire-and-forget signal that the learner just completed a piece of content. Call after
 * the completion is confirmed server-side.
 *
 * Updates the store DIRECTLY (not only via the "submodule-complete" listener) so it also
 * works on immersive pages that aren't wrapped in MainLayout - e.g. the calibration take
 * page and the interview page have no MainLayout (so no listener, no overlay, no nav).
 * The celebration then plays on the next MainLayout page the learner lands on (where the
 * nav exists), and the chip ticks +1. `reportContentCompleted` is in-flight-guarded, so
 * the extra "submodule-complete" ping (for the nav popover refresh + legacy flows) is
 * de-duped rather than double-fetching.
 */
export function notifyContentCompleted() {
  void reportContentCompleted();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("submodule-complete"));
  }
}

export function useStreakCelebration(): StreakCelebrationState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
