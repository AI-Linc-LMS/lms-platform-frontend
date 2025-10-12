import React from "react";
import { useTranslation } from "react-i18next";
import light from "../../../assets/dashboard_assets/light.png";
import { useQuery } from "@tanstack/react-query";
import {
  getDailyLeaderboard,
  getUserDailyTimeSpentData,
  LeaderboardData,
} from "../../../services/dashboardApis";

const goalMinutes = 30; // Default goal

const DailyProgress: React.FC<{ clientId: number }> = ({ clientId }) => {
  const { t } = useTranslation();
  const {
    data: leaderboardData,
    isLoading: isLeaderboardLoading,
    error: leaderboardError,
  } = useQuery({
    queryKey: ["dailyLeaderboard", clientId],
    queryFn: () => getDailyLeaderboard(clientId),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const {
    data: dailyTimeSpentData,
    isLoading: isTimeSpentLoading,
    error: timeSpentError,
  } = useQuery({
    queryKey: ["userTimeSpent", clientId],
    queryFn: () => getUserDailyTimeSpentData(clientId),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const leaderboardArray = leaderboardData?.leaderboard || [];
  const timeSpent = dailyTimeSpentData?.timespent ?? 0;

  // Map leaderboard data to table format
  const tableData = leaderboardArray.map(
    (item: LeaderboardData, idx: number) => ({
      standing: `#${idx + 1}`,
      name: item.name,
      time:
        item.progress.hours > 0
          ? `${item.progress.hours}hr ${item.progress.minutes}min`
          : `${item.progress.minutes}min`,
    })
  );

  // Calculate progress percentage for the progress bar
  const progressMinutes = timeSpent;
  const progressPercent = Math.min((progressMinutes / goalMinutes) * 100, 100);

  if (
    isLeaderboardLoading ||
    isTimeSpentLoading ||
    leaderboardError ||
    timeSpentError ||
    !leaderboardArray ||
    leaderboardArray.length === 0
  ) {
    return (
      <div className="flex flex-col w-full transition-all duration-300 bg-white p-4 rounded-xl md:mt-10">
        <h2 className="text-xl font-semibold text-[var(--neutral-500)] mb-3">
          Daily Progress
        </h2>

        {!leaderboardArray || leaderboardArray.length === 0 ? (
          <p className="text-[14px] text-[var(--neutral-400)] mb-8">
            No daily progress data available
          </p>
        ) : (
          <p className="text-[14px] text-[var(--neutral-400)] mb-8">
            Keep track of your daily learning ⚡
          </p>
        )}

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
              {[...Array(3)].map((_, index) => (
                <tr key={index} className="animate-pulse">
                  <td className="px-2 py-2 text-xs border-b border-gray-300">
                    <div className="h-4 bg-gray-200 rounded-xl w-6 mx-auto"></div>
                  </td>
                  <td className="px-2 py-2 text-xs border-b border-l border-gray-300">
                    <div className="h-4 bg-gray-200 rounded-xl w-20 mx-auto"></div>
                  </td>
                  <td className="px-2 py-2 text-xs border-b border-l border-gray-300">
                    <div className="h-4 bg-gray-200 rounded-xl w-16 mx-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="animate-pulse">
          <div className="flex justify-end items-center mb-1">
            <div className="h-4 bg-gray-200 rounded-xl w-16"></div>
          </div>
          <div className="h-8 rounded-full bg-gray-200"></div>
          <div className="flex justify-between mt-1">
            <div className="h-4 bg-gray-200 rounded-xl w-12"></div>
            <div className="h-4 bg-gray-200 rounded-xl w-12"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full lg:min-w-[270px] xl:min-w-[350px] transition-all duration-300 bg-white p-4 rounded-xl md:mt-10">
      <h2 className="text-xl font-semibold text-[var(--neutral-500)] mb-3">
        {t("dashboard.dailyProgress.title")}
      </h2>
      <p className="text-[14px] text-[var(--neutral-400)] mb-8">
        {t("dashboard.dailyProgress.subtitle")}
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-300 mb-4">
        <table className="w-full text-center border-collapse min-h-[270px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b border-gray-300 px-2 py-7 text-xs text-gray-600">
                {t("dashboard.dailyProgress.headers.standing")}
              </th>
              <th className="border-b border-l border-gray-300 px-2 py-2 text-xs text-gray-600">
                {t("dashboard.dailyProgress.headers.name")}
              </th>
              <th className="border-b border-l border-gray-300 px-2 py-2 text-xs text-gray-600">
                {t("dashboard.dailyProgress.headers.spent")}
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((item, index) => {
              const isLast = index === tableData.length - 1;
              return (
                <tr
                  key={index}
                  className={`group relative transition-all duration-300 hover:bg-[#E9F7FA]`}
                >
                  <td
                    className={`px-2 py-2 text-xs border-gray-300 ${
                      isLast ? "" : "border-b"
                    }`}
                  >
                    <span>{item.standing}</span>
                  </td>
                  <td
                    className={`px-2 py-2 text-xs border-l border-gray-300 ${
                      isLast ? "" : "border-b"
                    }`}
                  >
                    <span>{item.name}</span>
                  </td>
                  <td
                    className={`px-2 py-2 text-xs border-l border-gray-300 ${
                      isLast ? "" : "border-b"
                    }`}
                  >
                    <span>{item.time}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end items-center mb-1 text-green-700 font-semibold">
        <span className="text-[13px] text-[var(--success-500)]">
          + {progressMinutes} mins
        </span>
      </div>

      {/* Animated Progress Bar */}
      <div className="relative h-8 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-[var(--success-500)] transition-all duration-[1500ms] ease-in-out"
          style={{ width: `${progressPercent}%` }}
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 text-[var(--font-light)] text-xs"
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
        <p className="text-sm text-[var(--neutral-300)]">
          Log in every day and snag yourself a shiny +1 Streak point! Don't miss
          out on the fun—keep those streaks rolling!
        </p>
      </div>
    </div>
  );
};

export default DailyProgress;
