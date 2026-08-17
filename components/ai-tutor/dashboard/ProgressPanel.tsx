"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { TutorTintSurface } from "../shared/surfaces";
import type { TutorStats } from "@/lib/services/ai-tutor.service";

/**
 * The learner's totals, as a rail panel rather than a four-across strip.
 *
 * The strip version put four big neutral cards at full page width, which gave the least
 * interesting numbers on the page the most space on it. In the rail they read as a summary,
 * which is what they are, and the width goes to the things you can actually act on.
 *
 * Zeros render. A new learner seeing "0 sessions" is being told something true and is one
 * click from changing it; hiding the panel until it has data would make the rail collapse on
 * exactly the account that most needs the page to look finished.
 */

const ROWS: { key: keyof TutorStats; icon: string; label: string }[] = [
  { key: "minutes_tutored", icon: "solar:clock-circle-bold-duotone", label: "Minutes tutored" },
  { key: "sessions", icon: "solar:book-2-bold-duotone", label: "Sessions" },
  { key: "questions_answered", icon: "solar:question-square-bold-duotone", label: "Questions answered" },
  { key: "notes_saved", icon: "solar:bookmark-bold-duotone", label: "Notes kept" },
];

export function ProgressPanel({ stats }: { stats?: TutorStats }) {
  return (
    <TutorTintSurface tint="violet" padded={false}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: { xs: 2, md: 2.5 },
          py: 1.5,
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <Icon
          icon="solar:chart-2-bold-duotone"
          width={17}
          style={{ color: "var(--ai-violet)" }}
        />
        <Typography
          sx={{
            fontSize: "0.74rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
            '[dir="rtl"] &': { letterSpacing: "normal", textTransform: "none" },
          }}
        >
          Your progress
        </Typography>
      </Box>

      <Box>
        {ROWS.map((row, i) => (
          <Box
            key={row.key}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              px: { xs: 2, md: 2.5 },
              py: 1.25,
              borderTop: i === 0 ? "none" : "1px solid var(--border-default)",
            }}
          >
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: "8px",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                bgcolor: "color-mix(in srgb, var(--ai-violet) 12%, transparent)",
              }}
            >
              <Icon icon={row.icon} width={16} style={{ color: "var(--ai-violet)" }} />
            </Box>
            <Typography
              sx={{ fontSize: "0.88rem", color: "var(--font-secondary)", flex: 1, minWidth: 0 }}
            >
              {row.label}
            </Typography>
            <Typography
              sx={{
                fontSize: "1.05rem",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stats?.[row.key] ?? 0}
            </Typography>
          </Box>
        ))}
      </Box>
    </TutorTintSurface>
  );
}
