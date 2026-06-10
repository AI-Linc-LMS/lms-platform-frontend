"use client";

import type { ReactNode } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

/**
 * Adaptive-module signature palette + decorative radial mesh, mirrored from the
 * Adaptive Course Builder so the student detail page shares its visual identity.
 */
export const ADAPTIVE = {
  indigo: "#6366f1",
  purple: "#a855f7",
  pink: "#ec4899",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  blue: "#3b82f6",
  gradient: "linear-gradient(135deg,#6366f1 0%,#a855f7 60%,#ec4899 100%)",
} as const;

export const ADAPTIVE_MESH = [
  "radial-gradient(circle at 8% 0%, color-mix(in srgb, #6366f1 18%, transparent) 0%, transparent 55%)",
  "radial-gradient(circle at 95% 5%, color-mix(in srgb, #ec4899 14%, transparent) 0%, transparent 55%)",
  "radial-gradient(circle at 50% 110%, color-mix(in srgb, #a855f7 16%, transparent) 0%, transparent 60%)",
];

/** Chart series colors aligned with the dashboard chart tokens. */
export const CHART_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#3b82f6",
  "#a855f7",
  "#14b8a6",
  "#ef4444",
];

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

/** Color a 0–100 percentage from red → amber → green. */
export function pctColor(pct: number): string {
  if (pct >= 75) return ADAPTIVE.green;
  if (pct >= 40) return ADAPTIVE.amber;
  return ADAPTIVE.red;
}

export function ProgressBar({
  value,
  color,
  height = 8,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const barColor = color ?? pctColor(clamped);
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
      <LinearProgress
        variant="determinate"
        value={clamped}
        sx={{
          flex: 1,
          height,
          borderRadius: 999,
          backgroundColor: "color-mix(in srgb, var(--border-default) 60%, transparent)",
          "& .MuiLinearProgress-bar": {
            borderRadius: 999,
            background: barColor,
          },
        }}
      />
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.78rem",
          color: "var(--font-secondary)",
          fontVariantNumeric: "tabular-nums",
          minWidth: 38,
          textAlign: "right",
        }}
      >
        {clamped.toFixed(0)}%
      </Typography>
    </Box>
  );
}

export function StatPill({
  label,
  value,
  accent = ADAPTIVE.indigo,
  icon,
}: {
  label: string;
  value: ReactNode;
  accent?: string;
  icon?: string;
}) {
  return (
    <Box
      sx={{
        flex: "1 1 140px",
        minWidth: 130,
        p: 2,
        borderRadius: 2.5,
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--card-bg) 70%, transparent)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: 28,
          height: 2,
          background: accent,
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
        {icon && <IconWrapper icon={icon} size={16} color={accent} />}
        <Typography
          sx={{
            fontSize: "0.66rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography
        sx={{
          fontWeight: 800,
          fontSize: "1.5rem",
          lineHeight: 1.1,
          color: "var(--font-primary)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export function EmptyState({
  icon = "mdi:inbox-outline",
  title,
  hint,
}: {
  icon?: string;
  title: string;
  hint?: string;
}) {
  return (
    <Box
      sx={{
        p: { xs: 3, md: 5 },
        borderRadius: 3,
        textAlign: "center",
        border: "1px dashed color-mix(in srgb, var(--border-default) 90%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--surface) 50%, transparent)",
      }}
    >
      <IconWrapper icon={icon} size={42} color={ADAPTIVE.purple} />
      <Typography sx={{ fontWeight: 700, mt: 1.5, color: "var(--font-primary)" }}>
        {title}
      </Typography>
      {hint && (
        <Typography
          variant="body2"
          sx={{ color: "var(--font-secondary)", mt: 0.5, maxWidth: 480, mx: "auto" }}
        >
          {hint}
        </Typography>
      )}
    </Box>
  );
}

export function StatusChip({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();
  const map: Record<string, string> = {
    completed: ADAPTIVE.green,
    submitted: ADAPTIVE.green,
    evaluated: ADAPTIVE.green,
    published: ADAPTIVE.green,
    passed: ADAPTIVE.green,
    in_progress: ADAPTIVE.amber,
    active: ADAPTIVE.blue,
    scheduled: ADAPTIVE.blue,
    abandoned: ADAPTIVE.red,
    failed: ADAPTIVE.red,
    cancelled: ADAPTIVE.red,
  };
  const color = map[s] ?? "#94a3b8";
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 1,
        py: 0.3,
        borderRadius: 999,
        fontSize: "0.66rem",
        fontWeight: 800,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        color,
        bgcolor: `color-mix(in srgb, ${color} 14%, transparent)`,
      }}
    >
      {status || "—"}
    </Box>
  );
}

/** Horizontal labelled bars for a {skill: 0..1 or 0..100} map. */
export function SkillBars({
  data,
  scale = 1,
  emptyLabel,
}: {
  data: Record<string, number>;
  /** 1 → values are 0..1 (multiplied by 100); 100 → values already 0..100. */
  scale?: 1 | 100;
  emptyLabel?: string;
}) {
  const entries = Object.entries(data || {}).filter(
    ([, v]) => typeof v === "number"
  );
  if (entries.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
        {emptyLabel || "No skill data yet."}
      </Typography>
    );
  }
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {entries
        .sort((a, b) => b[1] - a[1])
        .map(([skill, raw]) => {
          const pct = scale === 1 ? raw * 100 : raw;
          return (
            <Box key={skill}>
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  mb: 0.5,
                  textTransform: "capitalize",
                }}
              >
                {skill.replace(/_/g, " ")}
              </Typography>
              <ProgressBar value={pct} />
            </Box>
          );
        })}
    </Box>
  );
}
