"use client";

import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { AIBeacon } from "../shared/AIBeacon";
import { AIPill } from "../shared/AIPill";
import { AdaptiveInfoTip } from "../shared/AdaptiveInfoTip";
import { certaintyBand } from "@/lib/utils/adaptive-confidence";
import { prettySkill } from "@/lib/utils/skill-label.utils";

interface AITutorSidecarProps {
  /** Pre-truncated hint teaser; full hint appears once the student spends a token. */
  hintTeaser?: string;
  /** When the student has paid for the hint, the full hint copy. */
  hintRevealed?: string;
  /** True while the hint AI call is in flight - disables the spend button + shows a thinking pill. */
  hintLoading?: boolean;
  hintTokensRemaining: number;
  onAskHint: () => void;
  /** Selector's predicted P(correct) - used to set the branch preview copy. */
  predictedPCorrect: number;
  difficultyLabel: string;
  targetSkill: string;
  /** Average standard error across target skills - drives the certainty band. */
  avgSe: number | null;
}

export function AITutorSidecar({
  hintTeaser,
  hintRevealed,
  hintLoading = false,
  hintTokensRemaining,
  onAskHint,
  predictedPCorrect,
  difficultyLabel,
  targetSkill,
  avgSe,
}: AITutorSidecarProps) {
  const skillLabel = prettySkill(targetSkill, "current topic");
  const certainty = certaintyBand(avgSe);
  const predictedPct = Math.round(predictedPCorrect * 100);

  // Branch preview - what the selector will likely pick next. Phrased as a
  // verb-noun pair so it reads naturally regardless of skill name.
  const correctBranch =
    difficultyLabel === "Hard"
      ? `Stretch question on ${skillLabel}`
      : `Harder question on ${skillLabel}`;
  const wrongBranch = `Easier ${skillLabel} warm-up`;

  return (
    <Box
      sx={{
        position: "sticky",
        top: 24,
        p: 2,
        borderRadius: 4,
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 60%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 60%, transparent)",
        backdropFilter: "blur(18px) saturate(140%)",
        boxShadow: "0 1px 0 0 color-mix(in srgb, white 14%, transparent) inset",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <AIBeacon size={32} />
        <Box>
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "text.secondary" }}>
            AI Tutor
          </Typography>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, lineHeight: 1.2 }}>
            Coaching this question
          </Typography>
        </Box>
      </Box>

      {/* Section 1: Why this Q - structured layman copy (skill chip + certainty
          + predicted %) so the student doesn't have to read raw selector jargon. */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <AIPill icon={<Icon icon="mdi:thought-bubble-outline" width={12} />}>Why you got this Q</AIPill>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.85 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: "0.82rem", color: "text.primary", fontWeight: 600 }}>
              Testing
            </Typography>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.35,
                px: 0.85,
                py: 0.25,
                borderRadius: 999,
                bgcolor: "color-mix(in srgb, #6366f1 12%, transparent)",
                border: "1px solid color-mix(in srgb, #6366f1 32%, transparent)",
                color: "#6366f1",
                fontSize: "0.72rem",
                fontWeight: 800,
              }}
            >
              <Icon icon="mdi:tag-outline" width={11} />
              {skillLabel}
            </Box>
            <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", fontWeight: 600 }}>
              at the
            </Typography>
            <Typography
              sx={{
                fontSize: "0.82rem",
                fontWeight: 800,
                color:
                  difficultyLabel === "Hard"
                    ? "#ef4444"
                    : difficultyLabel === "Easy"
                      ? "#10b981"
                      : "#6366f1",
              }}
            >
              {difficultyLabel}
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", fontWeight: 600 }}>
              level.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontWeight: 600 }}>
              AI&apos;s read:
            </Typography>
            <Typography sx={{ fontSize: "0.78rem", color: certainty.accent, fontWeight: 800 }}>
              {certainty.label}
            </Typography>
            <AdaptiveInfoTip title="How sure is the AI right now?" placement="left">
              <p>
                As you answer, the AI builds a private estimate of your level
                on <strong>{skillLabel}</strong>. The more you answer, the more
                confident it becomes - and the better-matched the next question
                will be.
              </p>
              <p>
                <strong>Just getting to know you</strong> - first couple of
                questions, very little to go on.
                <br />
                <strong>Building a picture</strong> - a rough sense.
                <br />
                <strong>Getting clearer</strong> - narrowing in.
                <br />
                <strong>Confident read</strong> - confident enough to wrap up
                soon.
              </p>
            </AdaptiveInfoTip>
            <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontWeight: 600 }}>
              · ~{predictedPct}% chance you&apos;ll get this right.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Section 2: Hint */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <AIPill icon={<Icon icon="mdi:lightbulb-outline" width={12} />}>Hint</AIPill>
        {hintRevealed ? (
          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              border: "1px solid color-mix(in srgb, #a855f7 35%, transparent)",
              bgcolor: "color-mix(in srgb, #a855f7 8%, transparent)",
            }}
          >
            <Typography sx={{ fontSize: "0.84rem", color: "text.primary", lineHeight: 1.5 }}>
              {hintRevealed}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              p: 1.25,
              borderRadius: 2,
              border: "1.5px dashed color-mix(in srgb, #a855f7 45%, transparent)",
              bgcolor: "color-mix(in srgb, #a855f7 4%, transparent)",
              display: "flex",
              flexDirection: "column",
              gap: 0.75,
            }}
          >
            <Box sx={{ display: "flex", gap: 0.75, alignItems: "flex-start" }}>
              {hintLoading && (
                <Icon
                  icon="mdi:loading"
                  width={14}
                  style={{
                    color: "#a855f7",
                    flexShrink: 0,
                    marginTop: 2,
                    animation: "ai-tutor-hint-spin 1s linear infinite",
                  }}
                />
              )}
              <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", fontStyle: "italic", lineHeight: 1.45 }}>
                {hintTeaser ?? "Think about what the question is really asking…"}
              </Typography>
            </Box>
            <ButtonBase
              onClick={onAskHint}
              disabled={hintTokensRemaining <= 0 || hintLoading}
              sx={{
                alignSelf: "flex-start",
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                color: hintTokensRemaining > 0 && !hintLoading ? "white" : "text.disabled",
                background: hintTokensRemaining > 0 && !hintLoading
                  ? "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)"
                  : "color-mix(in srgb, #a855f7 18%, transparent)",
                fontSize: "0.7rem",
                fontWeight: 800,
                letterSpacing: "0.05em",
                "&:disabled": { cursor: "not-allowed" },
              }}
            >
              {hintLoading
                ? "Thinking…"
                : `Spend 1 hint · ${hintTokensRemaining} left`}
            </ButtonBase>
            <style jsx global>{`
              @keyframes ai-tutor-hint-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </Box>
        )}
      </Box>

      {/* Section 3: Next-question branch preview */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
        <AIPill icon={<Icon icon="mdi:source-branch" width={12} />}>What comes next</AIPill>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1,
              borderRadius: 2,
              bgcolor: "color-mix(in srgb, #10b981 8%, transparent)",
              border: "1px solid color-mix(in srgb, #10b981 25%, transparent)",
            }}
          >
            <Icon icon="mdi:check-circle-outline" width={16} style={{ color: "#10b981" }} />
            <Typography sx={{ fontSize: "0.76rem", fontWeight: 600, color: "text.primary" }}>
              If you answer ✓: <Box component="span" sx={{ color: "#10b981", fontWeight: 800 }}>{correctBranch}</Box>
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1,
              borderRadius: 2,
              bgcolor: "color-mix(in srgb, #ef4444 8%, transparent)",
              border: "1px solid color-mix(in srgb, #ef4444 25%, transparent)",
            }}
          >
            <Icon icon="mdi:refresh" width={16} style={{ color: "#ef4444" }} />
            <Typography sx={{ fontSize: "0.76rem", fontWeight: 600, color: "text.primary" }}>
              If you answer ✗: <Box component="span" sx={{ color: "#ef4444", fontWeight: 800 }}>{wrongBranch}</Box>
            </Typography>
          </Box>
        </Box>
      </Box>

      <Typography sx={{ fontSize: "0.66rem", color: "text.secondary", fontStyle: "italic", textAlign: "center", mt: 1 }}>
        Powered by AI Linc Adaptive Engine
      </Typography>
    </Box>
  );
}
