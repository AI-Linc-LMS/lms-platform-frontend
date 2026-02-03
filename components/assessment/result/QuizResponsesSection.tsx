"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Pagination,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { QuizResponseItem } from "@/lib/services/assessment.service";

const QUIZ_ITEMS_PER_PAGE = 10;

interface QuizResponsesSectionProps {
  quizResponses: QuizResponseItem[];
}

function getOptionsArray(options: Record<string, string>): Array<{ id: string; label: string }> {
  const keys = Object.keys(options).length > 0 ? Object.keys(options).sort() : ["A", "B", "C", "D"];
  return keys.map((key) => ({ id: key, label: options[key] || "" }));
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
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(quizResponses.length / QUIZ_ITEMS_PER_PAGE));
  const start = (page - 1) * QUIZ_ITEMS_PER_PAGE;
  const items = quizResponses.slice(start, start + QUIZ_ITEMS_PER_PAGE);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        backgroundColor: "#ffffff",
        borderRadius: 3,
        border: "1px solid #e5e7eb",
        mb: 4,
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "#1a1f2e",
          mb: 3,
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
        }}
      >
        Quiz Responses ({quizResponses.length} questions)
      </Typography>

      {/* Pagination controls at top for large lists */}
      {quizResponses.length > QUIZ_ITEMS_PER_PAGE && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 500 }}>
            Page {page} of {totalPages} • Questions {start + 1}–{Math.min(start + QUIZ_ITEMS_PER_PAGE, quizResponses.length)}
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            size="medium"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((q, idx) => {
          const globalIndex = start + idx;
          const options = getOptionsArray(q.options || {});
          const selected = q.selected_answer ?? null;
          const correct = q.correct_option ?? "";
          const diffStyle = getDifficultyColor(q.difficulty_level);

          return (
            <Box
              key={q.question_id}
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid #e5e7eb",
                backgroundColor: "#fafafa",
              }}
            >
              {/* Question header */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 2,
                  mb: 2,
                }}
              >
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
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                    <Chip
                      label={`Q${globalIndex + 1}`}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                    />
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
                          backgroundColor: "#e0e7ff",
                          color: "#4338ca",
                          fontSize: "0.75rem",
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 500,
                      color: "#1a1f2e",
                      lineHeight: 1.6,
                    }}
                  >
                    {q.question_text}
                  </Typography>
                </Box>
              </Box>

              {/* Options */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pl: 6 }}>
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
                      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                        {isCorrectOpt && (
                          <Chip
                            label="Correct"
                            size="small"
                            sx={{
                              backgroundColor: "#10b981",
                              color: "#ffffff",
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
                              backgroundColor: "#ef4444",
                              color: "#ffffff",
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
                              backgroundColor: "#10b981",
                              color: "#ffffff",
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

              {/* Explanation */}
              {q.explanation && (
                <Box
                  sx={{
                    mt: 2,
                    ml: 6,
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
          );
        })}
      </Box>

      {/* Pagination at bottom */}
      {quizResponses.length > QUIZ_ITEMS_PER_PAGE && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 4,
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Paper>
  );
}
