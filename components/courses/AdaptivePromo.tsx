"use client";

import { AnimatePresence } from "framer-motion";
import { useAdaptivePromotion } from "@/lib/hooks/useAdaptivePromotion";
import { AdaptiveCoursePromoBanner } from "./AdaptiveCoursePromoBanner";
import { AdaptiveCourseIntroModal } from "./AdaptiveCourseIntroModal";

/**
 * Mounts the adaptive-course promotion surfaces for legacy-only students: a dismissible top banner
 * and a first-time animated intro modal. Renders nothing for ineligible students / tenants without
 * the feature (the hook skips the fetch). Mount ONCE near the top of the dashboard.
 */
export function AdaptivePromo() {
  const { promotion, dismissBanner, dismissIntro } = useAdaptivePromotion();
  if (!promotion?.eligible || !promotion.adaptive_course) return null;
  const course = promotion.adaptive_course;
  return (
    <>
      <AnimatePresence>
        {promotion.show_banner && (
          <AdaptiveCoursePromoBanner key="adaptive-promo-banner" course={course} onDismiss={dismissBanner} />
        )}
      </AnimatePresence>
      {promotion.show_intro_modal && (
        <AdaptiveCourseIntroModal course={course} onClose={dismissIntro} />
      )}
    </>
  );
}
