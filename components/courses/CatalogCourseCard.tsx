"use client";

import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { formatMoney } from "@/lib/utils/money";
import { PriceTag } from "@/components/common/PriceTag";
import { Icon } from "@iconify/react";
import type { AdaptiveCourseListItem } from "@/lib/services/adaptive-course.service";

/** A course card for the self-enroll catalog. Mirrors AdaptiveCourseCard's visuals but the root is
 *  a plain Box (not a ButtonBase) so it can carry a real <button> Enroll action — a button nested
 *  inside a ButtonBase is invalid. Enroll-only: the course detail page is enrollment-gated (a
 *  non-enrolled learner would hit its 403), so the card intentionally offers no "open" affordance. */
export function CatalogCourseCard({
  course,
  enrolling,
  disabled,
  onEnroll,
}: {
  course: AdaptiveCourseListItem;
  enrolling: boolean;
  /** True while a sibling card's enroll is in flight — greys this one out to prevent double-submit. */
  disabled?: boolean;
  onEnroll: () => void;
}) {
  // A course that is priced and not yet bought. `purchased` comes from the server, so a
  // payment that settled while this page was open resolves to a plain Enroll.
  const mustBuy = Boolean(course.is_paid && !course.purchased);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        borderRadius: 3,
        p: 2.5,
        bgcolor: "var(--card-bg, #fff)",
        border: "1px solid var(--border-default, #ececf1)",
        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 10px 26px -22px rgba(16,24,40,0.18)",
        transition: "transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "color-mix(in srgb, #6366f1 40%, transparent)",
          boxShadow: "0 20px 40px -26px rgba(99, 102, 241, 0.45)",
        },
      }}
    >
      {/* Image band (fallback gradient). */}
      <Box
        sx={{
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 2.5,
          overflow: "hidden",
          mb: 1.5,
          flexShrink: 0,
          background:
            "linear-gradient(135deg, color-mix(in srgb, #6366f1 14%, transparent), color-mix(in srgb, #a855f7 12%, transparent))",
        }}
      >
        {course.card_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.card_image_url}
            alt={course.title}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 3,
            flexShrink: 0,
            display: "grid",
            placeItems: "center",
            color: "white",
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
            boxShadow: "0 14px 26px -14px rgba(168, 85, 247, 0.6)",
          }}
        >
          <Icon icon="mdi:book-education-outline" width={22} />
        </Box>
        <Box
          component="span"
          sx={{
            px: 1,
            py: 0.3,
            borderRadius: 999,
            fontSize: "0.65rem",
            fontWeight: 800,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: "#a855f7",
            bgcolor: "color-mix(in srgb, #a855f7 14%, transparent)",
          }}
        >
          Adaptive
        </Box>
        <PriceTag isPaid={course.is_paid} price={course.price} currency={course.currency} withAmount />
      </Box>

      <Typography
        sx={{
          fontWeight: 800,
          fontSize: "1.05rem",
          lineHeight: 1.3,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {course.title}
      </Typography>
      <Typography
        sx={{
          color: "text.secondary",
          mt: 0.75,
          fontSize: "0.86rem",
          lineHeight: 1.5,
          minHeight: "2.6em",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {course.description || ""}
      </Typography>

      <Box sx={{ display: "flex", gap: 1.5, columnGap: 2, mt: "auto", pt: 2, flexWrap: "wrap" }}>
        <Metric icon="mdi:view-module-outline" label="modules" value={course.module_count} />
        <Metric icon="mdi:book-open-variant" label="articles" value={course.article_count} />
        <Metric icon="mdi:tune-vertical" label="quizzes" value={course.quiz_count} />
        {(course.coding_count ?? 0) > 0 && (
          <Metric icon="mdi:robot-happy-outline" label="coding" value={course.coding_count ?? 0} />
        )}
      </Box>

      {/* Enroll action pinned to the bottom so every card lines up. */}
      <Button
        onClick={onEnroll}
        disabled={enrolling || disabled}
        variant="contained"
        disableElevation
        startIcon={
          enrolling ? (
            <CircularProgress size={16} sx={{ color: "inherit" }} />
          ) : (
            <Icon icon={mustBuy ? "mdi:cart-outline" : "mdi:account-plus"} width={18} />
          )
        }
        sx={{
          mt: 2,
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 800,
          background: "linear-gradient(135deg, #6366f1 0%, #a855f7 60%, #ec4899 100%)",
          "&:hover": { background: "linear-gradient(135deg, #5457e5 0%, #9333ea 60%, #db2777 100%)" },
          "&.Mui-disabled": { color: "rgba(255,255,255,0.85)", opacity: 0.7 },
        }}
      >
        {enrolling
          ? mustBuy
            ? "Opening checkout…"
            : "Enrolling…"
          : mustBuy
            ? `Pay ${formatMoney(course.price, course.currency)}`
            : "Enroll"}
      </Button>
    </Box>
  );
}

function Metric({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.6 }}>
      <Icon icon={icon} width={16} style={{ color: "#6366f1" }} />
      <Typography component="span" sx={{ fontWeight: 800, fontSize: "0.85rem" }}>
        {value}
      </Typography>
      <Typography component="span" sx={{ color: "text.secondary", fontSize: "0.78rem" }}>
        {label}
      </Typography>
    </Box>
  );
}
