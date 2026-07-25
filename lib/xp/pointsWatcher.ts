"use client";

/**
 * Detects points increases ANYWHERE they're awarded and fires the "+N points"
 * celebration - so it plays for articles, videos, quizzes, coding, community,
 * and any future module, without each earn endpoint needing to return a delta.
 *
 * It polls the cheap unified total (adaptive wallets + community XP) after a
 * completion and celebrates the difference vs the last value we knew.
 */
import { adaptiveJourneyService } from "@/lib/services/adaptive-journey.service";
import { celebrateXp } from "@/lib/xp/xpCelebration";

let lastKnown: number | null = null;
let inFlight = false;

/** Seed the baseline without celebrating (call once on app load). */
export async function primePointsTotal(): Promise<void> {
  try {
    const total = await adaptiveJourneyService.getLearnerPointsTotal();
    if (typeof total === "number") lastKnown = total;
  } catch {
    /* non-critical */
  }
}

/** Fetch the unified total; if it grew since we last knew, celebrate the delta. */
export async function checkPointsAndCelebrate(): Promise<void> {
  if (inFlight) return;
  inFlight = true;
  try {
    const total = await adaptiveJourneyService.getLearnerPointsTotal();
    if (typeof total !== "number") return;
    if (lastKnown != null && total > lastKnown) {
      // Both totals are known here - the card counts old -> new exactly.
      celebrateXp(total - lastKnown, { oldTotal: lastKnown, newTotal: total });
    }
    lastKnown = total; // also primes if it was null
  } catch {
    /* non-critical */
  } finally {
    inFlight = false;
  }
}

/**
 * For earns where the delta is already known (e.g. a community action returns
 * the IP amount): celebrate immediately AND keep `lastKnown` in sync so a later
 * total-based check doesn't double-count the same points.
 */
export function noteKnownEarn(delta: number): void {
  if (!Number.isFinite(delta) || delta <= 0) return;
  if (lastKnown != null) {
    const oldT = lastKnown;
    celebrateXp(delta, { oldTotal: oldT, newTotal: oldT + delta });
    lastKnown = oldT + delta;
  } else {
    // Cold start (before primePointsTotal resolved): count 0 -> delta.
    celebrateXp(delta);
  }
}
