import { useQuery, useMutation } from "@tanstack/react-query";
import { getCourseContent, pastSubmissions } from "../../../../../services/enrolled-courses-content/courseContentApis";
import {
  runCode,
  runCustomCode,
  submitCode,
  RunCodeResult,
  CustomRunCodeResult,
  SubmitCodeResult,
} from "../../../../../services/enrolled-courses-content/submitApis";
import Editor from '@monaco-editor/react';
import descriptionIcon from "../../../../../commonComponents/icons/enrolled-courses/problem/descriptionIcon.svg";
import commentsIcon from "../../../../../commonComponents/icons/enrolled-courses/problem/commentsIcon.svg";
import submissionIcon from "../../../../../commonComponents/icons/enrolled-courses/problem/submissionIcon.svg";
import './ProblemCard.css';
import Comments from '../../../../../commonComponents/components/Comments';
import Submissions from './components/Submissions';
import Description from './components/Description';
import ConsoleTestCases from './components/ConsoleTestCases';
import { useEffect, useState } from "react";
import './ProblemCard.css';
import { CustomTestCase, ProblemData, TestCase } from "./problem.types";

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
  isSidebarContentOpen
}) => {
  const { data, isLoading, error } = useQuery<ProblemData>({
    queryKey: ['problem', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
    enabled: !!contentId && !!courseId,
  });

  // Fetch past submissions, but destructure only if needed in the component
  const pastSubmissionsQuery = useQuery<any>({
    queryKey: ['pastSubmissions', contentId],
    queryFn: () => pastSubmissions(1, courseId, contentId),
    enabled: !!contentId && !!courseId,
  });

  console.log('pastSubmissionsQuery', pastSubmissionsQuery.data);
  // Get available languages from template codes
  const availableLanguages = data?.details?.template_code?.map(tc => ({
    value: tc.language.toLowerCase().replace(/\s+/g, ''),
    label: tc.language,
    language_id: tc.language_id
  })) || [];

  const [code, setCode] = useState("");
  const [isAutocompleteEnabled, setIsAutocompleteEnabled] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem('ide-theme');
    return saved ? saved === 'dark' : false;
  });
  const [results, setResults] = useState<null | { success: boolean; message: string }>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [consoleHeight, setConsoleHeight] = useState(200);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [isDropdownHovered, setIsDropdownHovered] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [activeTestCase, setActiveTestCase] = useState<number>(0);
  const [customInput, setCustomInput] = useState("");
  const [customTestCase, setCustomTestCase] = useState<CustomTestCase>({ input: '' });
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  // Set default language when data is loaded
  useEffect(() => {
    if (data?.details?.template_code && data.details.template_code.length > 0) {
      const defaultLanguage = data.details.template_code[0].language.toLowerCase().replace(/\s+/g, '');
      setSelectedLanguage(defaultLanguage);
    }
  }, [data]);

  // Initialize code with template when data is loaded or language changes
  useEffect(() => {
    if (data?.details?.template_code && selectedLanguage) {
      const template = data.details.template_code.find(
        tc => tc.language.toLowerCase().replace(/\s+/g, '') === selectedLanguage
      );
      if (template) {
        setCode(template.template_code);
      }
    }
  }, [data, selectedLanguage]);

  // Initialize test cases when data is loaded
  useEffect(() => {
    if (data?.details?.test_cases) {
      const formattedTestCases = data.details.test_cases.map((tc, index) => ({
        test_case: index + 1,
        sample_input: tc.input,
        sample_output: tc.expected_output,
        status: undefined,
        userOutput: undefined,
        time: undefined,
        memory: undefined,
        input: tc.input,
        expected_output: tc.expected_output
      }));
      setTestCases(formattedTestCases);
    }
  }, [data]);
  console.log('testCases', testCases);

  // Run code mutation
  const runCodeMutation = useMutation({
    mutationFn: () => {
      const selectedTemplate = data?.details?.template_code?.find(
        tc => tc.language.toLowerCase().replace(/\s+/g, '') === selectedLanguage
      );
      return runCode(
        1,
        courseId,
        contentId,
        code,
        selectedTemplate?.language_id || 0
      );
    },
    onSuccess: (data: RunCodeResult) => {
      const updatedTestCases = data.results.map(result => ({
        test_case: result.test_case,
        sample_input: result.input,
        sample_output: result.expected_output,
        userOutput: result.actual_output,
        status: result.status === "Accepted" ? "passed" : "failed",
        time: result.time,
        memory: result.memory
      })) as TestCase[];

      setTestCases(updatedTestCases);

      const success = updatedTestCases.every(tc => tc.status === 'passed');
      setResults({
        success,
        message: success ? "All test cases passed!" : "Some test cases failed."
      });
      setIsRunning(false);
    },
    onError: (error) => {
      console.error("Error running code:", error);
      setResults({
        success: false,
        message: "Error running code. Please try again."
      });
      setIsRunning(false);
    }
  });

  // Run custom code mutation
  const runCustomCodeMutation = useMutation({
    mutationFn: (input: string) => {
      const selectedTemplate = data?.details?.template_code?.find(
        tc => tc.language.toLowerCase().replace(/\s+/g, '') === selectedLanguage
      );
      return runCustomCode(
        1,
        courseId,
        contentId,
        code,
        selectedTemplate?.language_id || 0,
        input
      );
    },
    onSuccess: (data: CustomRunCodeResult) => {
      setCustomTestCase({
        input: data.input,
        output: data.actual_output,
        status: data.status === "Accepted" ? "passed" : "failed",
        time: data.time,
        memory: data.memory
      });
      setIsRunning(false);
    },
    onError: (error) => {
      console.error("Error running custom code:", error);
      setCustomTestCase({
        input: customInput,
        status: "failed",
        output: "Error running code"
      });
      setIsRunning(false);
    }
  });

  // Submit code mutation
  const submitCodeMutation = useMutation({
    mutationFn: () => {
      const selectedTemplate = data?.details?.template_code?.find(
        tc => tc.language.toLowerCase().replace(/\s+/g, '') === selectedLanguage
      );
      return submitCode(
        1,
        courseId,
        contentId,
        code,
        selectedTemplate?.language_id || 0
      );
    },
    onSuccess: (data: SubmitCodeResult) => {
      const success = data.status === "Accepted";
      setResults({
        success,
        message: success
          ? `Solution accepted! Passed ${data.passed}/${data.total_test_cases} test cases.`
          : `Failed ${data.failed}/${data.total_test_cases} test cases.`
      });

      // Call onSubmit to notify the parent that code was submitted
      onSubmit(code);

      // If the submission was successful, call onComplete to mark the problem as complete
      if (success && onComplete) {
        console.log("Solution was accepted! Calling onComplete callback");
        setIsSubmitSuccess(true);
      } else {
        console.log(`Solution ${success ? 'accepted' : 'rejected'}, onComplete callback: ${onComplete ? 'provided' : 'not provided'}`);
      }

      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Error submitting code:", error);
      setResults({
        success: false,
        message: "Error submitting code. Please try again."
      });
      setIsSubmitting(false);
    }
  });

  // Log results for debugging
  console.log("Results:", results);
  console.log("Custom Test Case:", customTestCase);
  console.log("Coding Problem", data);

  if (isLoading) {
    return (
      <div className="animate-pulse bg-white rounded-lg shadow-lg p-6">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/6 mb-2"></div>
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
    if (value) {
      setCode(value);
    }
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setResults(null);

    // Update test case status to running
    setTestCases(testCases.map(tc => ({
      ...tc,
      status: 'running'
    })));

    // Run the code with the API
    runCodeMutation.mutate();
  };

  const handleCustomRunCode = () => {
    if (!customInput.trim()) {
      setResults({
        success: false,
        message: "Please provide custom input"
      });
      return;
    }

    setIsRunning(true);
    setResults(null);

    // Run the code with custom input
    runCustomCodeMutation.mutate(customInput);
  };

  const handleSubmitCode = () => {
    setIsSubmitting(true);
    setResults(null);

    // Submit the code with the API
    submitCodeMutation.mutate();
  };

  // Save theme preference
  const handleThemeChange = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    localStorage.setItem('ide-theme', newTheme ? 'dark' : 'light');
  };

  // Handle console resize
  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isResizing) {
      const container = document.querySelector('.code-editor-panel') as HTMLElement;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const newHeight = containerRect.bottom - e.clientY;

        // Set minimum and maximum heights
        if (newHeight >= 100 && newHeight <= containerRect.height - 100) {
          setConsoleHeight(newHeight);
        }
      }
    }
  };

  const stopResizing = () => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  };

  const toggleConsole = () => {
    setIsConsoleOpen(!isConsoleOpen);
  };

  return (
    <div className={`problem-card-container rounded-2xl ${isDarkTheme ? 'dark-mode' : ''}`}>


      {isSubmitSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
            <h3 className="text-xl font-bold text-green-600 mb-4">🎉 Problem Completed!</h3>
            <p className="text-gray-700 mb-6">
              Great job! Your solution has been accepted and the problem is marked as complete.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => setIsSubmitSuccess(false)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="leetcode-layout">
        {/* Left panel with problem description */}
        {!isSidebarContentOpen &&
          <div className="description-panel">
            <div className="flex flex-row text-[#264D64] text-sm">
              <button
                className={`flex flex-row items-center gap-2 px-4 py-2 rounded-t-md ${activeTab === 'description'
                  ? `${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-[#D7EFF6]  text-gray-500 border-gray-300"} font-semibold shadow-inner`
                  : `text-gray-500`}
              }`}
                onClick={() => setActiveTab('description')}
              >
                <img src={descriptionIcon} className="w-4 h-4" />
                Description
              </button>
              <button
                className={`text-md flex flex-row items-center gap-2 px-4 py-2 rounded-t-md ${activeTab === 'submission'
                  ? `${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-[#D7EFF6]  text-gray-500 border-gray-300"} bg-[#D7EFF6] font-semibold shadow-inner`
                  : 'text-gray-500 dark:text-gray-400'}`}
                onClick={() => setActiveTab('submission')}
              >
                <img src={submissionIcon} className="w-4 h-4" />
                Submissions
              </button>
              <button
                className={`flex flex-row items-center gap-2 px-4 py-2 rounded-t-md ${activeTab === 'comments'
                  ? `bg-[#D7EFF6] ${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-[#D7EFF6] text-gray-500 border-gray-300"} font-semibold shadow-inner`
                  : 'text-gray-500 dark:text-gray-400'}`}
                onClick={() => setActiveTab('comments')}
              >
                <img src={commentsIcon} className="w-4 h-4" />
                Comments
              </button>
            </div>

            <div className="description-content">
              {activeTab === 'description' && (
                <>
                  <Description
                    problem={data.details}
                    isDarkTheme={isDarkTheme}
                  />
                </>
              )}

              {activeTab === 'submission' && (
                <Submissions 
                  contentId={contentId}
                  courseId={courseId}
                  isDarkTheme={isDarkTheme}
                />
              )}

              {activeTab === 'comments' && (
                <Comments 
                  contentId={contentId}
                  courseId={courseId}
                  isDarkTheme={isDarkTheme}
                />
              )}
            </div>
          </div>}

        {/* Right panel with code editor */}
        <div className="code-editor-panel">
          <div className="flex flex-col px-3 w-full">
            <div className="flex flex-row w-full justify-between">
              <div className="flex flex-row gap-1">
                {/* Language Dropdown */}
                <div className="relative inline-block text-sm" onClick={() => setIsDropdownHovered(!isDropdownHovered)}>
                  <div className={`border text-center px-2 py-1 text-gray-700 text-xs cursor-pointer flex justify-between items-center w-full rounded-md gap-1 h-9 ${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}>
                    <span>{availableLanguages.find(opt => opt.value === selectedLanguage)?.label || 'Select Language'}</span>
                    <span className="text-[13px]">{isDropdownHovered ? "▲" : "▼"}</span>
                  </div>

                  {/* Dropdown options */}
                  {isDropdownHovered && (
                    <ul className={`absolute left-0 mt-1 w-40 rounded-md shadow-md z-10 text-xs border ${isDarkTheme ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}>
                      {availableLanguages.map(option => (
                        <li
                          key={option.value}
                          onClick={() => {
                            setSelectedLanguage(option.value);
                            setIsDropdownHovered(false);
                          }}
                          className={`px-3 py-1 cursor-pointer hover:bg-gray-100 text-gray-700 ${isDarkTheme ? "hover:bg-gray-700" : ""}`}
                        >
                          {option.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Autocomplete and Dark Mode Toggles */}
                <div className="flex flex-row gap-3">
                  <div className="flex flex-row gap-2">
                    <div className={`border text-center px-2 text-gray-700 cursor-pointer flex justify-between items-center w-full h-9 rounded-md ${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}>
                      <label className="toggle-label">
                        <span>Autocomplete</span>
                        <div className="toggle-switch">
                          <input type="checkbox" checked={isAutocompleteEnabled} onChange={() => setIsAutocompleteEnabled(!isAutocompleteEnabled)} />
                          <span className="toggle-slider"></span>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className={`border text-center px-2 py-1 text-gray-700 cursor-pointer flex justify-between items-center w-full h-9 mb-2 rounded-md ${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}>
                    <label className="toggle-label">
                      <span>Dark Mode</span>
                      <div className="toggle-switch">
                        <input type="checkbox" checked={isDarkTheme} onChange={handleThemeChange} />
                        <span className="toggle-slider"></span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Run and Submit Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className={`run-button md:text-xs xl:text-md bg-[#5FA564] h-9 ${isRunning ? 'button-loading' : ''}`}
                >
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
                <button
                  onClick={handleSubmitCode}
                  disabled={isSubmitting}
                  className={`submit-button md:text-xs xl:text-md ${isSubmitting ? 'button-loading opacity-70' : ''} ${'bg-gray-200'
                    } h-9`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>

          <div className="monaco-editor-wrapper" style={{ height: isConsoleOpen ? `calc(100% - ${consoleHeight}px)` : "100%" }}>
            <Editor
              height="100%"
              language={selectedLanguage}
              value={code}
              onChange={handleCodeChange}
              theme={isDarkTheme ? "vs-dark" : "light"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: "on",
                suggestOnTriggerCharacters: isAutocompleteEnabled,
                lineNumbers: "on",
                roundedSelection: true,
                selectOnLineNumbers: true,
                quickSuggestions: isAutocompleteEnabled,
              }}
            />
          </div>

          {/* Resizable console panel */}
          <div className="console-toggle" onClick={toggleConsole}>
            {isConsoleOpen ? "▼" : "▲"} Console
          </div>

          {isConsoleOpen && (
            <ConsoleTestCases
              testCases={testCases}
              activeTestCase={activeTestCase}
              setActiveTestCase={setActiveTestCase}
              customInput={customInput}
              setCustomInput={setCustomInput}
              customTestCase={customTestCase}
              isRunning={isRunning}
              handleCustomRunCode={handleCustomRunCode}
              isDarkTheme={isDarkTheme}
              startResizing={startResizing}
            />
          )}
        </div>
      </div>
    </div>
  )
};

export default ProblemCard;