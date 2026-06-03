"use client";

import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { AIPill } from "../shared/AIPill";
import type {
  AdaptiveAINarration,
  AdaptiveResponseRow,
} from "@/lib/types/adaptive-quiz";

interface PerQuestionRationaleCardProps {
  response: AdaptiveResponseRow;
  rationale: AdaptiveAINarration["per_question"][number] | null;
  mcq: {
    question_text: string;
    options: Array<{ id: string; value: string }>;
    correct_option: string;
  } | undefined;
}

export function PerQuestionRationaleCard({
  response,
  rationale,
  mcq,
}: PerQuestionRationaleCardProps) {
  if (!mcq) {
    return (
      <Typography sx={{ color: "text.secondary", fontStyle: "italic" }}>
        Question details unavailable.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
        gap: 2.5,
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        bgcolor: "color-mix(in srgb, var(--card-bg, #ffffff) 50%, transparent)",
        border: "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 80%, transparent)",
      }}
    >
      {/* Left: question + options */}
      <Box>
        <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "text.secondary", mb: 0.5 }}>
          Question {response.order_index + 1}
        </Typography>
        <Typography sx={{ fontSize: "0.98rem", fontWeight: 700, lineHeight: 1.45, mb: 1.5 }}>
          {mcq.question_text}
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {mcq.options.map((opt) => {
            const isCorrect = opt.id === mcq.correct_option;
            const isPicked = opt.id === response.selected_option;
            const color = isCorrect ? "#10b981" : isPicked ? "#ef4444" : undefined;
            return (
              <Box
                key={opt.id}
                sx={{
                  px: 1.25,
                  py: 1,
                  borderRadius: 2,
                  border: color ? `1.5px solid color-mix(in srgb, ${color} 50%, transparent)` : "1px solid color-mix(in srgb, var(--border-default, #e5e7eb) 80%, transparent)",
                  bgcolor: color ? `color-mix(in srgb, ${color} 8%, transparent)` : "transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    flexShrink: 0,
                    border: "1.5px solid",
                    borderColor: color ?? "color-mix(in srgb, currentColor 30%, transparent)",
                    color: color ?? "text.secondary",
                  }}
                >
                  {opt.id}
                </Box>
                <Typography sx={{ fontSize: "0.86rem", flex: 1 }}>{opt.value}</Typography>
                {isCorrect && <Icon icon="mdi:check-circle" width={18} style={{ color: "#10b981" }} />}
                {isPicked && !isCorrect && <Icon icon="mdi:close-circle" width={18} style={{ color: "#ef4444" }} />}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Right: AI rationale */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <AIPill icon={<Icon icon="mdi:thought-bubble-outline" width={12} />}>
          {response.is_correct ? "Why you got this right" : "Why you got this wrong"}
        </AIPill>
        <Typography sx={{ fontSize: "0.9rem", color: "text.primary", lineHeight: 1.55 }}>
          {rationale?.rationale ?? "No AI rationale was produced for this question."}
        </Typography>
        {rationale?.correct_concept && (
          <Box>
            <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "text.secondary", mb: 0.25 }}>
              Correct concept
            </Typography>
            <Typography sx={{ fontSize: "0.86rem", color: "text.primary", lineHeight: 1.5 }}>
              {rationale.correct_concept}
            </Typography>
          </Box>
        )}
        {rationale?.your_mistake && (
          <Box>
            <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", color: "text.secondary", mb: 0.25 }}>
              Where you went off
            </Typography>
            <Typography sx={{ fontSize: "0.86rem", color: "text.primary", lineHeight: 1.5 }}>
              {rationale.your_mistake}
            </Typography>
          </Box>
        )}
        {rationale?.diagram_suggestion && (
          <ButtonBase
            sx={{
              alignSelf: "flex-start",
              px: 1.5,
              py: 0.6,
              borderRadius: 999,
              border: "1px solid color-mix(in srgb, #a855f7 40%, transparent)",
              color: "#a855f7",
              fontSize: "0.74rem",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Icon icon="mdi:chart-bubble" width={14} />
            Explain with a diagram
          </ButtonBase>
        )}
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: "auto" }}>
          <MetaChip icon="mdi:clock-outline" label={`${Math.round(response.time_ms / 1000)}s`} />
          {response.confidence !== null && (
            <MetaChip icon="mdi:gauge" label={`confidence ${response.confidence}/4`} />
          )}
          {response.hint_used && <MetaChip icon="mdi:lightbulb-on-outline" label="hint used" />}
          {response.target_skill && (
            <MetaChip
              icon="mdi:bullseye-arrow"
              label={response.target_skill.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

function MetaChip({ icon, label }: { icon: string; label: string }) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 0.9,
        py: 0.25,
        borderRadius: 999,
        fontSize: "0.7rem",
        fontWeight: 700,
        color: "text.secondary",
        bgcolor: "color-mix(in srgb, currentColor 8%, transparent)",
        border: "1px solid color-mix(in srgb, currentColor 18%, transparent)",
      }}
    >
      <Icon icon={icon} width={12} />
      {label}
    </Box>
  );
}
