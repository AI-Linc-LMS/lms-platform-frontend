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

export function SubjectiveResponsesSection({
  subjectiveResponses,
}: SubjectiveResponsesSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = subjectiveResponses.length;
  const q = subjectiveResponses[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  if (!q) return null;

  const answered = Boolean(q.your_answer?.trim());
  const graded =
    q.awarded_marks != null && Number.isFinite(Number(q.awarded_marks));

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
              backgroundColor: answered ? "#6366f1" : "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper
              icon={answered ? "mdi:text-box-check-outline" : "mdi:text-box-remove-outline"}
              size={20}
              color={answered ? "#ffffff" : "#9ca3af"}
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
              <Chip label={`Q${currentIndex + 1}`} size="small" sx={{ fontWeight: 600, fontSize: "0.75rem" }} />
              {q.section_title ? (
                <Chip
                  label={q.section_title}
                  size="small"
                  sx={{ backgroundColor: "#e0e7ff", color: "#4338ca", fontSize: "0.75rem", fontWeight: 600 }}
                />
              ) : null}
              <Chip
                label={`Max ${q.max_marks} marks`}
                size="small"
                sx={{ backgroundColor: "#f0fdf4", color: "#166534", fontSize: "0.75rem", fontWeight: 600 }}
              />
              {q.question_type ? (
                <Chip
                  label={formatQuestionTypeLabel(q.question_type)}
                  variant="outlined"
                  size="small"
                  sx={{ fontSize: "0.75rem", fontWeight: 600, borderColor: "#e5e7eb" }}
                />
              ) : null}
              {graded ? (
                <Chip
                  label={`Score: ${q.awarded_marks} / ${q.max_marks}`}
                  size="small"
                  sx={{ backgroundColor: "#d1fae5", color: "#065f46", fontWeight: 700, fontSize: "0.75rem" }}
                />
              ) : (
                <Chip
                  label="Awaiting evaluation"
                  size="small"
                  sx={{ backgroundColor: "#fef3c7", color: "#92400e", fontWeight: 600, fontSize: "0.75rem" }}
                />
              )}
            </Box>
            {hasHtml(q.question_text) ? (
              <Box
                component="div"
                sx={{
                  fontWeight: 500,
                  color: "#1a1f2e",
                  lineHeight: 1.6,
                  "& p": { margin: "0 0 0.5em 0" },
                  "& p:last-child": { marginBottom: 0 },
                }}
                dangerouslySetInnerHTML={{ __html: q.question_text }}
              />
            ) : (
              <Typography variant="body1" sx={{ fontWeight: 500, color: "#1a1f2e", lineHeight: 1.6 }}>
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
              color: "#6366f1",
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
              border: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
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
                  color: "#1f2937",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {q.your_answer}
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ color: "#9ca3af", fontStyle: "italic" }}>
                No response submitted for this question.
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
    </Paper>
  );
}
