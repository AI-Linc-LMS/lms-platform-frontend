"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { IconWrapper } from "@/components/common/IconWrapper";
import { fadeRise } from "./motion";
import { useStaticRender } from "./StaticRenderContext";
import { useViewportEntrance } from "./useViewportEntrance";

interface SectionHeroProps {
  /**
   * Editorial chapter label, e.g. "Chapter 03". Aligns the new sections with
   * the existing 3 sections that use this typographic device.
   */
  chapter: string;
  title: string;
  subtitle?: string;
  /** Vertical gradient strip color — leading accent for the section identity. */
  accentTop?: string;
  accentBottom?: string;
  /** Optional content rendered to the right of the title block. */
  rightSlot?: ReactNode;
  /** Optional MDI / Iconify icon shown as a square badge to the left of the strip. */
  iconBadge?: { icon: string; gradient: string; shadow?: string };
}

/**
 * Shared section header used by every scorecard module section (except the
 * existing StudentOverview / LearningConsumption which inline their own
 * variant). Centralizes the editorial typography, gradient strip, and motion
 * variant so each section's identity comes only from its accent colors.
 */
export function SectionHero({
  chapter,
  title,
  subtitle,
  accentTop = "var(--accent-indigo)",
  accentBottom = "var(--accent-indigo-dark)",
  rightSlot,
  iconBadge,
}: SectionHeroProps) {
  const entrance = useViewportEntrance();

  return (
    <Box
      component={motion.div}
      variants={fadeRise}
      {...entrance}
      sx={{
        display: "flex",
        alignItems: { xs: "flex-start", sm: "center" },
        flexDirection: { xs: "column", sm: "row" },
        gap: 2.5,
        mb: { xs: 3.5, md: 4.5 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
        {iconBadge ? (
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: iconBadge.gradient,
              boxShadow: iconBadge.shadow ??
                `0 14px 28px -14px color-mix(in srgb, ${accentTop} 60%, transparent)`,
              flexShrink: 0,
            }}
          >
            <IconWrapper icon={iconBadge.icon} size={26} color="#fff" />
          </Box>
        ) : (
          <Box
            sx={{
              width: 4,
              height: 52,
              borderRadius: 2,
              background: `linear-gradient(180deg, ${accentTop} 0%, ${accentBottom} 100%)`,
              flexShrink: 0,
            }}
          />
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-secondary)",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              display: "block",
            }}
          >
            {chapter}
          </Typography>
          <Typography
            component="h2"
            sx={{
              fontWeight: 800,
              color: "var(--font-primary)",
              fontSize: { xs: "1.6rem", sm: "2rem", md: "2.5rem" },
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              mt: 0.25,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                fontSize: { xs: "0.85rem", sm: "0.95rem" },
                mt: 1,
                maxWidth: 640,
                lineHeight: 1.55,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Box>
      {rightSlot && <Box sx={{ flexShrink: 0 }}>{rightSlot}</Box>}
    </Box>
  );
}

interface KpiRailItem {
  value: number | string;
  label: string;
  tip?: string;
  accent: string;
  /** When numeric, drives CountUp. Set explicitly when value is a formatted string. */
  numeric?: boolean;
}

interface KpiRailProps {
  items: KpiRailItem[];
  columns?: { xs?: number; sm?: number; md?: number };
}

/**
 * Editorial KPI rail — oversized numbers separated by hairline borders, with
 * an accent strip on top of each cell. Matches the pattern in
 * LearningConsumptionSection so the new sections feel like part of the same
 * editorial layout.
 */
export function KpiRail({ items, columns }: KpiRailProps) {
  const entrance = useViewportEntrance();
  // Default 2 → 3 → N columns based on item count.
  const cols = {
    xs: columns?.xs ?? 2,
    sm: columns?.sm ?? Math.min(3, items.length),
    md: columns?.md ?? items.length,
  };

  return (
    <Box
      component={motion.div}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
      }}
      {...entrance}
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: `repeat(${cols.xs}, 1fr)`,
          sm: `repeat(${cols.sm}, 1fr)`,
          md: `repeat(${cols.md}, 1fr)`,
        },
        borderTop: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        borderBottom: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        mb: { xs: 3.5, md: 4.5 },
      }}
    >
      {items.map((kpi, idx) => (
        <Box
          key={`${kpi.label}-${idx}`}
          component={motion.div}
          variants={{
            hidden: { opacity: 0, y: 18 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
          }}
          sx={{
            position: "relative",
            py: { xs: 2.25, md: 2.75 },
            px: { xs: 1.5, sm: 2 },
            borderRight: {
              xs: idx % cols.xs !== cols.xs - 1 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
              sm: idx % cols.sm !== cols.sm - 1 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
              md: idx % cols.md !== cols.md - 1 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
            },
            transition: "background-color 0.25s ease",
            "&:hover": {
              backgroundColor: `color-mix(in srgb, ${kpi.accent} 6%, transparent)`,
            },
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              width: 28,
              height: 2,
              background: kpi.accent,
            },
          }}
        >
          <Typography
            component="div"
            sx={{
              fontWeight: 800,
              color: "var(--font-primary)",
              fontSize: { xs: "1.65rem", sm: "2.1rem", md: "2.55rem" },
              lineHeight: 1,
              letterSpacing: "-0.04em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {typeof kpi.value === "number" && kpi.numeric !== false ? (
              <KpiNumber value={kpi.value} />
            ) : (
              kpi.value
            )}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-secondary)",
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              display: "block",
              mt: 1,
            }}
          >
            {kpi.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// Lazy import for CountUp to avoid circular re-export pain.
function KpiNumber({ value }: { value: number }) {
  // Inline import here to avoid cycle when SectionHero is re-exported alongside
  // CountUp from shared/index.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { CountUp } = require("./CountUp") as typeof import("./CountUp");
  return <CountUp value={value} duration={1.4} />;
}

/**
 * Section card outer shell. Matches the existing StudentOverview /
 * LearningConsumption card silhouette so all sections share the same
 * radius / border / shadow / backdrop blur footprint.
 *
 * Pass `radialMesh` as an array of CSS radial-gradient strings for
 * module-specific decorative background.
 */
export function SectionShell({
  radialMesh,
  meshOpacity = 0.45,
  children,
}: {
  radialMesh: string[];
  meshOpacity?: number;
  children: ReactNode;
}) {
  // In static-render mode (PDF capture) we omit `backdropFilter` — Chromium's
  // print pipeline skips painting elements that have a CSS filter or
  // backdrop-filter once they're past the initial viewport, which truncates
  // the scorecard PDF after the first 2 chapters. The decorative blur isn't
  // meaningful in a printed page anyway.
  const staticRender = useStaticRender();
  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        backgroundColor: "var(--card-bg)",
        boxShadow:
          "0 1px 0 color-mix(in srgb, var(--border-default) 60%, transparent), 0 30px 60px -30px rgba(15, 23, 42, 0.18)",
        ...(staticRender ? {} : { backdropFilter: "blur(6px)" }),
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          opacity: meshOpacity,
          backgroundImage: radialMesh.join(", "),
          pointerEvents: "none",
        }}
      />
      <Box sx={{ position: "relative", p: { xs: 2.5, sm: 3.5, md: 5 } }}>
        {children}
      </Box>
    </Box>
  );
}
