"use client";

import { useEffect } from "react";
import { primePointsTotal } from "@/lib/xp/pointsWatcher";

/**
 * Seeds the unified points-total baseline once on load, so the learner's FIRST
 * earn of the session already animates (the watcher has a value to diff against).
 * Unauthenticated loads (e.g. the login page) just get a silently-ignored 401.
 */
export function PointsPrimer() {
  useEffect(() => {
    void primePointsTotal();
  }, []);
  return null;
}
