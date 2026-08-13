"use client";

import { useCallback, useEffect, useState } from "react";
import {
  B2C_FEATURE_ADAPTIVE_COURSE,
  b2cService,
  type B2CAllowance,
} from "@/lib/services/b2c.service";

interface UseB2CAllowance {
  /** True only on a tenant that actually meters free usage. */
  isB2C: boolean;
  /** Free courses this learner has left. 0 on any non-B2C tenant. */
  freeCoursesLeft: number;
  loading: boolean;
  /** Re-read after spending one, so the banner and the buttons agree. */
  refresh: () => Promise<void>;
}

/**
 * The learner's remaining free allowance.
 *
 * Fails SILENTLY to "no allowance": if this call errors we must not offer a free course we
 * cannot back, because the claim would 402 and read as a broken button. The paywall itself is
 * enforced server-side regardless, so being wrong in this direction costs a missed upsell
 * rather than giving anything away.
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

  const courses = data?.features.find((f) => f.feature_key === B2C_FEATURE_ADAPTIVE_COURSE);

  return {
    isB2C: Boolean(data?.is_b2c),
    freeCoursesLeft: data?.is_b2c ? (courses?.remaining ?? 0) : 0,
    loading,
    refresh: load,
  };
}
