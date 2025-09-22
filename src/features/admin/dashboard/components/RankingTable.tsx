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
        <h2 className="text-xl font-semibold text-[#343A40] mb-3">
          Student Ranking
        </h2>

        {!leaderboard || leaderboard.length === 0 ? (
          <p className="text-[14px] text-[var(--netural-400)] mb-8">
            No leaderboard leaderboard available
          </p>
        ) : (
          <p className="text-[14px] text-[var(--netural-400)] mb-8">
            Keep grinding and stay top on our leaderboard
          </p>
        )}
        <div className="rounded-xl border border-gray-300 overflow-hidden">
          <table className="w-full text-center border-collapse min-h-[450px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="border-b border-r border-gray-300  h-[50px] text-[12px] text-gray-600">
                  Standing
                </th>
                <th className="border-b border-r border-gray-300  h-[50px] text-[12px] text-gray-600">
                  Name
                </th>
                <th className="border-b border-r border-gray-300  h-[50px] text-[12px] text-gray-600">
                  Course
                </th>
                <th className="border-b border-gray-300  h-[50px] text-[12px] text-gray-600">
                  Marks
                </th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="border-b border-r border-gray-300 w-[70px] h-[50px] text-[12px]">
                    <div className="h-4 bg-gray-200 rounded w-6 mx-auto"></div>
                  </td>
                  <td className="border-b border-r border-gray-300 w-[120px] h-[50px] text-[12px]">
                    <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                  </td>
                  <td className="border-b border-r border-gray-300 w-[70px] h-[50px] text-[12px] p-1">
                    <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                  </td>
                  <td className="border-b border-gray-300 w-[70px] h-[50px] text-[12px]">
                    <div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-[#DEE2E6] rounded-xl px-4 py-5 flex items-center gap-2 max-w-md my-4">
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
          <p className="text-[13px] text-[var(--netural-300)]">
            As you complete modules you will move top of the leaderboard and
            earn exciting rewards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col transition-all duration-300 px-4">
      <h2 className="text-xl font-semibold text-[var(--default-primary)] mb-3">
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
            {leaderboard?.map((item: LeaderboardEntry, index: number) => {
              return (
                <tr
                  key={index}
                  className={`group relative transition-all duration-300 hover:bg-[#E9F7FA]`}
                >
                  <td className="border-b border-r border-gray-300  h-[50px] text-[12px]">
                    <span>{item.rank}</span>
                  </td>
                  <td className="border-b border-r border-gray-300  h-[50px] text-[12px]">
                    <span>{item.name}</span>
                  </td>
                  <td className="border-b border-r border-gray-300  h-[50px] text-[12px] p-1">
                    <span>
                      {item.course.length > 13
                        ? `${item.course.substring(0, 13)}...`
                        : item.course}
                    </span>
                  </td>
                  <td className="border-b border-gray-300  h-[50px] text-[12px]">
                    <span className="">{item.marks}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentRanking;
