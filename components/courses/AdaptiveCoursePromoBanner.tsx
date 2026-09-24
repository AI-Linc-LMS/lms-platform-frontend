"use client";

import { Box, Button, IconButton, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { PHONE } from "@/components/common/mobile/phone";
import type { PromoCtaKind } from "@/lib/services/adaptive-course.service";

interface Props {
  /** When true, the user has prior (legacy) courses, so warn that progress doesn't carry over.
   *  When false (brand-new user with no history), show a plain welcome instead. Defaults to true. */
  hasPriorCourses?: boolean;
  /** Where the button goes. **Null means there is nowhere this user can go**, and the banner then
   *  renders no button at all - see `promotion.promotion_cta`. */
  ctaRoute: string | null;
  /** What kind of place `ctaRoute` is, which is what the button is named after. */
  ctaKind: PromoCtaKind;
  onExplore?: () => void;   // optional: open the intro modal instead of routing
  onDismiss: () => void;
}

const CTA_KEY: Record<PromoCtaKind, string> = {
  course: "zeroCourseDashboard.promoCtaCourse",
  catalog: "zeroCourseDashboard.promoCtaCatalog",
  my_courses: "zeroCourseDashboard.promoCtaMyCourses",
  none: "zeroCourseDashboard.promoCtaCourse",
};
const CTA_DEFAULT: Record<PromoCtaKind, string> = {
  course: "Explore Adaptive Courses",
  catalog: "Browse courses",
  my_courses: "Go to my courses",
  none: "Explore Adaptive Courses",
};

/**
 * Dismissible top banner announcing Adaptive Courses. Dismissal persists server-side.
 *
 * The button used to always route to the promoted course. A learner can only open a course they
 * are ENROLLED in, so on a tenant whose admins assign every course - which is most of them - every
 * not-yet-assigned learner pressed "Explore Adaptive Courses" and landed on a page whose entire
 * contents were "You are not enrolled in this course." The server now decides the destination
 * (`cta_route`/`cta_kind`) and says so, and when there is nothing for this learner to open it says
 * null: an announcement with no button beats a button that goes nowhere. The copy follows the same
 * split, so the banner never invites someone to "pick one" when there is nothing to pick.
 */
export function AdaptiveCoursePromoBanner({
  hasPriorCourses = true, ctaRoute, ctaKind, onExplore, onDismiss,
}: Props) {
  const router = useRouter();
  const { t } = useTranslation("common");
  const canGo = Boolean(ctaRoute) || Boolean(onExplore);
  const bodyKey = ctaRoute
    ? hasPriorCourses
      ? "zeroCourseDashboard.promoBodyMigrating"
      : "zeroCourseDashboard.promoBodyOpen"
    : "zeroCourseDashboard.promoBodyWaiting";
  const bodyDefault = ctaRoute
    ? hasPriorCourses
      ? "We've moved to Adaptive Courses that adjust to your skill level as you go. Heads up: your adaptive progress starts fresh at 0 - your earlier course history doesn't carry over."
      : "We've added Adaptive Courses that adjust to your skill level as you learn - pick one and the engine meets you right where you are."
    : "We've added Adaptive Courses that adjust to your skill level as you learn. Your organisation picks yours - the moment it does, the engine meets you right where you are.";

  return (
    <Box
      component={motion.div}
      data-testid="adaptive-promo-banner"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      sx={{
        position: "relative", mb: 2.5, px: { xs: 2, md: 3 }, py: { xs: 1.75, md: 2 }, borderRadius: 4,
        display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
        color: "white", overflow: "hidden",
        background: "linear-gradient(120deg, #6366f1 0%, #a855f7 55%, #ec4899 100%)",
        boxShadow: "0 18px 40px -22px var(--module-hero-shadow, rgba(124,58,237,0.65))",
        // 360px is the narrowest phone in the fleet. Left to the desktop row the dismiss control
        // wrapped onto a second line beside the button, so the one affordance every learner needs
        // moved while the banner reflowed. Pin it to the corner and let the button own its line.
        [PHONE]: { gap: 1.25, pr: 5.5 },
      }}
    >
      {/* sparkle accent */}
      <Box sx={{ position: "absolute", inset: 0, opacity: 0.18, pointerEvents: "none",
        background: "radial-gradient(circle at 90% -20%, #fff 0%, transparent 40%)" }} />
      <Box sx={{ width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", flexShrink: 0,
        bgcolor: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.35)" }}>
        <Icon icon="mdi:auto-awesome" width={22} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 220, [PHONE]: { minWidth: 0 } }}>
        <Typography sx={{ fontWeight: 800, fontSize: "1.02rem", lineHeight: 1.2 }}>
          {t("zeroCourseDashboard.promoTitle", { defaultValue: "Your learning experience just got an upgrade ✨" })}
        </Typography>
        <Typography sx={{ fontSize: { xs: "0.8rem", sm: "0.85rem" }, opacity: 0.95, mt: 0.25 }}>
          {t(bodyKey, { defaultValue: bodyDefault })}
        </Typography>
      </Box>
      {canGo && (
        <Button
          onClick={() => (onExplore ? onExplore() : ctaRoute && router.push(ctaRoute))}
          variant="contained"
          sx={{ flexShrink: 0, textTransform: "none", fontWeight: 800, borderRadius: 999, px: 2.5,
            bgcolor: "white", color: "#6d28d9", "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
            [PHONE]: { width: "100%", minHeight: 44 } }}
        >
          {t(CTA_KEY[ctaKind], { defaultValue: CTA_DEFAULT[ctaKind] })}
        </Button>
      )}
      <IconButton
        aria-label={t("zeroCourseDashboard.promoDismiss", { defaultValue: "Dismiss" })}
        onClick={onDismiss}
        size="small"
        sx={{ color: "white", flexShrink: 0, "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
          [PHONE]: { position: "absolute", top: 8, right: 8, width: 36, height: 36 } }}
      >
        <Icon icon="mdi:close" width={18} />
      </IconButton>
    </Box>
  );
}
