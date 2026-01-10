"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Paper,
  Alert,
  Tabs,
  Tab,
  TextField,
  Button,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface TestResultsProps {
  testResults: any;
  problemData?: any;
  onRunCustomInput?: (input: string) => void;
  runningCustomInput?: boolean;
}

export function TestResults({
  testResults,
  problemData,
  onRunCustomInput,
  runningCustomInput,
}: TestResultsProps) {
  const [mainTab, setMainTab] = useState(0); // 0: Test Cases, 1: Custom Input
  const [selectedCase, setSelectedCase] = useState(0);
  const [customInput, setCustomInput] = useState("");

  // Handle different API response formats
  let testCasesArray: any[] = [];
  let hasCompilationError = false;
  let errorMessage = "";

  if (testResults) {
    if (Array.isArray(testResults)) {
      // Success case: array of test cases
      testCasesArray = testResults;
    } else if (testResults.results && Array.isArray(testResults.results)) {
      // Wrapped in results property (most common format)
      testCasesArray = testResults.results;
    } else if (testResults.test_cases) {
      // Wrapped in test_cases property
      testCasesArray = testResults.test_cases;
    } else if (testResults.stderr || testResults.compile_output) {
      // Single error object case
      testCasesArray = [testResults];
      hasCompilationError = true;
      errorMessage = testResults.stderr || testResults.compile_output || "";
    }
  }

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
        overflow: "hidden",
      }}
    >
      {/* Main Tabs: Test Cases / Custom Input */}
      <Tabs
        value={mainTab}
        onChange={(_, newValue) => setMainTab(newValue)}
        sx={{
          borderBottom: "1px solid #e5e7eb",
          minHeight: 40,
          backgroundColor: "#ffffff",
          "& .MuiTab-root": {
            color: "#6b7280",
            minHeight: 40,
            fontSize: "0.875rem",
            fontWeight: 500,
            textTransform: "none",
            "&.Mui-selected": {
              color: "#111827",
            },
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "#6366f1",
          },
        }}
      >
        <Tab label="Test Cases" />
        <Tab label="Custom Input" />
      </Tabs>

      {/* Content Area */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: { xs: 1.5, md: 2 },
          backgroundColor: "#f9fafb",
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f3f4f6",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#d1d5db",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: "#9ca3af",
            },
          },
        }}
      >
        {/* Test Cases Tab */}
        {mainTab === 0 && (
          <Box>
            {/* Compilation/Runtime Errors - Show prominently */}
            {hasCompilationError && errorMessage && (
              <Box
                sx={{
                  backgroundColor: "#ffffff",
                  p: 2,
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    py: 1.5,
                    backgroundColor: "#fee2e2",
                    border: "1px solid #ef4444",
                    "& .MuiAlert-message": {
                      width: "100%",
                    },
                    "& .MuiAlert-icon": {
                      color: "#dc2626",
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      mb: 0.5,
                      fontSize: "0.875rem",
                      color: "#991b1b",
                    }}
                  >
                    {testCasesArray[0]?.status || "Error"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      color: "#dc2626",
                    }}
                  >
                    {errorMessage}
                  </Typography>
                </Alert>
              </Box>
            )}

            {/* Case Selection Buttons */}
            {testResults && testCasesArray.length > 0 && (
              <Box
                sx={{
                  backgroundColor: "#ffffff",
                  p: 2,
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {testCasesArray.map((tc: any, index: number) => {
                    const isPassed =
                      tc.status === "Accepted" ||
                      tc.verdict === "Accepted" ||
                      tc.passed;
                    const isSelected = selectedCase === index;
                    return (
                      <Chip
                        key={index}
                        label={`Case ${index + 1}`}
                        onClick={() => setSelectedCase(index)}
                        sx={{
                          backgroundColor: isSelected
                            ? isPassed
                              ? "#d1fae5"
                              : "#fee2e2"
                            : "#f9fafb",
                          color: isSelected
                            ? isPassed
                              ? "#065f46"
                              : "#991b1b"
                            : "#4b5563",
                          fontWeight: 500,
                          fontSize: "0.875rem",
                          border: `1px solid ${
                            isSelected
                              ? isPassed
                                ? "#10b981"
                                : "#ef4444"
                              : "#d1d5db"
                          }`,
                          borderLeft: `4px solid ${
                            isPassed ? "#10b981" : "#ef4444"
                          }`,
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: isSelected
                              ? isPassed
                                ? "#a7f3d0"
                                : "#fecaca"
                              : "#e5e7eb",
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* Selected Test Case Details */}
            {testResults &&
              testCasesArray.length > 0 &&
              testCasesArray[selectedCase] &&
              (() => {
                const testCase = testCasesArray[selectedCase];
                const isPassed =
                  testCase.status === "Accepted" ||
                  testCase.verdict === "Accepted" ||
                  testCase.passed;

                return (
                  <Box
                    sx={{
                      backgroundColor: "#ffffff",
                      p: 2,
                      borderRadius: 1,
                    }}
                  >
                    {/* Input Section */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#6b7280",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          mb: 1,
                        }}
                      >
                        Input:
                      </Typography>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          backgroundColor: "#f3f4f6",
                          border: "1px solid #d1d5db",
                          fontFamily: "monospace",
                          fontSize: "0.875rem",
                          color: "#1f2937",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {testCase.input}
                      </Paper>
                    </Box>

                    {/* Expected Output Section */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#6b7280",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          mb: 1,
                        }}
                      >
                        Expected Output:
                      </Typography>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          backgroundColor: "#f3f4f6",
                          border: "1px solid #d1d5db",
                          fontFamily: "monospace",
                          fontSize: "0.875rem",
                          color: "#1f2937",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {testCase.expected_output}
                      </Paper>
                    </Box>

                    {/* Your Output Section */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: isPassed ? "#10b981" : "#ef4444",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          mb: 1,
                        }}
                      >
                        Your Output:
                      </Typography>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          backgroundColor: "#f3f4f6",
                          border: `1px solid ${
                            isPassed ? "#10b981" : "#ef4444"
                          }`,
                          fontFamily: "monospace",
                          fontSize: "0.875rem",
                          color: isPassed ? "#065f46" : "#991b1b",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                        }}
                      >
                        {testCase.actual_output || '""'}
                      </Paper>
                    </Box>

                    {/* Status Box */}
                    <Box
                      sx={{
                        p: 1.5,
                        mb: 2,
                        backgroundColor: isPassed ? "#d1fae5" : "#fee2e2",
                        border: `1px solid ${isPassed ? "#10b981" : "#ef4444"}`,
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: isPassed ? "#065f46" : "#991b1b",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                        }}
                      >
                        Status:{" "}
                        {testCase.status ||
                          testCase.verdict ||
                          (isPassed ? "Accepted" : "Wrong Answer")}
                      </Typography>
                    </Box>

                    {/* Time and Memory */}
                    <Box
                      sx={{
                        mb: 2,
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontSize: "0.875rem" }}
                      >
                        Time: {testCase.time || "0"}s
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#6b7280" }}>
                        |
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "#6b7280", fontSize: "0.875rem" }}
                      >
                        Memory:{" "}
                        {testCase.memory
                          ? `${(testCase.memory / 1024).toFixed(2)} MB`
                          : "0 KB"}
                      </Typography>
                    </Box>

                    {/* Error Messages */}
                    {(testCase.stderr || testCase.compile_output) &&
                      !hasCompilationError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.8rem",
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {testCase.stderr || testCase.compile_output}
                          </Typography>
                        </Alert>
                      )}

                    {/* Test Case Passed Message */}
                    {isPassed && (
                      <Box
                        sx={{
                          p: 1.5,
                          backgroundColor: "#d1fae5",
                          border: "1px solid #10b981",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <IconWrapper
                          icon="mdi:check"
                          size={16}
                          color="#065f46"
                        />
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#065f46",
                            fontSize: "0.875rem",
                          }}
                        >
                          Test case passed!
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })()}

            {/* No test results yet - Light Mode for Examples */}
            {(!testResults || testCasesArray.length === 0) && (
              <Box
                sx={{
                  backgroundColor: "#ffffff",
                  p: 2,
                  borderRadius: 1,
                  minHeight: "300px",
                }}
              >
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                    Click <strong>Run</strong> to test your code. You must pass
                    all test cases before submitting.
                  </Typography>
                </Alert>

                {/* Show sample test cases from problem data - Light Theme */}
                {problemData?.details?.test_cases &&
                  problemData.details.test_cases.length > 0 && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ mb: 1.5, fontWeight: 600, color: "#374151" }}
                      >
                        Sample Test Cases
                      </Typography>
                      {problemData.details.test_cases.map(
                        (testCase: any, index: number) => (
                          <Paper
                            key={index}
                            elevation={0}
                            sx={{
                              p: 1.5,
                              mb: 1.5,
                              backgroundColor: "#f9fafb",
                              border: "1px solid #e5e7eb",
                              borderLeft: "4px solid #9ca3af",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                fontSize: "0.875rem",
                                mb: 1,
                                color: "#111827",
                              }}
                            >
                              Test Case {index + 1}
                            </Typography>
                            <Box
                              sx={{
                                fontFamily: "monospace",
                                fontSize: "0.85rem",
                                color: "#4b5563",
                                "& div": {
                                  mb: 0.75,
                                  wordBreak: "break-word",
                                },
                              }}
                            >
                              <div>
                                <strong style={{ color: "#1f2937" }}>
                                  Input:
                                </strong>{" "}
                                {testCase.input}
                              </div>
                              <div>
                                <strong style={{ color: "#1f2937" }}>
                                  Expected Output:
                                </strong>{" "}
                                {testCase.expected_output}
                              </div>
                            </Box>
                          </Paper>
                        )
                      )}
                    </Box>
                  )}

                {/* Fallback if no test cases */}
                {(!problemData?.details?.test_cases ||
                  problemData.details.test_cases.length === 0) && (
                  <Box sx={{ textAlign: "center", py: 3, color: "#9ca3af" }}>
                    <IconWrapper
                      icon="mdi:play-circle-outline"
                      size={48}
                      color="#d1d5db"
                    />
                    <Typography
                      variant="body2"
                      sx={{ mt: 1.5, fontSize: "0.875rem" }}
                    >
                      No test results yet
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}

        {/* Custom Input Tab */}
        {mainTab === 1 && (
          <Box
            sx={{
              backgroundColor: "#ffffff",
              p: 2,
              borderRadius: 1,
              minHeight: "300px",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#4b5563",
                fontSize: "0.875rem",
                mb: 2,
              }}
            >
              Enter your custom test input below and click Run to see the
              output.
            </Typography>

            <TextField
              multiline
              rows={6}
              fullWidth
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter your input here..."
              sx={{
                mb: 2,
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#f9fafb",
                  color: "#111827",
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  "& fieldset": {
                    borderColor: "#d1d5db",
                  },
                  "&:hover fieldset": {
                    borderColor: "#9ca3af",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#6366f1",
                  },
                },
                "& .MuiInputBase-input::placeholder": {
                  color: "#9ca3af",
                },
              }}
            />

            <Button
              variant="contained"
              onClick={() => onRunCustomInput?.(customInput)}
              disabled={!customInput.trim() || runningCustomInput}
              startIcon={
                runningCustomInput ? (
                  <IconWrapper icon="mdi:loading" size={16} />
                ) : (
                  <IconWrapper icon="mdi:play" size={16} />
                )
              }
              sx={{
                backgroundColor: "#6366f1",
                "&:hover": {
                  backgroundColor: "#4f46e5",
                },
                "&:disabled": {
                  backgroundColor: "#4a5568",
                  color: "#718096",
                },
              }}
            >
              {runningCustomInput ? "Running..." : "Run"}
            </Button>

            {/* Show custom input result if available */}
            {testResults && testResults.custom_input && (
              <Box sx={{ mt: 3 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 2, fontWeight: 600, color: "#374151" }}
                >
                  Output
                </Typography>

                {/* Your Output Section */}
                <Box sx={{ mb: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Your Output:
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      backgroundColor: "#f3f4f6",
                      border: "1px solid #d1d5db",
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      color: "#111827",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      minHeight: "60px",
                    }}
                  >
                    {testResults.stdout ||
                      testResults.output ||
                      testResults.actual_output ||
                      (testResults.test_cases &&
                        testResults.test_cases[0]?.actual_output) ||
                      (Array.isArray(testResults.results) &&
                        testResults.results[0]?.actual_output) ||
                      "No output"}
                  </Paper>
                </Box>

                {/* Error output if any */}
                {(testResults.stderr || testResults.compile_output) && (
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#ef4444",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      Error Output:
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        backgroundColor: "#fee2e2",
                        border: "1px solid #ef4444",
                        fontFamily: "monospace",
                        fontSize: "0.875rem",
                        color: "#991b1b",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {testResults.stderr || testResults.compile_output}
                    </Paper>
                  </Box>
                )}

                {/* Status and execution info */}
                <Box
                  sx={{
                    p: 1.5,
                    mb: 2,
                    backgroundColor:
                      testResults.stderr || testResults.compile_output
                        ? "#fee2e2"
                        : "#d1fae5",
                    border: `1px solid ${
                      testResults.stderr || testResults.compile_output
                        ? "#ef4444"
                        : "#10b981"
                    }`,
                    borderRadius: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        testResults.stderr || testResults.compile_output
                          ? "#991b1b"
                          : "#065f46",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                    }}
                  >
                    Status: {testResults.status || "Executed"}
                  </Typography>
                </Box>

                {/* Time and Memory if available */}
                {(testResults.time || testResults.memory) && (
                  <Box
                    sx={{
                      mb: 2,
                      display: "flex",
                      gap: 1,
                      alignItems: "center",
                      color: "#6b7280",
                    }}
                  >
                    {testResults.time && (
                      <>
                        <Typography
                          variant="caption"
                          sx={{ fontSize: "0.875rem" }}
                        >
                          Time: {testResults.time}s
                        </Typography>
                        <Typography variant="caption">|</Typography>
                      </>
                    )}
                    {testResults.memory && (
                      <Typography
                        variant="caption"
                        sx={{ fontSize: "0.875rem" }}
                      >
                        Memory: {(testResults.memory / 1024).toFixed(2)} MB
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}
