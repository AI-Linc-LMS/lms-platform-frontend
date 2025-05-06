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

  if (isLoading) {
    return (
      <div className="animate-pulse">
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
      <div className="text-red-500 p-4">
        Error loading problem. Please try again later.
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-gray-500 p-4">
        No problem data available.
      </div>
    );
  }

  console.log('Problem Data:', data);

  const handleCodeChange = (value: string | undefined) => {
    if (value) {
      setCode(value);
    }
  };

  const handleRunCode = () => {
    // Here you would typically call an API to run the code against test cases
    // For demo purposes, we'll simulate a response
    setTimeout(() => {
      setResults({
        success: true,
        message: "All test cases passed!",
      });
    }, 1000);
  };

  const handleSubmitCode = () => {
    onSubmit(code);
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
    <div className="problem-card-container">
      {/* Problem Description Panel */}
      <div className="problem-panel">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{data.details.title}</h2>
        <div className="flex items-center mb-4">
          <span
            className={`text-xs font-medium py-1 px-2.5 rounded-full ${data.details.difficulty_level === "Easy" ? "bg-green-100 text-green-800" :
              data.details.difficulty_level === "Medium" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }`}
          >
            {data.details.difficulty_level}
          </span>
        </div>

        <div className="prose problem-description mb-6" dangerouslySetInnerHTML={{ __html: data.details.problem_statement || "" }} />

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Input Format</h3>
          <div className="bg-gray-50 rounded-lg p-4" dangerouslySetInnerHTML={{ __html: data.details.input_format || "" }} />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Output Format</h3>
          <div className="bg-gray-50 rounded-lg p-4" dangerouslySetInnerHTML={{ __html: data.details.output_format || "" }} />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Sample Input</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm">{data.details.sample_input}</pre>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Sample Output</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="text-sm">{data.details.sample_output}</pre>
          </div>
        </div>
      </div>

      {/* Code Panel */}
      <div className="code-panel">
        <div className="code-header">
          <h2 className="text-lg font-semibold text-gray-800">Code</h2>
          <div className="code-controls">
            <div className="language-selector">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-white border border-gray-200 text-gray-700 text-sm rounded focus:ring-blue-500 focus:border-blue-500 px-3 py-1"
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="autocomplete-toggle flex items-center ml-3">
              <span className="text-sm text-gray-600 mr-2">Autocomplete</span>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  type="checkbox"
                  id="autocomplete"
                  checked={isAutocompleteEnabled}
                  onChange={() => setIsAutocompleteEnabled(!isAutocompleteEnabled)}
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="autocomplete"
                  className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${isAutocompleteEnabled ? "bg-blue-500" : "bg-gray-300"
                    }`}
                ></label>
              </div>
              <span className="ml-2 text-sm text-gray-600">{isAutocompleteEnabled ? "On" : "Off"}</span>
            </div>
            <div className="theme-toggle flex items-center ml-3">
              <span className="text-sm text-gray-600 mr-2">Theme</span>
              <div className="relative inline-block w-10 align-middle select-none">
                <input
                  type="checkbox"
                  id="theme-toggle"
                  checked={isDarkTheme}
                  onChange={handleThemeChange}
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="theme-toggle"
                  className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${isDarkTheme ? "bg-blue-500" : "bg-gray-300"}`}
                ></label>
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {isDarkTheme ? "Dark" : "Light"}
              </span>
            </div>
          </div>
        </div>

        <div className="editor-container">
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

        <div className="code-actions">
          <button
            onClick={handleRunCode}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center cursor-pointer"
          >
            <span className="mr-1">▶</span> Run Code
          </button>
          <button
            onClick={handleSubmitCode}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium ml-2 cursor-pointer"
          >
            Submit
          </button>
        </div>

        <div className="output-section">
          {results ? (
            <div
              className={`p-4 rounded-lg ${results.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
            >
              {results.message}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              Run your code to see the output here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemCard;