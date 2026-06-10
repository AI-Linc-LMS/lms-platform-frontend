"use client";

import { useState, type ReactNode } from "react";
import { Box, Typography, LinearProgress, IconButton, Popover } from "@mui/material";
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

/**
 * A small "i" icon that opens a popover. Use to explain how a derived value
 * (at-risk, never active, etc.) is computed, on demand, without cluttering the UI.
 */
export function InfoButton({
  children,
  ariaLabel = "More information",
  size = 16,
}: {
  children: ReactNode;
  ariaLabel?: string;
  size?: number;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  return (
    <>
      <IconButton
        size="small"
        aria-label={ariaLabel}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ color: ADAPTIVE.indigo, p: 0.25 }}
      >
        <IconWrapper icon="mdi:information-outline" size={size} />
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              maxWidth: 360,
              p: 2,
              borderRadius: 3,
              border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
              boxShadow: "0 20px 48px -20px rgba(15,23,42,0.35)",
            },
          },
        }}
      >
        {children}
      </Popover>
    </>
  );
}

/**
 * Canonical explanation of how the directory's engagement-health signals are
 * derived. Kept in one place so the directory and detail page never drift.
 * Mirrors lib/utils/student-risk.ts.
 */
export function RiskCriteriaContent() {
  const rows: Array<{ icon: string; color: string; label: string; rule: string }> = [
    { icon: "mdi:login-variant", color: "#94a3b8", label: "Never logged in", rule: "The account has never authenticated (no last-login)." },
    { icon: "mdi:radar", color: "#f59e0b", label: "Never active", rule: "No course / content activity has ever been recorded." },
    { icon: "mdi:sleep", color: "#f59e0b", label: "Inactive (30d)", rule: "No activity in the last 30 days (or never active)." },
    { icon: "mdi:chart-line-variant", color: "#a855f7", label: "Low completion", rule: "Overall course content completion is below 30%." },
    { icon: "mdi:alert-circle-outline", color: "#ef4444", label: "At risk", rule: "Enrolled AND (inactive 30d OR low completion). Unenrolled students are never flagged." },
    { icon: "mdi:trophy-outline", color: "#10b981", label: "High performers", rule: "Overall content completion is 75% or higher." },
  ];
  return (
    <Box>
      <Typography sx={{ fontWeight: 800, color: "var(--font-primary)", mb: 1.25 }}>
        How these signals are calculated
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {rows.map((r) => (
          <Box key={r.label} sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}>
            <Box sx={{ mt: 0.2, flexShrink: 0 }}>
              <IconWrapper icon={r.icon} size={18} color={r.color} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "var(--font-primary)" }}>
                {r.label}
              </Typography>
              <Typography sx={{ fontSize: "0.78rem", color: "var(--font-secondary)", lineHeight: 1.4 }}>
                {r.rule}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
      <Typography sx={{ mt: 1.5, fontSize: "0.72rem", color: "var(--font-tertiary)", fontStyle: "italic" }}>
        All signals are derived from existing activity data — no extra tracking.
      </Typography>
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
