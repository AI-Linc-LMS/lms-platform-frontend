"use client";

import { Box, Paper } from "@mui/material";
import { memo } from "react";
import { QuizOption } from "./QuizLayout";
import { OptionText } from "./OptionText";

interface AnswerOptionProps {
  option: QuizOption;
  isSelected: boolean;
  isCorrect: boolean;
  isWrongSelection: boolean;
  isReadOnly: boolean;
  isSubmitting: boolean;
  onSelect: () => void;
  compact?: boolean;
}

export const AnswerOption = memo(function AnswerOption({
  option,
  isSelected,
  isCorrect,
  isWrongSelection,
  isReadOnly,
  isSubmitting,
  onSelect,
  compact,
}: AnswerOptionProps) {
  // Hot path: this component renders 4 instances per question and handles every
  // click. Hover styles are kept cheap - only border + background animate, and the
  // transform/box-shadow lift was removed because it forced GPU compositing on every
  // pointer move and was a real cost on weak laptops with integrated graphics.
  // The "selected" state still gets a subtle resting box-shadow for visual feedback.
  const interactive = !isSubmitting && !isReadOnly;
  const borderColor = isCorrect
    ? "#10b981"
    : isWrongSelection
    ? "#ef4444"
    : isSelected
    ? "#6366f1"
    : "#e5e7eb";
  const backgroundColor = isCorrect
    ? "#f0fdf4"
    : isWrongSelection
    ? "#fef2f2"
    : isSelected
    ? "#eff6ff"
    : "#ffffff";
  return (
    <Paper
      elevation={0}
      onClick={() => interactive && onSelect()}
      sx={{
        p: compact ? { xs: 2, sm: 2.5, md: 3 } : { xs: 2.5, sm: 3, md: 3.5 },
        border: `${isSelected || isCorrect || isWrongSelection ? 2 : 1.5}px solid ${borderColor}`,
        backgroundColor,
        borderRadius: 2.5,
        cursor: interactive ? "pointer" : "default",
        // Animate only cheap properties - `all` was triggering box-shadow & transform
        // recomputes on every pointer move. Border + background-color are GPU-cheap.
        transition: "border-color 0.15s ease-out, background-color 0.15s ease-out",
        position: "relative",
        boxShadow: isSelected
          ? "0 2px 8px 0 rgba(99, 102, 241, 0.15)"
          : "none",
        ...(interactive && {
          "&:hover": {
            borderColor: isSelected ? "#4f46e5" : "#6366f1",
            backgroundColor: isSelected ? "#dbeafe" : "#f9fafb",
          },
        }),
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* One renderer, and a sanitizing one. This branch used to inject option HTML with a raw
            `dangerouslySetInnerHTML` while every other surface went through RichHtml, so the
            busiest learner screen was the one place option markup reached the DOM unfiltered. The
            text branch, the HTML detection and the blank-tag guard all move WITH it, in
            components/quiz/OptionText.tsx, so nothing about how a plain option looks changes. */}
        <OptionText
          text={option.label}
          sx={{
            fontWeight: isSelected || isCorrect ? 600 : 500,
            color: isSelected
              ? "#1e40af"
              : isCorrect
              ? "#065f46"
              : isWrongSelection
              ? "#991b1b"
              : "#1a1f2e",
            fontSize: "1rem",
            lineHeight: 1.6,
            letterSpacing: "0.01em",
            "& p": { margin: 0 },
          }}
        />
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          {isCorrect && (
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              ✓
            </Box>
          )}
          {isWrongSelection && (
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              ✗
            </Box>
          )}
          {isSelected && !isCorrect && !isWrongSelection && (
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                backgroundColor: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              ✓
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
});

