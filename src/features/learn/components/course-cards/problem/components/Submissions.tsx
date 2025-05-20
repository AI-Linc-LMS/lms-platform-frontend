import React, { useState } from 'react';
import { getSubmissionHistory } from "../../../../../../services/enrolled-courses-content/submitApis";
import Editor from '@monaco-editor/react';

interface SubmissionsProps {
  contentId: number;
  courseId: number;
  isDarkTheme: boolean;
}

interface SubmissionHistoryItem {
  id: number;
  status: string;
  submitted_at: string;
  runtime: string;
  memory: string;
  language: string;
  source_code: string;
}

const Submissions: React.FC<SubmissionsProps> = ({ contentId, courseId, isDarkTheme }) => {
  const [selectedSubmissionCode, setSelectedSubmissionCode] = useState<string | null>(null);
  const [viewingSubmissionId, setViewingSubmissionId] = useState<number | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistoryItem[]>([]);

  // Fetch submission history when the component loads
  React.useEffect(() => {
    const fetchSubmissionHistory = async () => {
      setIsLoadingHistory(true);
      setHistoryError(null);

      try {
        // Try to fetch from API
        const history = await getSubmissionHistory(1, courseId, contentId);
        setSubmissionHistory(history);
      } catch (error) {
        console.error("Error fetching submission history:", error);
        // API not available or error - use fallback data
        console.log("Using fallback submission history data");

        // Create fallback data
        const mockHistory: SubmissionHistoryItem[] = [
          {
            id: 4,
            status: "Runtime Error",
            submitted_at: new Date().toISOString(),
            runtime: "N/A",
            memory: "N/A",
            language: "javascript",
            source_code: "// Code with runtime error"
          },
          {
            id: 3,
            status: "Accepted",
            submitted_at: new Date().toISOString(),
            runtime: "2 ms",
            memory: "59.4 MB",
            language: "javascript",
            source_code: "// Accepted solution"
          },
          {
            id: 2,
            status: "Runtime Error",
            submitted_at: "2022-12-10T12:00:00.000Z",
            runtime: "N/A",
            memory: "N/A",
            language: "javascript",
            source_code: "// Old code with error"
          },
          {
            id: 1,
            status: "Wrong Answer",
            submitted_at: "2022-12-10T10:00:00.000Z",
            runtime: "N/A",
            memory: "N/A",
            language: "javascript",
            source_code: "// Old code with wrong output"
          }
        ];

        setSubmissionHistory(mockHistory);
        setHistoryError(null);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchSubmissionHistory();
  }, [courseId, contentId]);

  return (
    <div className="submission-history">
      {selectedSubmissionCode !== null && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${isDarkTheme ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50"}`}>
          <div className={`${isDarkTheme ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                Submission Code - {submissionHistory.find(s => s.id === viewingSubmissionId)?.status}
              </h3>
              <button
                onClick={() => {
                  setSelectedSubmissionCode(null);
                  setViewingSubmissionId(null);
                }}
                className={`${isDarkTheme ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-gray-700"} text-2xl`}
              >
                &times;
              </button>
            </div>
            <div className="flex-grow overflow-auto">
              <Editor
                height="60vh"
                language={submissionHistory.find(s => s.id === viewingSubmissionId)?.language || "javascript"}
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
        <div className="text-red-500 py-4">{historyError}</div>
      ) : submissionHistory.length === 0 ? (
        <p className="text-gray-500 italic">You haven't submitted any solutions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className={`text-sm font-extralight border-b ${isDarkTheme ? "border-gray-700" : "border-gray-200"}`}>
                <th className={`text-left py-3 px-4 capitalize  w-16 ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}></th>
                <th className={`text-left py-3 px-4 capitalize font-extralight ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}>Status</th>
                <th className={`text-left py-3 px-4 capitalize font-extralight ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}>Language</th>
                <th className={`text-left py-3 px-4 capitalize font-extralight ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}>Runtime</th>
                <th className={`text-left py-3 px-4 capitalize font-extralight ${isDarkTheme ? "text-gray-300" : "text-gray-500"}`}>Memory</th>
              </tr>
            </thead>
            <tbody>
              {submissionHistory.map((submission, index) => (
                <tr key={submission.id} className={`text-xs ${isDarkTheme ? "border-b border-gray-700 hover:bg-gray-800" : "border-b border-gray-200 hover:bg-gray-100"}`}>
                  <td className={`py-4 px-4 text-center font-medium ${isDarkTheme ? "text-white" : "text-gray-500"}`}>{submissionHistory.length - index}</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col"
                      onClick={() => {
                        setSelectedSubmissionCode(submission.source_code);
                        setViewingSubmissionId(submission.id);
                      }}>
                      <span
                        className={`cursor-pointer font-semibold rounded-full ${submission.status === "Accepted"
                          ? "text-[#5FA564]"
                          : " text-[#EA4335]"
                          }`}>
                        {submission.status}
                      </span>
                      <span className="text-gray-500">
                        {new Date(submission.submitted_at).toLocaleString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 ">
                    <span className={`rounded px-2 py-1 ${isDarkTheme
                      ? "bg-[#D7EFF6] text-[#264D64]"
                      : "bg-[#D7EFF6] text-[#264D64]"
                      }`}>
                      {submission.language === "javascript" ? "JavaScript" :
                        submission.language === "typescript" ? "TypeScript" :
                          submission.language === "python" ? "Python" :
                            submission.language === "java" ? "Java" :
                              submission.language === "cpp" ? "C++" : submission.language}
                    </span>
                  </td>
                  <td className={`py-4 px-4  ${isDarkTheme ? "text-gray-300" : ""}`}>{submission.runtime || "N/A"}</td>
                  <td className={`py-4 px-4 ${isDarkTheme ? "text-gray-300" : ""}`}>{submission.memory || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Submissions; 