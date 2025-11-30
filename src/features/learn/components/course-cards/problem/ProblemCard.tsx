import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCourseContent } from "../../../../../services/enrolled-courses-content/courseContentApis";
import {
  runCode,
  runCustomCode,
  submitCode,
  RunCodeResult,
  CustomRunCodeResult,
  SubmitCodeResult,
} from "../../../../../services/enrolled-courses-content/submitApis";
import { LANGUAGE_ID_MAPPING } from "../../../../../services/enrolled-courses-content/submitApis";
import AppEditor from "../../../../../commonComponents/editor/AppEditor";
import descriptionIcon from "../../../../../commonComponents/icons/enrolled-courses/problem/descriptionIcon.svg";
import commentsIcon from "../../../../../commonComponents/icons/enrolled-courses/problem/commentsIcon.svg";
import submissionIcon from "../../../../../commonComponents/icons/enrolled-courses/problem/submissionIcon.svg";
import "./ProblemCard.css";
import Comments from "../../../../../commonComponents/components/Comments";
import Submissions from "./components/Submissions";
import Description from "./components/Description";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ProblemData, TestCase, CustomTestCase } from "./problem.types";
import React from "react";
import { Code, Play, Moon, Sun, Maximize2, Minimize2 } from "lucide-react";
import {
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  LinearProgress,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import CancelIcon from "@mui/icons-material/Cancel";
import InfoIcon from "@mui/icons-material/Info";
import { STREAK_QUERY_KEY } from "../../../hooks/useStreakData";

interface ProblemCardProps {
  contentId: number;
  courseId: number;
  onSubmit: (code: string) => void;
  onComplete?: () => void;
  isSidebarContentOpen: boolean;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onCloseSidebar?: () => void;
}

const ProblemCard: React.FC<ProblemCardProps> = ({
  contentId,
  courseId,
  onSubmit,
  onComplete,
  isSidebarContentOpen,
  isFullScreen = false,
  onToggleFullScreen,
  onCloseSidebar,
}) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const numericClientId = Number(clientId) || 0;
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<ProblemData>({
    queryKey: ["problem", courseId, contentId],
    queryFn: () => getCourseContent(numericClientId, courseId, contentId),
    enabled: !!contentId && !!courseId,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  const [code, setCode] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem("ide-theme");
    return saved ? saved === "dark" : true;
  });
  const [, setResults] = useState<{ success: boolean; message: string } | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [activeTestCase, setActiveTestCase] = useState<number>(0);
  const [customInput, setCustomInput] = useState("");
  const [stdOut, setStdOut] = useState("");
  const [customTestCase, setCustomTestCase] = useState<CustomTestCase>({
    input: "",
  });
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    status: string;
    passed: number;
    failed: number;
    total_test_cases: number;
  } | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState("");
  const [resultStatus, setResultStatus] = useState("");
  const [consoleTab, setConsoleTab] = useState<"testcases" | "custom">(
    "testcases"
  );
  // Show editor by default only in full screen, otherwise show description
  const [showEditor, setShowEditor] = useState(() => isFullScreen);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const consoleContentRef = useRef<HTMLDivElement>(null);

  // Get available languages from template codes
  const availableLanguages = useMemo(() => {
    if (!data?.details?.template_code) return [];

    if (!Array.isArray(data.details.template_code)) {
      return Object.entries(data.details.template_code).map(
        ([language, details]) => {
          const detailsObj = details as Record<string, unknown>;
          const languageValue = language.toLowerCase().replace(/\s+/g, "");

          return {
            value: languageValue,
            label: language,
            language_id:
              typeof detailsObj.language_id === "number"
                ? detailsObj.language_id
                : 0,
            template:
              typeof detailsObj.template_code === "string"
                ? detailsObj.template_code
                : typeof detailsObj.template === "string"
                ? detailsObj.template
                : "",
          };
        }
      );
    }

    return (
      data.details.template_code.map(
        (tc: {
          language: string;
          language_id: number;
          template_code: string;
        }) => {
          const languageValue = tc.language.toLowerCase().replace(/\s+/g, "");
          return {
            value: languageValue,
            label: tc.language,
            language_id: tc.language_id,
            template: tc.template_code,
          };
        }
      ) || []
    );
  }, [data?.details?.template_code]);

  // Helper to get template string for a given normalized language
  const getTemplateForLanguage = useCallback(
    (lookupLanguage: string): string => {
      if (!data?.details?.template_code) return "";
      const lookup = lookupLanguage.toLowerCase().replace(/\s+/g, "");
      const lookupAlt =
        lookup === "cpp" ? "c++" : lookup === "c++" ? "cpp" : "";
      const isLangMatch = (lang: string) =>
        lang === lookup ||
        (lookupAlt && lang === lookupAlt) ||
        ((lang === "python" || lang === "python3") &&
          (lookup === "python" || lookup === "python3"));

      const pickFromMaybeJsonMapping = (
        maybeString: unknown
      ): string | null => {
        if (typeof maybeString !== "string") return null;
        try {
          const parsed = JSON.parse(maybeString) as Record<string, string>;
          if (parsed && typeof parsed === "object") {
            if (parsed[lookup] != null) return parsed[lookup];
            if (lookupAlt && parsed[lookupAlt] != null)
              return parsed[lookupAlt];
            if (
              (lookup === "python" || lookup === "python3") &&
              (parsed.python != null || parsed.python3 != null)
            ) {
              return parsed.python ?? parsed.python3 ?? null;
            }
          }
        } catch {
          return maybeString;
        }
        return null;
      };

      const tc = data.details.template_code as unknown;

      if (typeof tc === "string") {
        const picked = pickFromMaybeJsonMapping(tc);
        return picked ?? "";
      }

      if (Array.isArray(tc)) {
        const entry = tc.find((t: any) => {
          const lang = String(t?.language ?? "")
            .toLowerCase()
            .replace(/\s+/g, "");
          return isLangMatch(lang);
        });
        if (!entry) return "";
        const fromMapping = pickFromMaybeJsonMapping(entry.template_code);
        if (fromMapping != null) return fromMapping;
        if (typeof entry.template_code === "string") return entry.template_code;
        return "";
      }

      for (const [language, details] of Object.entries(
        tc as Record<string, unknown>
      )) {
        const lang = language.toLowerCase().replace(/\s+/g, "");
        if (!isLangMatch(lang)) continue;
        const jsonPick = pickFromMaybeJsonMapping(details as any);
        if (jsonPick != null) return jsonPick;
        if (typeof details === "string") return details;
        const detailsObj = details as Record<string, unknown>;
        const fromNestedMapping = pickFromMaybeJsonMapping(
          detailsObj?.template_code as any
        );
        if (fromNestedMapping != null) return fromNestedMapping;
        if (typeof detailsObj?.template_code === "string")
          return detailsObj.template_code as string;
        if (typeof detailsObj?.template === "string")
          return detailsObj.template as string;
        return "";
      }

      return "";
    },
    [data?.details?.template_code]
  );

  // Initialize language and code ONCE when data loads
  useEffect(() => {
    if (data?.details?.template_code && !isInitialized) {
      // First, check localStorage for saved language preference
      const languageStorageKey = `problem-language-${courseId}-${contentId}`;
      const savedLanguage = localStorage.getItem(languageStorageKey);

      let defaultLanguage;

      // If we have a saved language, try to use it
      if (savedLanguage) {
        // Verify the saved language is still available
        const normalizedSaved = savedLanguage.toLowerCase().replace(/\s+/g, "");
        const isAvailable = availableLanguages.some(
          (lang) => lang.value === normalizedSaved
        );
        if (isAvailable) {
          defaultLanguage = normalizedSaved;
        }
      }

      // If no saved language or saved language not available, use API default or first available
      if (!defaultLanguage) {
        const apiDefault =
          (data as any)?.details?.default_language &&
          String((data as any).details.default_language)
            .toLowerCase()
            .replace(/\s+/g, "");

        if (apiDefault) {
          defaultLanguage = apiDefault;
        } else {
          if (Array.isArray(data.details.template_code)) {
            defaultLanguage = data.details.template_code[0]?.language
              .toLowerCase()
              .replace(/\s+/g, "");
          } else {
            defaultLanguage = Object.keys(data.details.template_code)[0]
              ?.toLowerCase()
              .replace(/\s+/g, "");
          }
        }
      }

      const normalizedLanguage =
        defaultLanguage === "python3" ? "python3" : defaultLanguage || "";
      const tpl = getTemplateForLanguage(normalizedLanguage);

      if (normalizedLanguage && tpl) {
        setSelectedLanguage(normalizedLanguage);
        // Save language preference
        localStorage.setItem(languageStorageKey, normalizedLanguage);

        // Check localStorage for saved code in this language
        const storageKey = `problem-code-${courseId}-${contentId}-${normalizedLanguage}`;
        const savedCode = localStorage.getItem(storageKey);

        // Use saved code if available, otherwise use template
        setCode(savedCode || tpl);
        setIsInitialized(true);
      }
    }
  }, [
    data,
    isInitialized,
    getTemplateForLanguage,
    courseId,
    contentId,
    availableLanguages,
  ]);

  // Initialize test cases when data is loaded
  useEffect(() => {
    if (data?.details?.test_cases) {
      const formattedTestCases = data.details.test_cases.map(
        (
          tc: { input: string; output?: string; expected_output?: string },
          index
        ) => {
          const testCase: TestCase = {
            test_case: index + 1,
            sample_input: tc.input,
            sample_output:
              tc.output !== undefined ? tc.output : tc.expected_output ?? "",
            status: undefined,
            userOutput: undefined,
            time: undefined,
            memory: undefined,
            input: tc.input,
            expected_output:
              tc.output !== undefined ? tc.output : tc.expected_output ?? "",
          };
          return testCase;
        }
      );
      setTestCases(formattedTestCases);
    }
  }, [data]);

  // Update error message when active test case changes
  useEffect(() => {
    // Don't update if we're submitting (submit handler will set its own message)
    if (isSubmitting) return;

    if (testCases.length > 0 && testCases[activeTestCase]) {
      const currentCase = testCases[activeTestCase];

      // Build error message for the active test case
      const buildTestCaseErrorMessage = (tc: TestCase, index: number) => {
        const caseNum = tc.test_case || index + 1;
        const parts: string[] = [];

        parts.push(
          `━━━ Test Case ${caseNum}: ${
            tc.verdict || tc.status || "Pending"
          } ━━━`
        );

        // Show input/output comparison
        if (tc.sample_input) {
          parts.push(`\nInput: ${tc.sample_input}`);
        }
        if (tc.sample_output) {
          parts.push(`Expected Output: ${tc.sample_output}`);
        }
        if (tc.userOutput !== undefined) {
          parts.push(`Your Output: ${tc.userOutput || "(empty)"}`);
        }

        // Show error details
        if (tc.stderr) {
          parts.push(`\n❌ Error (stderr):\n${tc.stderr}`);
        }

        if (tc.compile_output) {
          parts.push(`\n⚠️ Compile Output:\n${tc.compile_output}`);
        }

        // Show time and memory if available
        if (tc.time) {
          parts.push(`\n⏱️ Time: ${tc.time}s | Memory: ${tc.memory || 0} KB`);
        }

        return parts.join("\n");
      };

      if (currentCase.status === "passed") {
        setShowResults("✓ Test case passed!");
        setResultStatus("S");
      } else if (currentCase.status === "failed") {
        setShowResults(buildTestCaseErrorMessage(currentCase, activeTestCase));
        setResultStatus("F");
      } else if (currentCase.status === "running") {
        setShowResults("⟳ Running test case...");
        setResultStatus("");
      } else {
        // No status yet, clear results
        setShowResults("");
        setResultStatus("");
      }
    }
  }, [activeTestCase, testCases, isSubmitting]);

  // Clear all errors when switching between Test Cases and Custom Input tabs
  useEffect(() => {
    setShowResults("");
    setResultStatus("");
    // Clear test case execution results but keep original test case data
    setTestCases((prev) =>
      prev.map((tc) => ({
        ...tc,
        stderr: undefined,
        compile_output: undefined,
        userOutput: undefined,
        status: undefined,
        time: undefined,
        memory: undefined,
        verdict: undefined,
      }))
    );
    // Clear custom test case errors
    setCustomTestCase({
      input: customInput, // Keep the input value
      output: undefined,
      status: undefined,
      time: undefined,
      memory: undefined,
      stderr: undefined,
      compile_output: undefined,
      verdict: undefined,
    });
    setStdOut("");
  }, [consoleTab, customInput]);

  // Auto-scroll console content to bottom when content changes
  useEffect(() => {
    if (consoleContentRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        if (consoleContentRef.current) {
          consoleContentRef.current.scrollTop =
            consoleContentRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [testCases, customTestCase, showResults, stdOut, activeTestCase]);

  // Scroll to top when switching tabs
  useEffect(() => {
    if (consoleContentRef.current) {
      consoleContentRef.current.scrollTop = 0;
    }
  }, [consoleTab]);

  const getSelectedLanguageId = () => {
    if (!selectedLanguage) return 0;
    const normalized =
      selectedLanguage === "python3"
        ? "python"
        : selectedLanguage === "c++"
        ? "cpp"
        : selectedLanguage;
    return (LANGUAGE_ID_MAPPING as Record<string, number>)[normalized] ?? 0;
  };

  // Check if all test cases have passed
  const allTestCasesPassed = useMemo(() => {
    if (testCases.length === 0) return false;
    // Check if any test case has been run and has a status
    const hasRunTests = testCases.some((tc) => tc.status !== undefined);
    if (!hasRunTests) return false;
    // Check if all test cases have passed
    return testCases.every((tc) => tc.status === "passed");
  }, [testCases]);

  // Helper function to format test case values for 2-line display
  const formatTestCaseValue = useCallback(
    (value: string | undefined): string => {
      if (!value) return "";

      const trimmed = value.trim();

      // Check if value already has exactly 2 lines (one newline)
      const lines = trimmed.split("\n");
      if (lines.length === 2) {
        // If it's exactly 2 lines, return as is with proper formatting
        return lines.join("\n");
      }

      // Check if value can be split into 2 meaningful parts
      // Look for space-separated values that could be displayed on 2 lines
      const spaceIndex = trimmed.indexOf(" ");
      if (spaceIndex > 0 && spaceIndex < trimmed.length - 1) {
        // Split by spaces and check if we have exactly 2 parts
        const parts = trimmed.split(/\s+/).filter((p) => p.length > 0);
        if (parts.length === 2) {
          // Display on 2 lines
          return parts.join("\n");
        }
      }

      // Otherwise return as is
      return trimmed;
    },
    []
  );

  // Run code mutation
  const runCodeMutation = useMutation({
    mutationFn: () => {
      return runCode(
        numericClientId,
        courseId,
        contentId,
        code,
        getSelectedLanguageId()
      );
    },
    onSuccess: (data: RunCodeResult) => {
      const updatedTestCases = data.results.map((result) => ({
        test_case: result.test_case,
        sample_input: result.input,
        sample_output: result.expected_output,
        userOutput: result.actual_output,
        status: result.status === "Accepted" ? "passed" : "failed",
        time: result.time,
        memory: result.memory,
        stderr: result.stderr,
        compile_output: result.compile_output,
        verdict: result.verdict,
      })) as TestCase[];

      setTestCases(updatedTestCases);

      const success = updatedTestCases.every((tc) => tc.status === "passed");

      // The useEffect will handle updating showResults based on activeTestCase
      // Just set the overall results here
      setResults({
        success,
        message: success
          ? "All test cases passed!"
          : `${
              updatedTestCases.filter((tc) => tc.status === "failed").length
            } test case(s) failed`,
      });

      // If all passed, show success message
      if (success) {
        setShowResults("All test cases passed!");
        setResultStatus("S");
      }
      // Otherwise, the useEffect will update showResults based on activeTestCase

      setIsRunning(false);
    },
    onError: () => {
      setResults({
        success: false,
        message: "Error running code. Please try again.",
      });
      setResultStatus("F");
      setShowResults("Error running code. Please try again.");
      setIsRunning(false);
    },
  });

  // Run custom code mutation
  const runCustomCodeMutation = useMutation({
    mutationFn: (input: string) => {
      return runCustomCode(
        numericClientId,
        courseId,
        contentId,
        code,
        getSelectedLanguageId(),
        input
      );
    },
    onSuccess: (data: CustomRunCodeResult) => {
      setStdOut(data.actual_output);
      setResultStatus(data.status === "Accepted" ? "S" : "F");

      setCustomTestCase({
        input: data.input,
        output: data.actual_output,
        status: data.status === "Accepted" ? "passed" : "failed",
        time: data.time,
        memory: data.memory,
        stderr: data.stderr,
        compile_output: data.compile_output,
        verdict: data.status,
      });

      // Build detailed error message with creative messages
      let errorMessage = "";
      if (data.status === "Accepted") {
        errorMessage = "✓ Correct - Code executed successfully!";
        setResultStatus("S");
      } else {
        // Check if it's a syntax/compilation error
        const isSyntaxError =
          data.stderr?.toLowerCase().includes("syntax") ||
          data.stderr?.toLowerCase().includes("indentation") ||
          data.stderr?.toLowerCase().includes("compile") ||
          data.compile_output !== null ||
          data.status?.toLowerCase().includes("compilation") ||
          data.status?.toLowerCase().includes("compile");

        if (isSyntaxError) {
          errorMessage = "✗ Syntax Error";
          if (data.stderr) {
            errorMessage += `\n\n${data.stderr}`;
          } else if (data.compile_output) {
            errorMessage += `\n\n${data.compile_output}`;
          } else {
            errorMessage += `\n\n${data.status}`;
          }
          setResultStatus("F");
        } else {
          // Runtime or other errors
          const statusLower = data.status?.toLowerCase() || "";
          if (
            statusLower.includes("time limit") ||
            statusLower.includes("tle")
          ) {
            errorMessage = "⏱️ Time Limit Exceeded";
            if (data.stderr) {
              errorMessage += `\n\n${data.stderr}`;
            }
          } else if (
            statusLower.includes("memory") ||
            statusLower.includes("mle")
          ) {
            errorMessage = "💾 Memory Limit Exceeded";
            if (data.stderr) {
              errorMessage += `\n\n${data.stderr}`;
            }
          } else if (statusLower.includes("runtime")) {
            errorMessage = `✗ Runtime Error: ${data.status}`;
            if (data.stderr) {
              errorMessage += `\n\n${data.stderr}`;
            }
          } else {
            errorMessage = `✗ ${data.status}`;
            if (data.stderr) {
              errorMessage += `\n\n${data.stderr}`;
            }
          }
          setResultStatus("F");
        }
      }

      setShowResults(errorMessage);
      setIsRunning(false);
    },
    onError: () => {
      setStdOut("Error running code");
      setResultStatus("F");
      setShowResults("Error running code");
      setIsRunning(false);
    },
  });

  // Submit code mutation
  const submitCodeMutation = useMutation({
    mutationFn: () => {
      return submitCode(
        numericClientId,
        courseId,
        contentId,
        code,
        getSelectedLanguageId()
      );
    },
    onSuccess: async (data: SubmitCodeResult) => {
      const success = data.status === "Accepted";
      setResults({
        success,
        message: success
          ? `Solution accepted! Passed ${data.passed}/${data.total_test_cases} test cases.`
          : `Failed ${data.failed}/${data.total_test_cases} test cases.`,
      });

      onSubmit(code);

      if (success && onComplete) {
        onComplete();
        setIsSubmitSuccess(true);

        await queryClient.invalidateQueries({
          queryKey: [STREAK_QUERY_KEY, numericClientId],
        });
      } else {
        if (onComplete) {
          onComplete();
        }
        setSubmitResult({
          status: data.status,
          passed: data.passed,
          failed: data.failed,
          total_test_cases: data.total_test_cases,
        });
      }

      setIsSubmitting(false);
      setIsRunning(false);
    },
    onError: () => {
      setResults({
        success: false,
        message: "Error submitting code. Please try again.",
      });
      setIsSubmitting(false);
      setIsRunning(false);
    },
  });

  // Timer for submit cooldown
  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft(timeLeft - 1);
        localStorage.setItem("timeLeft", JSON.stringify(timeLeft - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Check for existing cooldown on mount
  useEffect(() => {
    if (localStorage.getItem("buttonDisabled")) {
      const timeLeftOnRefresh =
        JSON.parse(localStorage?.getItem("timeLeft") as any) -
        Math.floor(
          (Date.now() - JSON.parse(localStorage?.getItem("timestamp") as any)) /
            1000
        );

      if (timeLeftOnRefresh > 0) {
        setDisabled(true);
        setTimeLeft(timeLeftOnRefresh);
        setTimeout(() => {
          setDisabled(false);
          setTimeLeft(0);
          localStorage.removeItem("buttonDisabled");
          localStorage.removeItem("timeLeft");
        }, timeLeftOnRefresh * 1000);
      } else {
        localStorage.removeItem("buttonDisabled");
        localStorage.removeItem("timeLeft");
      }
    }
  }, []);

  // Update showEditor when full screen or sidebar changes - MUST be before any early returns
  useEffect(() => {
    if (isFullScreen) {
      setShowEditor(true); // Always show editor in full screen
    } else if (!isSidebarContentOpen) {
      setShowEditor(true); // When sidebar is closed, show editor (question on left, code on right)
    } else {
      setShowEditor(false); // When sidebar is open, show description by default
    }
  }, [isFullScreen, isSidebarContentOpen]);

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse space-y-4 w-full max-w-4xl p-6">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-white rounded-lg shadow-lg">
        Error loading problem. Please try again later.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-gray-500 p-4 bg-white rounded-lg shadow-lg">
        No problem data available.
      </div>
    );
  }

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      // Save to localStorage whenever code changes
      if (selectedLanguage && isInitialized) {
        const storageKey = `problem-code-${courseId}-${contentId}-${selectedLanguage}`;
        localStorage.setItem(storageKey, value);
      }
    }
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setResults(null);
    setShowResults("");
    setResultStatus("");

    setTestCases(
      testCases.map((tc) => ({
        ...tc,
        status: "running",
      }))
    );

    if (consoleTab === "testcases") {
      runCodeMutation.mutate();
    } else {
      handleCustomRunCode();
    }
  };

  const handleCustomRunCode = () => {
    if (!customInput.trim()) {
      setIsRunning(false);
      setResults({
        success: false,
        message: "Please provide custom input",
      });
      setResultStatus("F");
      setShowResults("Please provide custom input");
      return;
    }

    setIsRunning(true);
    setResults(null);

    runCustomCodeMutation.mutate(customInput);
  };

  const handleSubmitCode = async () => {
    const tenSeconds = 10;

    setDisabled(true);
    setTimeLeft(tenSeconds);
    localStorage.setItem("buttonDisabled", "true");
    localStorage.setItem("timeLeft", tenSeconds.toString());
    localStorage.setItem("timestamp", Date.now().toString());

    setIsSubmitting(true);
    setResults(null);
    setIsRunning(true);

    try {
      const runResult = await runCodeMutation.mutateAsync();

      const allTestsPassed = runResult.results.every(
        (result) => result.status === "Accepted"
      );

      if (allTestsPassed) {
        submitCodeMutation.mutate();
      } else {
        // Build detailed error message for failed test cases
        const buildSubmitErrorMessage = (results: RunCodeResult["results"]) => {
          const failedResults = results.filter(
            (result) => result.status !== "Accepted"
          );
          if (failedResults.length === 0) return "All test cases passed!";

          const errorMessages = failedResults.map((result, idx) => {
            const parts: string[] = [];
            const caseNum = result.test_case || idx + 1;
            parts.push(
              `━━━ Test Case ${caseNum}: ${result.verdict || result.status} ━━━`
            );

            // Show input/output comparison
            if (result.input) {
              parts.push(`\nInput: ${result.input}`);
            }
            if (result.expected_output) {
              parts.push(`Expected Output: ${result.expected_output}`);
            }
            if (result.actual_output !== undefined) {
              parts.push(`Your Output: ${result.actual_output || "(empty)"}`);
            }

            // Show error details
            if (result.stderr) {
              parts.push(`\n❌ Error (stderr):\n${result.stderr}`);
            }

            if (result.compile_output) {
              parts.push(`\n⚠️ Compile Output:\n${result.compile_output}`);
            }

            // Show time and memory if available
            if (result.time) {
              parts.push(
                `\n⏱️ Time: ${result.time}s | Memory: ${result.memory || 0} KB`
              );
            }

            return parts.join("\n");
          });

          return `❌ Please fix the failing test cases before submitting:\n${errorMessages.join(
            "\n\n"
          )}`;
        };

        const errorMessage = buildSubmitErrorMessage(runResult.results);

        // Test cases are already updated by runCodeMutation.onSuccess
        // Set error message (useEffect is prevented from running when isSubmitting is true)
        setResults({
          success: false,
          message: errorMessage,
        });
        setResultStatus("F");
        setShowResults(errorMessage);
        setIsSubmitting(false);
        setIsRunning(false);
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || "Error running code. Please try again.";
      setResults({
        success: false,
        message: errorMessage,
      });
      setResultStatus("F");
      setShowResults(`❌ ${errorMessage}`);
      setIsSubmitting(false);
      setIsRunning(false);
    }

    setTimeout(() => {
      setDisabled(false);
      setTimeLeft(0);
      localStorage.removeItem("buttonDisabled");
      localStorage.removeItem("timeLeft");
      localStorage.removeItem("timestamp");
    }, 10000);
  };

  const handleThemeChange = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    localStorage.setItem("ide-theme", newTheme ? "dark" : "light");
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);

    const normalized =
      selectedLanguage === "python3"
        ? "python"
        : selectedLanguage === "c++"
        ? "cpp"
        : selectedLanguage || "javascript";

    try {
      monaco.editor.setTheme(isDarkTheme ? "vs-dark" : "light");
      const model = editor.getModel?.();
      if (model && normalized) {
        monaco.editor.setModelLanguage(model, normalized);
      }
    } catch (error) {
      // Error in editor mount
    }
  };

  const handleLanguageChange = (newLang: string) => {
    // Save current code before switching languages
    if (selectedLanguage && code && isInitialized) {
      const currentStorageKey = `problem-code-${courseId}-${contentId}-${selectedLanguage}`;
      localStorage.setItem(currentStorageKey, code);
    }

    setSelectedLanguage(newLang);
    // Save language preference
    const languageStorageKey = `problem-language-${courseId}-${contentId}`;
    localStorage.setItem(languageStorageKey, newLang);

    const tpl = getTemplateForLanguage(newLang);
    if (tpl) {
      // Check localStorage for saved code in new language
      const newStorageKey = `problem-code-${courseId}-${contentId}-${newLang}`;
      const savedCode = localStorage.getItem(newStorageKey);

      // Use saved code if available, otherwise use template
      setCode(savedCode || tpl);

      if (isEditorReady && editorRef.current && monacoRef.current) {
        const normalized =
          newLang === "python3"
            ? "python"
            : newLang === "c++"
            ? "cpp"
            : newLang || "javascript";
        try {
          const model = editorRef.current.getModel?.();
          if (model) {
            monacoRef.current.editor.setModelLanguage(model, normalized);
          }
        } catch (error) {
          // Error updating language
        }
      }
    }
  };

  const shouldRenderEditor = selectedLanguage && code && isInitialized;

  return (
    <div
      className={`overflow-hidden ${
        isFullScreen
          ? "fixed inset-0 z-50 bg-gray-900"
          : isDarkTheme
          ? "bg-gray-900"
          : "bg-gray-50"
      }`}
    >
      {/* Submission Result Dialog */}
      <Dialog
        open={isSubmitSuccess || (submitResult !== null && !isSubmitSuccess)}
        onClose={() => {
          setIsSubmitSuccess(false);
          setSubmitResult(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        {isSubmitSuccess ? (
          <>
            <DialogTitle sx={{ textAlign: "center", pt: 4, pb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    bgcolor: "var(--success-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TaskAltIcon
                    sx={{ fontSize: 50, color: "var(--success-500)" }}
                  />
                </Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ color: "var(--success-500)" }}
                >
                  Perfect run — Submission accepted!
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ textAlign: "center", pb: 2 }}>
              <Typography
                variant="body1"
                sx={{ color: "var(--font-secondary)" }}
                gutterBottom
              >
                Great job! Your solution has been accepted.
              </Typography>
              {submitResult && (
                <Box sx={{ mt: 3 }}>
                  <Chip
                    icon={<CheckCircleIcon />}
                    label={`${submitResult.passed}/${submitResult.total_test_cases} test cases passed`}
                    sx={{
                      borderColor: "var(--success-500)",
                      color: "var(--success-500)",
                      "& .MuiChip-icon": {
                        color: "var(--success-500)",
                      },
                    }}
                    variant="outlined"
                  />
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center", pb: 3, px: 3 }}>
              <Button
                onClick={() => {
                  setIsSubmitSuccess(false);
                  setSubmitResult(null);
                }}
                variant="contained"
                size="large"
                startIcon={<CheckCircleIcon />}
                sx={{
                  minWidth: 180,
                  bgcolor: "var(--success-500)",
                  "&:hover": {
                    bgcolor: "var(--success-500)",
                    opacity: 0.9,
                  },
                }}
              >
                Continue Learning
              </Button>
            </DialogActions>
          </>
        ) : submitResult ? (
          <>
            <DialogTitle sx={{ textAlign: "center", pt: 4, pb: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    bgcolor:
                      submitResult.passed > 0
                        ? "var(--warning-100)"
                        : "var(--error-100)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {submitResult.passed > 0 ? (
                    <InfoIcon
                      sx={{ fontSize: 50, color: "var(--warning-500)" }}
                    />
                  ) : (
                    <CancelIcon
                      sx={{ fontSize: 50, color: "var(--error-500)" }}
                    />
                  )}
                </Box>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{
                    color:
                      submitResult.passed > 0
                        ? "var(--warning-500)"
                        : "var(--error-500)",
                  }}
                >
                  {submitResult.passed > 0
                    ? "Partially Solved"
                    : "Submission Failed"}
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pb: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "var(--font-secondary)", mb: 1 }}
                  gutterBottom
                >
                  Status
                </Typography>
                <Chip
                  label={submitResult.status}
                  sx={{
                    bgcolor:
                      submitResult.passed > 0
                        ? "var(--warning-100)"
                        : "var(--error-100)",
                    color:
                      submitResult.passed > 0
                        ? "var(--warning-500)"
                        : "var(--error-500)",
                  }}
                  size="medium"
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ color: "var(--font-secondary)", mb: 1.5 }}
                  gutterBottom
                >
                  Test Cases Progress
                </Typography>
                <Box sx={{ position: "relative", mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (submitResult.passed / submitResult.total_test_cases) *
                      100
                    }
                    sx={{
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "var(--neutral-200)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 5,
                        backgroundColor:
                          submitResult.passed > 0
                            ? "var(--warning-500)"
                            : "var(--error-500)",
                      },
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  textAlign="center"
                  fontWeight={500}
                  sx={{ color: "var(--font-primary)" }}
                >
                  {submitResult.passed} of {submitResult.total_test_cases} test
                  cases passed
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  mt: 3,
                }}
              >
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`${submitResult.passed} Passed`}
                  sx={{
                    borderColor: "var(--success-500)",
                    color: "var(--success-500)",
                    "& .MuiChip-icon": {
                      color: "var(--success-500)",
                    },
                  }}
                  variant="outlined"
                  size="medium"
                />
                <Chip
                  icon={<CancelIcon />}
                  label={`${submitResult.failed} Failed`}
                  sx={{
                    borderColor: "var(--error-500)",
                    color: "var(--error-500)",
                    "& .MuiChip-icon": {
                      color: "var(--error-500)",
                    },
                  }}
                  variant="outlined"
                  size="medium"
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ justifyContent: "center", pb: 3, px: 3 }}>
              <Button
                onClick={() => {
                  setSubmitResult(null);
                }}
                variant="contained"
                size="large"
                startIcon={
                  submitResult.passed > 0 ? <InfoIcon /> : <CancelIcon />
                }
                sx={{
                  minWidth: 180,
                  bgcolor:
                    submitResult.passed > 0
                      ? "var(--warning-500)"
                      : "var(--error-500)",
                  "&:hover": {
                    bgcolor:
                      submitResult.passed > 0
                        ? "var(--warning-500)"
                        : "var(--error-500)",
                    opacity: 0.9,
                  },
                }}
              >
                Try Again
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      {/* Loading Dialog */}
      <Dialog open={isSubmitting} PaperProps={{ sx: { p: 3 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            minWidth: 200,
          }}
        >
          <CircularProgress
            size={50}
            sx={{
              color: "var(--primary-500)",
            }}
          />
          <Typography variant="body1" sx={{ color: "var(--font-primary)" }}>
            Submitting your solution...
          </Typography>
        </Box>
      </Dialog>

      <div
        className={`grid grid-cols-12 gap-3 p-3 ${
          isFullScreen ? "h-screen" : "h-screen"
        }`}
      >
        {/* Left Panel - Problem Description (shown when sidebar is closed or in full screen) */}
        {(!isSidebarContentOpen || isFullScreen) && (
          <div
            className={`col-span-12 ${
              isFullScreen ? "lg:col-span-5" : "lg:col-span-5"
            } !rounded-xl border overflow-hidden flex flex-col h-full ${
              isDarkTheme
                ? "border-gray-700 bg-gray-900"
                : "border-primary-100 bg-white"
            }`}
          >
            <div
              className={`flex flex-row text-sm border-b flex-shrink-0 ${
                isDarkTheme
                  ? "text-gray-300 border-gray-700"
                  : "text-secondary-700 border-gray-200"
              }`}
            >
              {isFullScreen && onToggleFullScreen && (
                <button
                  onClick={onToggleFullScreen}
                  className={`flex flex-row items-center gap-2 px-4 py-3 transition-all ${
                    isDarkTheme
                      ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                  title="Exit Full Screen"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              )}
              {!isFullScreen && onToggleFullScreen && (
                <button
                  onClick={onToggleFullScreen}
                  className={`flex flex-row items-center gap-2 px-4 py-3 transition-all font-semibold ${
                    isDarkTheme
                      ? "text-primary-400 hover:bg-gray-800 hover:text-primary-300"
                      : "text-primary-600 hover:bg-primary-50"
                  }`}
                  title="Expand to Full Screen"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Full Screen</span>
                </button>
              )}
              <button
                className={`flex flex-row items-center gap-2 px-4 py-3 transition-all ${
                  activeTab === "description"
                    ? `${
                        isDarkTheme
                          ? "bg-gray-800 text-white border-b-2 border-primary-400"
                          : "bg-primary-50 text-primary-700 border-b-2 border-primary-500"
                      } font-semibold`
                    : isDarkTheme
                    ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("description")}
              >
                <img
                  src={descriptionIcon}
                  className="w-4 h-4"
                  alt="Description"
                />
                Description
              </button>
              <button
                className={`flex flex-row items-center gap-2 px-4 py-3 transition-all ${
                  activeTab === "submission"
                    ? `${
                        isDarkTheme
                          ? "bg-gray-800 text-white border-b-2 border-primary-400"
                          : "bg-primary-50 text-primary-700 border-b-2 border-primary-500"
                      } font-semibold`
                    : isDarkTheme
                    ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("submission")}
              >
                <img
                  src={submissionIcon}
                  className={`w-4 h-4 ${
                    isDarkTheme ? "brightness-0 invert opacity-90" : ""
                  }`}
                  alt="Submissions"
                />
                Submissions
              </button>
              <button
                className={`flex flex-row items-center gap-2 px-4 py-3 transition-all ${
                  activeTab === "comments"
                    ? `${
                        isDarkTheme
                          ? "bg-gray-800 text-white border-b-2 border-primary-400"
                          : "bg-primary-50 text-primary-700 border-b-2 border-primary-500"
                      } font-semibold`
                    : isDarkTheme
                    ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("comments")}
              >
                <img src={commentsIcon} className="w-4 h-4" alt="Comments" />
                Comments
              </button>
            </div>

            <div
              className={`h-[calc(100%-48px)] overflow-y-auto p-4 ${
                isDarkTheme ? "bg-gray-900" : "bg-white"
              }`}
            >
              {activeTab === "description" && (
                <Description problem={data.details} isDarkTheme={isDarkTheme} />
              )}

              {activeTab === "submission" && (
                <Submissions
                  contentId={contentId}
                  courseId={courseId}
                  isDarkTheme={isDarkTheme}
                />
              )}

              {activeTab === "comments" && (
                <Comments
                  contentId={contentId}
                  courseId={courseId}
                  isDarkTheme={isDarkTheme}
                  clientId={clientId}
                />
              )}
            </div>
          </div>
        )}

        {/* Right Panel - Code Editor and Console OR Description when sidebar is open */}
        {isSidebarContentOpen && !showEditor ? (
          /* Show Description Panel when sidebar is open and editor is hidden */
          <div
            className={`col-span-12 border rounded-xl overflow-hidden flex flex-col h-full ${
              isDarkTheme
                ? "border-gray-700 bg-gray-900"
                : "border-primary-100 bg-white"
            }`}
          >
            <div
              className={`flex flex-row text-sm border-b flex-shrink-0 ${
                isDarkTheme
                  ? "text-gray-300 border-gray-700"
                  : "text-secondary-700 border-gray-200"
              }`}
            >
              {!isFullScreen && onToggleFullScreen && (
                <button
                  onClick={onToggleFullScreen}
                  className={`flex flex-row items-center gap-2 px-4 py-3 transition-all font-semibold ${
                    isDarkTheme
                      ? "text-primary-400 hover:bg-gray-800 hover:text-primary-300"
                      : "text-primary-600 hover:bg-primary-50"
                  }`}
                  title="Expand to Full Screen"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Full Screen</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowEditor(true);
                  onCloseSidebar?.(); // Close sidebar when starting to code
                }}
                className={`flex flex-row items-center gap-2 px-4 py-3 transition-all font-semibold ml-auto ${
                  isDarkTheme
                    ? "text-primary-400 hover:bg-gray-800 hover:text-primary-300"
                    : "text-primary-600 hover:bg-primary-50"
                }`}
                title="Start Coding"
              >
                <Code className="w-4 h-4" />
                <span>Start Coding</span>
              </button>
              <label
                className={`flex items-center gap-3 px-3 m-1 py-3 rounded-md cursor-pointer transition-colors h-9 ${
                  isDarkTheme
                    ? "bg-gray-700 text-white border border-gray-600 hover:bg-gray-600"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {isDarkTheme ? (
                  <Moon className="w-4 h-4" />
                ) : (
                  <Sun className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {isDarkTheme ? "Dark" : "Light"}
                </span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isDarkTheme}
                    onChange={handleThemeChange}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-5 rounded-full transition-colors ${
                      isDarkTheme ? "bg-primary-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        isDarkTheme ? "transform translate-x-5" : ""
                      }`}
                    />
                  </div>
                </div>
              </label>
            </div>
            <div
              className={`h-[calc(100%-48px)] overflow-y-auto p-4 ${
                isDarkTheme ? "bg-gray-900" : "bg-white"
              }`}
            >
              <Description problem={data.details} isDarkTheme={isDarkTheme} />
            </div>
          </div>
        ) : (
          /* Show Code Editor when sidebar is closed or when showEditor is true */
          <div
            className={`${
              isFullScreen
                ? "col-span-12 lg:col-span-7"
                : !isSidebarContentOpen
                ? "col-span-12 lg:col-span-7"
                : "col-span-12"
            } border border-primary-100 rounded-xl overflow-hidden flex flex-col h-full ${
              isDarkTheme ? "bg-gray-900" : "bg-white"
            }`}
          >
            {/* Editor Header */}
            <div
              className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 border-b ${
                isDarkTheme
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex flex-row gap-3 items-center flex-wrap">
                {!isFullScreen && (
                  <button
                    onClick={() => setShowEditor(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="Show Problem Description"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span className="hidden sm:inline">Description</span>
                  </button>
                )}
                <div
                  className={`flex items-center font-semibold hidden md:flex ${
                    isDarkTheme ? "text-white" : "text-secondary-950"
                  }`}
                >
                  <Code className="mr-2 w-4 h-4" />
                  Code
                </div>
                <FormControl
                  size="small"
                  sx={{
                    minWidth: 120,
                    height: "36px",
                    "& .MuiOutlinedInput-root": {
                      height: "36px",
                      backgroundColor: isDarkTheme ? "#374151" : "#f0f9ff",
                      color: isDarkTheme ? "#ffffff" : "#1e293b",
                      borderColor: isDarkTheme ? "#4b5563" : "#bfdbfe",
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: isDarkTheme ? "#6b7280" : "#93c5fd",
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: isDarkTheme ? "#60a5fa" : "#3b82f6",
                        borderWidth: "1px",
                      },
                      "& .MuiSelect-select": {
                        padding: "8px 14px",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                      },
                    },
                    "& .MuiSvgIcon-root": {
                      color: isDarkTheme ? "#d1d5db" : "#64748b",
                    },
                  }}
                >
                  <Select
                    value={selectedLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    displayEmpty
                    sx={{
                      height: "36px",
                      "& .MuiSelect-select": {
                        textAlign: "center",
                      },
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: isDarkTheme ? "#1f2937" : "#ffffff",
                          "& .MuiMenuItem-root": {
                            color: isDarkTheme ? "#e5e7eb" : "#1f2937",
                            textAlign: "center",
                            justifyContent: "center",
                            "&:hover": {
                              backgroundColor: isDarkTheme
                                ? "#374151"
                                : "#f3f4f6",
                            },
                            "&.Mui-selected": {
                              backgroundColor: isDarkTheme
                                ? "#4b5563"
                                : "#dbeafe",
                              color: isDarkTheme ? "#ffffff" : "#1e40af",
                              "&:hover": {
                                backgroundColor: isDarkTheme
                                  ? "#4b5563"
                                  : "#dbeafe",
                              },
                            },
                          },
                        },
                      },
                    }}
                  >
                    {availableLanguages.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Theme Toggle */}
                <label
                  className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors h-9 ${
                    isDarkTheme
                      ? "bg-gray-700 text-white border border-gray-600 hover:bg-gray-600"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {isDarkTheme ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                  <span className="text-sm">
                    {isDarkTheme ? "Dark" : "Light"}
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={isDarkTheme}
                      onChange={handleThemeChange}
                      className="sr-only"
                    />
                    <div
                      className={`w-10 h-5 rounded-full transition-colors ${
                        isDarkTheme ? "bg-primary-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          isDarkTheme ? "transform translate-x-5" : ""
                        }`}
                      />
                    </div>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  style={{
                    backgroundColor: isRunning
                      ? "#9ca3af"
                      : "var(--course-cta)",
                    color: "#ffffff",
                    cursor: isRunning ? "not-allowed" : "pointer",
                  }}
                  className="px-4 py-2 rounded-md font-semibold transition-all h-9 text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
                  onMouseEnter={(e) => {
                    if (!isRunning) {
                      e.currentTarget.style.backgroundColor =
                        "var(--course-cta)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isRunning) {
                      e.currentTarget.style.backgroundColor =
                        "var(--course-cta)";
                    }
                  }}
                >
                  <Play className="w-3 h-3" />
                  {isRunning ? "Running..." : "Run Code"}
                </button>
                {disabled ? (
                  <Tooltip title={`You can try again in ${timeLeft} seconds`}>
                    <button
                      disabled
                      style={{
                        backgroundColor: "#9ca3af",
                        color: "#ffffff",
                        cursor: "not-allowed",
                      }}
                      className="px-4 py-2 rounded-md font-semibold h-9 text-sm"
                    >
                      Submit ({timeLeft}s)
                    </button>
                  </Tooltip>
                ) : !allTestCasesPassed ? (
                  <Tooltip title="Pass all test cases to submit">
                    <span>
                      <button
                        disabled
                        style={{
                          backgroundColor: "#9ca3af",
                          color: "#ffffff",
                          cursor: "not-allowed",
                        }}
                        className="px-4 py-2 rounded-md font-semibold h-9 text-sm"
                      >
                        Submit
                      </button>
                    </span>
                  </Tooltip>
                ) : (
                  <button
                    onClick={handleSubmitCode}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: isSubmitting
                        ? "#9ca3af"
                        : "var(--primary-500)",
                      color: "#ffffff",
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                    className="px-4 py-2 rounded-md font-semibold transition-all h-9 text-sm shadow-md hover:shadow-lg"
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor =
                          "var(--primary-600)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.backgroundColor =
                          "var(--primary-500)";
                      }
                    }}
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                )}
              </div>
            </div>

            {/* Editor and Console - Vertical Layout */}
            <div className="flex flex-col h-[calc(100%-0px)] overflow-hidden">
              {/* Code Editor - Full Width Top */}
              <div
                className={`flex-1 min-h-0 flex flex-col ${
                  isDarkTheme
                    ? "border-b border-gray-700"
                    : "border-b border-gray-200"
                }`}
              >
                {shouldRenderEditor ? (
                  <div className="flex-1 min-h-0 w-full overflow-hidden">
                    <AppEditor
                      height="100%"
                      language={
                        selectedLanguage === "python3"
                          ? "python"
                          : selectedLanguage === "c++"
                          ? "cpp"
                          : selectedLanguage || "javascript"
                      }
                      value={code}
                      onChange={(v) => handleCodeChange(v)}
                      theme={isDarkTheme ? "vs-dark" : "light"}
                      disableCopyPaste={true}
                      onMount={handleEditorDidMount}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center flex-1">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                  </div>
                )}
              </div>

              {/* Console Panel - Full Width Bottom */}
              <div
                className={`flex flex-col overflow-hidden flex-1 min-h-10 ${
                  isDarkTheme ? "bg-gray-900" : "bg-white"
                }`}
              >
                {/* Console Tabs */}
                <div
                  className={`flex border-b flex-shrink-0 ${
                    isDarkTheme ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      consoleTab === "testcases"
                        ? isDarkTheme
                          ? "border-b-2 border-primary-500 text-white"
                          : "border-b-2 border-primary-500 text-primary-600"
                        : isDarkTheme
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setConsoleTab("testcases")}
                  >
                    Test Cases
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      consoleTab === "custom"
                        ? isDarkTheme
                          ? "border-b-2 border-primary-500 text-white"
                          : "border-b-2 border-primary-500 text-primary-600"
                        : isDarkTheme
                        ? "text-gray-400 hover:text-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                    onClick={() => setConsoleTab("custom")}
                  >
                    Custom Input
                  </button>
                </div>

                {/* Console Content */}
                <div
                  ref={consoleContentRef}
                  className="flex-1 overflow-y-auto p-4"
                  style={{
                    minHeight: 0,
                    maxHeight: "100%",
                    overflowY: "auto",
                    overflowX: "hidden",
                  }}
                >
                  {consoleTab === "testcases" ? (
                    <div className="space-y-3">
                      {/* Test Case Tabs */}
                      <div className="flex gap-2 flex-wrap">
                        {testCases.map((tc, index) => {
                          const hasError = tc.stderr || tc.compile_output;
                          return (
                            <button
                              key={index}
                              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                activeTestCase === index
                                  ? isDarkTheme
                                    ? "bg-gray-700 text-white"
                                    : "bg-primary-100 text-primary-700"
                                  : isDarkTheme
                                  ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              } ${
                                tc.status === "passed"
                                  ? "border-l-4 border-green-500"
                                  : tc.status === "failed" || hasError
                                  ? "border-l-4 border-red-500"
                                  : ""
                              } ${
                                hasError && tc.status === "failed"
                                  ? isDarkTheme
                                    ? "bg-red-900/20"
                                    : "bg-red-50"
                                  : ""
                              }`}
                              onClick={() => setActiveTestCase(index)}
                            >
                              Case {index + 1}
                              {hasError && (
                                <span className="ml-1 text-red-500">⚠</span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Test Case Display */}
                      {testCases[activeTestCase] && (
                        <div className="space-y-3">
                          <div>
                            <div
                              className={`text-sm font-semibold mb-2 ${
                                isDarkTheme ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Input:
                            </div>
                            <div
                              className={`p-3 rounded-md font-mono text-sm ${
                                isDarkTheme
                                  ? "bg-gray-800 text-gray-300"
                                  : "bg-gray-50 text-gray-800"
                              }`}
                              style={{ whiteSpace: "pre-wrap" }}
                            >
                              {formatTestCaseValue(
                                testCases[activeTestCase].sample_input
                              )}
                            </div>
                          </div>

                          <div>
                            <div
                              className={`text-sm font-semibold mb-2 ${
                                isDarkTheme ? "text-gray-300" : "text-gray-700"
                              }`}
                            >
                              Expected Output:
                            </div>
                            <div
                              className={`p-3 rounded-md font-mono text-sm ${
                                isDarkTheme
                                  ? "bg-gray-800 text-gray-300"
                                  : "bg-gray-50 text-gray-800"
                              }`}
                              style={{ whiteSpace: "pre-wrap" }}
                            >
                              {formatTestCaseValue(
                                testCases[activeTestCase].sample_output
                              )}
                            </div>
                          </div>

                          {testCases[activeTestCase].userOutput !==
                            undefined && (
                            <div>
                              <div
                                className={`text-sm font-semibold mb-2 ${
                                  testCases[activeTestCase].status === "passed"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                Your Output:
                              </div>
                              <div
                                className={`p-3 rounded-md font-mono text-sm ${
                                  isDarkTheme
                                    ? "bg-gray-800 text-gray-300"
                                    : "bg-gray-50 text-gray-800"
                                }`}
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {formatTestCaseValue(
                                  testCases[activeTestCase].userOutput
                                )}
                              </div>
                            </div>
                          )}

                          {testCases[activeTestCase].status && (
                            <>
                              <div
                                className={`p-3 rounded-md text-sm font-small ${
                                  testCases[activeTestCase].status === "passed"
                                    ? "bg-green-100 text-green-800"
                                    : testCases[activeTestCase].status ===
                                      "failed"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                Status:{" "}
                                {testCases[activeTestCase].verdict ||
                                  (testCases[activeTestCase].status === "passed"
                                    ? "✓ Passed"
                                    : testCases[activeTestCase].status ===
                                      "failed"
                                    ? "✗ Failed"
                                    : "⟳ Running...")}
                              </div>

                              {/* Error Display - stderr */}
                              {testCases[activeTestCase].stderr && (
                                <div>
                                  <div
                                    className={`text-sm font-semibold mb-2 text-red-600 ${
                                      isDarkTheme
                                        ? "text-red-400"
                                        : "text-red-700"
                                    }`}
                                  >
                                    Error (stderr):
                                  </div>
                                  <div
                                    className={`p-3 rounded-md font-mono text-sm text-red-600 ${
                                      isDarkTheme
                                        ? "bg-red-900/30 text-red-400 border border-red-700"
                                        : "bg-red-50 text-red-800 border border-red-200"
                                    }`}
                                    style={{ whiteSpace: "pre-wrap" }}
                                  >
                                    {testCases[activeTestCase].stderr}
                                  </div>
                                </div>
                              )}

                              {/* Compile Output Display */}
                              {testCases[activeTestCase].compile_output && (
                                <div>
                                  <div
                                    className={`text-sm font-semibold mb-2 text-orange-600 ${
                                      isDarkTheme
                                        ? "text-orange-400"
                                        : "text-orange-700"
                                    }`}
                                  >
                                    Compile Output:
                                  </div>
                                  <div
                                    className={`p-3 rounded-md font-mono text-sm text-orange-600 ${
                                      isDarkTheme
                                        ? "bg-orange-900/30 text-orange-400 border border-orange-700"
                                        : "bg-orange-50 text-orange-800 border border-orange-200"
                                    }`}
                                    style={{ whiteSpace: "pre-wrap" }}
                                  >
                                    {testCases[activeTestCase].compile_output}
                                  </div>
                                </div>
                              )}

                              {/* Time and Memory */}
                              {testCases[activeTestCase].time && (
                                <div className="text-sm text-gray-600">
                                  Time: {testCases[activeTestCase].time}s |
                                  Memory: {testCases[activeTestCase].memory} KB
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Custom Input Area */}
                      <div>
                        <label
                          className={`text-sm font-semibold mb-2 block ${
                            isDarkTheme ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Input (stdin):
                        </label>
                        <textarea
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="Enter custom input..."
                          rows={6}
                          className={`w-full p-3 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                            isDarkTheme
                              ? "bg-gray-800 text-gray-300 border border-gray-700"
                              : "bg-gray-50 text-gray-800 border border-gray-300"
                          }`}
                        />
                      </div>

                      {/* Custom Output Area */}
                      <div>
                        <label
                          className={`text-sm font-semibold mb-2 block ${
                            isDarkTheme ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          Output (stdout):
                        </label>
                        <div
                          className={`w-full p-3 rounded-md font-mono text-sm min-h-[100px] ${
                            isDarkTheme
                              ? "bg-gray-800 text-gray-300 border border-gray-700"
                              : "bg-gray-50 text-gray-800 border border-gray-300"
                          }`}
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {stdOut || "Run code to see output..."}
                        </div>
                      </div>

                      {/* Error Display for Custom Input */}
                      {customTestCase.stderr && (
                        <div>
                          <label
                            className={`text-sm font-semibold mb-2 block text-red-600 ${
                              isDarkTheme ? "text-red-400" : "text-red-700"
                            }`}
                          >
                            Error (stderr):
                          </label>
                          <div
                            className={`w-full p-3 rounded-md font-mono text-sm text-red-600 ${
                              isDarkTheme
                                ? "bg-red-900/30 text-red-400 border border-red-700"
                                : "bg-red-50 text-red-800 border border-red-200"
                            }`}
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {customTestCase.stderr}
                          </div>
                        </div>
                      )}

                      {/* Compile Output Display for Custom Input */}
                      {customTestCase.compile_output && (
                        <div>
                          <label
                            className={`text-sm font-semibold mb-2 block text-orange-600 ${
                              isDarkTheme
                                ? "text-orange-400"
                                : "text-orange-700"
                            }`}
                          >
                            Compile Output:
                          </label>
                          <div
                            className={`w-full p-3 rounded-md font-mono text-sm text-orange-600 ${
                              isDarkTheme
                                ? "bg-orange-900/30 text-orange-400 border border-orange-700"
                                : "bg-orange-50 text-orange-800 border border-orange-200"
                            }`}
                            style={{ whiteSpace: "pre-wrap" }}
                          >
                            {customTestCase.compile_output}
                          </div>
                        </div>
                      )}

                      {/* Status and Metrics for Custom Input */}
                      {customTestCase.verdict && (
                        <div className="mt-3">
                          <div
                            className={`text-sm font-medium ${
                              customTestCase.status === "passed"
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            Status: {customTestCase.verdict}
                          </div>
                          {customTestCase.time && (
                            <div className="mt-1 text-sm text-gray-600">
                              Time: {customTestCase.time}s | Memory:{" "}
                              {customTestCase.memory} KB
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Results Display */}
                  {showResults && (
                    <div
                      className={`mt-4 p-3 rounded-md text-sm font-medium ${
                        resultStatus === "S"
                          ? "bg-green-100 text-green-800"
                          : resultStatus === "F"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                      style={{
                        whiteSpace: "pre-wrap",
                        fontFamily: "monospace",
                      }}
                    >
                      {showResults}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemCard;
