"use client";

import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { AIPill } from "../shared/AIPill";

interface SkillRow {
  skill: string;
  theta: number;
  /** Previous θ (before the most recent answer) — drives the ghost marker. */
  thetaPrev?: number;
  se: number;
}

interface SkillConfidenceCardProps {
  skills: SkillRow[];
  /** Skill currently being targeted by the selector — used to highlight the row. */
  activeSkill?: string;
  /** Short AI nudge under the list — when present, surfaced as a soft purple pill. */
  nudge?: string;
}

const BAND_COLOR = (mastery: number): string => {
  if (mastery >= 0.75) return "#10b981";
  if (mastery >= 0.55) return "#6366f1";
  if (mastery >= 0.35) return "#f59e0b";
  return "#ef4444";
};

/** Map θ ∈ [-4, +4] to a 0–1 mastery view. The sigmoid keeps the middle
 *  band wide so the visual changes are perceptible in the common θ range. */
function thetaToMastery(theta: number): number {
  return 1 / (1 + Math.exp(-theta * 0.9));
}

function prettySkill(s: string): string {
  if (!s) return "General";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SkillConfidenceCard({ skills, activeSkill, nudge }: SkillConfidenceCardProps) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 3,
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 70%, transparent)",
        backdropFilter: "blur(14px) saturate(140%)",
        boxShadow: "0 1px 0 0 color-mix(in srgb, white 12%, transparent) inset",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", letterSpacing: "-0.01em" }}>
          Skill confidence
        </Typography>
        <AIPill icon={<Icon icon="mdi:chart-bell-curve-cumulative" width={12} />}>live</AIPill>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {skills.map((row) => {
          const mastery = thetaToMastery(row.theta);
          const masteryPrev = row.thetaPrev !== undefined ? thetaToMastery(row.thetaPrev) : null;
          const color = BAND_COLOR(mastery);
          const isActive = activeSkill && activeSkill === row.skill;
          return (
            <Box key={row.skill}>
              <Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 0.5 }}>
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: isActive ? "var(--accent-indigo, #6366f1)" : "text.primary",
                  }}
                >
                  {prettySkill(row.skill)}
                  {isActive && (
                    <Box component="span" sx={{ ml: 0.75, fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.14em", color: "var(--accent-indigo, #6366f1)" }}>
                      • TARGETING
                    </Box>
                  )}
                </Typography>
                <Typography sx={{ fontSize: "0.78rem", fontWeight: 800, color, fontVariantNumeric: "tabular-nums" }}>
                  {Math.round(mastery * 100)}%
                </Typography>
              </Box>
              <Box sx={{ position: "relative", height: 8, borderRadius: 999, bgcolor: "color-mix(in srgb, currentColor 10%, transparent)", overflow: "hidden" }}>
                {masteryPrev !== null && Math.abs(mastery - masteryPrev) > 0.01 && (
                  <Box
                    aria-hidden
                    sx={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: 0,
                      width: `${Math.round(masteryPrev * 100)}%`,
                      borderRight: `2px dashed color-mix(in srgb, ${color} 60%, transparent)`,
                      opacity: 0.55,
                    }}
                  />
                )}
                <Box
                  component={motion.div}
                  initial={false}
                  animate={{ width: `${Math.round(mastery * 100)}%` }}
                  transition={{ type: "spring", stiffness: 180, damping: 28 }}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background: `linear-gradient(90deg, color-mix(in srgb, ${color} 65%, transparent) 0%, ${color} 100%)`,
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: "0.62rem", color: "text.secondary", mt: 0.4 }}>
                SE {row.se.toFixed(2)}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {nudge && (
        <Box
          sx={{
            mt: 0.5,
            p: 1.25,
            borderRadius: 2,
            bgcolor: "color-mix(in srgb, #a855f7 10%, transparent)",
            border: "1px solid color-mix(in srgb, #a855f7 22%, transparent)",
            display: "flex",
            gap: 1,
            alignItems: "flex-start",
          }}
        >
          <Icon icon="mdi:target" width={16} style={{ color: "#a855f7", marginTop: 2 }} />
          <Typography sx={{ fontSize: "0.78rem", color: "text.primary", lineHeight: 1.45 }}>
            {nudge}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
