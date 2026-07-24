"use client";

/**
 * AssessmentStatusChip - shared status/label primitives for the assessment-management
 * admin redesign. Provides a tone-driven pill (StatusChip), a difficulty mapper
 * (DifficultyChip), a compact count badge (CountBadge), and a status→tone helper
 * (assessmentStatusTone). All colors flow through CSS custom-property tokens so the
 * primitives stay theme-aware in light and dark.
 */

import * as React from "react";
import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export type ChipTone = "success" | "warning" | "error" | "info" | "neutral" | "ai" | "proctored";

/** Resolves a tone to its token-backed foreground color. */
const TONE_COLOR: Record<ChipTone, string> = {
  success: "var(--success-500)",
  warning: "var(--warning-500)",
  error: "var(--error-500)",
  info: "var(--accent-indigo)",
  neutral: "var(--font-secondary)",
  // Redesign: pink AI/identity chips (e.g. "Non-adaptive · same for all").
  ai: "var(--ai-pink)",
  // Redesign: cyan proctoring chips (mockup's semantic proctored tone).
  proctored: "var(--tone-proctored)",
};

export interface StatusChipProps {
  label: string;
  tone?: ChipTone;
  icon?: string;
}

/**
 * StatusChip - a small tinted pill. Background is a 14% tint of the tone color
 * over the surface; foreground text/icon use the tone color directly.
 */
export function StatusChip({ label, tone = "neutral", icon }: StatusChipProps) {
  const color = TONE_COLOR[tone];
  const bg = `color-mix(in srgb, ${color} 14%, var(--surface) 86%)`;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        height: 23,
        px: 1,
        borderRadius: 999,
        backgroundColor: bg,
        border: "1px solid transparent",
        color,
        fontSize: "0.72rem",
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
        maxWidth: "100%",
      }}
    >
      {icon ? <IconWrapper icon={icon} size={13} color={color} /> : null}
      <Box
        component="span"
        sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {label}
      </Box>
    </Box>
  );
}

export interface DifficultyChipProps {
  level?: string;
}

/** Maps a difficulty level to a toned StatusChip. Unknown/empty → neutral "-". */
export function DifficultyChip({ level }: DifficultyChipProps) {
  const key = (level ?? "").trim().toLowerCase();

  let tone: ChipTone;
  let label: string;
  switch (key) {
    case "easy":
      tone = "success";
      label = "Easy";
      break;
    case "medium":
      tone = "warning";
      label = "Medium";
      break;
    case "hard":
      tone = "error";
      label = "Hard";
      break;
    default:
      tone = "neutral";
      label = "-";
  }

  return <StatusChip label={label} tone={tone} icon="mdi:speedometer" />;
}

export interface CountBadgeProps {
  count: number;
  label?: string;
}

/** CountBadge - compact indigo-tinted badge showing a count and optional label. */
export function CountBadge({ count, label }: CountBadgeProps) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 0.5,
        px: 0.75,
        py: 0.25,
        borderRadius: 1,
        backgroundColor:
          "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
        color: "var(--accent-indigo-dark)",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <Typography
        component="span"
        sx={{ fontSize: "0.78rem", fontWeight: 700, lineHeight: 1 }}
      >
        {count}
      </Typography>
      {label ? (
        <Typography
          component="span"
          sx={{
            fontSize: "0.68rem",
            fontWeight: 500,
            lineHeight: 1,
            opacity: 0.85,
          }}
        >
          {label}
        </Typography>
      ) : null}
    </Box>
  );
}

/** Title-cases a raw token (hyphen/underscore/space separated). */
function titleCase(raw: string): string {
  return raw
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * assessmentStatusTone - maps a raw assessment status to a display tone + label.
 * active/published → success, draft → warning, inactive/archived → neutral,
 * scheduled → info. Unknown values fall back to neutral with a Title-cased label.
 */
export function assessmentStatusTone(status: string): {
  tone: ChipTone;
  label: string;
} {
  switch ((status ?? "").trim().toLowerCase()) {
    case "active":
    case "published":
      return { tone: "success", label: "Active" };
    case "draft":
      return { tone: "warning", label: "Draft" };
    case "inactive":
    case "archived":
      return { tone: "neutral", label: "Inactive" };
    case "scheduled":
      return { tone: "info", label: "Scheduled" };
    default:
      return { tone: "neutral", label: titleCase(status || "Unknown") };
  }
}
