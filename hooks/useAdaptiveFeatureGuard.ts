"use client";

import { useIsAdaptiveQuizEnabled } from "@/lib/contexts/ClientInfoContext";

/**
 * One-stop check for adaptive-quiz-route gating.
 *
 * Returns the tenant-level flag value. The backend enforces per-quiz opt-in
 * (`AdaptiveQuizConfig.is_active`) so we don't have to round-trip for that
 * here — a disabled config will 403 the start endpoint, which is surfaced as
 * an error toast in the UI.
 */
export function useAdaptiveFeatureGuard(): boolean {
  return useIsAdaptiveQuizEnabled();
}
