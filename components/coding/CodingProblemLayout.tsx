"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Paper, Tabs, Tab, useMediaQuery, useTheme } from "@mui/material";
import { coursesService } from "@/lib/services/courses.service";
import { useToast } from "@/components/common/Toast";
import { CompletionDialog } from "@/components/common/CompletionDialog";
import { ProblemDescription } from "./ProblemDescription";
import { TestResults } from "./TestResults";
import { Submissions } from "./Submissions";
import { CodeEditorPanel } from "./CodeEditorPanel";
import { CodingProblemComments } from "./CodingProblemComments";
import { getAvailableLanguages, getLanguageId } from "./utils/languageUtils";

interface CodingProblemLayoutProps {
  courseId: number;
  contentId: number;
  problemData: any;
  onComplete?: () => void;
  marks?: number;
  obtainedMarks?: number | null;
  allowResize?: boolean; // Flag to enable/disable resizing (default: true)
}

export function CodingProblemLayout({
  courseId,
  contentId,
  problemData,
  onComplete,
  marks,
  obtainedMarks,
  allowResize = true,
}: CodingProblemLayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showToast } = useToast();

  // Get available languages from problem data
  const availableLanguages = getAvailableLanguages(
    problemData?.details?.template_code
  );

  // State
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState<number>(0); // Mobile tabs
  const [leftTab, setLeftTab] = useState<number>(0); // Desktop left panel tabs
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [runningCustomInput, setRunningCustomInput] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [completionStats, setCompletionStats] = useState<any>(null);
  const lastFetchedSubmissionsIdRef = useRef<number | null>(null);

  // Comments state
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Resizable panel states - Load from localStorage
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    if (allowResize && typeof window !== "undefined") {
      const saved = localStorage.getItem("coding_leftPanelWidth");
      return saved ? parseInt(saved) : 450;
    }
    return 450;
  });
  const [editorHeight, setEditorHeight] = useState(() => {
    if (allowResize && typeof window !== "undefined") {
      const saved = localStorage.getItem("coding_editorHeight");
      return saved ? parseInt(saved) : 60;
    }
    return 60;
  });

  // Local storage key for this specific problem
  const getStorageKey = (lang: string) =>
    `coding_problem_${courseId}_${contentId}_${lang}`;

  // Save panel sizes to localStorage whenever they change
  useEffect(() => {
    if (allowResize && leftPanelWidth !== 450) {
      localStorage.setItem("coding_leftPanelWidth", leftPanelWidth.toString());
    }
  }, [leftPanelWidth, allowResize]);

  useEffect(() => {
    if (allowResize && editorHeight !== 60) {
      localStorage.setItem("coding_editorHeight", editorHeight.toString());
    }
  }, [editorHeight, allowResize]);

  // Horizontal resize handler (left panel width)
  const handleHorizontalResize = (e: React.MouseEvent) => {
    if (!allowResize) return; // Don't allow resizing if disabled

    e.preventDefault();
    const startX = e.clientX;
    const startWidth = leftPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(300, Math.min(800, startWidth + delta));
      setLeftPanelWidth(newWidth);
      // Save immediately during resize
      localStorage.setItem("coding_leftPanelWidth", newWidth.toString());
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Vertical resize handler (editor height)
  const handleVerticalResize = (e: React.MouseEvent) => {
    if (!allowResize) return; // Don't allow resizing if disabled

    e.preventDefault();
    const container = e.currentTarget.parentElement;
    if (!container) return;

    const startY = e.clientY;
    const startHeight = editorHeight;
    const containerRect = container.getBoundingClientRect();

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientY - startY;
      const deltaPercent = (delta / containerRect.height) * 100;
      const newHeight = Math.max(30, Math.min(70, startHeight + deltaPercent));
      setEditorHeight(newHeight);
      // Save immediately during resize
      localStorage.setItem("coding_editorHeight", newHeight.toString());
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Initialize default language
  useEffect(() => {
    if (availableLanguages.length > 0 && !selectedLanguage) {
      const pythonLang = availableLanguages.find(
        (l) => l.value === "python3" || l.value === "python"
      );
      setSelectedLanguage(pythonLang?.value || availableLanguages[0].value);
    }
  }, [availableLanguages, selectedLanguage]);

  // Initialize code with template_code or from local storage
  useEffect(() => {
    if (selectedLanguage && problemData) {
      // Try to load from local storage first
      const storageKey = getStorageKey(selectedLanguage);
      const savedCode = localStorage.getItem(storageKey);

      if (savedCode) {
        setCode(savedCode);
        return;
      }

      // Load template code
      if (problemData?.details?.template_code?.[selectedLanguage]) {
        setCode(problemData.details.template_code[selectedLanguage]);
      } else if (problemData?.details?.starter_code) {
        setCode(problemData.details.starter_code);
      }
    }
  }, [problemData, selectedLanguage]);

  // Debounce timer for saving code to localStorage
  const saveDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const codeRef = useRef(code);

  // Update code ref
  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  // Save code to local storage with debouncing to avoid lag
  useEffect(() => {
    if (selectedLanguage && code) {
      // Clear existing timer
      if (saveDebounceTimerRef.current) {
        clearTimeout(saveDebounceTimerRef.current);
      }

      // Debounce for 1500ms to ensure smooth typing (increased from 1000ms)
      saveDebounceTimerRef.current = setTimeout(() => {
        const storageKey = getStorageKey(selectedLanguage);
        localStorage.setItem(storageKey, codeRef.current);
      }, 1500);
    }

    // Cleanup timer on unmount
    return () => {
      if (saveDebounceTimerRef.current) {
        clearTimeout(saveDebounceTimerRef.current);
      }
    };
  }, [code, selectedLanguage]);

  // Load previous submissions
  const loadSubmissions = async () => {
    try {
      setLoadingSubmissions(true);
      const data = await coursesService.getCodingSubmissions(
        courseId,
        contentId
      );
      setSubmissions(data);
    } catch (error) {
      // Error loading submissions
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (lastFetchedSubmissionsIdRef.current !== contentId) {
      lastFetchedSubmissionsIdRef.current = contentId;
      loadSubmissions();
      loadComments();
    }
  }, [courseId, contentId]);

  // Load comments
  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const data = await coursesService.getComments(courseId, contentId);
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      // Error loading comments - silently fail
    } finally {
      setLoadingComments(false);
    }
  };

  // Handle submit comment
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await coursesService.addComment(courseId, contentId, newComment.trim());
      setNewComment("");
      loadComments(); // Reload comments after posting
      showToast("Comment posted successfully", "success");
    } catch (error: any) {
      showToast(
        error?.response?.data?.message || "Failed to post comment",
        "error"
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle language change
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    setCanSubmit(false);
    setTestResults(null);

    // Try to load from local storage first
    const storageKey = getStorageKey(language);
    const savedCode = localStorage.getItem(storageKey);

    if (savedCode) {
      setCode(savedCode);
      return;
    }

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
      const result = await coursesService.runCode(
        courseId,
        contentId,
        code,
        languageId
      );
      setTestResults(result);

      // Check if all tests passed (handle both array and object responses)
      let testCases: any[] = [];
      let hasError = false;

      if (Array.isArray(result)) {
        testCases = result;
      } else if (result.results && Array.isArray(result.results)) {
        testCases = result.results;
      } else if (result.test_cases) {
        testCases = result.test_cases;
      } else if (result.stderr || result.compile_output) {
        // Single error object
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

      if (isMobile) {
        setActiveTab(2);
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
      const result = await coursesService.submitCode(
        courseId,
        contentId,
        code,
        languageId
      );
      setTestResults(result);

      if (isMobile) {
        setActiveTab(2);
      }

      // Check if all tests passed (handle both array and object responses)
      let testCases: any[] = [];
      let hasError = false;

      if (Array.isArray(result)) {
        testCases = result;
      } else if (result.results && Array.isArray(result.results)) {
        testCases = result.results;
      } else if (result.total_test_cases) {
        testCases = result.total_test_cases;
      } else if (result.stderr || result.compile_output) {
        // Single error object
        hasError = true;
        testCases = [result];
      }

      const allPassed = result.passed === result.total_test_cases;
      if (allPassed || result.all_passed || result.status === "Accepted") {
        // Extract time and memory from result
        const time = parseFloat(result.time || result.execution_time || "0");
        const memory = parseInt(result.memory || result.memory_used || "0");

        // Show completion dialog with stats
        setCompletionStats({
          passed: result.passed,
          total_test_cases: result.total_test_cases,
          timeUsed: time > 0 ? `${time.toFixed(3)}s` : undefined,
          memoryUsed:
            memory > 0 ? `${(memory / 1024).toFixed(2)} MB` : undefined,
          score: obtainedMarks || marks,
          maxScore: marks,
        });
        setShowCompletionDialog(true);

        // Load submissions in background
        loadSubmissions();
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

    // Clear from local storage
    const storageKey = getStorageKey(selectedLanguage);
    localStorage.removeItem(storageKey);

    if (problemData?.details?.template_code?.[selectedLanguage]) {
      setCode(problemData.details.template_code[selectedLanguage]);
    } else if (problemData?.details?.starter_code) {
      setCode(problemData.details.starter_code);
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
      setRunningCustomInput(true);
      const languageId = getLanguageId(selectedLanguage);

      // Use the runCode endpoint with custom input
      const result = await coursesService.runCode(
        courseId,
        contentId,
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
    } finally {
      setRunningCustomInput(false);
    }
  };

  // Mobile Layout (Tabs)
  if (isMobile) {
    return (
      <>
        <CompletionDialog
          open={showCompletionDialog}
          onClose={() => {
            setShowCompletionDialog(false);
            onComplete?.();
          }}
          contentType="CodingProblem"
          contentTitle={problemData?.problem_title || "Coding Problem"}
          stats={completionStats}
        />
        <Box
          sx={{
            height: "calc(100vh - 150px)",
            minHeight: "400px",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#ffffff",
              minHeight: 42,
              "& .MuiTab-root": {
                minHeight: 42,
                fontSize: "0.875rem",
              },
            }}
          >
            <Tab label="Problem" />
            <Tab label="Code" />
            <Tab label="Test Cases" />
            <Tab label="Submissions" />
            <Tab label="Comments" />
          </Tabs>

          <Box sx={{ flex: 1, overflow: "hidden", backgroundColor: "#ffffff" }}>
            {activeTab === 0 && (
              <ProblemDescription
                problemData={problemData}
                marks={marks}
                obtainedMarks={obtainedMarks}
              />
            )}
            {activeTab === 1 && (
              <CodeEditorPanel
                code={code}
                selectedLanguage={selectedLanguage}
                availableLanguages={availableLanguages}
                running={running}
                submitting={submitting}
                canSubmit={canSubmit}
                onCodeChange={(newCode) => {
                  // Update immediately for responsive UI
                  setCode(newCode);
                }}
                onLanguageChange={handleLanguageChange}
                onReset={handleReset}
                onRun={handleRunCode}
                onSubmit={handleSubmitCode}
              />
            )}
            {activeTab === 2 && (
              <TestResults
                testResults={testResults}
                problemData={problemData}
                onRunCustomInput={handleRunCustomInput}
                runningCustomInput={runningCustomInput}
              />
            )}
            {activeTab === 3 && (
              <Submissions
                submissions={submissions}
                loading={loadingSubmissions}
              />
            )}
            {activeTab === 4 && (
              <CodingProblemComments
                comments={comments}
                newComment={newComment}
                submittingComment={submittingComment}
                loading={loadingComments}
                onCommentChange={setNewComment}
                onSubmitComment={handleSubmitComment}
              />
            )}
          </Box>
        </Box>
      </>
    );
  }

  // Desktop Layout (Split Panels)
  return (
    <>
      <CompletionDialog
        open={showCompletionDialog}
        onClose={() => {
          setShowCompletionDialog(false);
          onComplete?.();
        }}
        contentType="CodingProblem"
        contentTitle={problemData?.problem_title || "Coding Problem"}
        stats={completionStats}
      />
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
        {/* Left Panel */}
        <Paper
          elevation={0}
          sx={{
            width: `${leftPanelWidth}px`,
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
          <Tabs
            value={leftTab}
            onChange={(_, newValue) => setLeftTab(newValue)}
            sx={{
              borderBottom: "1px solid #e5e7eb",
              minHeight: 42,
              flexShrink: 0,
              "& .MuiTab-root": {
                minHeight: 42,
                fontSize: "0.875rem",
                fontWeight: 600,
                textTransform: "none",
              },
            }}
          >
            <Tab label="Description" />
            <Tab label="Submissions" />
            <Tab label="Comments" />
          </Tabs>
          <Box
            sx={{
              flex: 1,
              overflow: "hidden",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {leftTab === 0 && (
              <ProblemDescription
                problemData={problemData}
                marks={marks}
                obtainedMarks={obtainedMarks}
              />
            )}
            {leftTab === 1 && (
              <Submissions
                submissions={submissions}
                loading={loadingSubmissions}
              />
            )}
            {leftTab === 2 && (
              <CodingProblemComments
                comments={comments}
                newComment={newComment}
                submittingComment={submittingComment}
                loading={loadingComments}
                onCommentChange={setNewComment}
                onSubmitComment={handleSubmitComment}
              />
            )}
          </Box>
        </Paper>

        {/* Horizontal Resize Handle - Only show if resizing is allowed */}
        {allowResize && (
          <Box
            onMouseDown={handleHorizontalResize}
            sx={{
              width: "6px",
              height: "100%",
              cursor: "col-resize",
              backgroundColor: "#e5e7eb",
              flexShrink: 0,
              transition: "all 0.2s",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "&:hover": {
                backgroundColor: "#6366f1",
                width: "8px",
              },
              "&:active": {
                backgroundColor: "#4f46e5",
              },
              "&::before": {
                content: '""',
                position: "absolute",
                width: "2px",
                height: "40px",
                backgroundColor: "#9ca3af",
                borderRadius: "2px",
                opacity: 0.5,
              },
              "&:hover::before": {
                backgroundColor: "#ffffff",
                opacity: 0.8,
              },
            }}
          />
        )}

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
              height: `${editorHeight}%`,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <CodeEditorPanel
              code={code}
              selectedLanguage={selectedLanguage}
              availableLanguages={availableLanguages}
              running={running}
              submitting={submitting}
              canSubmit={canSubmit}
              onCodeChange={(newCode) => {
                // Update immediately for responsive UI
                setCode(newCode);
              }}
              onLanguageChange={handleLanguageChange}
              onReset={handleReset}
              onRun={handleRunCode}
              onSubmit={handleSubmitCode}
            />
          </Box>

          {/* Vertical Resize Handle - Only show if resizing is allowed */}
          {allowResize && (
            <Box
              onMouseDown={handleVerticalResize}
              sx={{
                height: "6px",
                width: "100%",
                cursor: "row-resize",
                backgroundColor: "#e5e7eb",
                flexShrink: 0,
                transition: "all 0.2s",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                  backgroundColor: "#6366f1",
                  height: "8px",
                },
                "&:active": {
                  backgroundColor: "#4f46e5",
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  height: "2px",
                  width: "40px",
                  backgroundColor: "#9ca3af",
                  borderRadius: "2px",
                  opacity: 0.5,
                },
                "&:hover::before": {
                  backgroundColor: "#ffffff",
                  opacity: 0.8,
                },
              }}
            />
          )}

          {/* Test Cases */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              backgroundColor: "#fafafa",
            }}
          >
            <TestResults
              testResults={testResults}
              problemData={problemData}
              onRunCustomInput={handleRunCustomInput}
              runningCustomInput={runningCustomInput}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
}
