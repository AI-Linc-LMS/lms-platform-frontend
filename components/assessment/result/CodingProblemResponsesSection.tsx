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
  "& p": { mb: 1.5, lineHeight: 1.8, color: "#374151", fontSize: "0.9375rem" },
  "& br": { display: "block", content: '""', marginTop: "0.5em" },
  "& pre": { whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" },
};

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
            Problem {currentIndex + 1} of {total}
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

      {/* Current Problem - single problem */}
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          backgroundColor: "#fafafa",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <Box
            sx={{
              minWidth: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: allPassed ? "#10b981" : "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconWrapper
              icon={allPassed ? "mdi:check" : "mdi:alert-circle"}
              size={22}
              color="#ffffff"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#1a1f2e",
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
                  backgroundColor: allPassed ? "#d1fae5" : "#fef3c7",
                  color: allPassed ? "#065f46" : "#92400e",
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
                    backgroundColor: "#f3f4f6",
                    color: "#6b7280",
                    fontSize: "0.75rem",
                  }}
                />
              )}
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
                color: "#111827",
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
                color: "#111827",
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
                color: "#111827",
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
                color: "#111827",
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
                color: "#059669",
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
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderLeft: "4px solid #059669",
                borderRadius: 1,
                fontSize: "0.875rem",
                fontFamily: "'Fira Code', 'Consolas', monospace",
                color: "#065f46",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                boxShadow: "0 1px 3px rgba(5, 150, 105, 0.1)",
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
                color: "#0369a1",
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
                backgroundColor: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderLeft: "4px solid #0369a1",
                borderRadius: 1,
                fontSize: "0.875rem",
                fontFamily: "'Fira Code', 'Consolas', monospace",
                color: "#0c4a6e",
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                boxShadow: "0 1px 3px rgba(3, 105, 161, 0.1)",
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
                color: "#6366f1",
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
                border: "1px solid #45475a",
                borderLeft: "4px solid #6366f1",
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.15)",
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
                  background: "#1e1e2e",
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
      </Box>
    </Paper>
  );
}
