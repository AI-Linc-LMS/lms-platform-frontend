"use client";

import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { CodingProblemResponseItem } from "@/lib/services/assessment.service";

const htmlContentSx = {
  "& p": { mb: 1.5, lineHeight: 1.8, color: "var(--font-secondary)", fontSize: "0.9375rem" },
  "& br": { display: "block", content: '""', marginTop: "0.5em" },
  "& pre": { whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" },
};

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

interface CodingProblemResponsesSectionProps {
  codingResponses: CodingProblemResponseItem[];
}

export function CodingProblemResponsesSection({ codingResponses }: CodingProblemResponsesSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = codingResponses.length;
  const item = codingResponses[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  if (!item) return null;

  const diffStyle = getDifficultyColor(item.difficulty_level);
  const allPassed = item.all_test_cases_passed;
  const feedbackText =
    typeof item.feedback === "string" ? item.feedback.trim() : "";
  const hasFeedback = feedbackText.length > 0;

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
        Coding Problem Review ({total} problems)
      </Typography>

      {/* Navigation Bar - same layout as QuizResponsesSection */}
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
            Problem {currentIndex + 1} of {total}
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

      {/* Current Problem - single problem */}
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          border: "1px solid var(--border-default)",
          backgroundColor: "var(--surface)",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <Box
            sx={{
              minWidth: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: allPassed
                ? "var(--success-500)"
                : "var(--warning-500)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper
              icon={allPassed ? "mdi:check" : "mdi:alert-circle"}
              size={22}
              color="var(--font-light)"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "var(--font-primary)",
                fontSize: { xs: "1rem", sm: "1.125rem" },
              }}
            >
              {item.title}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
              <Chip
                label={`${item.passed_test_cases}/${item.total_test_cases} tests passed`}
                size="small"
                sx={{
                  backgroundColor: allPassed
                    ? "color-mix(in srgb, var(--success-500) 16%, transparent)"
                    : "color-mix(in srgb, var(--warning-500) 18%, transparent)",
                  color: allPassed ? "var(--success-500)" : "var(--warning-500)",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
              {item.difficulty_level && (
                <Chip
                  label={item.difficulty_level}
                  size="small"
                  sx={{
                    backgroundColor: diffStyle.bg,
                    color: diffStyle.color,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                />
              )}
              {item.tags && (
                <Chip
                  label={item.tags}
                  size="small"
                  sx={{
                    backgroundColor: "var(--surface)",
                    color: "var(--font-secondary)",
                    fontSize: "0.75rem",
                  }}
                />
              )}
              {item.awarded_marks != null && Number.isFinite(Number(item.awarded_marks)) ? (
                <Chip
                  label={`Score: ${item.awarded_marks}`}
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
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Problem Statement */}
        {item.problem_statement && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: "var(--font-primary)",
                mb: 1,
                fontSize: "0.9375rem",
              }}
            >
              Problem Statement
            </Typography>
            <Box sx={htmlContentSx} dangerouslySetInnerHTML={{ __html: item.problem_statement }} />
          </Box>
        )}

        {/* Input Format */}
        {item.input_format && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: "var(--font-primary)",
                mb: 1,
                fontSize: "0.9375rem",
              }}
            >
              Input Format
            </Typography>
            <Box sx={htmlContentSx} dangerouslySetInnerHTML={{ __html: item.input_format }} />
          </Box>
        )}

        {/* Output Format */}
        {item.output_format && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: "var(--font-primary)",
                mb: 1,
                fontSize: "0.9375rem",
              }}
            >
              Output Format
            </Typography>
            <Box sx={htmlContentSx} dangerouslySetInnerHTML={{ __html: item.output_format }} />
          </Box>
        )}

        {/* Constraints */}
        {item.constraints && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: "var(--font-primary)",
                mb: 1,
                fontSize: "0.9375rem",
              }}
            >
              Constraints
            </Typography>
            <Box sx={htmlContentSx} dangerouslySetInnerHTML={{ __html: item.constraints }} />
          </Box>
        )}

        {/* Sample Input */}
        {item.sample_input && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: "var(--success-500)",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                mb: 1,
              }}
            >
              Sample Input
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                backgroundColor:
                  "color-mix(in srgb, var(--success-500) 10%, var(--surface))",
                border:
                  "1px solid color-mix(in srgb, var(--success-500) 32%, var(--border-default))",
                borderLeft: "4px solid var(--success-500)",
                borderRadius: 1,
                fontSize: "0.875rem",
                fontFamily: "'Fira Code', 'Consolas', monospace",
                color: "var(--font-secondary)",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                boxShadow:
                  "0 1px 3px color-mix(in srgb, var(--success-500) 20%, transparent)",
              }}
            >
              {item.sample_input}
            </Box>
          </Box>
        )}

        {/* Sample Output */}
        {item.sample_output && (
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: "var(--accent-indigo)",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                mb: 1,
              }}
            >
              Sample Output
            </Typography>
            <Box
              component="pre"
              sx={{
                p: 2,
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface))",
                border:
                  "1px solid color-mix(in srgb, var(--accent-indigo) 30%, var(--border-default))",
                borderLeft: "4px solid var(--accent-indigo)",
                borderRadius: 1,
                fontSize: "0.875rem",
                fontFamily: "'Fira Code', 'Consolas', monospace",
                color: "var(--font-secondary)",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                boxShadow:
                  "0 1px 3px color-mix(in srgb, var(--accent-indigo) 20%, transparent)",
              }}
            >
              {item.sample_output}
            </Box>
          </Box>
        )}

        {/* Submitted Code - syntax highlighted */}
        {item.submitted_code && (
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: "var(--accent-indigo)",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                mb: 1,
              }}
            >
              Your Submitted Code
            </Typography>
            <Box
              sx={{
                borderRadius: 1,
                overflow: "hidden",
                border: "1px solid var(--border-default)",
                borderLeft: "4px solid var(--accent-indigo)",
                boxShadow:
                  "0 4px 12px color-mix(in srgb, var(--accent-indigo) 25%, transparent)",
                "& pre": { margin: 0, borderRadius: 0 },
                "& code": { fontSize: "0.8125rem !important" },
              }}
            >
              <SyntaxHighlighter
                language={(item as any).language || "python"}
                style={oneDark}
                customStyle={{
                  margin: 0,
                  padding: 16,
                  background: "var(--surface)",
                  fontSize: "0.8125rem",
                }}
                codeTagProps={{ style: { fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace" } }}
                showLineNumbers
                wrapLongLines
              >
                {item.submitted_code}
              </SyntaxHighlighter>
            </Box>
          </Box>
        )}

        {hasFeedback ? (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: "var(--success-500)",
                textTransform: "uppercase",
                fontSize: "0.75rem",
                mb: 1,
              }}
            >
              Evaluator feedback
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
    </Paper>
  );
}
