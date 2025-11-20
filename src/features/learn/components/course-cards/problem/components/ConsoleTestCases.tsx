import { useEffect, useRef } from "react";
import testcaseIcon from "../../../../../../commonComponents/icons/enrolled-courses/problem/testcaseIcon.png";
import { TestCase, CustomTestCase } from "../problem.types";

interface ConsoleTestCasesProps {
  testCases: TestCase[];
  activeTestCase: number;
  setActiveTestCase: (index: number) => void;
  customInput: string;
  setCustomInput: (input: string) => void;
  customTestCase: CustomTestCase;
  isRunning: boolean;
  handleCustomRunCode: () => void;
  isDarkTheme: boolean;
  startResizing: (e: React.MouseEvent) => void;
  consoleHeight: number;
}

const ConsoleTestCases: React.FC<ConsoleTestCasesProps> = ({
  testCases,
  activeTestCase,
  setActiveTestCase,
  customInput,
  setCustomInput,
  customTestCase,
  isRunning,
  handleCustomRunCode,
  isDarkTheme,
  startResizing,
  consoleHeight,
}) => {
  const consoleRef = useRef<HTMLDivElement>(null);

  // Scroll to //console when test cases are running
  useEffect(() => {
    if (isRunning && consoleRef.current) {
      consoleRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isRunning]);

  const renderTestCaseSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-4 w-24 bg-gray-200 rounded mb-4"></div>
      <div className="space-y-3">
        <div>
          <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
        <div>
          <div className="h-3 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`mb-10 ${isDarkTheme ? "bg-[#252526]" : ""}`}
      ref={consoleRef}
      style={{ height: `${consoleHeight}px`, overflowY: "auto" }}
    >
      <div className="console-resize-handle" onMouseDown={startResizing}></div>
      <div className="flex items-center text-center gap-2 p-4 text-xl font-semibold">
        <img src={testcaseIcon} className="w-6 h-6 mt-1 font-bold" /> Testcase
      </div>
      <div
        className={`border-1 mx-2 ${
          isDarkTheme ? "border-gray-600" : ""
        } rounded-xl`}
      >
        {!testCases || testCases.length === 0 ? (
          <div className="p-4 text-gray-500 italic">Loading test cases...</div>
        ) : (
          <>
            <div
              className={`flex space-x-4 ${
                isDarkTheme ? "bg-[#252526]" : "bg-gray-50"
              } rounded-t-xl `}
            >
              {testCases.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTestCase(idx)}
                  className={`px-4 py-2 rounded-t-xl ${
                    activeTestCase === idx
                      ? ` ${
                          isDarkTheme
                            ? "bg-gray-800 text-[var(--font-light)] border-gray-600"
                            : "bg-[var(--primary-50)] text-[var(--font-dark)] border-gray-300"
                        } font-semibold shadow-inner`
                      : `text-gray-500 '}`
                  }`}
                >
                  Case {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setActiveTestCase(-1)}
                className={`px-4 py-2 rounded-t-md ${
                  activeTestCase === -1
                    ? `${
                        isDarkTheme
                          ? "bg-gray-800 text-[var(--font-light)] border-gray-600"
                          : "bg-[var(--primary-50)] text-[var(--font-dark)] border-gray-300"
                      } font-semibold shadow-inner`
                    : "text-gray-500"
                }`}
              >
                Custom Input +
              </button>
            </div>

            <div className="p-4">
              {activeTestCase >= 0 ? (
                <>
                  <h3 className="mb-2 font-medium">
                    Case {activeTestCase + 1}
                  </h3>

                  <div className="text-sm text-gray-700 mb-1 ">
                    <strong>Input:</strong>
                  </div>
                  <pre
                    className={`p-2 mt-2 rounded text-sm ${
                      isDarkTheme
                        ? "bg-gray-800 text-[var(--font-light)] border-gray-600"
                        : "bg-gray-200 text-[var(--font-dark)] border-gray-300"
                    }`}
                  >
                    {testCases[activeTestCase]?.sample_input}
                  </pre>

                  <div className="text-sm text-gray-700 mt-4 mb-1">
                    <strong>Expected Output:</strong>
                  </div>
                  <pre
                    className={`p-2 mt-2 rounded text-sm text-gray-800
                    ${
                      isDarkTheme
                        ? "bg-gray-800 text-[var(--font-light)] border-gray-600"
                        : "bg-gray-200 text-[var(--font-dark)] border-gray-300"
                    } `}
                  >
                    {testCases[activeTestCase]?.sample_output}
                  </pre>
                  {testCases[activeTestCase]?.status === "running"
                    ? renderTestCaseSkeleton()
                    : testCases[activeTestCase]?.status && (
                        <div>
                          <div className="text-sm text-gray-700 mt-4 mb-1">
                            <strong>Your Output:</strong>
                          </div>
                          <pre
                            className={`p-2 mt-2 rounded text-sm ${
                              testCases[activeTestCase]?.status === "passed"
                                ? "text-green-600"
                                : testCases[activeTestCase]?.status === "failed"
                                ? "text-red-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {testCases[activeTestCase]?.userOutput || " "}
                          </pre>

                          <div className="mt-2 font-medium">
                            Status:{" "}
                            <span
                              className={`${
                                testCases[activeTestCase]?.status === "passed"
                                  ? "text-green-700"
                                  : testCases[activeTestCase]?.status ===
                                    "failed"
                                  ? "text-red-700"
                                  : "text-yellow-600"
                              }`}
                            >
                              {testCases[activeTestCase]?.verdict || testCases[activeTestCase]?.status || "failed"}
                            </span>
                          </div>

                          {testCases[activeTestCase]?.stderr && (
                            <div className="mt-3">
                              <div className="text-sm text-gray-700 mb-1">
                                <strong>Error (stderr):</strong>
                              </div>
                              <pre
                                className={`p-2 mt-2 rounded text-sm text-red-600 ${
                                  isDarkTheme
                                    ? "bg-gray-800 text-red-400 border-gray-600"
                                    : "bg-red-50 text-red-800 border-red-200"
                                }`}
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {testCases[activeTestCase]?.stderr}
                              </pre>
                            </div>
                          )}

                          {testCases[activeTestCase]?.compile_output && (
                            <div className="mt-3">
                              <div className="text-sm text-gray-700 mb-1">
                                <strong>Compile Output:</strong>
                              </div>
                              <pre
                                className={`p-2 mt-2 rounded text-sm text-orange-600 ${
                                  isDarkTheme
                                    ? "bg-gray-800 text-orange-400 border-gray-600"
                                    : "bg-orange-50 text-orange-800 border-orange-200"
                                }`}
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {testCases[activeTestCase]?.compile_output}
                              </pre>
                            </div>
                          )}

                          {testCases[activeTestCase]?.time && (
                            <div className="mt-1 text-sm text-gray-600">
                              Time: {testCases[activeTestCase]?.time}s | Memory:{" "}
                              {testCases[activeTestCase]?.memory} KB
                            </div>
                          )}
                        </div>
                      )}
                </>
              ) : (
                <div>
                  <h3 className="mb-2 font-medium">Custom Input</h3>
                  <div className="text-sm text-gray-700 mb-1">
                    <strong>Input:</strong>
                  </div>
                  <textarea
                    className={`p-2 mt-2 w-full h-24 rounded text-sm border ${
                      isDarkTheme
                        ? "bg-gray-800 text-[var(--font-light)] border-gray-600"
                        : "bg-gray-100 text-[var(--font-dark)] border-gray-300"
                    }`}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter your custom input here..."
                  />

                  <div className="mt-3">
                    <button
                      className={`run-button md:text-xs xl:text-md bg-[var(--success-500)] px-4 py-2 rounded ${
                        isRunning ? "button-loading opacity-70" : ""
                      }`}
                      onClick={handleCustomRunCode}
                      disabled={isRunning}
                    >
                      {isRunning ? "Running..." : "Run with Custom Input"}
                    </button>
                  </div>

                  {customTestCase.status === "running"
                    ? renderTestCaseSkeleton()
                    : customTestCase.output && (
                        <>
                          <div className="text-sm text-gray-700 mt-4 mb-1">
                            <strong>Output:</strong>
                          </div>
                          <pre
                            className={`p-2 mt-2 rounded text-sm ${
                              isDarkTheme
                                ? "bg-gray-800 text-[var(--font-light)] border-gray-600"
                                : "bg-gray-200 text-[var(--font-dark)] border-gray-300"
                            } ${
                              customTestCase.status === "passed"
                                ? "text-green-600"
                                : customTestCase.status === "failed"
                                ? "text-red-600"
                                : "text-yellow-600"
                            }`}
                          >
                            {customTestCase.output || " "}
                          </pre>

                          {customTestCase.verdict && (
                            <div className="mt-2 font-medium">
                              Status:{" "}
                              <span
                                className={`${
                                  customTestCase.status === "passed"
                                    ? "text-green-700"
                                    : customTestCase.status === "failed"
                                    ? "text-red-700"
                                    : "text-yellow-600"
                                }`}
                              >
                                {customTestCase.verdict}
                              </span>
                            </div>
                          )}

                          {customTestCase.stderr && (
                            <div className="mt-3">
                              <div className="text-sm text-gray-700 mb-1">
                                <strong>Error (stderr):</strong>
                              </div>
                              <pre
                                className={`p-2 mt-2 rounded text-sm text-red-600 ${
                                  isDarkTheme
                                    ? "bg-gray-800 text-red-400 border-gray-600"
                                    : "bg-red-50 text-red-800 border-red-200"
                                }`}
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {customTestCase.stderr}
                              </pre>
                            </div>
                          )}

                          {customTestCase.compile_output && (
                            <div className="mt-3">
                              <div className="text-sm text-gray-700 mb-1">
                                <strong>Compile Output:</strong>
                              </div>
                              <pre
                                className={`p-2 mt-2 rounded text-sm text-orange-600 ${
                                  isDarkTheme
                                    ? "bg-gray-800 text-orange-400 border-gray-600"
                                    : "bg-orange-50 text-orange-800 border-orange-200"
                                }`}
                                style={{ whiteSpace: "pre-wrap" }}
                              >
                                {customTestCase.compile_output}
                              </pre>
                            </div>
                          )}

                          {customTestCase.time && (
                            <div className="mt-1 text-sm text-gray-600">
                              Time: {customTestCase.time}s | Memory:{" "}
                              {customTestCase.memory} KB
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
  );
};

export default ConsoleTestCases;
