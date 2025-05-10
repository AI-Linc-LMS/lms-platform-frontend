import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCourseContent } from "../../../../../services/courses-content/courseContentApis";
import Editor from '@monaco-editor/react';
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
  input: string;
  expectedOutput: string;
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
  const [activeConsoleTab, setActiveConsoleTab] = useState("testcases");
  const [customInput, setCustomInput] = useState("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [isDropdownHovered, setIsDropdownHovered] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0].value);

  // Mock test cases based on sample input/output from the problem
  React.useEffect(() => {
    if (data?.details) {
      setTestCases([
        {
          input: data.details.sample_input,
          expectedOutput: data.details.sample_output,
          status: undefined
        },
        {
          input: "Mock test case 2 input",
          expectedOutput: "Mock test case 2 output",
          status: undefined
        }
      ]);
    }
  }, [data]);

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
        userOutput: tc.expectedOutput, // In a real app, this would be the actual output
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
        userOutput: tc.expectedOutput, // In a real app, this would be the actual output
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
      <div className="problem-header rounded-2xl">
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

      </div>

      <div className="leetcode-layout">
        {/* Left panel with problem description */}
        <div className="description-panel">
          <div className="description-tabs">
            <button
              className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`tab-button ${activeTab === 'solutions' ? 'active' : ''}`}
              onClick={() => setActiveTab('solutions')}
            >
              Solutions
            </button>
            <button
              className={`tab-button ${activeTab === 'discussion' ? 'active' : ''}`}
              onClick={() => setActiveTab('discussion')}
            >
              Submissions
            </button>
          </div>

          <div className="description-content">
            {activeTab === 'description' && (
              <>
                <div className="problem-description" dangerouslySetInnerHTML={{ __html: data.details.problem_statement || "" }} />

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
          <div className="editor-header">
            <div className="header-top-row">
              <div
                className="relative inline-block text-sm"
                onClick={() => setIsDropdownHovered(!isDropdownHovered)}
              >
                {/* Trigger */}
                <div
                  className={`border text-center px-2 py-1 cursor-pointer flex justify-between items-center w-25 rounded-md ${isDarkTheme
                    ? "bg-gray-800 text-white border-gray-600"
                    : "bg-white text-black border-gray-300"
                    }`}
                >
                  <span>{languageOptions.find(opt => opt.value === selectedLanguage)?.label}</span>
                  <span className="text-[13px]">{isDropdownHovered ? "▲" : "▼"}</span>
                </div>

                {/* Dropdown options */}
                {isDropdownHovered && (
                  <ul
                    className={`absolute left-0 mt-1 w-40 rounded-md shadow-md z-10 border ${isDarkTheme
                      ? "bg-gray-800 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-black"
                      }`}
                  >
                    {languageOptions.map(option => (
                      <li
                        key={option.value}
                        onClick={() => {
                          setSelectedLanguage(option.value);
                          setIsDropdownHovered(false);
                        }}
                        className={`px-3 py-1 cursor-pointer hover:bg-gray-100 ${isDarkTheme ? "hover:bg-gray-700" : ""
                          }`}
                      >
                        {option.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* <div className="run-submit-buttons">
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
              </div> */}
            </div>

            {/* <div className="editor-actions">
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
            </div> */}
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
              <div className="console-resize-handle" onMouseDown={startResizing}></div>
              <div className="console-panel" style={{ height: `${consoleHeight}px` }}>
                <div className="console-tabs">
                  <button
                    className={`console-tab ${activeConsoleTab === 'testcases' ? 'active' : ''}`}
                    onClick={() => setActiveConsoleTab('testcases')}
                  >
                    Test Cases
                  </button>
                  <button
                    className={`console-tab ${activeConsoleTab === 'customInput' ? 'active' : ''}`}
                    onClick={() => setActiveConsoleTab('customInput')}
                  >
                    Custom Input
                  </button>
                  <button
                    className={`console-tab ${activeConsoleTab === 'console' ? 'active' : ''}`}
                    onClick={() => setActiveConsoleTab('console')}
                  >
                    Console
                  </button>
                </div>

                <div className="console-content">
                  {activeConsoleTab === 'testcases' && (
                    <div className="testcases-content">
                      {testCases.map((testCase, index) => (
                        <div key={index} className={`testcase ${testCase.status}`}>
                          <div className="testcase-header">
                            <div className="testcase-title">
                              Test Case {index + 1}
                              {testCase.status && (
                                <span className={`testcase-status ${testCase.status}`}>
                                  {testCase.status === 'passed' ? '✓ Passed' :
                                    testCase.status === 'failed' ? '✗ Failed' :
                                      '⟳ Running'}
                                </span>
                              )}
                            </div>
                            <button className="testcase-expand">▼</button>
                          </div>
                          <div className="testcase-details">
                            <div className="testcase-section">
                              <div className="testcase-label">Input:</div>
                              <pre className="testcase-value">{testCase.input}</pre>
                            </div>
                            <div className="testcase-section">
                              <div className="testcase-label">Expected Output:</div>
                              <pre className="testcase-value">{testCase.expectedOutput}</pre>
                            </div>
                            {testCase.userOutput && (
                              <div className="testcase-section">
                                <div className="testcase-label">Your Output:</div>
                                <pre className="testcase-value">{testCase.userOutput}</pre>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeConsoleTab === 'customInput' && (
                    <div className="custom-input-content">
                      <div className="custom-input-wrapper">
                        <textarea
                          className="custom-input-textarea"
                          value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="Enter your custom input here..."
                        />
                      </div>
                      <div className="custom-input-actions">
                        <button
                          className="custom-input-run"
                          onClick={() => {
                            // Simulate running with custom input
                            setIsRunning(true);
                            setTimeout(() => {
                              setIsRunning(false);
                              setResults({
                                success: true,
                                message: "Custom input test passed!",
                              });
                            }, 1000);
                          }}
                          disabled={isRunning}
                        >
                          Run
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConsoleTab === 'console' && (
                    <div className="console-output">
                      {results && (
                        <div className={`results ${results.success ? 'success' : 'error'}`}>
                          {results.message}
                        </div>
                      )}
                      <div className="console-log">
                        {/* Console output would be displayed here */}
                        {isRunning ? 'Executing code...' : '> Console output will appear here'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemCard;