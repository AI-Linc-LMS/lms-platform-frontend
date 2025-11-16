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
import { ProblemData, TestCase } from "./problem.types";
import React from "react";
import { Code, Play, Moon, Sun } from "lucide-react";
import { Tooltip } from "@mui/material";

interface ProblemCardProps {
  contentId: number;
  courseId: number;
  onSubmit: (code: string) => void;
  onComplete?: () => void;
  isSidebarContentOpen: boolean;
}

const ProblemCard: React.FC<ProblemCardProps> = ({
  contentId,
  courseId,
  onSubmit,
  onComplete,
  isSidebarContentOpen,
}) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<ProblemData>({
    queryKey: ["problem", courseId, contentId],
    queryFn: () => getCourseContent(clientId, courseId, contentId),
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
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

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
      let defaultLanguage;
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

      const normalizedLanguage =
        defaultLanguage === "python3" ? "python3" : defaultLanguage || "";
      const tpl = getTemplateForLanguage(normalizedLanguage);

      if (normalizedLanguage && tpl) {
        setSelectedLanguage(normalizedLanguage);
        setCode(tpl);
        setIsInitialized(true);
      }
    }
  }, [data, isInitialized, getTemplateForLanguage]);

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

  // Run code mutation
  const runCodeMutation = useMutation({
    mutationFn: () => {
      return runCode(1, courseId, contentId, code, getSelectedLanguageId());
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
      })) as TestCase[];

      setTestCases(updatedTestCases);

      const success = updatedTestCases.every((tc) => tc.status === "passed");
      setResults({
        success,
        message: success ? "All test cases passed!" : "Some test cases failed.",
      });
      setResultStatus(success ? "S" : "F");
      setShowResults(
        success ? "All test cases passed!" : "Some test cases failed."
      );
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
        1,
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
      setShowResults(
        data.status === "Accepted"
          ? "Custom test passed!"
          : "Custom test failed."
      );
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
      return submitCode(1, courseId, contentId, code, getSelectedLanguageId());
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
          queryKey: ["streakTable", parseInt(clientId)],
        });
      } else {
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
        setResults({
          success: false,
          message: "Please fix the failing test cases before submitting.",
        });
        setResultStatus("F");
        setShowResults("Please fix the failing test cases before submitting.");
        setIsSubmitting(false);
        setIsRunning(false);
      }
    } catch {
      setResults({
        success: false,
        message: "Error running code. Please try again.",
      });
      setResultStatus("F");
      setShowResults("Error running code. Please try again.");
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
      console.error("Error in editor mount:", error);
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setSelectedLanguage(newLang);
    const tpl = getTemplateForLanguage(newLang);
    if (tpl) {
      setCode(tpl);
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
          console.error("Error updating language:", error);
        }
      }
    }
  };

  const shouldRenderEditor = selectedLanguage && code && isInitialized;

  return (
    <div
      className={`overflow-hidden ${
        isDarkTheme ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Success Modal */}
      {isSubmitSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md border-t-4 border-green-500">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-2xl font-bold text-green-600 mb-3">
                Problem Completed!
              </h3>
              <p className="text-gray-700 mb-6">
                Great job! Your solution has been accepted and the problem is
                marked as complete.
              </p>
              <button
                onClick={() => setIsSubmitSuccess(false)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-md"
              >
                Continue Learning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failure Modal */}
      {submitResult && !isSubmitSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md border-t-4 border-red-500">
            <h3 className="text-2xl font-bold text-red-600 mb-6 text-center">
              Submission Failed
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Status:</span>
                <span className="text-red-600 font-bold">
                  {submitResult.status}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Passed:</span>
                <span className="text-green-600 font-bold">
                  {submitResult.passed}/{submitResult.total_test_cases}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600 font-medium">Failed:</span>
                <span className="text-red-600 font-bold">
                  {submitResult.failed}/{submitResult.total_test_cases}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSubmitResult(null)}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
          <div className="bg-white p-8 rounded-xl shadow-2xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mb-4"></div>
            <p className="text-gray-700 text-lg font-medium">
              Submitting your solution...
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-3 p-3 h-screen">
        {/* Left Panel - Problem Description */}
        {!isSidebarContentOpen && (
          <div className="col-span-12 lg:col-span-6 !rounded-xl border border-primary-100 overflow-hidden bg-white">
            <div className="flex flex-row text-secondary-700 text-sm border-b border-gray-200">
              <button
                className={`flex flex-row items-center gap-2 px-4 py-3 transition-all ${
                  activeTab === "description"
                    ? `${
                        isDarkTheme
                          ? "bg-gray-800 text-white"
                          : "bg-primary-50 text-primary-700"
                      } font-semibold border-b-2 border-primary-500`
                    : `text-gray-500 hover:bg-gray-50`
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
                          ? "bg-gray-800 text-white"
                          : "bg-primary-50 text-primary-700"
                      } font-semibold border-b-2 border-primary-500`
                    : "text-gray-500 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("submission")}
              >
                <img
                  src={submissionIcon}
                  className="w-4 h-4"
                  alt="Submissions"
                />
                Submissions
              </button>
              <button
                className={`flex flex-row items-center gap-2 px-4 py-3 transition-all ${
                  activeTab === "comments"
                    ? `${
                        isDarkTheme
                          ? "bg-gray-800 text-white"
                          : "bg-primary-50 text-primary-700"
                      } font-semibold border-b-2 border-primary-500`
                    : "text-gray-500 hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("comments")}
              >
                <img src={commentsIcon} className="w-4 h-4" alt="Comments" />
                Comments
              </button>
            </div>

            <div className="h-[calc(100%-48px)] overflow-y-auto p-4">
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

        {/* Right Panel - Code Editor and Console */}
        <div
          className={`${
            isSidebarContentOpen ? "col-span-12" : "col-span-12 lg:col-span-6"
          } border border-primary-100 rounded-xl overflow-hidden ${
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
              <div
                className={`flex items-center font-semibold hidden md:flex ${
                  isDarkTheme ? "text-white" : "text-secondary-950"
                }`}
              >
                <Code className="mr-2 w-4 h-4" />
                Code
              </div>
              <select
                id="language"
                name="language"
                value={selectedLanguage}
                className={`form-select rounded-md px-3 py-2 h-9 focus:outline-none transition-colors ${
                  isDarkTheme
                    ? "bg-gray-700 text-white border border-gray-600 hover:bg-gray-600"
                    : "bg-primary-50 text-secondary-950 border border-primary-200 hover:bg-primary-100"
                }`}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                {availableLanguages.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

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
                  backgroundColor: isRunning ? "#9ca3af" : "#22c55e",
                  color: "#ffffff",
                  cursor: isRunning ? "not-allowed" : "pointer",
                }}
                className="px-4 py-2 rounded-md font-semibold transition-all h-9 text-sm flex items-center gap-2 shadow-md hover:shadow-lg"
                onMouseEnter={(e) => {
                  if (!isRunning) {
                    e.currentTarget.style.backgroundColor = "#16a34a";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isRunning) {
                    e.currentTarget.style.backgroundColor = "#22c55e";
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
              ) : (
                <button
                  onClick={handleSubmitCode}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: isSubmitting ? "#9ca3af" : "#3b82f6",
                    color: "#ffffff",
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                  className="px-4 py-2 rounded-md font-semibold transition-all h-9 text-sm shadow-md hover:shadow-lg"
                  onMouseEnter={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = "#2563eb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.backgroundColor = "#3b82f6";
                    }
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              )}
            </div>
          </div>

          {/* Editor and Console Grid */}
          <div className="grid grid-cols-12 h-[calc(100%-64px)]">
            {/* Code Editor - Left Side */}
            <div
              className={`col-span-12 md:col-span-7 ${
                isDarkTheme
                  ? "border-r border-gray-700"
                  : "border-r border-gray-200"
              }`}
            >
              {shouldRenderEditor ? (
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
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                </div>
              )}
            </div>

            {/* Console Panel - Right Side */}
            <div
              className={`col-span-12 md:col-span-5 flex flex-col ${
                isDarkTheme ? "bg-gray-900" : "bg-white"
              }`}
            >
              {/* Console Tabs */}
              <div
                className={`flex border-b ${
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
              <div className="flex-1 overflow-y-auto p-4">
                {consoleTab === "testcases" ? (
                  <div className="space-y-3">
                    {/* Test Case Tabs */}
                    <div className="flex gap-2 flex-wrap">
                      {testCases.map((tc, index) => (
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
                              : tc.status === "failed"
                              ? "border-l-4 border-red-500"
                              : ""
                          }`}
                          onClick={() => setActiveTestCase(index)}
                        >
                          Case {index + 1}
                        </button>
                      ))}
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
                          >
                            {testCases[activeTestCase].sample_input}
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
                          >
                            {testCases[activeTestCase].sample_output}
                          </div>
                        </div>

                        {testCases[activeTestCase].userOutput !== undefined && (
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
                            >
                              {testCases[activeTestCase].userOutput}
                            </div>
                          </div>
                        )}

                        {testCases[activeTestCase].status && (
                          <div
                            className={`p-3 rounded-md text-sm font-medium ${
                              testCases[activeTestCase].status === "passed"
                                ? "bg-green-100 text-green-800"
                                : testCases[activeTestCase].status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {testCases[activeTestCase].status === "passed"
                              ? "✓ Passed"
                              : testCases[activeTestCase].status === "failed"
                              ? "✗ Failed"
                              : "⟳ Running..."}
                          </div>
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
                      >
                        {stdOut || "Run code to see output..."}
                      </div>
                    </div>
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
                  >
                    {showResults}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemCard;
