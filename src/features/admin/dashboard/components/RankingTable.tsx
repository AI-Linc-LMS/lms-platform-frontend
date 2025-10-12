import React from "react";
import { LeaderboardEntry } from "../pages/Dashboard";

interface StudentRankingProps {
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: Error | null;
}

const StudentRanking: React.FC<StudentRankingProps> = ({
  leaderboard,
  isLoading,
  error,
}) => {
  if (isLoading || error || !leaderboard || leaderboard.length === 0) {
    return (
      <div className="flex flex-col transition-all duration-300 p-4 rounded-3xl lg:min-w-[270px] xl:min-w-[350px]">
        <h2 className="text-xl font-semibold text-[var(--neutral-500)] mb-3">
          Student Ranking
        </h2>
        <p className="text-[14px] text-[var(--neutral-400)] mb-2">
          No leaderboard available
        </p>
        <div className="bg-[#DEE2E6] rounded-xl px-4 py-5 flex items-center gap-2 max-w-md mt-2">
          <div className="mt-0.5 text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          </div>
          <p className="text-[13px] text-[var(--neutral-300)]">
            As you complete modules you will move top of the leaderboard and
            earn exciting rewards.
          </p>
        </div>
      </div>
    );
  }

  // Defensive rendering: ensure array, limit to top 10, and provide safe fallbacks
  const safeRows = (Array.isArray(leaderboard) ? leaderboard : [])
    .filter((row) => row && (typeof row.marks === "number" || typeof row.rank === "number"))
    .slice(0, 10);

  return (
    <div className="flex flex-col transition-all duration-300 px-4">
      <h2 className="text-xl font-semibold text-[var(--primary-500)] mb-3">
        Student Ranking
      </h2>

      <div className="flex w-full border border-gray-300 rounded-xl overflow-hidden min-w-[300px]">
        <table className="text-center border-collapse min-h-[450px] w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b border-r border-gray-300 bg-[var(--primary-50)]  h-[50px] text-xs text-[var(--font-dark)]">
                Standing
              </th>
              <th className="border-b border-r border-gray-300 bg-[var(--primary-50)] h-[50px] text-xs text-[var(--font-dark)]">
                Name
              </th>
              <th className="border-b border-r border-gray-300 bg-[var(--primary-50)] h-[50px] text-xs text-[var(--font-dark)]">
                Course
              </th>
              <th className="border-b border-gray-300 bg-[var(--primary-50)] h-[50px] text-xs text-[var(--font-dark)]">
                Marks
              </th>
            </tr>
          </thead>
          <tbody>
            {safeRows.map((item: LeaderboardEntry, index: number) => {
              const standing = typeof item?.rank === "number" ? item.rank : index + 1;
              const name = item?.name || "—";
              const course = item?.course || "—";
              const marks = typeof item?.marks === "number" ? item.marks : 0;
              const displayCourse = course.length > 13 ? `${course.substring(0, 13)}...` : course;
              return (
                <tr
                  key={index}
                  className={`group relative transition-all duration-300 hover:bg-[#E9F7FA]`}
                >
                  <td className="border-b border-r border-gray-300  h-[50px] text-[12px]">
                    <span>{standing}</span>
                  </td>
                  <td className="border-b border-r border-gray-300  h-[50px] text-[12px]">
                    <span>{name}</span>
                  </td>
                  <td className="border-b border-r border-gray-300  h-[50px] text-[12px] p-1" title={course}>
                    <span>{displayCourse}</span>
                  </td>
                  <td className="border-b border-gray-300  h-[50px] text-[12px]">
                    <span className="">{marks}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scoring breakdown info */}
      <div className="bg-[#DEE2E6] rounded-xl px-4 py-5 flex items-start gap-2 max-w-xl my-4">
        <div className="mt-0.5 text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </div>
        <div className="text-[13px] text-[var(--neutral-300)]">
          <p className="mb-1 font-medium text-gray-600">How marks are calculated</p>
          <ul className="list-disc ml-5 space-y-0.5 text-gray-600">
            <li>VideoTutorial: 10 points</li>
            <li>Quiz: 20 points</li>
            <li>Assignment: 30 points</li>
            <li>Article: 5 points</li>
            <li>CodingProblem: 50 points</li>
          </ul>
          <p className="mt-2 text-gray-500">Top 10 students are shown based on total marks earned.</p>
        </div>
      </div>
    </div>
  );
};

export default StudentRanking;
