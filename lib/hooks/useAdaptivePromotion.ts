"use client";

import { useCallback, useEffect, useState } from "react";
import {
  adaptiveCourseService,
  type AdaptivePromotion,
} from "@/lib/services/adaptive-course.service";
import { useIsAdaptiveQuizEnabled } from "@/lib/contexts/ClientInfoContext";

/**
 * One shared fetch of the adaptive-course promotion state for the current student. Skips the call
 * entirely for tenants without the adaptive feature. Dismissals are optimistic (hide immediately)
 * and persisted server-side, so "show once" holds across devices on the next load. Mount ONCE at the
 * page level and pass results down, to avoid a double fetch / double notification race.
 */
export function useAdaptivePromotion() {
  const enabled = useIsAdaptiveQuizEnabled();
  const [promotion, setPromotion] = useState<AdaptivePromotion | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    adaptiveCourseService
      .getPromotion()
      .then((p) => alive && setPromotion(p))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled]);

  const dismissBanner = useCallback(() => {
    setPromotion((p) => (p ? { ...p, show_banner: false } : p));
    adaptiveCourseService.dismissPromotion("banner").catch(() => {});
  }, []);

  const dismissIntro = useCallback(() => {
    setPromotion((p) => (p ? { ...p, show_intro_modal: false } : p));
    adaptiveCourseService.dismissPromotion("intro_modal").catch(() => {});
  }, []);

  return { promotion, dismissBanner, dismissIntro };
}
