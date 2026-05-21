"use client";

import { Box, Typography, Chip, Divider, Paper } from "@mui/material";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("common");
  return (
    <Box
      sx={{
        p: { xs: 2, md: 3 },
        "&::-webkit-scrollbar": {
          width: "6px",
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor: "var(--surface)",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "var(--font-tertiary)",
          borderRadius: "4px",
          "&:hover": {
            backgroundColor: "var(--font-secondary)",
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
          color: "var(--font-primary)",
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
                  ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                  : difficultyLevel === "Medium"
                  ? "color-mix(in srgb, var(--warning-500) 14%, var(--surface) 86%)"
                  : "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
              color:
                difficultyLevel === "Easy"
                  ? "var(--success-500)"
                  : difficultyLevel === "Medium"
                  ? "var(--warning-500)"
                  : "var(--error-500)",
              fontWeight: 600,
            }}
          />
          {tags && (
            <Chip
              label={tags}
              size="small"
              sx={{
                bgcolor: "var(--surface)",
                color: "var(--font-secondary)",
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
              color: "var(--font-primary)",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            {t("adminContentManagement.problemStatement")}
          </Typography>
          <Box
            sx={{
              "& p": {
                mb: 1.5,
                lineHeight: 1.8,
                color: "var(--font-secondary)",
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
              color: "var(--font-primary)",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            {t("adminContentManagement.inputFormat")}
          </Typography>
          <Box
            sx={{
              "& p": {
                mb: 1.5,
                lineHeight: 1.8,
                color: "var(--font-secondary)",
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
              color: "var(--font-primary)",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            {t("adminContentManagement.outputFormat")}
          </Typography>
          <Box
            sx={{
              "& p": {
                mb: 1.5,
                lineHeight: 1.8,
                color: "var(--font-secondary)",
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
              color: "var(--font-primary)",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            {t("adminContentManagement.constraints")}
          </Typography>
          <Box
            sx={{
              "& p": {
                mb: 1.5,
                lineHeight: 1.8,
                color: "var(--font-secondary)",
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
              color: "var(--font-primary)",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            {t("adminContentManagement.sampleInputOutput")}
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border-default)",
              borderRadius: 1,
            }}
          >
            {sampleInput && (
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "var(--font-secondary)",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                  }}
                >
                  {t("adminContentManagement.sampleInput")}
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    mt: 1,
                    p: 1.5,
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 1,
                    fontSize: "0.875rem",
                    fontFamily: "monospace",
                    color: "var(--font-primary)",
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
                    color: "var(--font-secondary)",
                    textTransform: "uppercase",
                    fontSize: "0.75rem",
                  }}
                >
                  {t("adminContentManagement.sampleOutput")}
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    mt: 1,
                    p: 1.5,
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 1,
                    fontSize: "0.875rem",
                    fontFamily: "monospace",
                    color: "var(--font-primary)",
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
              color: "var(--font-primary)",
              fontSize: { xs: "1rem", md: "1.125rem" },
            }}
          >
            {t("adminContentManagement.testCases")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {testCases.map((testCase: any, index: number) => (
              <Paper
                key={index}
                elevation={0}
                sx={{
                  p: 2,
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "var(--font-secondary)",
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
                          color: "var(--font-secondary)",
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
                          backgroundColor: "var(--card-bg)",
                          border: "1px solid var(--border-default)",
                          borderRadius: 1,
                          fontSize: "0.875rem",
                          fontFamily: "monospace",
                          color: "var(--font-primary)",
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
                          color: "var(--font-secondary)",
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
                          backgroundColor: "var(--card-bg)",
                          border: "1px solid var(--border-default)",
                          borderRadius: 1,
                          fontSize: "0.875rem",
                          fontFamily: "monospace",
                          color: "var(--font-primary)",
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
