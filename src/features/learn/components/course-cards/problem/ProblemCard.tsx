import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCourseContent } from "../../../../../services/enrolled-courses-content/courseContentApis";
import { 
  runCode, 
  runCustomCode, 
  submitCode,
  LANGUAGE_ID_MAPPING,
  RunCodeResult,
  CustomRunCodeResult,
  SubmitCodeResult
} from "../../../../../services/enrolled-courses-content/submitApis";
import Editor from '@monaco-editor/react';
import testcaseIcon from "../../../../../commonComponents/icons/enrolled-courses/testcaseIcon.png";
import lightProblemIcon from "../../../../../commonComponents/icons/enrolled-courses/lightProblemIcon.png";
import tagProblemIcon from "../../../../../commonComponents/icons/enrolled-courses/tagProblemIcon.png";
import heartProblemIcon from "../../../../../commonComponents/icons/enrolled-courses/heartProblemIcon.png";
import './ProblemCard.css';

interface ProblemCardProps {
  contentId: number;
  courseId: number;
  onSubmit: (code: string) => void;
  onComplete?: () => void;
}

interface ProblemDetails {
  id: number;
  difficulty_level: string;
  input_format: string;
  output_format: string;
  problem_statement: string;
  sample_input: string;
  sample_output: string;
  title: string;
}

interface ProblemData {
  id: number;
  content_type: string;
  content_title: string;
  details: ProblemDetails;
}

interface TestCase {
  test_case?: number;
  sample_input: string;
  sample_output: string;
  userOutput?: string;
  status?: 'passed' | 'failed' | 'running';
  time?: string;
  memory?: number;
}

interface CustomTestCase {
  input: string;
  output?: string;
  status?: 'passed' | 'failed' | 'running';
  time?: string;
  memory?: number;
}

// Add submission history type
interface SubmissionHistory {
  id: number;
  status: string;
  submitted_at: string;
  runtime: string;
  memory: string;
  language: string;
}

