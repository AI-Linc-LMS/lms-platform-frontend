"use client";

import {
  Box,
  Paper,
  Typography,
  Chip,
  Divider,
} from "@mui/material";
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
        Coding Problem Responses ({codingResponses.length} problems)
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {codingResponses.map((item) => {
          const diffStyle = getDifficultyColor(item.difficulty_level);
          const allPassed = item.all_test_cases_passed;

          return (
            <Box
              key={item.problem_id}
              sx={{
                p: 3,
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
                      color: "#6b7280",
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
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 1,
                      fontSize: "0.875rem",
                      fontFamily: "monospace",
                      color: "#111827",
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
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
                      color: "#6b7280",
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
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: 1,
                      fontSize: "0.875rem",
                      fontFamily: "monospace",
                      color: "#111827",
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {item.sample_output}
                  </Box>
                </Box>
              )}

              {/* Submitted Code */}
              {item.submitted_code && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      mb: 1,
                    }}
                  >
                    Your Submitted Code
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      p: 2,
                      backgroundColor: "#1e1e1e",
                      color: "#d4d4d4",
                      borderRadius: 1,
                      fontSize: "0.8125rem",
                      fontFamily: "monospace",
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      border: "1px solid #333",
                    }}
                  >
                    {item.submitted_code}
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
