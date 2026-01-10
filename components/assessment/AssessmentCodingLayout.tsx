"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Paper } from "@mui/material";
import { useToast } from "@/components/common/Toast";
import { ProblemDescription } from "@/components/coding/ProblemDescription";
import { TestResults } from "@/components/coding/TestResults";
import { AssessmentCodeEditorPanel } from "./AssessmentCodeEditorPanel";
import { assessmentService } from "@/lib/services/assessment.service";
import {
  getAvailableLanguages,
  getLanguageId,
} from "@/components/coding/utils/languageUtils";

interface AssessmentCodingLayoutProps {
  slug: string;
  questionId: number;
  problemData: any;
  onCodeChange?: (code: string, language: string) => void;
  onCodeSubmit?: (result: {
    tc_passed?: number;
    total_tc?: number;
    best_code?: string;
    passed?: number;
    total_test_cases?: number;
  }) => void;
  initialCode?: string;
  initialLanguage?: string;
}

export function AssessmentCodingLayout({
  slug,
  questionId,
  problemData,
  onCodeChange,
  onCodeSubmit,
  initialCode,
  initialLanguage,
}: AssessmentCodingLayoutProps) {
  const { showToast } = useToast();

  // Get available languages from problem data
  const availableLanguages = getAvailableLanguages(
    problemData?.details?.template_code
  );

  // State
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [testResults, setTestResults] = useState<any>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Track previous code to avoid unnecessary callbacks
  const previousCodeRef = useRef<{ code: string; language: string } | null>(
    null
  );

  // Track if component has been initialized to prevent initialCode from causing loops
  const hasInitializedRef = useRef(false);

  // Initialize default language
  useEffect(() => {
    if (availableLanguages.length > 0 && !selectedLanguage) {
      if (
        initialLanguage &&
        availableLanguages.some((l) => l.value === initialLanguage)
      ) {
        setSelectedLanguage(initialLanguage);
      } else {
        const pythonLang = availableLanguages.find(
          (l) => l.value === "python3" || l.value === "python"
        );
        setSelectedLanguage(pythonLang?.value || availableLanguages[0].value);
      }
    }
  }, [availableLanguages, selectedLanguage, initialLanguage]);

  // Initialize code with template_code or initialCode (only on mount)
  useEffect(() => {
    if (selectedLanguage && problemData && !hasInitializedRef.current) {
      hasInitializedRef.current = true;

      if (initialCode) {
        setCode(initialCode);
        return;
      }

      // Load template code
      if (problemData?.details?.template_code?.[selectedLanguage]) {
        setCode(problemData.details.template_code[selectedLanguage]);
      } else if (problemData?.details?.starter_code) {
        setCode(problemData.details.starter_code);
      }
    }
  }, [problemData, selectedLanguage, initialCode]);

  // Call onCodeChange callback when code changes - use ref to avoid infinite loops
  const onCodeChangeRef = useRef(onCodeChange);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onCodeChangeRef.current = onCodeChange;
  }, [onCodeChange]);

  // Debounce onCodeChange to prevent interrupting user typing
  useEffect(() => {
    if (onCodeChangeRef.current && selectedLanguage && code) {
      if (
        !previousCodeRef.current ||
        previousCodeRef.current.code !== code ||
        previousCodeRef.current.language !== selectedLanguage
      ) {
        // Clear existing debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }

        // Debounce for 500ms to avoid interrupting typing
        debounceTimerRef.current = setTimeout(() => {
          previousCodeRef.current = { code, language: selectedLanguage };
          if (onCodeChangeRef.current) {
            onCodeChangeRef.current(code, selectedLanguage);
          }
        }, 500);
      }
    }

    // Cleanup timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [code, selectedLanguage]);

  // Handle language change
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setCanSubmit(false);
    setTestResults(null);

    // Load template code
    if (problemData?.details?.template_code?.[language]) {
      setCode(problemData.details.template_code[language]);
    }
  };

  // Handle Run Code
  const handleRunCode = async () => {
    if (!code.trim()) {
      showToast("Please write some code first", "error");
      return;
    }

    try {
      setRunning(true);
      setTestResults(null);
      const languageId = getLanguageId(selectedLanguage);

      const result = await assessmentService.runCodeInAssessment(
        slug,
        questionId,
        code,
        languageId
      );

      setTestResults(result);

      // Check if all tests passed
      let testCases: any[] = [];
      let hasError = false;

      if (Array.isArray(result)) {
        testCases = result;
      } else if (result.results && Array.isArray(result.results)) {
        testCases = result.results;
      } else if (result.test_cases) {
        testCases = result.test_cases;
      } else if (result.stderr || result.compile_output) {
        hasError = true;
        testCases = [result];
      }

      const allPassed =
        !hasError &&
        testCases.length > 0 &&
        testCases.every(
          (tc: any) =>
            tc.status === "Accepted" || tc.verdict === "Accepted" || tc.passed
        );

      if (allPassed || result.all_passed || result.status === "Accepted") {
        setCanSubmit(true);
        showToast("All test cases passed! You can now submit.", "success");
      } else if (result.passed_testcases === result.total_testcases) {
        setCanSubmit(true);
        showToast("All test cases passed! You can now submit.", "success");
      } else if (hasError) {
        setCanSubmit(false);
        const errorType = result.status || "Error";
        showToast(
          `${errorType}: Please fix the errors and try again.`,
          "error"
        );
      } else {
        setCanSubmit(false);
        showToast(
          "Some test cases failed. Fix your code and try again.",
          "warning"
        );
      }
    } catch (error: any) {
      setCanSubmit(false);
      showToast(error.response?.data?.message || "Failed to run code", "error");
    } finally {
      setRunning(false);
    }
  };

  // Handle Submit Code
  const handleSubmitCode = async () => {
    if (!code.trim()) {
      showToast("Please write some code first", "error");
      return;
    }

    try {
      setSubmitting(true);
      const languageId = getLanguageId(selectedLanguage);

      const result = await assessmentService.submitCodeInAssessment(
        slug,
        questionId,
        code,
        languageId
      );

      setTestResults(result);

      // Call onCodeSubmit callback with test case results
      if (onCodeSubmit) {
        onCodeSubmit({
          tc_passed: result.passed_testcases ?? result.passed_testcases,
          total_tc: result.total_testcases ?? result.total_testcases,
          best_code: result.best_code ?? code,
          passed: result.passed,
          total_test_cases: result.total_test_cases,
        });
      }

      // Check if all tests passed
      let hasError = false;

      if (result.stderr || result.compile_output) {
        hasError = true;
      }

      const allPassed = result.passed === result.total_test_cases;
      if (allPassed || result.all_passed || result.status === "Accepted") {
        showToast("Code submitted successfully!", "success");
      } else if (hasError) {
        const errorType = result.status || "Error";
        showToast(
          `${errorType}: Submission failed. Please fix the errors.`,
          "error"
        );
      } else {
        showToast(
          "Some test cases failed. Please review and try again.",
          "warning"
        );
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to submit code",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reset
  const handleReset = () => {
    setCanSubmit(false);
    setTestResults(null);
    setRunning(false);
    setSubmitting(false);

    if (problemData?.details?.template_code?.[selectedLanguage]) {
      setCode(problemData.details.template_code[selectedLanguage]);
    } else if (problemData?.details?.starter_code) {
      setCode(problemData.details.starter_code);
    } else {
      setCode("");
    }

    showToast("Code reset to default", "info");
  };

  // Handle Custom Input Run
  const handleRunCustomInput = async (customInput: string) => {
    if (!code.trim()) {
      showToast("Please write some code first", "error");
      return;
    }

    try {
      const languageId = getLanguageId(selectedLanguage);

      const result = await assessmentService.runCodeInAssessment(
        slug,
        questionId,
        code,
        languageId,
        customInput
      );

      // Mark as custom input result
      setTestResults({ ...result, custom_input: true });

      if (result.stderr || result.compile_output) {
        showToast("Code executed with errors", "warning");
      } else {
        showToast("Custom input executed successfully", "success");
      }
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "Failed to run custom input",
        "error"
      );
    }
  };

  return (
    <Box
      sx={{
        height: { xs: "calc(100vh - 150px)", md: "calc(100vh - 180px)" },
        minHeight: "500px",
        maxHeight: { xs: "calc(100vh - 150px)", md: "calc(100vh - 180px)" },
        display: "flex",
        gap: 0,
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Left Panel - Problem Description */}
      <Paper
        elevation={0}
        sx={{
          width: "450px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRight: "2px solid #e5e7eb",
          borderRadius: 0,
          backgroundColor: "#ffffff",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <ProblemDescription problemData={problemData} />
        </Box>
      </Paper>

      {/* Right Panel - Code Editor with Test Cases */}
      <Box
        sx={{
          flex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {/* Code Editor */}
        <Box
          sx={{
            height: "60%",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <AssessmentCodeEditorPanel
            code={code}
            selectedLanguage={selectedLanguage}
            availableLanguages={availableLanguages}
            running={running}
            submitting={submitting}
            canSubmit={canSubmit}
            onCodeChange={setCode}
            onLanguageChange={handleLanguageChange}
            onReset={handleReset}
            onRun={handleRunCode}
            onSubmit={handleSubmitCode}
          />
        </Box>

        {/* Test Cases */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "#fafafa",
            borderTop: "2px solid #e5e7eb",
          }}
        >
          <TestResults
            testResults={testResults}
            problemData={problemData}
            onRunCustomInput={handleRunCustomInput}
            runningCustomInput={false}
          />
        </Box>
      </Box>
    </Box>
  );
}
