import React from "react";
import light from "../../../assets/dashboard_assets/light.png";
import { useDailyLeaderboard } from "../../../hooks/useDailyLeaderboard";

const goalMinutes = 30; // Default goal

const DailyProgress: React.FC = () => {
  
  const { data, isLoading, isError, error } = useDailyLeaderboard(1);

  // Map API data to table format
  const tableData = data?.map((item, idx) => ({
    standing: idx + 1,
    name: item.name,
    time: `${item.progress} mins`,
  })) || [];

  // Calculate total progress for progress bar
  const progressMinutes = data?.reduce((sum, item) => sum + (item.progress || 0), 0) || 0;
  const progressPercent = Math.min((progressMinutes / goalMinutes) * 100, 100);

  if (isLoading) return <div>Loading leaderboard...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <div className="flex flex-col w-full lg:min-w-[270px] xl:min-w-[350px] transition-all duration-300 bg-white p-4 rounded-3xl mt-10">
      <h2 className="text-xl font-semibold text-[#343A40] mb-3">
        Daily Progress
      </h2>
      <p className="text-[14px] text-[#495057] mb-8">
        Keep track of your daily learning ⚡
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-300 mb-4">
        <table className="w-full text-center border-collapse min-h-[270px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b border-gray-300 px-2 py-7 text-xs text-gray-600">
                Standing
              </th>
              <th className="border-b border-l border-gray-300 px-2 py-2 text-xs text-gray-600">
                Name
              </th>
              <th className="border-b border-l border-gray-300 px-2 py-2 text-xs text-gray-600">
                Spent
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => {
              const isLast = index === tableData.length - 1;
              return (
                <tr
                  key={index}
                  className="transition duration-200 hover:bg-gray-50"
                >
                  <td
                    className={`px-2 py-2 text-xs border-gray-300 hover:bg-[#E9F7FA] ${
                      isLast ? "" : "border-b"
                    } group`}
                  >
                    <span className="transition-transform duration-300">
                      {item.standing}
                    </span>
                  </td>
                  <td
                    className={`px-2 py-2 text-xs border-l border-gray-300 hover:bg-[#E9F7FA] ${
                      isLast ? "" : "border-b"
                    } group`}
                  >
                    <span className="transition-transform duration-300">
                      {item.name}
                    </span>
                  </td>
                  <td
                    className={`px-2 py-2 text-xs border-l border-gray-300 hover:bg-[#E9F7FA] ${
                      isLast ? "" : "border-b"
                    } group`}
                  >
                    <span className="transition-transform duration-300">
                      {item.time}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end items-center mb-1 text-green-700 font-semibold">
        <span className="text-[13px] text-[#5FA564]">+ {progressMinutes} mins</span>
      </div>

      {/* Animated Progress Bar */}
      <div className="relative h-8 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-[#5FA564] transition-all duration-[1500ms] ease-in-out"
          style={{ width: `${progressPercent}%` }}
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 text-white text-xs"
          style={{ left: `calc(${progressPercent}% - 18px)` }}
        >
          <img src={light} alt="Progress Icon" />
        </span>
      </div>

      <div className="flex justify-between text-[13px] mt-1 text-gray-500">
        <span>0 mins</span>
        <span>{goalMinutes} mins</span>
      </div>

      <div className="bg-[#DEE2E6] rounded-xl px-5 py-4 flex items-center gap-2 max-w-md mt-12">
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
        <p className="text-sm text-[#6C757D]">
          Log in every day and snag yourself a shiny +1 Streak point! Don't miss
          out on the fun—keep those streaks rolling!
        </p>
      </div>
    </div>
  );
};

export default DailyProgress;