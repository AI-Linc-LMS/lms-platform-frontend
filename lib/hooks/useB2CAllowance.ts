"use client";

import { useCallback, useEffect, useState } from "react";
import {
  B2C_FEATURE_ADAPTIVE_COURSE,
  B2C_FEATURE_ASSESSMENT,
  b2cService,
  type B2CAllowance,
} from "@/lib/services/b2c.service";

interface UseB2CAllowance {
  /** True only on a tenant that actually meters free usage. */
  isB2C: boolean;
  /** Free uses left for an arbitrary feature. 0 on any non-B2C tenant. */
  remainingFor: (featureKey: string) => number;
  /** Convenience readers for the two metered features today. */
  freeCoursesLeft: number;
  freeAssessmentsLeft: number;
  loading: boolean;
  /** Re-read after spending one, so banners and buttons agree. */
  refresh: () => Promise<void>;
}

/**
 * The learner's remaining free allowance.
 *
 * Fails SILENTLY to "no allowance": if this call errors we must not offer a free use we cannot
 * back, because the claim would 402 and read as a broken button. The paywall is enforced
 * server-side regardless, so being wrong in this direction costs a missed upsell rather than
 * giving anything away.
 */
export function useB2CAllowance(enabled = true): UseB2CAllowance {
  const [data, setData] = useState<B2CAllowance | null>(null);
  const [loading, setLoading] = useState(enabled);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      setData(await b2cService.getAllowance());
    } catch {
      setData({ is_b2c: false, features: [] });
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const remainingFor = useCallback(
    (featureKey: string) => {
      if (!data?.is_b2c) return 0;
      return data.features.find((f) => f.feature_key === featureKey)?.remaining ?? 0;
    },
    [data],
  );

  return {
    isB2C: Boolean(data?.is_b2c),
    remainingFor,
    freeCoursesLeft: remainingFor(B2C_FEATURE_ADAPTIVE_COURSE),
    freeAssessmentsLeft: remainingFor(B2C_FEATURE_ASSESSMENT),
    loading,
    refresh: load,
  };
}
