"use client";

import { Box, Paper, Typography } from "@mui/material";
import { memo } from "react";
import { QuizOption } from "./QuizLayout";

interface AnswerOptionProps {
  option: QuizOption;
  isSelected: boolean;
  isCorrect: boolean;
  isWrongSelection: boolean;
  isReadOnly: boolean;
  isSubmitting: boolean;
  onSelect: () => void;
}

export const AnswerOption = memo(function AnswerOption({
  option,
  isSelected,
  isCorrect,
  isWrongSelection,
  isReadOnly,
  isSubmitting,
  onSelect,
}: AnswerOptionProps) {
  return (
    <Paper
      elevation={0}
      onClick={() => !isSubmitting && !isReadOnly && onSelect()}
      sx={{
        p: { xs: 2, sm: 2.5, md: 3 },
        border: isCorrect
          ? "2px solid #10b981"
          : isWrongSelection
          ? "2px solid #ef4444"
          : isSelected
          ? "2px solid #6366f1"
          : "1px solid #e5e7eb",
        backgroundColor: isCorrect
          ? "#f0fdf4"
          : isWrongSelection
          ? "#fef2f2"
          : isSelected
          ? "#f0f9ff"
          : "#ffffff",
        borderRadius: 2,
        cursor: isSubmitting || isReadOnly ? "default" : "pointer",
        transition: "all 0.2s",
        position: "relative",
        "&:hover": {
          borderColor:
            isSubmitting || isReadOnly
              ? isCorrect
                ? "#10b981"
                : isWrongSelection
                ? "#ef4444"
                : "#e5e7eb"
              : "#10b981",
          backgroundColor:
            isSubmitting || isReadOnly
              ? isCorrect
                ? "#f0fdf4"
                : isWrongSelection
                ? "#fef2f2"
                : "#ffffff"
              : "#f9fafb",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{
            fontWeight: isSelected || isCorrect ? 600 : 400,
            color: "#1a1f2e",
            fontSize: "1rem",
          }}
        >
          {option.label}
        </Typography>
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

