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
        p: { xs: 2.5, sm: 3, md: 3.5 },
        border: isCorrect
          ? "2px solid #10b981"
          : isWrongSelection
          ? "2px solid #ef4444"
          : isSelected
          ? "2px solid #6366f1"
          : "1.5px solid #e5e7eb",
        backgroundColor: isCorrect
          ? "#f0fdf4"
          : isWrongSelection
          ? "#fef2f2"
          : isSelected
          ? "#eff6ff"
          : "#ffffff",
        borderRadius: 2.5,
        cursor: isSubmitting || isReadOnly ? "default" : "pointer",
        transition: "all 0.2s ease-in-out",
        position: "relative",
        boxShadow: isSelected
          ? "0 2px 8px 0 rgba(99, 102, 241, 0.15)"
          : "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        "&:hover": {
          borderColor:
            isSubmitting || isReadOnly
              ? isCorrect
                ? "#10b981"
                : isWrongSelection
                ? "#ef4444"
                : "#e5e7eb"
              : isSelected
              ? "#4f46e5"
              : "#6366f1",
          backgroundColor:
            isSubmitting || isReadOnly
              ? isCorrect
                ? "#f0fdf4"
                : isWrongSelection
                ? "#fef2f2"
                : "#ffffff"
              : isSelected
              ? "#dbeafe"
              : "#f9fafb",
          transform: isSubmitting || isReadOnly ? "none" : "translateY(-2px)",
          boxShadow: isSubmitting || isReadOnly
            ? (isSelected
                ? "0 2px 8px 0 rgba(99, 102, 241, 0.15)"
                : "0 1px 3px 0 rgba(0, 0, 0, 0.05)")
            : "0 4px 12px 0 rgba(99, 102, 241, 0.2)",
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

