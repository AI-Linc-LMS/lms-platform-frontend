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
      <div className="flex flex-col transition-all duration-300 p-6 rounded-2xl shadow-md w-full h-[430px] bg-[var(--card-bg)] ring-1 ring-[var(--primary-100)] ring-offset-1">
        <h2 className="text-xl font-bold text-[var(--primary-500)] mb-6">
          Student Ranking
        </h2>
        <p className="text-sm text-gray-500 mb-4">No leaderboard available</p>
        <div className="bg-[#F0F4FF] rounded-xl px-5 py-6 flex items-start gap-3 mt-2 border border-[var(--primary-100)]">
          <div className="mt-0.5 text-[var(--primary-500)]">
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
          <p className="text-[13px] text-[var(--neutral-300)] leading-relaxed">
            As you complete modules you will move to the top of the leaderboard
            and earn exciting rewards.
          </p>
        </div>
      </div>
    );
  }

  // Defensive rendering: ensure array, limit to top 10, and provide safe fallbacks
  const safeRows = (Array.isArray(leaderboard) ? leaderboard : [])
    .filter(
      (row) =>
        row && (typeof row.marks === "number" || typeof row.rank === "number")
    )
    .slice(0, 10);

  return (
    <div className="flex flex-col transition-all duration-300 p-6 rounded-2xl shadow-md bg-[var(--card-bg)] ring-1 ring-[var(--primary-100)] ring-offset-1 w-full h-[430px]">
      <h2 className="text-xl font-bold text-[var(--primary-500)] mb-6">
        Student Ranking
      </h2>

      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="text-center border-collapse w-full">
          <thead className="bg-gradient-to-r from-[var(--primary-50)] to-[#E6F0FF] sticky top-0 z-10">
            <tr>
              <th className="border-b-2 border-r border-[var(--primary-200)] h-[48px] text-xs font-semibold text-[var(--primary-700)] uppercase tracking-wide">
                Rank
              </th>
              <th className="border-b-2 border-r border-[var(--primary-200)] h-[48px] text-xs font-semibold text-[var(--primary-700)] uppercase tracking-wide">
                Name
              </th>
              <th className="border-b-2 border-r border-[var(--primary-200)] h-[48px] text-xs font-semibold text-[var(--primary-700)] uppercase tracking-wide">
                Course
              </th>
              <th className="border-b-2 border-[var(--primary-200)] h-[48px] text-xs font-semibold text-[var(--primary-700)] uppercase tracking-wide">
                Marks
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--card-bg)]">
            {safeRows.map((item: LeaderboardEntry, index: number) => {
              const standing =
                typeof item?.rank === "number" ? item.rank : index + 1;
              const name = item?.name || "—";
              const course = item?.course || "—";
              const marks = typeof item?.marks === "number" ? item.marks : 0;
              const displayCourse =
                course.length > 18 ? `${course.substring(0, 18)}...` : course;
              const isTopThree = standing <= 3;

              return (
                <tr
                  key={index}
                  className={`group relative transition-all duration-200 hover:bg-[#F0F8FF] ${
                    isTopThree ? "bg-[#FFFBF0]" : ""
                  }`}
                >
                  <td className="border-b border-r border-gray-200 h-[52px] text-sm font-medium">
                    <div className="flex items-center justify-center gap-1">
                      {isTopThree && (
                        <span className="text-lg inline-flex items-center">
                          <img
                            src={
                              standing === 1
                                ? "/gold-medal.png"
                                : standing === 2
                                ? "/silver-medal.png"
                                : "/bronze-medal.png"
                            }
                            alt={`medal-${standing}`}
                            className="w-5 h-5 object-contain mr-0.5"
                          />
                        </span>
                      )}
                      <span
                        className={
                          isTopThree
                            ? "text-[var(--primary-600)] font-bold"
                            : "text-gray-700"
                        }
                      >
                        {standing}
                      </span>
                    </div>
                  </td>
                  <td className="border-b border-r border-gray-200 h-[52px] text-sm px-2">
                    <span className="font-medium text-gray-800">{name}</span>
                  </td>
                  <td
                    className="border-b border-r border-gray-200 h-[52px] text-xs px-2 text-gray-600"
                    title={course}
                  >
                    <span>{displayCourse}</span>
                  </td>
                  <td className="border-b border-gray-200 h-[52px] text-sm">
                    <span className="font-semibold text-[var(--primary-600)]">
                      {marks}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Scoring breakdown info */}
      <div className="bg-[#F0F4FF] rounded-xl px-4 py-4 flex items-start gap-2 mt-4 border border-[var(--primary-100)]">
        <div className="mt-0.5 text-[var(--primary-500)] flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
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
        <div className="text-[11px] text-gray-700">
          <p className="font-semibold text-gray-800 mb-1">Points System</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            <span>Video: 10</span>
            <span>Quiz: 20</span>
            <span>Assignment: 30</span>
            <span>Article: 5</span>
            <span>Coding: 50</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRanking;
