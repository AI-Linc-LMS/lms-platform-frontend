"use client";

import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { AIBeacon } from "../shared/AIBeacon";
import { AIPill } from "../shared/AIPill";
import { AdaptiveInfoTip } from "../shared/AdaptiveInfoTip";
import { certaintyBand } from "@/lib/utils/adaptive-confidence";

interface DifficultyPulseProps {
  /** Selector's predicted P(correct) for the *current* question. 0..1 — used to position the marker. */
  predictedPCorrect: number;
  /** Sub-skill being probed this turn. Rendered as its own chip. */
  targetSkill: string;
  /** Average standard error across target skills — drives the certainty label. */
  avgSe: number | null;
  difficultyLabel: "Easy" | "Medium" | "Hard" | string;
}

const GRADIENT = "linear-gradient(90deg, #10b981 0%, #6366f1 50%, #ef4444 100%)";

function prettySkill(s: string): string {
  if (!s) return "this skill";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DifficultyPulse({
  predictedPCorrect,
  targetSkill,
  avgSe,
  difficultyLabel,
}: DifficultyPulseProps) {
  const certainty = certaintyBand(avgSe);
  const skillLabel = prettySkill(targetSkill);
  const predictedPct = Math.round(predictedPCorrect * 100);
  // The track maps Easy (left) → Hard (right). A *lower* predicted P(correct)
  // means the engine picked a harder item relative to the student's θ, so we
  // map P=1 → 0% (Easy) and P=0 → 100% (Hard).
  const markerPct = Math.max(2, Math.min(98, (1 - predictedPCorrect) * 100));

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        gap: 2,
        p: 1.75,
        borderRadius: 3,
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 55%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 70%, transparent)",
        backdropFilter: "blur(14px) saturate(140%)",
        boxShadow: "0 1px 0 0 color-mix(in srgb, white 14%, transparent) inset, 0 16px 36px -24px rgba(99, 102, 241, 0.4)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <AIBeacon size={36} />
      </Box>

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.75, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <AIPill icon={<Icon icon="mdi:robot-happy-outline" width={14} />}>Adaptive engine</AIPill>
          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontWeight: 600 }}>
            Current question · {difficultyLabel}
          </Typography>
        </Box>

        {/* Plain-English line: skill chip + how sure the AI is + predicted % */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: "0.88rem", color: "text.primary", fontWeight: 600, lineHeight: 1.5 }}>
            Testing
          </Typography>
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.4,
              px: 1,
              py: 0.3,
              borderRadius: 999,
              bgcolor: "color-mix(in srgb, #6366f1 12%, transparent)",
              border: "1px solid color-mix(in srgb, #6366f1 32%, transparent)",
              color: "#6366f1",
              fontSize: "0.78rem",
              fontWeight: 800,
              letterSpacing: "-0.005em",
            }}
          >
            <Icon icon="mdi:tag-outline" width={12} />
            {skillLabel}
          </Box>
          <Typography sx={{ fontSize: "0.88rem", color: "text.secondary", fontWeight: 600 }}>·</Typography>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4 }}>
            <Typography
              sx={{
                fontSize: "0.88rem",
                color: certainty.accent,
                fontWeight: 700,
              }}
            >
              {certainty.label}
            </Typography>
            <AdaptiveInfoTip title="What's the AI measuring?" placement="bottom">
              <p>
                As you answer, the AI builds a private estimate of how strong
                you are on <strong>{skillLabel}</strong>. The more you answer,
                the more confident that estimate becomes.
              </p>
              <p>
                <strong>Just getting to know you</strong> — first couple of
                questions, the AI has very little to go on.
                <br />
                <strong>Building a picture</strong> — it has a rough sense.
                <br />
                <strong>Getting clearer</strong> — it's narrowing in.
                <br />
                <strong>Confident read</strong> — it can stop soon.
              </p>
              <p style={{ opacity: 0.7, fontSize: "0.74rem" }}>
                You don't need to do anything special — answer honestly and the
                next question adapts to where you are.
              </p>
            </AdaptiveInfoTip>
          </Box>
          <Typography sx={{ fontSize: "0.88rem", color: "text.secondary", fontWeight: 600 }}>·</Typography>
          <Typography sx={{ fontSize: "0.88rem", color: "text.secondary", fontWeight: 600 }}>
            ~{predictedPct}% chance you'll get this right
          </Typography>
        </Box>

        <Box sx={{ position: "relative", mt: 0.5, height: 10 }}>
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              background: GRADIENT,
              opacity: 0.85,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              border: "1px solid color-mix(in srgb, white 30%, transparent)",
              boxShadow: "0 1px 0 0 color-mix(in srgb, white 25%, transparent) inset",
            }}
          />
          <Box
            component={motion.div}
            aria-label={`Difficulty marker at ${Math.round(markerPct)}% of the Easy–Hard range`}
            initial={false}
            animate={{ left: `${markerPct}%` }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            sx={{
              position: "absolute",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "white",
              boxShadow:
                "0 0 0 2px #6366f1, 0 6px 14px -4px rgba(99, 102, 241, 0.55)",
            }}
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.25 }}>
          <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "text.secondary" }}>
            Easy
          </Typography>
          <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "text.secondary" }}>
            Hard
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
