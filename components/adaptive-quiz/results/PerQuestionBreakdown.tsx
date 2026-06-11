"use client";

import { useState } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { Icon } from "@iconify/react";
import { PerQuestionRationaleCard } from "./PerQuestionRationaleCard";
import type { AdaptiveAINarration, AdaptiveResponseRow } from "@/lib/types/adaptive-quiz";

interface PerQuestionBreakdownProps {
  responses: AdaptiveResponseRow[];
  narration: AdaptiveAINarration;
  /** MCQ id → resolved question text + options. Sourced from the session detail's `responses` array. */
  mcqDirectory: Record<number, { question_text: string; options: Array<{ id: string; value: string }>; correct_option: string }>;
}

export function PerQuestionBreakdown({ responses, narration, mcqDirectory }: PerQuestionBreakdownProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(responses.length ? 0 : null);

  if (!responses.length) {
    return null;
  }

  const selectedResp = selectedIndex !== null ? responses.find((r) => r.order_index === selectedIndex) ?? null : null;
  const selectedRationale =
    selectedIndex !== null ? narration.per_question.find((p) => p.index === selectedIndex) ?? null : null;

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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Icon icon="mdi:format-list-numbered" width={20} style={{ color: "#6366f1" }} />
        <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
          Question by question
        </Typography>
        <Typography sx={{ ml: "auto", fontSize: "0.74rem", color: "text.secondary", fontWeight: 600 }}>
          Tap a pill to see the AI's read on it.
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {responses.map((r) => {
          const isSelected = selectedIndex === r.order_index;
          const color = r.is_correct ? "#10b981" : "#ef4444";
          return (
            <ButtonBase
              key={r.order_index}
              onClick={() => setSelectedIndex(r.order_index)}
              sx={{
                width: 40,
                height: 40,
                borderRadius: 999,
                fontWeight: 800,
                fontSize: "0.85rem",
                color: isSelected ? "white" : color,
                bgcolor: isSelected ? color : `color-mix(in srgb, ${color} 12%, transparent)`,
                border: `1.5px solid color-mix(in srgb, ${color} ${isSelected ? "0%" : "45%"}, transparent)`,
                transition: "all 120ms ease",
              }}
            >
              {r.order_index + 1}
            </ButtonBase>
          );
        })}
      </Box>

      {selectedResp && (
        <PerQuestionRationaleCard
          response={selectedResp}
          rationale={selectedRationale}
          mcq={mcqDirectory[selectedResp.mcq]}
        />
      )}
    </Box>
  );
}