const ProblemCard: React.FC<ProblemCardProps> = ({
  contentId,
  courseId,
  onSubmit,
  onComplete,
}) => {
  const { data, isLoading, error } = useQuery<ProblemData>({
    queryKey: ['problem', contentId],
    queryFn: () => getCourseContent(1, courseId, contentId),
    enabled: !!contentId && !!courseId,
  });
  const languageOptions = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
  ];

  const [code, setCode] = useState("// Write your code here");
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
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0].value);
  const [activeTestCase, setActiveTestCase] = useState<number>(0);
  const [customInput, setCustomInput] = useState("");
  const [customTestCase, setCustomTestCase] = useState<CustomTestCase>({ input: '' });
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistory[]>([
    {
      id: 4,
      status: "Runtime Error",
      submitted_at: new Date().toISOString(), // Today
      runtime: "N/A",
      memory: "N/A",
      language: "javascript"
    },
    {
      id: 3,
      status: "Accepted",
      submitted_at: new Date().toISOString(), // Today
      runtime: "2 ms",
      memory: "59.4 MB",
      language: "javascript"
    },
    {
      id: 2,
      status: "Runtime Error",
      submitted_at: "2022-12-10T12:00:00.000Z", // Dec 10, 2022
      runtime: "N/A",
      memory: "N/A",
      language: "javascript"
    },
    {
      id: 1,
      status: "Wrong Answer",
      submitted_at: "2022-12-10T10:00:00.000Z", // Dec 10, 2022
      runtime: "N/A",
      memory: "N/A",
      language: "javascript"
    }
  ]);
  
  // Run code mutation
  const runCodeMutation = useMutation({
    mutationFn: () => runCode(
      1, 
      courseId, 
      contentId, 
      code, 
      LANGUAGE_ID_MAPPING[selectedLanguage as keyof typeof LANGUAGE_ID_MAPPING]
    ),
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
    mutationFn: (input: string) => runCustomCode(
      1, 
      courseId, 
      contentId, 
      code, 
      LANGUAGE_ID_MAPPING[selectedLanguage as keyof typeof LANGUAGE_ID_MAPPING],
      input
    ),
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
    mutationFn: () => submitCode(
      1, 
      courseId, 
      contentId, 
      code, 
      LANGUAGE_ID_MAPPING[selectedLanguage as keyof typeof LANGUAGE_ID_MAPPING]
    ),
    onSuccess: (data: SubmitCodeResult) => {
      const success = data.status === "Accepted";
      setResults({
        success,
        message: success 
          ? `Solution accepted! Passed ${data.passed}/${data.total_test_cases} test cases.` 
          : `Failed ${data.failed}/${data.total_test_cases} test cases.`
      });
      
      // Add submission to history
      const newSubmission: SubmissionHistory = {
        id: submissionHistory.length + 1,
        status: data.status,
        submitted_at: new Date().toISOString(),
        runtime: success ? "2 ms" : "N/A",
        memory: success ? "59.4 MB" : "N/A",
        language: selectedLanguage
      };
      setSubmissionHistory([newSubmission, ...submissionHistory]);
      
      // Call onSubmit to notify the parent that code was submitted
      onSubmit(code);
      
      // If the submission was successful, call onComplete to mark the problem as complete
      if (success && onComplete) {
        console.log("Solution was accepted! Calling onComplete callback");
        setIsSubmitSuccess(true);
        
        // Directly call submitContent to update the status
        // submitContent(
        //   1, 
        //   courseId, 
        //   contentId, 
        //   'CodingProblem', 
        //   { status: 'complete' },
        //   'updateStatus'
        // )
        // .then(statusCode => {
        //   console.log("Status update response:", statusCode);
        //   // Now call the onComplete callback for UI updates
        //   onComplete();
        // })
        // .catch(error => {
        //   console.error("Failed to update status:", error);
        //   // Still call onComplete for UI updates
        //   onComplete();
        // });
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
  
  // Mock test cases based on sample input/output from the problem
  React.useEffect(() => {
    if (data?.details) {
      setTestCases([
        {
          test_case: 1,
          sample_input: data.details.sample_input,
          sample_output: data.details.sample_output,
        }
      ]);
    }
  }, [data]);

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
      {/* <div className="problem-header rounded-2xl">
        <div className="problem-title-section">
          <div className="flex">
            <h1 className="problem-title">{data.details.title}</h1>
            <span
              className={`difficulty-badge ml-2 mt-2
                ${data.details.difficulty_level === "Easy" ? "easy" :
                  data.details.difficulty_level === "Medium" ? "medium" : "hard"
                }`}
            >
              {data.details.difficulty_level}
            </span>
          </div>
          <div className="run-submit-buttons">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className={`run-button ${isRunning ? 'button-loading' : ''}`}
            >
              {isRunning ? 'Running...' : 'Run'}
            </button>
            <button
              onClick={handleSubmitCode}
              disabled={isSubmitting}
              className={`submit-button ${isSubmitting ? 'button-loading' : ''}`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
          <div className="editor-actions">
            <div className="toggle-container">
              <label className="toggle-label">
                <span>Autocomplete</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isAutocompleteEnabled}
                    onChange={() => setIsAutocompleteEnabled(!isAutocompleteEnabled)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>

            <div className="toggle-container">
              <label className="toggle-label">
                <span>Dark Mode</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={isDarkTheme}
                    onChange={handleThemeChange}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div> 
          </div>
        </div>
      </div>*/}

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
        <div className="description-panel">
          <div className="flex flex-row text-[#264D64]">
            <button
              className={`px-4 py-2 rounded-t-md ${activeTab === 'description'
                ? `${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-[#D7EFF6]  text-black border-gray-300"} font-semibold shadow-inner`
                : `text-gray-500`}
              }`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`px-4 py-2 rounded-t-md ${activeTab === 'solutions'
                ? `${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-[#D7EFF6]  text-black border-gray-300"} bg-[#D7EFF6] font-semibold shadow-inner`
                : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('solutions')}
            >
              Solutions
            </button>
            <button
              className={`px-4 py-2 rounded-t-md ${activeTab === 'submission'
                ? `bg-[#D7EFF6] ${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-[#D7EFF6] text-black border-gray-300"} font-semibold shadow-inner`
                : 'text-gray-500 dark:text-gray-400'}`}
              onClick={() => setActiveTab('submission')}
            >
              Submissions
            </button>
          </div>

          <div className="description-content">
            {activeTab === 'description' && (
              <>
                <div className="flex">
                  <h1 className="problem-title">{data.details.title}</h1>
                  {/* <span
                    className={`difficulty-badge ml-2 mt-2
                ${data.details.difficulty_level === "Easy" ? "easy" :
                        data.details.difficulty_level === "Medium" ? "medium" : "hard"
                      }`}
                  >
                    {data.details.difficulty_level}
                  </span> */}
                </div>

                <div className="flex gap-3">
                  {/* Difficulty Tag */}
                  <div className="flex items-center text-center gap-1 px-2 py-1 rounded-md border-1 border-gray-400 text-gray-500 text-sm my-2">
                    <img src={lightProblemIcon} className="w-3 h-3 font-bold" />
                    <span className="text-gray-500 text-xs">{data.details.difficulty_level}</span>
                  </div>

                  {/* Category Tag */}
                  <div className="flex items-center text-center gap-1 px-2 py-1 rounded-md border text-gray-500 text-sm my-2">
                    <img src={tagProblemIcon} className="w-3 h-3 mt-1 font-bold" />
                    <span className="text-gray-500 text-xs">Algorithms</span>
                  </div>

                  {/* Like Percentage Tag */}
                  <div className="flex items-center text-center gap-1 px-2 py-1 rounded-md border text-gray-500 text-sm my-2">
                    <img src={heartProblemIcon} className="w-3 h-3 mt-1 font-bold" />
                    <span className="text-gray-500 text-xs">98.82%</span>
                  </div>
                </div>
                <div className="problem-description mt-2" dangerouslySetInnerHTML={{ __html: data.details.problem_statement || "" }} />

                <div className="section">
                  <h3 className="section-title">Input Format</h3>
                  <div className="section-content" dangerouslySetInnerHTML={{ __html: data.details.input_format || "" }} />
                </div>

                <div className="section">
                  <h3 className="section-title">Output Format</h3>
                  <div className="section-content" dangerouslySetInnerHTML={{ __html: data.details.output_format || "" }} />
                </div>

                <div className="examples-section">
                  <div className="example">
                    <h3 className="example-title">Example 1:</h3>
                    <div className="example-box">
                      <div className="example-input">
                        <span className="example-label">Input:</span>
                        <pre className="example-code">{data.details.sample_input}</pre>
                      </div>
                      <div className="example-output">
                        <span className="example-label">Output:</span>
                        <pre className="example-code">{data.details.sample_output}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'solutions' && (
              <div className="placeholder-content">
                <p>Community solutions will appear here.</p>
              </div>
            )}

            {activeTab === 'submission' && (
              <div className="submission-history">
                <h3 className={`text-xl font-bold mb-4 ${isDarkTheme ? "text-white" : ""}`}>Your Submissions</h3>
                
                {submissionHistory.length === 0 ? (
                  <p className="text-gray-500 italic">You haven't submitted any solutions yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className={`border-b ${isDarkTheme ? "border-gray-700" : "border-gray-200"}`}>
                          <th className={`text-left py-3 px-4 font-medium uppercase tracking-wider w-16 ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}>No.</th>
                          <th className={`text-left py-3 px-4 font-medium uppercase tracking-wider ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}>Status</th>
                          <th className={`text-left py-3 px-4 font-medium uppercase tracking-wider ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}>Language</th>
                          <th className={`text-left py-3 px-4 font-medium uppercase tracking-wider ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}>Runtime</th>
                          <th className={`text-left py-3 px-4 font-medium uppercase tracking-wider ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}>Memory</th>
                          <th className={`text-left py-3 px-4 font-medium uppercase tracking-wider ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissionHistory.map((submission, index) => (
                          <tr key={submission.id} className={`${isDarkTheme ? "border-b border-gray-700 hover:bg-gray-800" : "border-b border-gray-200 hover:bg-gray-100"}`}>
                            <td className={`py-4 px-4 text-center font-medium ${isDarkTheme ? "text-white" : ""}`}>{submissionHistory.length - index}</td>
                            <td className="py-4 px-4">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                submission.status === "Accepted" 
                                  ? isDarkTheme ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800" 
                                  : submission.status === "Wrong Answer"
                                  ? isDarkTheme ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"
                                  : isDarkTheme ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800"
                              }`}>
                                {submission.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-sm">
                              <span className={`rounded px-2 py-1 ${
                                isDarkTheme 
                                  ? "bg-gray-700 text-white" 
                                  : "bg-gray-200 text-gray-800"
                              }`}>
                                {submission.language === "javascript" ? "JavaScript" : 
                                 submission.language === "typescript" ? "TypeScript" : 
                                 submission.language === "python" ? "Python" : 
                                 submission.language === "java" ? "Java" : 
                                 submission.language === "cpp" ? "C++" : submission.language}
                              </span>
                            </td>
                            <td className={`py-4 px-4 text-sm ${isDarkTheme ? "text-gray-300" : ""}`}>{submission.runtime}</td>
                            <td className={`py-4 px-4 text-sm ${isDarkTheme ? "text-gray-300" : ""}`}>{submission.memory}</td>
                            <td className={`py-4 px-4 text-sm ${isDarkTheme ? "text-gray-400" : "text-gray-500"}`}>
                              {new Date(submission.submitted_at).toLocaleString('en-US', {
                                month: 'short',
                                day: '2-digit',
                                year: 'numeric'
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel with code editor */}
        <div className="code-editor-panel">
          <div className="flex flex-col px-3 w-full">
            <h3 className="text-xl font-semibold py-2 text-gray-700">Code</h3>
            <div className="flex flex-row w-full justify-between">
              <div className="flex flex-row gap-1">
                {/* Language Dropdown */}
                <div className="relative inline-block text-sm" onClick={() => setIsDropdownHovered(!isDropdownHovered)}>
                  <div className={`border text-center px-2 py-1 text-gray-700 text-xs cursor-pointer flex justify-between items-center w-full rounded-md gap-1 h-9 ${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}>
                    <span>{languageOptions.find(opt => opt.value === selectedLanguage)?.label}</span>
                    <span className="text-[13px]">{isDropdownHovered ? "▲" : "▼"}</span>
                  </div>

                  {/* Dropdown options */}
                  {isDropdownHovered && (
                    <ul className={`absolute left-0 mt-1 w-40 rounded-md shadow-md z-10 text-xs border ${isDarkTheme ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}>
                      {languageOptions.map(option => (
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
                  className={`submit-button md:text-xs xl:text-md ${isSubmitting ? 'button-loading opacity-70' : ''} ${
                    'bg-gray-200'
                  } h-9`}
                >
                  {isSubmitting ? 'Submitting...' :'Submit'}
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
            <div className={`mb-10 ${isDarkTheme ? "bg-[#252526]" : ""}`}>
              <div className="console-resize-handle" onMouseDown={startResizing}>
              </div>
              <div className="flex items-center text-center gap-2 p-4 text-xl font-semibold">
                <img src={testcaseIcon} className="w-6 h-6 mt-1 font-bold" /> Testcase
              </div>
              <div className={`border-1 mx-2 ${isDarkTheme ? "border-gray-600" : ""} rounded-xl`}>
                {!testCases || testCases.length === 0 ? (
                  <div className="p-4 text-gray-500 italic">Loading test cases...</div>
                ) : (
                  <>
                    <div className={`flex space-x-4 ${isDarkTheme ? "bg-[#252526]" : "bg-gray-50"} rounded-t-xl `}>
                      {testCases.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveTestCase(idx)}
                          className={`px-4 py-2 rounded-t-xl ${activeTestCase === idx
                            ? ` ${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-[#D7EFF6] text-black border-gray-300"} font-semibold shadow-inner`
                            : `text-gray-500 '}`
                            }`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setActiveTestCase(-1)}
                        className={`px-4 py-2 rounded-t-md ${activeTestCase === -1
                          ? `${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-[#D7EFF6] text-black border-gray-300"} font-semibold shadow-inner`
                          : 'text-gray-500'
                          }`}
                      >
                        Custom Input +
                      </button>
                    </div>

                    <div className="p-4">
                      {activeTestCase >= 0 ? (
                        <>
                          <h3 className="mb-2 font-medium">Case {activeTestCase + 1}</h3>

                          <div className="text-sm text-gray-700 mb-1 ">
                            <strong>Input:</strong>
                          </div>
                          <pre className={`p-2 mt-2 rounded text-sm ${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-gray-200 text-black border-gray-300"}`}>
                            {testCases[activeTestCase]?.sample_input ?? 'Loading...'}
                          </pre>

                          <div className="text-sm text-gray-700 mt-4 mb-1">
                            <strong>Expected Output:</strong>
                          </div>
                          <pre className={`p-2 mt-2 rounded text-sm ${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-gray-200 text-black border-gray-300"} text-gray-800`}>
                            {testCases[activeTestCase]?.sample_output ?? 'Loading...'}
                          </pre>
                          {testCases[activeTestCase]?.status && (
                            <div>
                              <div className="text-sm text-gray-700 mt-4 mb-1">
                                <strong>Your Output:</strong>
                              </div>
                              <pre
                                className={`bg-gray-100 p-2 mt-2 rounded text-sm ${testCases[activeTestCase]?.status === 'passed'
                                  ? 'text-green-600'
                                  : testCases[activeTestCase]?.status === 'running'
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                  }`}
                              >
                                {testCases[activeTestCase]?.userOutput || 'Not run yet'}
                              </pre>

                              <div className="mt-2 font-medium">
                                Status:{' '}
                                <span
                                  className={`${testCases[activeTestCase]?.status === 'passed'
                                    ? 'text-green-700'
                                    : testCases[activeTestCase]?.status === 'running'
                                      ? 'text-yellow-600'
                                      : 'text-red-700'
                                    }`}
                                >
                                  {testCases[activeTestCase]?.status || 'Not run'}
                                </span>
                              </div>
                              
                              {testCases[activeTestCase]?.time && (
                                <div className="mt-1 text-sm text-gray-600">
                                  Time: {testCases[activeTestCase]?.time}s | 
                                  Memory: {testCases[activeTestCase]?.memory} KB
                                </div>
                              )}
                            </div>)}
                        </>
                      ) : (
                        <div>
                          <h3 className="mb-2 font-medium">Custom Input</h3>
                          <div className="text-sm text-gray-700 mb-1">
                            <strong>Input:</strong>
                          </div>
                          <textarea 
                            className={`p-2 mt-2 w-full h-24 rounded text-sm border ${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-gray-100 text-black border-gray-300"}`}
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            placeholder="Enter your custom input here..."
                          />
                          
                          <div className="mt-3">
                            <button 
                              className={`run-button md:text-xs xl:text-md bg-[#5FA564] px-4 py-2 rounded ${isRunning ? 'button-loading opacity-70' : ''}`}
                              onClick={handleCustomRunCode}
                              disabled={isRunning}
                            >
                              {isRunning ? 'Running...' : 'Run with Custom Input'}
                            </button>
                          </div>
                          
                          {customTestCase.output && (
                            <>
                              <div className="text-sm text-gray-700 mt-4 mb-1">
                                <strong>Output:</strong>
                              </div>
                              <pre
                                className={`bg-gray-100 p-2 mt-2 rounded text-sm ${customTestCase.status === 'passed'
                                  ? 'text-green-600'
                                  : customTestCase.status === 'running'
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                  }`}
                              >
                                {customTestCase.output}
                              </pre>
                              
                              {customTestCase.time && (
                                <div className="mt-1 text-sm text-gray-600">
                                  Time: {customTestCase.time}s | 
                                  Memory: {customTestCase.memory} KB
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
};

export default ProblemCard;