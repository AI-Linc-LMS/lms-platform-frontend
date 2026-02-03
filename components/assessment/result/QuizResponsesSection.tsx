"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { QuizResponseItem } from "@/lib/services/assessment.service";

interface QuizResponsesSectionProps {
  quizResponses: QuizResponseItem[];
}

function getOptionsArray(options: Record<string, string>): Array<{ id: string; label: string; value: string }> {
  const keys = Object.keys(options).length > 0 ? Object.keys(options).sort() : ["A", "B", "C", "D"];
  return keys.map((key) => ({ id: key, label: options[key] || "", value: key }));
}

function getDifficultyColor(level?: string) {
  if (!level) return { bg: "#f3f4f6", color: "#6b7280" };
  switch (level) {
    case "Easy":
      return { bg: "#d1fae5", color: "#065f46" };
    case "Medium":
      return { bg: "#fef3c7", color: "#92400e" };
    case "Hard":
      return { bg: "#fee2e2", color: "#991b1b" };
    default:
      return { bg: "#f3f4f6", color: "#6b7280" };
  }
}

export function QuizResponsesSection({ quizResponses }: QuizResponsesSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = quizResponses.length;
  const q = quizResponses[currentIndex];
  const options = getOptionsArray(q?.options || {});
  const selected = q?.selected_answer?.toUpperCase() ?? null;
  const correct = q?.correct_option ?? "";
  const diffStyle = getDifficultyColor(q?.difficulty_level);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  if (!q) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        backgroundColor: "#ffffff",
        borderRadius: 3,
        border: "1px solid #e5e7eb",
        mb: 4,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "#1a1f2e",
          mb: 2,
          fontSize: { xs: "1.125rem", sm: "1.25rem" },
        }}
      >
        Quiz Response Review ({total} questions)
      </Typography>

      {/* Navigation Bar - same layout as QuizResults/QuizContent */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
          px: { xs: 1, sm: 2 },
          py: 1.5,
          backgroundColor: "#f9fafb",
          borderRadius: 2,
          border: "1px solid #e5e7eb",
        }}
      >
        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
          {!isFirst && (
            <Button
              variant="outlined"
              onClick={() => setCurrentIndex((i) => i - 1)}
              sx={{
                borderColor: "#6366f1",
                color: "#6366f1",
                px: 2,
                py: 1,
                minWidth: "100px",
                fontSize: "0.875rem",
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": {
                  borderColor: "#4f46e5",
                  backgroundColor: "#6366f115",
                },
              }}
            >
              ← Previous
            </Button>
          )}
        </Box>
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 600, fontSize: "0.9375rem" }}>
            Question {currentIndex + 1} of {total}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          {!isLast && (
            <Button
              variant="contained"
              onClick={() => setCurrentIndex((i) => i + 1)}
              sx={{
                background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                color: "#ffffff",
                px: 2.5,
                py: 1,
                minWidth: "100px",
                fontSize: "0.875rem",
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                "&:hover": {
                  background: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
                  boxShadow: "0 6px 16px rgba(99, 102, 241, 0.4)",
                  transform: "translateY(-1px)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              Next →
            </Button>
          )}
        </Box>
      </Box>

      {/* Current Question - single question, minimal scroll */}
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          backgroundColor: "#fafafa",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
          <Box
            sx={{
              minWidth: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: q.is_correct ? "#10b981" : "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper
              icon={q.is_correct ? "mdi:check" : "mdi:close"}
              size={20}
              color="#ffffff"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
              <Chip label={`Q${currentIndex + 1}`} size="small" sx={{ fontWeight: 600, fontSize: "0.75rem" }} />
              {q.difficulty_level && (
                <Chip
                  label={q.difficulty_level}
                  size="small"
                  sx={{
                    backgroundColor: diffStyle.bg,
                    color: diffStyle.color,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                />
              )}
              {q.topic && (
                <Chip
                  label={q.topic}
                  size="small"
                  sx={{ backgroundColor: "#e0e7ff", color: "#4338ca", fontSize: "0.75rem" }}
                />
              )}
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 500, color: "#1a1f2e", lineHeight: 1.6 }}>
              {q.question_text}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pl: { xs: 0, sm: 6 } }}>
          {options.map((opt) => {
            const isSelected = opt.id === selected;
            const isCorrectOpt = opt.id === correct;
            return (
              <Paper
                key={opt.id}
                elevation={0}
                sx={{
                  p: 2,
                  border:
                    isCorrectOpt && isSelected
                      ? "2px solid #10b981"
                      : isCorrectOpt
                      ? "2px solid #10b981"
                      : isSelected
                      ? "2px solid #ef4444"
                      : "1px solid #e5e7eb",
                  backgroundColor:
                    isCorrectOpt && isSelected
                      ? "#f0fdf4"
                      : isCorrectOpt
                      ? "#f0fdf4"
                      : isSelected
                      ? "#fef2f2"
                      : "#ffffff",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography sx={{ color: "#1a1f2e", fontWeight: isSelected || isCorrectOpt ? 500 : 400 }}>
                  <strong>{opt.id}.</strong> {opt.label}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {isCorrectOpt && (
                    <Chip
                      label="Correct"
                      size="small"
                      sx={{ backgroundColor: "#10b981", color: "#fff", fontWeight: 600, fontSize: "0.75rem" }}
                    />
                  )}
                  {isSelected && !isCorrectOpt && (
                    <Chip
                      label="Your Answer"
                      size="small"
                      sx={{ backgroundColor: "#ef4444", color: "#fff", fontWeight: 600, fontSize: "0.75rem" }}
                    />
                  )}
                  {isSelected && isCorrectOpt && (
                    <Chip
                      label="Your Answer"
                      size="small"
                      sx={{ backgroundColor: "#10b981", color: "#fff", fontWeight: 600, fontSize: "0.75rem" }}
                    />
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>

        {q.explanation && (
          <Box
            sx={{
              mt: 2,
              pl: { xs: 0, sm: 6 },
              p: 2,
              backgroundColor: "#f0f9ff",
              borderRadius: 2,
              borderLeft: "4px solid #6366f1",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: "#6366f1",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "block",
                mb: 0.5,
              }}
            >
              Explanation
            </Typography>
            <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.7 }}>
              {q.explanation}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
