"use client";

import { Box, ButtonBase, Typography } from "@mui/material";
import type { ConfidenceLevel } from "@/lib/types/adaptive-quiz";

const OPTIONS: Array<{ value: ConfidenceLevel; label: string; emoji: string }> = [
  { value: 1, label: "Guessing", emoji: "🤷" },
  { value: 2, label: "Unsure", emoji: "🤔" },
  { value: 3, label: "Pretty sure", emoji: "🙂" },
  { value: 4, label: "Certain", emoji: "💯" },
];

interface ConfidenceInputProps {
  value: ConfidenceLevel | null;
  onChange: (next: ConfidenceLevel) => void;
}

export function ConfidenceInput({ value, onChange }: ConfidenceInputProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography
        sx={{
          fontSize: "0.66rem",
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "text.secondary",
        }}
      >
        How confident are you before submitting?
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
        }}
      >
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <ButtonBase
              key={opt.value}
              onClick={() => onChange(opt.value)}
              sx={{
                px: 1.25,
                py: 1,
                borderRadius: 2,
                border: selected
                  ? "1.5px solid #6366f1"
                  : "1.5px solid color-mix(in srgb, var(--border-default, #e5e7eb) 80%, transparent)",
                bgcolor: selected
                  ? "color-mix(in srgb, #6366f1 8%, transparent)"
                  : "color-mix(in srgb, var(--card-bg, #ffffff) 75%, transparent)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                transition: "border-color 120ms ease, background-color 120ms ease",
              }}
            >
              <Box sx={{ fontSize: "1.3rem", lineHeight: 1 }}>{opt.emoji}</Box>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: selected ? "#6366f1" : "text.primary",
                  textAlign: "center",
                }}
              >
                {opt.label}
              </Typography>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}
