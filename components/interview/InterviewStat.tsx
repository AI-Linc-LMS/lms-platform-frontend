"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

/**
 * A stat card in the dashboard's visual language: accent strip, heavy value, uppercase
 * label, and a sub line that says something rather than repeating the number.
 *
 * The module's first version used the flat roadmaps `Metric`, which is correct for a
 * catalogue of roadmap cards and reads as empty next to the learner dashboard, where every
 * number carries an accent and a piece of context. Matching the dashboard is the point: this
 * is the same learner looking at the same kind of information about themselves.
 *
 * Written against CSS variables rather than the dashboard's hardcoded hex, so it follows the
 * tenant theme, which `components/dashboard/v2/parts.tsx` predates.
 */
export function InterviewStat({
  label,
  value,
  sub,
  icon,
  accent = "var(--accent-purple)",
  /** Rendered under the value as a progress track. Omit for counts. */
  percent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon: string;
  accent?: string;
  percent?: number | null;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        p: 2,
        pt: 2.25,
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border-default)",
        bgcolor: "var(--card-bg)",
        transition: "border-color 150ms ease",
        "&:hover": { borderColor: "color-mix(in srgb, var(--font-primary) 18%, transparent)" },
      }}
    >
      <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, bgcolor: accent }} />
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "1.75rem",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "var(--font-primary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {value}
          </Typography>
          <Typography
            sx={{
              mt: 0.5,
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--font-secondary)",
              '[dir="rtl"] &': { letterSpacing: 0 },
            }}
          >
            {label}
          </Typography>
          {sub ? (
            <Typography sx={{ mt: 0.4, fontSize: "0.76rem", color: "var(--font-tertiary)" }}>
              {sub}
            </Typography>
          ) : null}
        </Box>
        <Box
          sx={{
            width: 38,
            height: 38,
            flexShrink: 0,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            color: accent,
            bgcolor: `color-mix(in srgb, ${accent} 12%, transparent)`,
          }}
        >
          <Icon icon={icon} width={19} />
        </Box>
      </Box>

      {typeof percent === "number" ? (
        <Box
          sx={{
            mt: 1.5,
            height: 6,
            borderRadius: 999,
            bgcolor: "color-mix(in srgb, var(--font-primary) 8%, transparent)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              height: "100%",
              width: `${Math.max(0, Math.min(100, percent))}%`,
              bgcolor: accent,
              borderRadius: 999,
              transition: "width 400ms cubic-bezier(.175,.885,.32,1.1)",
              "@media (prefers-reduced-motion: reduce)": { transition: "none" },
            }}
          />
        </Box>
      ) : null}
    </Box>
  );
}

export default InterviewStat;
