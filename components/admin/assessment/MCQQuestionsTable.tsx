"use client";

import { Box, Typography, Paper, Chip } from "@mui/material";
import { MCQ } from "@/lib/services/admin/admin-assessment.service";
import { PaginationControls } from "./PaginationControls";

interface MCQWithSection extends MCQ {
  sectionId: string;
}

interface MCQQuestionsTableProps {
  mcqs: MCQWithSection[];
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  sectionName?: string;
}

function hasHtml(str: unknown): str is string {
  return typeof str === "string" && /<[a-z][\s\S]*>/i.test(str);
}

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  Easy: {
    bg: "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)",
    text: "var(--success-500)",
  },
  Medium: {
    bg: "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)",
    text: "var(--warning-500)",
  },
  Hard: {
    bg: "color-mix(in srgb, var(--error-500) 16%, var(--surface) 84%)",
    text: "var(--error-500)",
  },
};

export function MCQQuestionsTable({
  mcqs,
  page,
  limit,
  onPageChange,
  onLimitChange,
  sectionName,
}: MCQQuestionsTableProps) {
  const startIndex = (page - 1) * limit;
  const paginatedMCQs = mcqs.slice(startIndex, startIndex + limit);

  if (mcqs.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: "center",
          bgcolor:
            "color-mix(in srgb, var(--warning-500) 14%, var(--surface) 86%)",
          border:
            "1px solid color-mix(in srgb, var(--warning-500) 35%, var(--border-default) 65%)",
        }}
      >
        <Typography
          variant="body1"
          sx={{ color: "var(--warning-500)", fontWeight: 600 }}
        >
          No questions found{sectionName ? ` in ${sectionName}` : ""}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {paginatedMCQs.map((mcq, index) => {
        const globalIndex = startIndex + index;
        const diffColors =
          DIFFICULTY_COLORS[mcq.difficulty_level ?? ""] ??
          DIFFICULTY_COLORS.Medium;

        return (
          <Paper
            key={globalIndex}
            sx={{
              p: { xs: 2.5, sm: 3 },
              borderRadius: 2,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              boxShadow:
                "0 1px 3px color-mix(in srgb, var(--font-primary) 8%, transparent)",
            }}
          >
            {/* Question number + metadata */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                mb: 2,
                flexWrap: "wrap",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: "var(--font-secondary)",
                  fontFamily: "monospace",
                  bgcolor: "var(--surface)",
                  px: 1,
                  py: 0.25,
                  borderRadius: 1,
                  border: "1px solid var(--border-default)",
                  lineHeight: 1.8,
                }}
              >
                Q{globalIndex + 1}
              </Typography>
              {mcq.difficulty_level && (
                <Chip
                  label={mcq.difficulty_level}
                  size="small"
                  sx={{
                    bgcolor: diffColors.bg,
                    color: diffColors.text,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                />
              )}
              {mcq.topic && (
                <Chip
                  label={mcq.topic}
                  size="small"
                  sx={{
                    bgcolor: "var(--surface)",
                    color: "var(--font-secondary)",
                    fontSize: "0.75rem",
                    border: "1px solid var(--border-default)",
                  }}
                />
              )}
            </Box>

            {/* Question text — matches student QuestionTitle rendering */}
            {hasHtml(mcq.question_text) ? (
              <Box
                component="div"
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: { xs: "0.9375rem", sm: "1rem" },
                  lineHeight: 1.7,
                  mb: 2.5,
                  "& p": { margin: "0 0 0.5em 0" },
                  "& p:last-child": { marginBottom: 0 },
                }}
                dangerouslySetInnerHTML={{ __html: mcq.question_text }}
              />
            ) : (
              <Typography
                sx={{
                  fontWeight: 600,
                  color: "var(--font-primary)",
                  fontSize: { xs: "0.9375rem", sm: "1rem" },
                  lineHeight: 1.7,
                  mb: 2.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {mcq.question_text}
              </Typography>
            )}

            {/* Options — styled like student-facing AnswerOption cards */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {(["A", "B", "C", "D"] as const).map((letter) => {
                const optionText = mcq[
                  `option_${letter.toLowerCase()}` as keyof MCQ
                ] as string;
                const isCorrect = mcq.correct_option === letter;
                return (
                  <Box
                    key={letter}
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      p: { xs: 1.25, sm: 1.5 },
                      borderRadius: 1.5,
                      border: isCorrect
                        ? "2px solid #10b981"
                        : "1.5px solid var(--border-default)",
                      backgroundColor: isCorrect ? "#f0fdf4" : "var(--surface)",
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: 24,
                        height: 24,
                        borderRadius: "50%",
                        bgcolor: isCorrect ? "#10b981" : "var(--border-default)",
                        color: isCorrect ? "#fff" : "var(--font-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        flexShrink: 0,
                        mt: 0.125,
                      }}
                    >
                      {letter}
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: isCorrect ? "#065f46" : "var(--font-primary)",
                        fontWeight: isCorrect ? 600 : 400,
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                        flex: 1,
                      }}
                    >
                      {optionText}
                    </Typography>
                    {isCorrect && (
                      <Box
                        sx={{
                          minWidth: 20,
                          height: 20,
                          borderRadius: "50%",
                          backgroundColor: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "12px",
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        ✓
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>

            {/* Explanation if present */}
            {mcq.explanation && (
              <Box
                sx={{
                  mt: 2,
                  p: 1.5,
                  borderRadius: 1.5,
                  bgcolor:
                    "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
                  border:
                    "1px solid color-mix(in srgb, var(--accent-indigo) 25%, var(--border-default) 75%)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: "var(--accent-indigo)",
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  Explanation
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "var(--font-secondary)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {mcq.explanation}
                </Typography>
              </Box>
            )}
          </Paper>
        );
      })}

      {mcqs.length > limit && (
        <PaginationControls
          totalItems={mcqs.length}
          page={page}
          limit={limit}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
          itemLabel="questions"
        />
      )}
    </Box>
  );
}
