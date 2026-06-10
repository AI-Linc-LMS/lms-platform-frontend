"use client";

import { useState, type ReactNode } from "react";
import { Box, Typography, IconButton, Popover } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

const INDIGO = "#6366f1";

/**
 * A small "i" icon that opens a popover. Use to explain how a derived value
 * (at-risk, never active, etc.) is computed, on demand, without cluttering the UI.
 * Kept as a focused standalone client component so it can be imported from any
 * route without dragging in unrelated UI helpers.
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
        sx={{ color: INDIGO, p: 0.25 }}
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
