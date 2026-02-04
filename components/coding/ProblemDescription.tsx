"use client";

import { Box, Typography, Chip, Paper } from "@mui/material";

interface ProblemDescriptionProps {
  problemData: any;
  marks?: number;
  obtainedMarks?: number | null;
}

export function ProblemDescription({
  problemData,
  marks,
  obtainedMarks,
}: ProblemDescriptionProps) {
  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
        p: { xs: 2, md: 2, lg: 2.5 },
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
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          mb: { xs: 1.5, md: 1.5, lg: 2 },
          color: "#1a1f2e",
          fontSize: { xs: "1.1rem", md: "1.15rem", lg: "1.25rem" },
        }}
      >
        {problemData?.content_title || problemData?.details?.title || problemData?.details?.name || problemData?.details?.problem_title || "Coding Problem"}
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          mb: 2.5,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {problemData?.details?.difficulty_level && (
          <Chip
            label={problemData.details.difficulty_level}
            size="medium"
            sx={{
              backgroundColor:
                problemData.details.difficulty_level === "Easy"
                  ? "#10b981"
                  : problemData.details.difficulty_level === "Medium"
                  ? "#f59e0b"
                  : "#ef4444",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          />
        )}
        {marks !== undefined && marks > 0 && (
          <Chip
            label={`Total Marks: ${marks}`}
            size="medium"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: "0.875rem" }}
          />
        )}
        {obtainedMarks !== null && obtainedMarks !== undefined && (
          <Chip
            label={`Obtained: ${obtainedMarks}`}
            size="medium"
            sx={{
              backgroundColor: "#6366f1",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.875rem",
            }}
          />
        )}
      </Box>
      {/* Tags */}
      {problemData?.details?.tags && (
        <Box sx={{ mt: 3, mb: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 1.5, fontSize: "1rem" }}
          >
            Tags
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {problemData.details.tags
              .split(",")
              .map((tag: string, index: number) => (
                <Chip
                  key={index}
                  label={tag.trim()}
                  size="small"
                  sx={{
                    backgroundColor: "#e0e7ff",
                    color: "#4338ca",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                  }}
                />
              ))}
          </Box>
        </Box>
      )}
      {/* Problem Statement */}
      {problemData?.details?.problem_statement ? (
        <Box
          dangerouslySetInnerHTML={{
            __html: problemData.details.problem_statement,
          }}
          sx={{
            color: "#374151",
            lineHeight: 1.7,
            fontSize: "0.95rem",
            "& h1, & h2, & h3": {
              fontWeight: 600,
              color: "#1a1f2e",
              mt: 2.5,
              mb: 1.5,
              fontSize: "1.1rem",
            },
            "& p": {
              mb: 2,
              fontSize: "0.95rem",
            },
            "& ul, & ol": {
              pl: 3,
              mb: 2,
              fontSize: "0.95rem",
            },
            "& li": {
              mb: 0.75,
            },
            "& code": {
              backgroundColor: "#f3f4f6",
              padding: "3px 8px",
              borderRadius: "4px",
              fontSize: "0.875em",
              fontFamily: "monospace",
              color: "#1f2937",
            },
            "& pre": {
              backgroundColor: "#f3f4f6",
              color: "#1f2937",
              p: 2,
              borderRadius: 1.5,
              overflow: "auto",
              mb: 2,
              fontSize: "0.875rem",
              border: "1px solid #d1d5db",
            },
          }}
        />
      ) : (
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mb: 2, fontSize: "0.95rem" }}
        >
          No problem description available. Please check back later.
        </Typography>
      )}

      {/* Input Format */}
      {problemData?.details?.input_format && (
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 1.5, fontSize: "1rem" }}
          >
            Input Format
          </Typography>
          <Box
            dangerouslySetInnerHTML={{
              __html: problemData.details.input_format,
            }}
            sx={{
              color: "#374151",
              fontSize: "0.875rem",
              lineHeight: 1.7,
              "& p": { mb: 1 },
            }}
          />
        </Box>
      )}

      {/* Output Format */}
      {problemData?.details?.output_format && (
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 1.5, fontSize: "1rem" }}
          >
            Output Format
          </Typography>
          <Box
            dangerouslySetInnerHTML={{
              __html: problemData.details.output_format,
            }}
            sx={{
              color: "#374151",
              fontSize: "0.875rem",
              lineHeight: 1.7,
              "& p": { mb: 1 },
            }}
          />
        </Box>
      )}

      {/* Examples / Test Cases */}
      {problemData?.details?.test_cases &&
        problemData.details.test_cases.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 2, fontSize: "1rem" }}
            >
              Examples
            </Typography>
            {problemData.details.test_cases.map(
              (testCase: any, index: number) => (
                <Box key={index} sx={{ mb: 2.5 }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, mb: 1, fontSize: "0.875rem" }}
                  >
                    Example {index + 1}:
                  </Typography>

                  {/* Input */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: "#6b7280",
                        display: "block",
                        mb: 0.5,
                        fontSize: "0.75rem",
                      }}
                    >
                      Input:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        p: 2,
                        backgroundColor: "#f3f4f6",
                        color: "#1f2937",
                        borderRadius: 1.5,
                        overflow: "auto",
                        fontSize: "0.875rem",
                        fontFamily: "monospace",
                        margin: 0,
                        border: "1px solid #d1d5db",
                      }}
                    >
                      {testCase.input}
                    </Box>
                  </Box>

                  {/* Output */}
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 600,
                        color: "#6b7280",
                        display: "block",
                        mb: 0.5,
                        fontSize: "0.75rem",
                      }}
                    >
                      Output:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        p: 2,
                        backgroundColor: "#f3f4f6",
                        color: "#1f2937",
                        borderRadius: 1.5,
                        overflow: "auto",
                        fontSize: "0.875rem",
                        fontFamily: "monospace",
                        margin: 0,
                        border: "1px solid #d1d5db",
                      }}
                    >
                      {testCase.expected_output}
                    </Box>
                  </Box>
                </Box>
              )
            )}
          </Box>
        )}

      {/* Fallback to sample_input/sample_output */}
      {(!problemData?.details?.test_cases ||
        problemData.details.test_cases.length === 0) &&
        (problemData?.details?.sample_input ||
          problemData?.details?.sample_output) && (
          <Box sx={{ mt: 3 }}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, mb: 2, fontSize: "1rem" }}
            >
              Example 1:
            </Typography>

            {problemData.details.sample_input && (
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "#6b7280",
                    display: "block",
                    mb: 0.5,
                    fontSize: "0.75rem",
                  }}
                >
                  Input:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    backgroundColor: "#1e293b",
                    color: "#e2e8f0",
                    borderRadius: 1.5,
                    overflow: "auto",
                    fontSize: "0.875rem",
                    fontFamily: "monospace",
                    margin: 0,
                    border: "1px solid #334155",
                  }}
                >
                  {problemData.details.sample_input}
                </Box>
              </Box>
            )}

            {problemData.details.sample_output && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "#6b7280",
                    display: "block",
                    mb: 0.5,
                    fontSize: "0.75rem",
                  }}
                >
                  Output:
                </Typography>
                <Box
                  component="pre"
                  sx={{
                    p: 2,
                    backgroundColor: "#f3f4f6",
                    color: "#1f2937",
                    borderRadius: 1.5,
                    overflow: "auto",
                    fontSize: "0.875rem",
                    fontFamily: "monospace",
                    margin: 0,
                    border: "1px solid #d1d5db",
                  }}
                >
                  {problemData.details.sample_output}
                </Box>
              </Box>
            )}
          </Box>
        )}

      {/* Constraints */}
      {problemData?.details?.constraints && (
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, mb: 2, fontSize: "1rem" }}
          >
            Constraints
          </Typography>
          <Box
            dangerouslySetInnerHTML={{
              __html: problemData.details.constraints,
            }}
            sx={{
              color: "#374151",
              fontSize: "0.875rem",
              lineHeight: 1.7,
              "& ul": { pl: 3, mb: 0 },
              "& li": { mb: 0.75 },
              "& strong": { fontWeight: 600 },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
