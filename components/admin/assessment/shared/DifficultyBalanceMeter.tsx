"use client";

import { Box, Typography } from "@mui/material";

export interface DifficultyBalance {
  easy: number;
  medium: number;
  hard: number;
}

interface DifficultyBalanceMeterProps {
  balance: DifficultyBalance;
  /** Show the "Easy N · Medium N · Hard N" legend below the bar. */
  legend?: boolean;
  /** Bar height in px. */
  height?: number;
  /** Compact single-line variant (legend inline, smaller). */
  dense?: boolean;
}

const SEGMENTS = [
  { key: "easy" as const, label: "Easy", color: "var(--ats-success, var(--success-500))" },
  { key: "medium" as const, label: "Medium", color: "var(--ats-warning, var(--warning-500))" },
  { key: "hard" as const, label: "Hard", color: "var(--ats-error, var(--error-500))" },
];

/**
 * The reusable difficulty-balance meter - a single stacked green/amber/red bar with an
 * optional count legend. Used across the composer blueprint, builder outline, hub cards
 * and the detail overview so difficulty reads consistently everywhere.
 */
export function DifficultyBalanceMeter({
  balance,
  legend = true,
  height = 8,
  dense = false,
}: DifficultyBalanceMeterProps) {
  const total = Math.max(0, balance.easy) + Math.max(0, balance.medium) + Math.max(0, balance.hard);

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        role="img"
        aria-label={`Difficulty: ${balance.easy} easy, ${balance.medium} medium, ${balance.hard} hard`}
        sx={{
          display: "flex",
          height,
          borderRadius: 999,
          overflow: "hidden",
          bgcolor: "var(--surface)",
        }}
      >
        {total === 0 ? null : (
          SEGMENTS.map((seg) => {
            const n = Math.max(0, balance[seg.key]);
            if (n === 0) return null;
            return (
              <Box
                key={seg.key}
                sx={{ width: `${(n / total) * 100}%`, bgcolor: seg.color }}
              />
            );
          })
        )}
      </Box>
      {legend ? (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: dense ? 1.25 : 2,
            mt: dense ? 0.5 : 0.75,
          }}
        >
          {SEGMENTS.map((seg) => (
            <Box key={seg.key} sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: "3px", bgcolor: seg.color }} />
              <Typography
                variant="caption"
                sx={{ color: "var(--font-secondary)", fontSize: dense ? "0.7rem" : "0.75rem" }}
              >
                {seg.label}{" "}
                <Box
                  component="span"
                  sx={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--font-primary)" }}
                >
                  {Math.max(0, balance[seg.key])}
                </Box>
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}
    </Box>
  );
}
