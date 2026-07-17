"use client";

import { Box, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

export interface StatItem {
  label: string;
  value: string | number;
  icon?: string;
  /** Tone for the icon tile: any CSS color/var. */
  tone?: string;
}

interface StatStripProps {
  items: StatItem[];
}

/**
 * A horizontal strip of metric cards (total / active / scheduled / drafts / submissions /
 * pass-rate). Numbers render in the mono stack so the strip reads like a dashboard.
 */
export function StatStrip({ items }: StatStripProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, 1fr)",
          sm: "repeat(3, 1fr)",
          lg: `repeat(${items.length}, 1fr)`,
        },
        gap: 1.5,
      }}
    >
      {items.map((it) => {
        const tone = it.tone || "var(--accent-indigo)";
        return (
          <Box
            key={it.label}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              borderRadius: "var(--radius-card)",
              bgcolor: "var(--card-bg)",
              border: "1px solid var(--border-default)",
              transition: "box-shadow 0.15s ease",
              "&:hover": {
                boxShadow: "0 8px 24px -14px color-mix(in srgb, var(--font-primary) 30%, transparent)",
              },
            }}
          >
            {it.icon ? (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: `color-mix(in srgb, ${tone} 14%, var(--card-bg) 86%)`,
                  color: tone,
                }}
              >
                <IconWrapper icon={it.icon} size={20} />
              </Box>
            ) : null}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  fontSize: "1.35rem",
                  lineHeight: 1.1,
                  color: "var(--font-primary)",
                }}
              >
                {it.value}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--font-secondary)", whiteSpace: "nowrap" }}
              >
                {it.label}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
