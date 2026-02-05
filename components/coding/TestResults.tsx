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
  isAssessment?: boolean; // If true, show only test case count, not detailed results
}

export function TestResults({
  testResults,
  problemData,
  onRunCustomInput,
  runningCustomInput,
  isAssessment = false,
}: TestResultsProps) {
  const [mainTab, setMainTab] = useState(0); // 0: Test Cases, 1: Custom Input
  const [selectedCase, setSelectedCase] = useState(0);
  const [customInput, setCustomInput] = useState("");

  // Normalize: unwrap nested response (data, result, output, run_result, run_output, submission, submissions)
  const raw =
    testResults?.data ??
    testResults?.result ??
    testResults?.output ??
    testResults?.run_result ??
    (Array.isArray(testResults?.run_output) ? testResults.run_output[0] : null) ??
    testResults?.submission ??
    (Array.isArray(testResults?.submissions) ? testResults.submissions[0] : null) ??
    testResults;
  const res = raw || testResults;

  // Helper to extract error fields from any object
  const extractErrorFrom = (obj: any) => {
    if (!obj || typeof obj !== "object") return;
    const err =
      obj.error ||
      obj.status_message ||
      (typeof obj.status === "string" ? obj.status : obj.status?.description);
    const stderr = obj.stderr;
    const compileOutput = obj.compile_output;
    if (err || stderr || compileOutput) {
      return {
        errorType: err || "Error",
        errorMessage: [stderr, compileOutput].filter(Boolean).join("\n\n") || err || "",
      };
    }
  };

  // Handle different API response formats
  let testCasesArray: any[] = [];
  let hasCompilationError = false;
  let errorType = "";
  let errorMessage = "";
  let passedCount = 0;
  let totalCount = 0;

  if (res) {
    if (Array.isArray(res)) {
      testCasesArray = res;
      // Check first element for error (Judge0 may return array of one error object)
      const first = res[0];
      if (first && (first.stderr || first.compile_output || first.error)) {
        hasCompilationError = true;
        errorType = first.error || first.status || first.status_message || "Error";
        const parts: string[] = [];
        if (first.stderr) parts.push(first.stderr);
        if (first.compile_output) parts.push(first.compile_output);
        errorMessage = parts.length > 0 ? parts.join("\n\n") : (first.message || first.error || "");
      }
    } else if (res.results && Array.isArray(res.results)) {
      testCasesArray = res.results;
    } else if (res.test_cases) {
      testCasesArray = res.test_cases;
    } else if (res.stderr || res.compile_output || res.error) {
      testCasesArray = [res];
      hasCompilationError = true;
      errorType = res.error || res.status || res.status_message || "Error";
      const parts: string[] = [];
      if (res.stderr) parts.push(res.stderr);
      if (res.compile_output) parts.push(res.compile_output);
      errorMessage = parts.length > 0 ? parts.join("\n\n") : (res.message || res.error || "");
    }

    // Calculate passed/total for assessment mode
    if (isAssessment) {
      passedCount = res.passed_testcases ?? res.passed ?? res.tc_passed ?? 0;
      totalCount = res.total_testcases ?? res.total_test_cases ?? res.total_tc ?? 0;

      if (totalCount === 0 && testCasesArray.length > 0) {
        totalCount = testCasesArray.length;
        passedCount = testCasesArray.filter(
          (tc: any) =>
            tc.status === "Accepted" ||
            tc.verdict === "Accepted" ||
            tc.passed === true
        ).length;
      }
    }
  }

  // Fallback: extract error from top-level, nested wrappers, or individual test case results
  if (testResults && !hasCompilationError) {
    const extracted =
      extractErrorFrom(testResults) ??
      extractErrorFrom(testResults?.data) ??
      extractErrorFrom(testResults?.result) ??
      extractErrorFrom(testResults?.run_output?.[0]) ??
      extractErrorFrom(testResults?.submissions?.[0]) ??
      // Error may be inside results[] when API returns { results: [{ stderr, error, ... }] }
      (testCasesArray.length > 0 ? extractErrorFrom(testCasesArray[0]) : undefined);
    if (extracted) {
      hasCompilationError = true;
      errorType = extracted.errorType;
      errorMessage = extracted.errorMessage;
    }
  }

  // Assessment mode: Show tabbed layout (Test Cases / Custom Input) with error in Test Cases tab
  if (isAssessment) {
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
        {/* Tabs for assessment mode */}
        <Tabs
          value={mainTab}
          onChange={(_, v) => setMainTab(v)}
          sx={{
            borderBottom: "1px solid #e5e7eb",
            minHeight: 40,
            backgroundColor: "#ffffff",
            "& .MuiTab-root": { minHeight: 40, fontSize: "0.875rem", fontWeight: 500, textTransform: "none" },
            "& .Mui-selected": { color: "#111827" },
            "& .MuiTabs-indicator": { backgroundColor: "#6366f1" },
          }}
        >
          <Tab label="Test Cases" />
          <Tab label="Custom Input" />
        </Tabs>
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          {mainTab === 0 && (
            <>
        {!testResults ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#9ca3af",
            }}
          >
            <IconWrapper
              icon="mdi:play-circle-outline"
              size={48}
              color="#d1d5db"
            />
            <Typography
              variant="body2"
              sx={{ mt: 1.5, fontSize: "0.875rem" }}
            >
              Click <strong>Run Code</strong> to test your solution
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "100%",
            }}
          >
            {/* Show test case count if available */}
            {totalCount > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                  p: 3,
                  backgroundColor: "#f9fafb",
                  borderRadius: 2,
                  border: "1px solid #e5e7eb",
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: passedCount === totalCount ? "#10b981" : "#ef4444",
                  }}
                >
                  {passedCount} / {totalCount}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#6b7280",
                    fontSize: "0.875rem",
                  }}
                >
                  Test Cases Passed
                </Typography>
              </Box>
            )}

            {/* Show error details under test case count - ensure visibility */}
            {hasCompilationError && (errorType || errorMessage) && (
              <Box
                sx={{
                  width: "100%",
                  p: 2,
                  backgroundColor: "#fef2f2",
                  borderRadius: 1,
                  border: "1px solid #fecaca",
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, color: "#991b1b", mb: 1 }}
                >
                  {errorType || "Error"}
                </Typography>
                <Typography
                  component="pre"
                  variant="body2"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.8rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    color: "#b91c1c",
                  }}
                >
                  {errorMessage || errorType}
                </Typography>
              </Box>
            )}

            {/* Show status messages */}
            {totalCount > 0 && (
              <>
                {passedCount === totalCount && (
                  <Alert severity="success" sx={{ width: "100%" }}>
                    All test cases passed! You can submit your solution.
                  </Alert>
                )}
                {passedCount < totalCount && passedCount > 0 && (
                  <Alert severity="warning" sx={{ width: "100%" }}>
                    Some test cases failed. Fix your code and try again.
                  </Alert>
                )}
                {passedCount === 0 && totalCount > 0 && !hasCompilationError && (
                  <Alert severity="error" sx={{ width: "100%" }}>
                    All test cases failed. Please review your code.
                  </Alert>
                )}
              </>
            )}

            {/* Show message if no test results but no error either */}
            {!hasCompilationError && totalCount === 0 && testResults && (
              <Alert severity="info" sx={{ width: "100%" }}>
                Code executed. Waiting for test results...
              </Alert>
            )}
          </Box>
        )}
            </>
          )}
          {mainTab === 1 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: "#4b5563", mb: 2, fontSize: "0.875rem" }}>
                Enter your custom test input below and click Run to see the output.
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
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
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
                sx={{ backgroundColor: "#6366f1", "&:hover": { backgroundColor: "#4f46e5" } }}
              >
                {runningCustomInput ? "Running..." : "Run"}
              </Button>
              {testResults?.custom_input && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Output</Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 1.5,
                      backgroundColor: "#f3f4f6",
                      fontFamily: "monospace",
                      fontSize: "0.875rem",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {testResults.stdout || testResults.output || "No output"}
                  </Paper>
                  {(testResults.stderr || testResults.compile_output || testResults.error) && (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.5,
                        mt: 1,
                        backgroundColor: "#fee2e2",
                        border: "1px solid #ef4444",
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        color: "#991b1b",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {testResults.stderr || testResults.compile_output || testResults.error || ""}
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
    );
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
            {/* Compilation/Runtime Errors - bind error, stderr, compile_output */}
            {hasCompilationError && (errorType || errorMessage) && (
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
                    {errorType || testCasesArray[0]?.status || "Error"}
                  </Typography>
                  <Typography
                    component="pre"
                    variant="body2"
                    sx={{
                      fontFamily: "monospace",
                      fontSize: "0.8rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      color: "#dc2626",
                    }}
                  >
                    {errorMessage || errorType}
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

                {/* Error output if any - bind error, stderr, compile_output */}
                {(testResults.stderr || testResults.compile_output || testResults.error) && (
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
                      {testResults.stderr || testResults.compile_output || testResults.error}
                    </Paper>
                  </Box>
                )}

                {/* Status and execution info */}
                <Box
                  sx={{
                    p: 1.5,
                    mb: 2,
                    backgroundColor:
                      testResults.stderr || testResults.compile_output || testResults.error
                        ? "#fee2e2"
                        : "#d1fae5",
                    border: `1px solid ${
                      testResults.stderr || testResults.compile_output || testResults.error
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
                        testResults.stderr || testResults.compile_output || testResults.error
                          ? "#991b1b"
                          : "#065f46",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                    }}
                  >
                    Status: {testResults.status || testResults.error || "Executed"}
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
