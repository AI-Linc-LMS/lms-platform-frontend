"use client";

import { Box, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { AnimatedRing } from "@/components/scorecard/shared/AnimatedRing";
import { AIPill } from "../shared/AIPill";
import { AIBeacon } from "../shared/AIBeacon";
import type { AdaptiveAINarration } from "@/lib/types/adaptive-quiz";

interface ResultStripProps {
  narration: AdaptiveAINarration;
  hintsUsed: number;
}

function bandColor(accuracy: number): string {
  if (accuracy >= 0.8) return "#10b981";
  if (accuracy >= 0.6) return "#6366f1";
  if (accuracy >= 0.4) return "#f59e0b";
  return "#ef4444";
}

export function ResultStrip({ narration, hintsUsed }: ResultStripProps) {
  const { score_summary, headline } = narration;
  const acc = score_summary.accuracy;
  const color = bandColor(acc);
  const totalMinutes = Math.max(1, Math.round(score_summary.time_total_ms / 60000));

  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3.5 },
        borderRadius: 4,
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 65%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 60%, transparent)",
        backdropFilter: "blur(18px) saturate(140%)",
        boxShadow: "0 1px 0 0 color-mix(in srgb, white 14%, transparent) inset, 0 24px 60px -32px rgba(99, 102, 241, 0.35)",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "160px minmax(0, 1fr) 220px" },
        gap: { xs: 2, md: 3 },
        alignItems: "center",
      }}
    >
      {/* Score ring */}
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <AnimatedRing
          value={Math.round(acc * 100)}
          size={140}
          strokeWidth={12}
          color={color}
          glow
          caption="Accuracy"
        />
      </Box>

      {/* AI headline */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AIBeacon size={32} />
          <AIPill icon={<Icon icon="mdi:robot-happy-outline" width={12} />}>
            AI tutor's read
          </AIPill>
        </Box>
        <Typography sx={{ fontSize: { xs: "1.1rem", md: "1.35rem" }, fontWeight: 800, lineHeight: 1.35, letterSpacing: "-0.02em" }}>
          {headline || "Here's how the session went."}
        </Typography>
      </Box>

      {/* Stat grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 1,
        }}
      >
        <Stat label="Correct" value={String(score_summary.correct)} accent="#10b981" />
        <Stat
          label="Incorrect"
          value={String(score_summary.total - score_summary.correct)}
          accent="#ef4444"
        />
        <Stat label="Hints" value={String(hintsUsed)} accent="#a855f7" />
        <Stat label="Time" value={`${totalMinutes}m`} accent="#6366f1" />
      </Box>
    </Box>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        bgcolor: `color-mix(in srgb, ${accent} 8%, transparent)`,
        border: `1px solid color-mix(in srgb, ${accent} 22%, transparent)`,
      }}
    >
      <Typography sx={{ fontSize: "0.62rem", color: "text.secondary", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: "1.3rem", fontWeight: 900, color: accent, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>
        {value}
      </Typography>
    </Box>
  );
}
