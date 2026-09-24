"use client";

import { AnimatePresence } from "framer-motion";
import { useAdaptivePromotion } from "@/lib/hooks/useAdaptivePromotion";
import type { PromoCtaKind } from "@/lib/services/adaptive-course.service";
import { AdaptiveCoursePromoBanner } from "./AdaptiveCoursePromoBanner";
import { AdaptiveCourseIntroModal } from "./AdaptiveCourseIntroModal";

/**
 * Mounts the adaptive-course promotion surfaces: a dismissible top banner and a first-time animated
 * intro modal, shown to any eligible user once a course is published. Renders nothing for ineligible
 * users / tenants without the feature (the hook skips the fetch). Mount ONCE near the top of the
 * dashboard. Copy adapts via `has_prior_courses` (migration warning vs plain welcome).
 *
 * The destination is the SERVER's decision (`cta_route`/`cta_kind`), because only it knows whether
 * this user may open the promoted course. `cta_route: null` means there is nowhere for them to go
 * and both surfaces drop their button; an older server sends neither field, and the legacy
 * `adaptive_course.route` is the fallback.
 */
export function AdaptivePromo() {
  const { promotion, dismissBanner, dismissIntro } = useAdaptivePromotion();
  if (!promotion?.eligible || !promotion.adaptive_course) return null;
  const course = promotion.adaptive_course;
  const hasPriorCourses = promotion.has_prior_courses ?? true;
  const ctaRoute = promotion.cta_route === undefined ? course.route : promotion.cta_route;
  const ctaKind: PromoCtaKind = promotion.cta_kind ?? "course";
  return (
    <>
      <AnimatePresence>
        {promotion.show_banner && (
          <AdaptiveCoursePromoBanner
            key="adaptive-promo-banner"
            hasPriorCourses={hasPriorCourses}
            ctaRoute={ctaRoute}
            ctaKind={ctaKind}
            onDismiss={dismissBanner}
          />
        )}
      </AnimatePresence>
      {promotion.show_intro_modal && (
        <AdaptiveCourseIntroModal
          hasPriorCourses={hasPriorCourses}
          ctaRoute={ctaRoute}
          ctaKind={ctaKind}
          onClose={dismissIntro}
        />
      )}
    </>
  );
}
