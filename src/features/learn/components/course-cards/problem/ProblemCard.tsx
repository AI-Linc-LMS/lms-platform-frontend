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

  const [code, setCode] = useState("// Write your code here");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [isAutocompleteEnabled, setIsAutocompleteEnabled] = useState(true);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem('ide-theme');
    return saved ? saved === 'dark' : false;
  });
  const [results, setResults] = useState<null | { success: boolean; message: string }>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("description");

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
    
    // Simulate code execution
    setTimeout(() => {
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
    
    // Simulate submission
    setTimeout(() => {
      onSubmit(code);
      setResults({
        success: true,
        message: "Solution accepted! Your submission beats 85% of users in runtime.",
      });
      setIsSubmitting(false);
    }, 1500);
  };

  const languageOptions = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
  ];

  // Save theme preference
  const handleThemeChange = () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    localStorage.setItem('ide-theme', newTheme ? 'dark' : 'light');
  };

  return (
    <div className={`problem-card-container rounded-2xl ${isDarkTheme ? 'dark-mode' : ''}`}>
      <div className="problem-header rounded-2xl">
        <div className="problem-title-section">
          <h1 className="problem-title">{data.details.title}</h1>
          <span
            className={`difficulty-badge ${
              data.details.difficulty_level === "Easy" ? "easy" :
              data.details.difficulty_level === "Medium" ? "medium" : "hard"
            }`}
          >
            {data.details.difficulty_level}
          </span>
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
              <div className="language-selector">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="language-select"
                >
                  {languageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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

          <div className="monaco-editor-container">
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
            
            <div className="editor-footer">
              <div className="results-container">
                {results && (
                  <div className={`results ${results.success ? 'success' : 'error'}`}>
                    {results.message}
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