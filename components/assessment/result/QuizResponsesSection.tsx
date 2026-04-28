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
  if (!level) return { bg: "var(--surface)", color: "var(--font-secondary)" };
  switch (level) {
    case "Easy":
      return {
        bg: "color-mix(in srgb, var(--success-500) 16%, transparent)",
        color: "var(--success-500)",
      };
    case "Medium":
      return {
        bg: "color-mix(in srgb, var(--warning-500) 18%, transparent)",
        color: "var(--warning-500)",
      };
    case "Hard":
      return {
        bg: "color-mix(in srgb, var(--error-500) 16%, transparent)",
        color: "var(--error-500)",
      };
    default:
      return { bg: "var(--surface)", color: "var(--font-secondary)" };
  }
}

export function QuizResponsesSection({ quizResponses }: QuizResponsesSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = quizResponses.length;
  const q = quizResponses[currentIndex];
  const options = getOptionsArray(q?.options || {});
  const selected = q?.selected_answer?.toUpperCase() ?? null;
  const correct = q?.correct_option ?? "";
  const feedbackText = typeof q?.feedback === "string" ? q.feedback.trim() : "";
  const hasFeedback = feedbackText.length > 0;
  const graded =
    q?.awarded_marks != null && Number.isFinite(Number(q?.awarded_marks));
  const diffStyle = getDifficultyColor(q?.difficulty_level);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  if (!q) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        backgroundColor: "var(--card-bg)",
        borderRadius: 3,
        border: "1px solid var(--border-default)",
        mb: 4,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: "var(--font-primary)",
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
          backgroundColor: "var(--surface)",
          borderRadius: 2,
          border: "1px solid var(--border-default)",
        }}
      >
        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
          {!isFirst && (
            <Button
              variant="outlined"
              onClick={() => setCurrentIndex((i) => i - 1)}
              sx={{
                borderColor: "var(--accent-indigo)",
                color: "var(--accent-indigo)",
                px: 2,
                py: 1,
                minWidth: "100px",
                fontSize: "0.875rem",
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                "&:hover": {
                  borderColor: "var(--accent-indigo-dark)",
                  backgroundColor:
                    "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
                },
              }}
            >
              ← Previous
            </Button>
          )}
        </Box>
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontWeight: 600, fontSize: "0.9375rem" }}>
            Question {currentIndex + 1} of {total}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
          {!isLast && (
            <Button
              variant="contained"
              onClick={() => setCurrentIndex((i) => i + 1)}
              sx={{
                background:
                  "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
                color: "var(--font-light)",
                px: 2.5,
                py: 1,
                minWidth: "100px",
                fontSize: "0.875rem",
                fontWeight: 600,
                borderRadius: 2,
                textTransform: "none",
                boxShadow:
                  "0 4px 12px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, var(--accent-indigo-dark) 0%, var(--accent-indigo) 100%)",
                  boxShadow:
                    "0 6px 16px color-mix(in srgb, var(--accent-indigo) 45%, transparent)",
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
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--surface)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
          <Box
            sx={{
              minWidth: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: q.is_correct
                ? "var(--success-500)"
                : "var(--error-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper
              icon={q.is_correct ? "mdi:check" : "mdi:close"}
              size={20}
              color="var(--font-light)"
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
                  sx={{
                    backgroundColor:
                      "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                    color: "var(--accent-indigo)",
                    fontSize: "0.75rem",
                  }}
                />
              )}
              {graded ? (
                <Chip
                  label={`Score: ${q.awarded_marks}`}
                  size="small"
                  sx={{
                    backgroundColor:
                      "color-mix(in srgb, var(--success-500) 16%, transparent)",
                    color: "var(--success-500)",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}
                />
              ) : null}
            </Box>
            <Typography variant="body1" sx={{ fontWeight: 500, color: "var(--font-primary)", lineHeight: 1.6 }}>
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
                      ? "2px solid var(--success-500)"
                      : isCorrectOpt
                      ? "2px solid var(--success-500)"
                      : isSelected
                      ? "2px solid var(--error-500)"
                      : "1px solid var(--border-default)",
                  backgroundColor:
                    isCorrectOpt && isSelected
                      ? "color-mix(in srgb, var(--success-500) 10%, var(--card-bg))"
                      : isCorrectOpt
                      ? "color-mix(in srgb, var(--success-500) 10%, var(--card-bg))"
                      : isSelected
                      ? "color-mix(in srgb, var(--error-500) 10%, var(--card-bg))"
                      : "var(--card-bg)",
                  borderRadius: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography sx={{ color: "var(--font-primary)", fontWeight: isSelected || isCorrectOpt ? 500 : 400 }}>
                  <strong>{opt.id}.</strong> {opt.label}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  {isCorrectOpt && (
                    <Chip
                      label="Correct"
                      size="small"
                      sx={{
                        backgroundColor: "var(--success-500)",
                        color: "var(--font-light)",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                      sx={{
                        backgroundColor: "var(--success-500)",
                        color: "var(--font-light)",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  )}
                  {isSelected && !isCorrectOpt && (
                    <Chip
                      label="Your Answer"
                      size="small"
                      sx={{
                        backgroundColor: "var(--error-500)",
                        color: "var(--font-light)",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  )}
                  {isSelected && isCorrectOpt && (
                    <Chip
                      label="Your Answer"
                      size="small"
                      sx={{
                        backgroundColor: "var(--success-500)",
                        color: "var(--font-light)",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
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
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface))",
              borderRadius: 2,
              borderLeft: "4px solid var(--accent-indigo)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: "var(--accent-indigo)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "block",
                mb: 0.5,
              }}
            >
              Explanation
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)", lineHeight: 1.7 }}>
              {q.explanation}
            </Typography>
          </Box>
        )}

        {hasFeedback ? (
          <Box
            sx={{
              mt: 2,
              pl: { xs: 0, sm: 6 },
              p: 2,
              backgroundColor:
                "color-mix(in srgb, var(--success-500) 12%, var(--surface))",
              borderRadius: 2,
              borderLeft: "4px solid var(--success-500)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "var(--success-500)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                display: "block",
                mb: 0.5,
              }}
            >
              Evaluator feedback
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
              }}
            >
              {feedbackText}
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Paper>
  );
}
