"use client";

import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { CountUp } from "@/components/scorecard/shared/CountUp";
import type { AdaptiveAINarration } from "@/lib/types/adaptive-quiz";

interface SkillMasteryHeatmapProps {
  skills: AdaptiveAINarration["skill_mastery"];
}

const BAND_LABEL: Record<string, string> = {
  emerging: "Needs work",
  developing: "Developing",
  proficient: "Proficient",
  mastered: "Mastered",
};

const BAND_COLOR: Record<string, string> = {
  emerging: "#ef4444",
  developing: "#f59e0b",
  proficient: "#6366f1",
  mastered: "#10b981",
};

function prettySkill(s: string): string {
  if (!s) return "General";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SkillMasteryHeatmap({ skills }: SkillMasteryHeatmapProps) {
  if (!skills.length) {
    return null;
  }
  return (
    <Box
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 4,
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 65%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 60%, transparent)",
        backdropFilter: "blur(18px) saturate(140%)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Icon icon="mdi:chart-line-variant" width={20} style={{ color: "#6366f1" }} />
          <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
            Skill mastery
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.74rem", color: "text.secondary", fontWeight: 600 }}>
          Dashed marker = where you ended your last attempt
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {skills.map((row) => {
          const color = BAND_COLOR[row.band] ?? "#6366f1";
          const hasBaseline = row.delta_pct !== null && row.delta_pct !== undefined;
          const previousMastery =
            typeof row.previous_mastery_pct === "number"
              ? Math.max(0, Math.min(100, row.previous_mastery_pct))
              : null;
          return (
            <Box key={row.skill}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.5 }}>
                <Typography sx={{ fontSize: "0.88rem", fontWeight: 700 }}>{prettySkill(row.skill)}</Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25 }}>
                  <Typography sx={{ fontSize: "0.62rem", color: "text.secondary", letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 800 }}>
                    {BAND_LABEL[row.band] ?? row.band}
                  </Typography>
                  {hasBaseline && row.delta_pct !== 0 ? (
                    <Typography
                      sx={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        color: (row.delta_pct as number) > 0 ? "#10b981" : "#ef4444",
                      }}
                    >
                      {(row.delta_pct as number) > 0 ? "+" : ""}
                      {row.delta_pct} pts
                    </Typography>
                  ) : !hasBaseline ? (
                    <Box
                      sx={{
                        px: 0.7,
                        py: 0.15,
                        borderRadius: 999,
                        fontSize: "0.6rem",
                        fontWeight: 800,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#a855f7",
                        bgcolor: "color-mix(in srgb, #a855f7 12%, transparent)",
                        border: "1px solid color-mix(in srgb, #a855f7 25%, transparent)",
                      }}
                    >
                      First attempt
                    </Box>
                  ) : null}
                  <Typography
                    sx={{
                      fontSize: "0.95rem",
                      fontWeight: 900,
                      color,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    <CountUp value={row.mastery_pct} duration={1.2} suffix="%" />
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ position: "relative", height: 12, borderRadius: 999, bgcolor: "color-mix(in srgb, currentColor 8%, transparent)", overflow: "hidden" }}>
                {previousMastery !== null && previousMastery !== row.mastery_pct && (
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: `${previousMastery}%`,
                      width: "0px",
                      borderLeft: "2px dashed color-mix(in srgb, currentColor 50%, transparent)",
                    }}
                  />
                )}
                <Box
                  component={motion.div}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${row.mastery_pct}%` }}
                  viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background: `linear-gradient(90deg, color-mix(in srgb, ${color} 60%, transparent) 0%, ${color} 100%)`,
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: "0.62rem", color: "text.secondary", mt: 0.5 }}>
                SE {row.se.toFixed(2)} · θ {row.theta.toFixed(2)}
                {previousMastery !== null && ` · was ${previousMastery}%`}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
