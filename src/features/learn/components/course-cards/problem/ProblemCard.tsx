import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCourseContent } from "../../../../../services/courses-content/courseContentApis";
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
  sample_input: string;
  sample_output: string;
  userOutput?: string;
  status?: 'passed' | 'failed' | 'running';
}

const ProblemCard: React.FC<ProblemCardProps> = ({
  contentId,
  courseId,
  onSubmit,
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
  console.log(results);
  // Mock test cases based on sample input/output from the problem
  React.useEffect(() => {
    if (data?.details) {
      setTestCases([
        {
          sample_input: data.details.sample_input,
          sample_output: data.details.sample_output,
        },
        {
          sample_input: "Mock test case 2 input",
          sample_output: "Mock test case 2 output",
        }
      ]);
    }
  }, [data]);

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

    // Simulate code execution
    setTimeout(() => {
      // Set results for each test case
      setTestCases(testCases.map(tc => ({
        ...tc,
        userOutput: tc.sample_output, // In a real app, this would be the actual output
        status: 'passed' // Simulate all passing for demo
      })));

      setResults({
        success: true,
        message: "All test cases passed!",
      });
      setIsRunning(false);
    }, 1000);
  };

  const handleSubmitCode = () => {
    setIsSubmitting(true);
    setResults(null);

    // Simulate submission with test cases
    setTimeout(() => {
      // Set results for each test case
      setTestCases(testCases.map(tc => ({
        ...tc,
        userOutput: tc.sample_output, // In a real app, this would be the actual output
        status: 'passed' // Simulate all passing for demo
      })));

      onSubmit(code);
      setResults({
        success: true,
        message: "Solution accepted! Your submission beats 85% of users in runtime.",
      });
      setIsSubmitting(false);
    }, 1500);
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

      <div className="leetcode-layout">
        {/* Left panel with problem description */}
        <div className="description-panel">
          <div className="flex flex-row text-[#264D64]">
            <button
              className={`px-4 py-2 rounded-t-md ${activeTab === 'description'
                ? 'bg-[#D7EFF6] font-semibold shadow-inner'
                : 'text-gray-500'}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`px-4 py-2 rounded-t-md ${activeTab === 'solutions'
                ? 'bg-[#D7EFF6] font-semibold shadow-inner'
                : 'text-gray-500'}`}
              onClick={() => setActiveTab('solutions')}
            >
              Solutions
            </button>
            <button
              className={`px-4 py-2 rounded-t-md ${activeTab === 'submission'
                ? 'bg-[#D7EFF6] font-semibold shadow-inner'
                : 'text-gray-500'}`}
              onClick={() => setActiveTab('submission')}
            >
              Submission
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

            {activeTab === 'discussion' && (
              <div className="placeholder-content">
                <p>Community discussions will appear here.</p>
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
                  <div className={`border text-center px-2 py-1 text-gray-700 cursor-pointer flex justify-between items-center w-full rounded-md gap-1 h-9 ${isDarkTheme ? "bg-gray-800 text-white border-gray-600" : "bg-white text-black border-gray-300"}`}>
                    <span>{languageOptions.find(opt => opt.value === selectedLanguage)?.label}</span>
                    <span className="text-[13px]">{isDropdownHovered ? "▲" : "▼"}</span>
                  </div>

                  {/* Dropdown options */}
                  {isDropdownHovered && (
                    <ul className={`absolute left-0 mt-1 w-40 rounded-md shadow-md z-10 border ${isDarkTheme ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-black"}`}>
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
                <button onClick={handleRunCode} disabled={isRunning} className={`run-button bg-[#5FA564] h-9 ${isRunning ? 'button-loading' : ''}`}>
                  {isRunning ? 'Running...' : 'Run Code'}
                </button>
                <button onClick={handleSubmitCode} disabled={isSubmitting} className={`submit-button bg-gray-200 h-9 ${isSubmitting ? 'button-loading' : ''}`}>
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
            <>
              <div className="console-resize-handle" onMouseDown={startResizing}>
              </div>
              <div className="flex items-center text-center gap-2 p-4 text-xl font-semibold">
                <img src={testcaseIcon} className="w-6 h-6 mt-1 font-bold" /> Testcase
              </div>
              <div className="border-1 mx-2 border-gray-300 rounded-xl">
                {!testCases || testCases.length === 0 ? (
                  <div className="p-4 text-gray-500 italic">Loading test cases...</div>
                ) : (
                  <>
                    <div className="flex space-x-4 bg-gray-50 ">
                      {testCases.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveTestCase(idx)}
                          className={`px-4 py-2 rounded-t-md ${activeTestCase === idx
                            ? 'bg-[#D7EFF6] font-semibold shadow-inner'
                            : 'text-gray-500'
                            }`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setActiveTestCase(-1)}
                        className={`px-4 py-2 rounded-t-md ${activeTestCase === -1
                          ? 'bg-white font-semibold shadow-inner'
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

                          <div className="text-sm text-gray-700 mb-1">
                            <strong>Input:</strong>
                          </div>
                          <pre className="bg-gray-100 p-2 mt-2 rounded text-sm text-gray-800">
                            {testCases[activeTestCase]?.sample_input ?? 'Loading...'}
                          </pre>

                          <div className="text-sm text-gray-700 mt-4 mb-1">
                            <strong>Expected Output:</strong>
                          </div>
                          <pre className="bg-gray-100 p-2 mt-2 rounded text-sm text-gray-800">
                            {testCases[activeTestCase]?.sample_output ?? 'Loading...'}
                          </pre>
                          {testCases[activeTestCase]?.status === 'passed' && (
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
                            </div>)}
                        </>
                      ) : (
                        <div className="text-gray-500 italic">Enter custom input...</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div >
  )
};

export default ProblemCard;