import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { pastSubmissions } from "../../../../../../services/enrolled-courses-content/courseContentApis";
import Editor from "@monaco-editor/react";

interface SubmissionsProps {
  contentId: number;
  courseId: number;
  isDarkTheme: boolean;
}

interface SubmissionHistoryItem {
  id: number;
  custom_dimension: {
    status: string;
    time: number;
    memory: number;
    language_id: number;
    language_name?: string;
    source_code: string;
    passed: number;
    failed: number;
    total_test_cases: number;
  };
  created_at: string;
  result: string;
}

// Default values for missing data
const DEFAULT_SUBMISSION: SubmissionHistoryItem = {
  id: 0,
  custom_dimension: {
    status: "Pending",
    time: 0,
    memory: 0,
    language_id: 71, // Default to Python
    language_name: "Python",
    source_code: "// No code available",
    passed: 0,
    failed: 0,
    total_test_cases: 0,
  },
  created_at: new Date().toISOString(),
  result: "Pending",
};

const Submissions: React.FC<SubmissionsProps> = ({
  contentId,
  courseId,
  isDarkTheme,
}) => {
  const [selectedSubmissionCode, setSelectedSubmissionCode] = useState<
    string | null
  >(null);
  const [viewingSubmissionId, setViewingSubmissionId] = useState<number | null>(
    null
  );
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const {
    data: submissionHistory,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useQuery({
    queryKey: ["submissions", courseId, contentId],
    queryFn: () => pastSubmissions(clientId, courseId, contentId),
    retry: 2, // Retry failed requests twice
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Function to get language name - use backend language_name if available, otherwise fallback to mapping
  const getLanguageName = (
    customDimension: SubmissionHistoryItem["custom_dimension"]
  ) => {
    // First try to use the language_name from backend if available
    if (customDimension?.language_name) {
      return customDimension.language_name;
    }

    // Fallback to language ID mapping
    const languageId = customDimension?.language_id;
    switch (languageId) {
      case 63:
        return "JavaScript";
      case 74:
        return "TypeScript";
      case 71:
        return "Python";
      case 62:
        return "Java";
      case 54:
        return "C++";
      default:
        return "Unknown";
    }
  };

  // Function to get Monaco Editor language for syntax highlighting
  const getMonacoLanguage = (
    customDimension: SubmissionHistoryItem["custom_dimension"]
  ) => {
    // Use language_name from backend if available
    if (customDimension?.language_name) {
      const langName = customDimension.language_name.toLowerCase();
      if (langName.includes("python")) return "python";
      if (langName.includes("java")) return "java";
      if (langName.includes("c++") || langName.includes("cpp")) return "cpp";
      if (langName.includes("javascript")) return "javascript";
      if (langName.includes("typescript")) return "typescript";
    }

    // Fallback to language ID mapping
    const languageId = customDimension?.language_id;
    switch (languageId) {
      case 63:
        return "javascript";
      case 74:
        return "typescript";
      case 71:
        return "python";
      case 62:
        return "java";
      case 54:
        return "cpp";
      default:
        return "plaintext";
    }
  };

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "accepted":
        return "text-[var(--success-500)]";
      case "pending":
        return "text-yellow-500";
      case "wrong answer":
        return "text-[var(--error-500)]";
      case "error":
      case "failed":
        return "text-[var(--error-500)]";
      default:
        return "text-gray-500";
    }
  };

  // Function to format date safely
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  // Function to format memory safely
  const formatMemory = (memory: number) => {
    if (!memory || isNaN(memory)) return "N/A";
    return `${(memory / 1024).toFixed(1)} MB`;
  };

  // Function to format time safely
  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "N/A";
    return `${time.toFixed(3)} ms`;
  };

  return (
    <div className="submission-history">
      {selectedSubmissionCode !== null && (
        <div
          className={`fixed inset-0 flex items-center justify-center z-50 ${
            isDarkTheme ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50"
          }`}
        >
          <div
            className={`${
              isDarkTheme ? "bg-gray-800" : "bg-white"
            } p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className={`text-xl font-bold ${
                  isDarkTheme ? "text-[var(--font-light)]" : "text-gray-800"
                }`}
              >
                Submission Code -{" "}
                {submissionHistory?.find(
                  (s: SubmissionHistoryItem) => s.id === viewingSubmissionId
                )?.custom_dimension?.status || "Unknown"}
              </h3>
              <button
                onClick={() => {
                  setSelectedSubmissionCode(null);
                  setViewingSubmissionId(null);
                }}
                className={`${
                  isDarkTheme
                    ? "text-gray-300 hover:text-[var(--font-light)]"
                    : "text-gray-500 hover:text-gray-700"
                } text-2xl`}
              >
                &times;
              </button>
            </div>
            <div className="flex-grow overflow-auto">
              <Editor
                height="60vh"
                language={getMonacoLanguage(
                  submissionHistory?.find(
                    (s: SubmissionHistoryItem) => s.id === viewingSubmissionId
                  )?.custom_dimension
                )}
                value={selectedSubmissionCode}
                theme={isDarkTheme ? "vs-dark" : "light"}
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: "on",
                  lineNumbers: "on",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {isLoadingHistory ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : historyError ? (
        <div className="text-center py-8">
          <div
            className={`mb-2 ${
              isDarkTheme ? "text-red-400" : "text-red-500"
            }`}
          >
            Failed to load submissions
          </div>
          <p
            className={`text-sm ${
              isDarkTheme ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Please try refreshing the page or contact support if the problem
            persists.
          </p>
        </div>
      ) : !submissionHistory || submissionHistory.length === 0 ? (
        <div className="text-center py-8">
          <p
            className={`mb-2 ${
              isDarkTheme ? "text-gray-400" : "text-gray-500"
            }`}
          >
            No submissions found
          </p>
          <p
            className={`text-sm ${
              isDarkTheme ? "text-gray-500" : "text-gray-400"
            }`}
          >
            Start by submitting your first solution!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr
                className={`text-sm font-extralight border-b ${
                  isDarkTheme ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"
                }`}
              >
                <th
                  className={`text-left py-3 px-4 capitalize w-16 ${
                    isDarkTheme ? "text-gray-300" : "text-gray-700"
                  }`}
                ></th>
                <th
                  className={`text-left py-3 px-4 capitalize font-extralight ${
                    isDarkTheme ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Status
                </th>
                <th
                  className={`text-left py-3 px-4 capitalize font-extralight ${
                    isDarkTheme ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Language
                </th>
                <th
                  className={`text-left py-3 px-4 capitalize font-extralight ${
                    isDarkTheme ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Runtime
                </th>
                <th
                  className={`text-left py-3 px-4 capitalize font-extralight ${
                    isDarkTheme ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Memory
                </th>
              </tr>
            </thead>
            <tbody>
              {submissionHistory.map(
                (submission: SubmissionHistoryItem, index: number) => {
                  const safeSubmission = {
                    ...DEFAULT_SUBMISSION,
                    ...submission,
                  };
                  const customDimension =
                    safeSubmission.custom_dimension ||
                    DEFAULT_SUBMISSION.custom_dimension;

                  return (
                    <tr
                      key={submission.id}
                      className={`text-xs ${
                        isDarkTheme
                          ? "border-b border-gray-700 hover:bg-gray-800/50"
                          : "border-b border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <td
                        className={`py-4 px-4 text-center font-medium ${
                          isDarkTheme ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {submissionHistory.length - index}
                      </td>
                      <td className="py-4 px-4">
                        <div
                          className="flex flex-col"
                          onClick={() => {
                            setSelectedSubmissionCode(
                              customDimension.source_code
                            );
                            setViewingSubmissionId(submission.id);
                          }}
                        >
                          <span
                            className={`cursor-pointer font-semibold rounded-full ${getStatusColor(
                              customDimension.status
                            )}`}
                          >
                            {customDimension.status || "Unknown"}
                          </span>
                          <span
                            className={`text-xs mt-1 ${
                              isDarkTheme ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {formatDate(safeSubmission.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`rounded px-2 py-1 text-xs ${
                            isDarkTheme
                              ? "bg-gray-700 text-gray-300"
                              : "bg-[var(--primary-50)] text-[var(--secondary-700)]"
                          }`}
                        >
                          {getLanguageName(customDimension)}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-4 ${
                          isDarkTheme ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {formatTime(customDimension.time)}
                      </td>
                      <td
                        className={`py-4 px-4 ${
                          isDarkTheme ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {formatMemory(customDimension.memory)}
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Submissions;
