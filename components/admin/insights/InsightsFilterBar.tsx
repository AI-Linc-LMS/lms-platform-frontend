"use client";

import { Box, Chip, Tooltip, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { RANGE_OPTIONS, type RangeKey } from "@/lib/services/admin/admin-insights.service";
import { INSIGHT } from "./primitives";

/**
 * The one filter that governs every number on the page.
 *
 * It is a single control rather than one per section on purpose: with per-section ranges, two
 * panels on the same screen silently describe different periods and any comparison between them
 * is wrong. One range, stated once, applied everywhere.
 *
 * The range is also honoured *server-side*. The dashboard this replaces sent start/end dates
 * that the backend ignored and then sliced a fixed 30-day array on the client, so "bimonthly"
 * rendered 30 days of data under a 60-day label. The chart grain (daily / weekly / monthly) is
 * now derived from the range by the server and echoed back, which is why it is displayed here
 * rather than offered as a second control the caller could set inconsistently.
 */
export function InsightsFilterBar({
  value,
  onChange,
  grain,
  disabled,
  computedAt,
}: {
  value: RangeKey;
  onChange: (next: RangeKey) => void;
  grain?: string;
  disabled?: boolean;
  computedAt?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        flexWrap: "wrap",
        mb: 2.5,
        px: { xs: 1.75, md: 2 },
        py: 1.5,
        borderRadius: 3,
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        backgroundColor: "var(--card-bg)",
        // Sticky so the range stays visible and changeable while reading a long page — a filter
        // you have to scroll back up to reach gets set once and then forgotten.
        position: { md: "sticky" },
        top: { md: 12 },
        zIndex: 4,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
        <IconWrapper icon="mdi:calendar-range-outline" size={17} color={INSIGHT.indigo} />
        <Typography
          sx={{
            fontSize: "0.68rem",
            fontWeight: 800,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
          }}
        >
          Period
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
        {RANGE_OPTIONS.map((opt) => {
          const active = opt.key === value;
          return (
            <Box
              key={opt.key}
              component="button"
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.key)}
              aria-pressed={active}
              title={opt.label}
              sx={{
                px: 1.5,
                py: 0.6,
                borderRadius: 999,
                cursor: disabled ? "default" : "pointer",
                fontFamily: "inherit",
                fontWeight: 800,
                fontSize: "0.75rem",
                border: active
                  ? "1px solid transparent"
                  : "1px solid color-mix(in srgb, var(--border-default) 85%, transparent)",
                background: active ? INSIGHT.gradient : "transparent",
                color: active ? "#fff" : "var(--font-secondary)",
                opacity: disabled ? 0.6 : 1,
                transition: "background .12s, color .12s",
                "&:hover": {
                  backgroundColor: active
                    ? undefined
                    : "color-mix(in srgb, var(--border-default) 30%, transparent)",
                },
                "&:focus-visible": {
                  outline: "none",
                  boxShadow: `0 0 0 2px var(--card-bg), 0 0 0 4px ${INSIGHT.indigo}`,
                },
              }}
            >
              {opt.short}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ flex: 1 }} />

      {grain && (
        <Tooltip
          arrow
          enterTouchDelay={0}
          title="Chosen by the range so the label matches the data. Short ranges plot daily; longer ones roll up to weeks or months, because a line with 365 points is noise and one with 4 is a stat tile in disguise."
        >
          <Chip
            size="small"
            icon={<IconWrapper icon="mdi:chart-timeline-variant" size={14} />}
            label={`Plotted ${grain === "day" ? "daily" : grain === "week" ? "weekly" : "monthly"}`}
            sx={{ fontWeight: 700, height: 24, cursor: "help" }}
          />
        </Tooltip>
      )}

      {computedAt && (
        <Typography sx={{ fontSize: "0.72rem", color: "var(--font-secondary)" }}>
          Updated{" "}
          {new Date(computedAt).toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      )}
    </Box>
  );
}
