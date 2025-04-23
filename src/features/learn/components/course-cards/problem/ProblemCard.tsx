import React, { useState } from "react";
import Editor from '@monaco-editor/react';
import './ProblemCard.css';

interface ProblemCardProps {
  problemId: string;
  title: string;
  description: string;
  difficulty: string;
  testCases: {
    input: string;
    output: string;
  }[];
  initialCode: string;
  language: string;
  onSubmit: (code: string) => void;
}

const ProblemCard: React.FC<ProblemCardProps> = ({
  /* We keep problemId even though it's not directly used in the component
     because it might be needed for future functionality like tracking progress */
  title,
  description,
  difficulty,
  testCases,
  initialCode,
  language,
  onSubmit,
}) => {
  const [code, setCode] = useState(initialCode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [isAutocompleteEnabled, setIsAutocompleteEnabled] = useState(true);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [results, setResults] = useState<null | { success: boolean; message: string }>(null);

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

  return (
    <div className="problem-card-container">
      {/* Problem Description Panel */}
      <div className="problem-panel">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
        <div className="flex items-center mb-4">
          <span
            className={`text-xs font-medium py-1 px-2.5 rounded-full ${difficulty === "Easy" ? "bg-green-100 text-green-800" :
              difficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
                "bg-red-100 text-red-800"
              }`}
          >
            {difficulty}
          </span>
        </div>

        <div className="prose problem-description mb-6" dangerouslySetInnerHTML={{ __html: description }} />

        <h3 className="text-lg font-semibold mb-4">Test Cases</h3>
        <div className="flex space-x-2 mb-4">
          {testCases.map((_, index) => (
            <button
              key={index}
              className={`test-case-btn px-3 py-1 text-sm rounded ${activeTestCase === index
                ? "bg-blue-100 text-blue-700 font-medium"
                : "bg-gray-100 text-gray-600"
                }`}
              onClick={() => setActiveTestCase(index)}
            >
              Case {index + 1}
            </button>
          ))}
        </div>
        <div className="bg-gray-50 rounded-lg p-4 my-10">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-1">Input:</h4>
            <pre className="bg-white p-2 rounded border text-sm">
              {testCases[activeTestCase].input}
            </pre>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Expected Output:</h4>
            <pre className="bg-white p-2 rounded border text-sm">
              {testCases[activeTestCase].output}
            </pre>
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
          </div>
        </div>

        <div className="editor-container">
          <Editor
            height="100%"
            language={selectedLanguage}
            value={code}
            onChange={handleCodeChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: "on",
              suggestOnTriggerCharacters: isAutocompleteEnabled,
            }}
          />
        </div>

        <div className="code-actions">
          <button
            onClick={handleRunCode}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center"
          >
            <span className="mr-1">▶</span> Run Code
          </button>
          <button
            onClick={handleSubmitCode}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium ml-2"
          >
            Submit
          </button>
        </div>

        <div className="testcase-section">
          <h3 className="text-lg font-semibold mb-2">Testcase</h3>
          <div className="testcase-tabs">
            <button className="testcase-tab active">Case 1</button>
            <button className="testcase-tab">Case 2</button>
          </div>
          <div className="testcase-content">
            <div className="testcase-item">
              <h4 className="text-sm font-medium text-gray-700">root=</h4>
              <pre className="bg-white p-2 rounded border text-sm mt-1">
                {testCases[activeTestCase].input}
              </pre>
            </div>
          </div>
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
