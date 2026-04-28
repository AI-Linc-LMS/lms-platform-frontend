"use client";

import { useState } from "react";
import { Box, Paper, Typography, Button, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { SubjectiveResponseItem } from "@/lib/services/assessment.service";

interface SubjectiveResponsesSectionProps {
  subjectiveResponses: SubjectiveResponseItem[];
}

function hasHtml(str: unknown): str is string {
  return typeof str === "string" && /<[a-z][\s\S]*>/i.test(str);
}

function formatQuestionTypeLabel(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function getSubjectiveAnswerText(q: SubjectiveResponseItem): string {
  const raw = q.your_answer ?? q.answer ?? "";
  return typeof raw === "string" ? raw : String(raw ?? "");
}

export function SubjectiveResponsesSection({
  subjectiveResponses,
}: SubjectiveResponsesSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = subjectiveResponses.length;
  const q = subjectiveResponses[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  if (!q) return null;

  const answerText = getSubjectiveAnswerText(q);
  const answered = Boolean(answerText.trim());
  const feedbackText =
    typeof q.feedback === "string" ? q.feedback.trim() : "";
  const hasFeedback = feedbackText.length > 0;
  const graded =
    q.awarded_marks != null && Number.isFinite(Number(q.awarded_marks));

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
        Written response review ({total} {total === 1 ? "question" : "questions"})
      </Typography>

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
              backgroundColor: answered
                ? "var(--accent-indigo)"
                : "var(--border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper
              icon={answered ? "mdi:text-box-check-outline" : "mdi:text-box-remove-outline"}
              size={20}
              color={answered ? "var(--font-light)" : "var(--font-tertiary)"}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
              <Chip label={`Q${currentIndex + 1}`} size="small" sx={{ fontWeight: 600, fontSize: "0.75rem" }} />
              {q.section_title ? (
                <Chip
                  label={q.section_title}
                  size="small"
                  sx={{
                    backgroundColor:
                      "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
                    color: "var(--accent-indigo)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                />
              ) : null}
              <Chip
                label={`Max ${q.max_marks} marks`}
                size="small"
                sx={{
                  backgroundColor:
                    "color-mix(in srgb, var(--success-500) 16%, transparent)",
                  color: "var(--success-500)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              />
              {q.question_type ? (
                <Chip
                  label={formatQuestionTypeLabel(q.question_type)}
                  variant="outlined"
                  size="small"
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    borderColor: "var(--border-default)",
                    color: "var(--font-secondary)",
                  }}
                />
              ) : null}
              {graded ? (
                <Chip
                  label={`Score: ${q.awarded_marks} / ${q.max_marks}`}
                  size="small"
                  sx={{
                    backgroundColor:
                      "color-mix(in srgb, var(--success-500) 16%, transparent)",
                    color: "var(--success-500)",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                  }}
                />
              ) : (
                <Chip
                  label="Awaiting evaluation"
                  size="small"
                  sx={{
                    backgroundColor:
                      "color-mix(in srgb, var(--warning-500) 18%, transparent)",
                    color: "var(--warning-500)",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                />
              )}
            </Box>
            {hasHtml(q.question_text) ? (
              <Box
                component="div"
                sx={{
                  fontWeight: 500,
                  color: "var(--font-primary)",
                  lineHeight: 1.6,
                  "& p": { margin: "0 0 0.5em 0" },
                  "& p:last-child": { marginBottom: 0 },
                }}
                dangerouslySetInnerHTML={{ __html: q.question_text }}
              />
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 500, color: "var(--font-primary)", lineHeight: 1.6 }}>
                {q.question_text}
              </Typography>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            pl: { xs: 0, sm: 6 },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "var(--accent-indigo)",
              textTransform: "uppercase",
              letterSpacing: 0.06,
              display: "block",
              mb: 1,
            }}
          >
            Your answer
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
              minHeight: 80,
            }}
          >
            {answered ? (
              <Typography
                component="pre"
                sx={{
                  m: 0,
                  fontFamily: "var(--font-family-primary), system-ui, sans-serif",
                  fontSize: "0.875rem",
                  lineHeight: 1.65,
                  color: "var(--font-primary)",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {answerText}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: "var(--font-tertiary)", fontStyle: "italic" }}>
                No response submitted for this question.
              </Typography>
            )}
          </Paper>

          {hasFeedback ? (
            <Box sx={{ mt: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  color: "var(--success-500)",
                  textTransform: "uppercase",
                  letterSpacing: 0.06,
                  display: "block",
                  mb: 1,
                }}
              >
                Feedback
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border:
                    "1px solid color-mix(in srgb, var(--success-500) 30%, var(--border-default))",
                  backgroundColor:
                    "color-mix(in srgb, var(--success-500) 10%, var(--surface))",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    m: 0,
                    color: "var(--font-secondary)",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {feedbackText}
                </Typography>
              </Paper>
            </Box>
          ) : null}
        </Box>
      </Box>
    </Paper>
  );
}
