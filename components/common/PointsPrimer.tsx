"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { primePointsTotal } from "@/lib/xp/pointsWatcher";

/**
 * Seeds the unified points-total baseline once on load, so the learner's FIRST
 * earn of the session already animates (the watcher has a value to diff against).
 * Gated on auth: unauthenticated loads used to fire a guaranteed 401 on every
 * login-page view across every tenant.
 */
export function PointsPrimer() {
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) return;
    void primePointsTotal();
  }, [isAuthenticated]);
  return null;
}
