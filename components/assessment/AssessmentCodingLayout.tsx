"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Paper } from "@mui/material";
import { useToast } from "@/components/common/Toast";
import { ProblemDescription } from "@/components/coding/ProblemDescription";
import { TestResults } from "@/components/coding/TestResults";
import { AssessmentCodeEditorPanel } from "./AssessmentCodeEditorPanel";
import { CodingQuestionList } from "./CodingQuestionList";
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
  questions?: Array<{
    id: string | number;
    title: string;
    answered?: boolean;
  }>;
  totalQuestions?: number;
  onQuestionClick?: (questionId: string | number) => void;
  onNextQuestion?: () => void;
  onPreviousQuestion?: () => void;
  currentQuestionIndex?: number;
}

export function AssessmentCodingLayout({
  slug,
  questionId,
  problemData,
  onCodeChange,
  onCodeSubmit,
  initialCode,
  initialLanguage,
  questions = [],
  totalQuestions = 0,
  onQuestionClick,
  onNextQuestion,
  onPreviousQuestion,
  currentQuestionIndex = 0,
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

  // Track previous questionId to detect question changes
  const previousQuestionIdRef = useRef<number | null>(null);
  const hasInitializedCodeRef = useRef<number | null>(null);
  const lastInitialCodeRef = useRef<string>("");

  const storageKey = `assessment_${slug}_coding_${questionId}`;

  const getStoredData = (): { code: string; language: string; language_id: number } | null => {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.code !== undefined || parsed.language !== undefined)) {
          return {
            code: parsed.code != null ? String(parsed.code) : "",
            language: parsed.language || "python3",
            language_id: parsed.language_id ?? getLanguageId(parsed.language || "python3"),
          };
        }
      }
    } catch {
      // Ignore
    }
    return null;
  };

  // Save code, language, language_id to sessionStorage
  // Skip saving when code is empty and sessionStorage already has content - prevents overwriting
  // during initial load before code init has run (save effect can run before setCode(storedCode) commits)
  useEffect(() => {
    if (typeof window === "undefined" || !slug || !questionId || !selectedLanguage) return;
    if (!code.trim()) {
      const stored = getStoredData();
      if (stored?.code != null && stored.code.trim() !== "") return; // Don't overwrite with empty
    }
    try {
      const languageId = getLanguageId(selectedLanguage);
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ code, language: selectedLanguage, language_id: languageId })
      );
    } catch {
      // Ignore quota errors
    }
  }, [storageKey, slug, questionId, selectedLanguage, code]);

  // Initialize language on mount or question change - prefer sessionStorage, then initialLanguage, then python
  // Keep dependency array fixed (5 items) - React requires constant size between renders
  const langInitDeps = [
    availableLanguages,
    selectedLanguage,
    initialLanguage ?? "",
    questionId,
    slug,
  ] as const;
  useEffect(() => {
    if (availableLanguages.length === 0) return;
    const key = `assessment_${slug}_coding_${questionId}`;
    let stored: { code: string; language: string; language_id: number } | null = null;
    if (typeof window !== "undefined") {
      try {
        const raw = sessionStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.language)
            stored = { code: parsed.code ?? "", language: parsed.language, language_id: parsed.language_id };
        }
      } catch {
        // Ignore
      }
    }
    const storedLang = stored?.language;
    const validStoredLang = storedLang && availableLanguages.some((l) => l.value === storedLang);
    const validInitialLang = initialLanguage && availableLanguages.some((l) => l.value === initialLanguage);
    if (validStoredLang) {
      setSelectedLanguage(storedLang);
    } else if (validInitialLang) {
      setSelectedLanguage(initialLanguage);
    } else if (!selectedLanguage) {
      const pythonLang = availableLanguages.find(
        (l) => l.value === "python3" || l.value === "python"
      );
      setSelectedLanguage(pythonLang?.value || availableLanguages[0].value);
    }
  }, langInitDeps);

  // Initialize code with template_code or initialCode - ONLY when question changes or first mount
  useEffect(() => {
    if (!selectedLanguage || !problemData) return;

    const questionChanged = previousQuestionIdRef.current !== questionId && previousQuestionIdRef.current !== null;
    const needsInitialization = hasInitializedCodeRef.current !== questionId;
    
    // Determine what code to load - prefer sessionStorage (saved during session), then initialCode, then template
    const getCodeToLoad = () => {
      const stored = getStoredData();
      if (stored?.code != null && stored.code.trim() !== "") {
        return stored.code;
      }
      if (initialCode && initialCode.trim() !== "") {
        return initialCode;
      }
      if (problemData?.details?.template_code?.[selectedLanguage]) {
        return problemData.details.template_code[selectedLanguage];
      }
      if (problemData?.details?.starter_code) {
        return problemData.details.starter_code;
      }
      return "";
    };
    
    if (questionChanged) {
      // Question changed - reset everything
      previousQuestionIdRef.current = questionId;
      hasInitializedCodeRef.current = questionId;
      lastInitialCodeRef.current = initialCode || "";
      
      // Reset state when question changes
      setTestResults(null);
      setCanSubmit(false);
      setRunning(false);
      setSubmitting(false);

      // Load code when question changes
      setCode(getCodeToLoad());
    } else if (needsInitialization) {
      // First time initialization for this question (on mount or when language becomes available)
      previousQuestionIdRef.current = questionId;
      hasInitializedCodeRef.current = questionId;
      lastInitialCodeRef.current = initialCode || "";
      
      // Load code on first initialization
      setCode(getCodeToLoad());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId, selectedLanguage, problemData]); // Removed initialCode to prevent resets

  // Handle initialCode loading later (from saved responses) - only if sessionStorage has no user code
  // SessionStorage takes precedence: do not override with initialCode when user has saved code
  useEffect(() => {
    if (
      initialCode &&
      initialCode.trim() !== "" &&
      initialCode !== lastInitialCodeRef.current &&
      hasInitializedCodeRef.current === questionId &&
      selectedLanguage &&
      problemData
    ) {
      // If sessionStorage has non-empty code for this question, do NOT override – user's session data wins
      const stored = getStoredData();
      if (stored?.code != null && stored.code.trim() !== "") {
        lastInitialCodeRef.current = initialCode;
        return;
      }
      lastInitialCodeRef.current = initialCode;
      // Only set initialCode if current code is empty or matches template (user hasn't typed)
      setCode((currentCode) => {
        if (!currentCode || currentCode.trim() === "") {
          return initialCode;
        }
        const templateCode = problemData?.details?.template_code?.[selectedLanguage] || "";
        if (currentCode === templateCode) {
          return initialCode;
        }
        return currentCode;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]); // Only run when initialCode changes, but safely check current code

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
      // Clear any pending debounce timer and immediately save code to backend response
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      // Immediately save code to backend response before running
      if (onCodeChangeRef.current && selectedLanguage && code) {
        previousCodeRef.current = { code, language: selectedLanguage };
        onCodeChangeRef.current(code, selectedLanguage);
      }

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
      } else if (result.stderr || result.compile_output || result.error) {
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
        const errorType = result.error || result.status || "Error";
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
      const errData = error.response?.data;
      // API may return error payload (error, stderr, compile_output) with 4xx/5xx – still display it
      if (errData && (errData.error || errData.stderr || errData.compile_output)) {
        setTestResults(errData);
        showToast(
          (errData.error || errData.status || "Error") + ": Please fix the errors and try again.",
          "error"
        );
      } else {
        showToast(errData?.message || "Failed to run code", "error");
      }
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
      // Clear any pending debounce timer and immediately save code to backend response
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      // Immediately save code to backend response before submitting
      if (onCodeChangeRef.current && selectedLanguage && code) {
        previousCodeRef.current = { code, language: selectedLanguage };
        onCodeChangeRef.current(code, selectedLanguage);
      }

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

      if (result.stderr || result.compile_output || result.error) {
        hasError = true;
      }

      const allPassed = result.passed === result.total_test_cases;
      if (allPassed || result.all_passed || result.status === "Accepted") {
        showToast("Code submitted successfully!", "success");
      } else if (hasError) {
        const errorType = result.error || result.status || "Error";
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
      const errData = error.response?.data;
      if (errData && (errData.error || errData.stderr || errData.compile_output)) {
        setTestResults(errData);
        showToast(
          (errData.error || errData.status || "Error") + ": Please fix the errors and try again.",
          "error"
        );
      } else {
        showToast(errData?.message || "Failed to submit code", "error");
      }
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
      // Clear any pending debounce timer and immediately save code to backend response
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      // Immediately save code to backend response before running with custom input
      if (onCodeChangeRef.current && selectedLanguage && code) {
        previousCodeRef.current = { code, language: selectedLanguage };
        onCodeChangeRef.current(code, selectedLanguage);
      }

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
      const errData = error.response?.data;
      if (errData && (errData.error || errData.stderr || errData.compile_output)) {
        setTestResults({ ...errData, custom_input: true });
        showToast((errData.error || errData.status || "Error") + ": Check the output for details.", "error");
      } else {
        showToast(errData?.message || "Failed to run custom input", "error");
      }
    }
  };

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: { xs: 2, md: 3 },
        maxWidth: "100%",
      }}
    >
      {/* Left Sidebar - Question List */}
      {questions.length > 0 && (
        <Box
          sx={{
            width: { xs: "100%", md: "320px" },
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            order: { xs: 1, md: 0 },
          }}
        >
          <CodingQuestionList
            questions={questions}
            currentQuestionId={questionId}
            onQuestionClick={onQuestionClick}
          />
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          order: { xs: 0, md: 1 },
        }}
      >
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
            minHeight: 140,
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
            isAssessment={true}
          />
        </Box>
      </Box>
        </Box>
      </Box>
    </Box>
  );
}
