"use client";

import { Box, Typography, Chip, Divider, Paper } from "@mui/material";

interface CodingProblemDescriptionProps {
  title: string;
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  testCases: Array<{ input: string; expected_output: string }>;
  tags: string;
  difficultyLevel: string;
}

export function CodingProblemDescription({
  title,
  problemStatement,
  inputFormat,
  outputFormat,
  constraints,
  sampleInput,
  sampleOutput,
  testCases,
  tags,
  difficultyLevel,
}: CodingProblemDescriptionProps) {
  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        "&::-webkit-scrollbar": {
          width: "6px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "#f1f1f1",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#888",
          borderRadius: "4px",
          "&:hover": {
            backgroundColor: "#555",
          },
        },
      }}
    >
      {/* Title and Tags */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          mb: 2,
          color: "#1a1f2e",
          fontSize: { xs: "1.1rem", md: "1.25rem" },
        }}
      >
        {title}
      </Typography>

      {difficultyLevel && (
        <Box sx={{ mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={difficultyLevel}
            size="small"
            sx={{
              bgcolor:
                difficultyLevel === "Easy"
                  ? "#d1fae5"
                  : difficultyLevel === "Medium"
                  ? "#fef3c7"
                  : "#fee2e2",
              color:
                difficultyLevel === "Easy"
                  ? "#065f46"
                  : difficultyLevel === "Medium"
                  ? "#92400e"
                  : "#991b1b",
              fontWeight: 600,
            }}
          />
          {tags && (
            <Chip
              label={tags}
              size="small"
              sx={{
                bgcolor: "#f3f4f6",
                color: "#6b7280",
                fontWeight: 500,
              }}
            />
          )}
        </Box>
      )}

      {/* Problem Statement */}
      {problemStatement && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1.5,
              color: "#111827",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            Problem Statement
          </Typography>
          <Box
            sx={{
              "& p": {
                mb: 1.5,
                lineHeight: 1.8,
                color: "#374151",
                fontSize: "0.9375rem",
              },
              "& br": {
                display: "block",
                content: '""',
                marginTop: "0.5em",
              },
            }}
            dangerouslySetInnerHTML={{ __html: problemStatement }}
          />
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Input Format */}
      {inputFormat && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1.5,
              color: "#111827",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            Input Format
          </Typography>
          <Box
            sx={{
              "& p": {
                mb: 1.5,
                lineHeight: 1.8,
                color: "#374151",
                fontSize: "0.9375rem",
              },
            }}
            dangerouslySetInnerHTML={{ __html: inputFormat }}
          />
        </Box>
      )}

      {/* Output Format */}
      {outputFormat && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1.5,
              color: "#111827",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            Output Format
          </Typography>
          <Box
            sx={{
              "& p": {
                mb: 1.5,
                lineHeight: 1.8,
                color: "#374151",
                fontSize: "0.9375rem",
              },
            }}
            dangerouslySetInnerHTML={{ __html: outputFormat }}
          />
        </Box>
      )}

      {/* Constraints */}
      {constraints && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1.5,
              color: "#111827",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            Constraints
          </Typography>
          <Box
            sx={{
              "& p": {
                mb: 1.5,
                lineHeight: 1.8,
                color: "#374151",
                fontSize: "0.9375rem",
              },
            }}
            dangerouslySetInnerHTML={{ __html: constraints }}
          />
        </Box>
      )}

      {/* Sample Input/Output */}
      {(sampleInput || sampleOutput) && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1.5,
              color: "#111827",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            Sample Input/Output
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 1,
            }}
          >
            {sampleInput && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                  }}
                >
                  Sample Input
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    mt: 1,
                    p: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 1,
                    fontSize: "0.875rem",
                    fontFamily: "monospace",
                    color: "#111827",
                    overflow: "auto",
                    mb: 0,
                  }}
                >
                  {sampleInput}
                </Box>
              </Box>
            )}
            {sampleOutput && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                  }}
                >
                  Sample Output
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    mt: 1,
                    p: 1.5,
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 1,
                    fontSize: "0.875rem",
                    fontFamily: "monospace",
                    color: "#111827",
                    overflow: "auto",
                    mb: 0,
                  }}
                >
                  {sampleOutput}
                </Box>
              </Box>
            )}
          </Paper>
        </Box>
      )}

      {/* Test Cases */}
      {testCases.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: 1.5,
              color: "#111827",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            Test Cases
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {testCases.map((testCase: any, index: number) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "#6b7280",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                    mb: 1,
                    display: "block",
                  }}
                >
                  Test Case {index + 1}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {testCase.input && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: "#6b7280",
                          fontSize: "0.75rem",
                        }}
                      >
                        Input:
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          mt: 0.5,
                          p: 1.5,
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 1,
                          fontSize: "0.875rem",
                          fontFamily: "monospace",
                          color: "#111827",
                          overflow: "auto",
                          mb: 0,
                        }}
                      >
                        {testCase.input}
                      </Box>
                    </Box>
                  )}
                  {testCase.expected_output && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: "#6b7280",
                          fontSize: "0.75rem",
                        }}
                      >
                        Expected Output:
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          mt: 0.5,
                          p: 1.5,
                          backgroundColor: "#ffffff",
                          border: "1px solid #e5e7eb",
                          borderRadius: 1,
                          fontSize: "0.875rem",
                          fontFamily: "monospace",
                          color: "#111827",
                          overflow: "auto",
                          mb: 0,
                        }}
                      >
                        {testCase.expected_output}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
