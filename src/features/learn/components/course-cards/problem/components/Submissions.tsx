import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pastSubmissions } from '../../../../../../services/enrolled-courses-content/courseContentApis';
import Editor from '@monaco-editor/react';

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
    source_code: string;
    passed: number;
    failed: number;
    total_test_cases: number;
  }
  created_at: string;
  result: string;
}

const Submissions: React.FC<SubmissionsProps> = ({ contentId, courseId, isDarkTheme }) => {
  const [selectedSubmissionCode, setSelectedSubmissionCode] = useState<string | null>(null);
  const [viewingSubmissionId, setViewingSubmissionId] = useState<number | null>(null);

  const { data: submissionHistory, isLoading: isLoadingHistory, error: historyError } = useQuery({
    queryKey: ['submissions', courseId, contentId],
    queryFn: () => pastSubmissions(1, courseId, contentId)
  });

  console.log("submissionHistory", submissionHistory);
  // Function to get language name from language ID
  const getLanguageName = (languageId: number) => {
    switch (languageId) {
      case 63: return "JavaScript";
      case 74: return "TypeScript";
      case 71: return "Python";
      case 62: return "Java";
      case 54: return "C++";
      default: return "Unknown";
    }
  };

  return (
    <div className="submission-history">
      {selectedSubmissionCode !== null && (
        <div className={`fixed inset-0 flex items-center justify-center z-50 ${isDarkTheme ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50"}`}>
          <div className={`${isDarkTheme ? "bg-gray-800" : "bg-white"} p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-xl font-bold ${isDarkTheme ? "text-white" : "text-gray-800"}`}>
                Submission Code - {submissionHistory?.find((s: SubmissionHistoryItem) => s.id === viewingSubmissionId)?.status}
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
                language={getLanguageName(submissionHistory?.find((s: SubmissionHistoryItem) => s.id === viewingSubmissionId)?.language_id || 71)}
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
        <div className="text-red-500 py-4">{historyError instanceof Error ? historyError.message : "Failed to load submissions"}</div>
      ) : !submissionHistory || submissionHistory.length === 0 ? (
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
              {submissionHistory.map((submission: SubmissionHistoryItem, index: number) => (
                <tr key={submission.id} className={`text-xs ${isDarkTheme ? "border-b border-gray-700 hover:bg-gray-800" : "border-b border-gray-200 hover:bg-gray-100"}`}>
                  <td className={`py-4 px-4 text-center font-medium ${isDarkTheme ? "text-white" : "text-gray-500"}`}>{submissionHistory.length - index}</td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col"
                      onClick={() => {
                        setSelectedSubmissionCode(submission.custom_dimension.source_code);
                        setViewingSubmissionId(submission.id);
                      }}>
                      <span
                        className={`cursor-pointer font-semibold rounded-full ${submission.custom_dimension.status === "Accepted"
                          ? "text-[#5FA564]"
                          : " text-[#EA4335]"
                          }`}>
                        {submission.custom_dimension.status}
                      </span>
                      <span className="text-gray-500">
                        {new Date(submission.created_at).toLocaleString('en-US', {
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
                      {getLanguageName(submission.custom_dimension.language_id)}
                    </span>
                  </td>
                  <td className={`py-4 px-4  ${isDarkTheme ? "text-gray-300" : ""}`}>{submission.custom_dimension.time ? `${submission.custom_dimension.time.toFixed(3)} ms` : "N/A"}</td>
                  <td className={`py-4 px-4 ${isDarkTheme ? "text-gray-300" : ""}`}>{submission.custom_dimension.memory ? `${(submission.custom_dimension.memory / 1024).toFixed(1)} MB` : "N/A"}</td>
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