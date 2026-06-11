"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import type { ReactNode } from "react";

interface CompanionCardProps {
  /** Hex accent — used sparingly: the small header icon only. */
  accent?: string;
  /** Optional header — small icon chip + uppercase label + optional right slot. */
  title?: string;
  icon?: string;
  right?: ReactNode;
  /** Dark "live" variant (the takeaways card). */
  dark?: boolean;
  children: ReactNode;
  sx?: object;
}

/**
 * The card for the Video Companion surface. Deliberately clean: a near-solid
 * surface, a hairline neutral border, and a soft shadow — accent colour appears
 * only in the small header icon chip, never as a full-card wash (which read as
 * muddy background tint when stacked). One dark variant for the live takeaways.
 */
export function CompanionCard({
  accent = "#6366f1",
  title,
  icon,
  right,
  dark = false,
  children,
  sx,
}: CompanionCardProps) {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 3,
        p: { xs: 2, md: 2.25 },
        background: dark ? "#14122b" : "var(--card-bg, #ffffff)",
        border: dark
          ? "1px solid rgba(255,255,255,0.08)"
          : "1px solid var(--border-default, #ececf1)",
        boxShadow: dark
          ? "0 12px 32px -20px rgba(0,0,0,0.5)"
          : "0 1px 2px rgba(16,24,40,0.04), 0 8px 24px -20px rgba(16,24,40,0.18)",
        color: dark ? "#fff" : "inherit",
        ...sx,
      }}
    >
      {title && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          {icon && (
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                color: dark ? "#fff" : accent,
                background: dark
                  ? "linear-gradient(135deg, #6366f1, #a855f7)"
                  : `color-mix(in srgb, ${accent} 12%, transparent)`,
              }}
            >
              <Icon icon={icon} width={15} />
            </Box>
          )}
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: dark ? "rgba(255,255,255,0.82)" : "text.secondary",
            }}
          >
            {title}
          </Typography>
          {right && <Box sx={{ ml: "auto" }}>{right}</Box>}
        </Box>
      )}
      {children}
    </Box>
  );
}
