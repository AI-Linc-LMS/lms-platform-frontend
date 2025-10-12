import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  getLeaderboardData,
  LeaderboardItem,
} from "../../../services/dashboardApis";

interface LeaderboardResponse {
  leaderboard: LeaderboardItem[];
}

const Leaderboard: React.FC<{ clientId: number }> = ({ clientId }) => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useQuery<LeaderboardItem[]>({
    queryKey: ["leaderboard", clientId],
    queryFn: async () => {
      const response = await getLeaderboardData(clientId);
      // Handle both array and object with leaderboard property
      if (Array.isArray(response)) {
        return response;
      } else if (
        response &&
        typeof response === "object" &&
        "leaderboard" in response
      ) {
        return (response as LeaderboardResponse).leaderboard;
      }
      return [];
    },
  });

  // Filter out specific backend users that should not be displayed
  const filteredData = data?.filter((item: LeaderboardItem) => {
    const namesToExclude = [
      "shubham lal",
      "balbir",
      "balbir yadav -[iitb]",
      "ailinc dev",
      "ai-linc dev",
      "ailinc admin",
      "ai linc",
      "daksh rajput",
      "Soumic Sarkar",
      "i learning",
    ];
    return !namesToExclude.includes(item.name.toLowerCase());
  });

  if (isLoading || error || !filteredData || filteredData.length === 0) {
    return (
      <div className="flex flex-col w-full lg:min-w-[270px] xl:min-w-[350px] transition-all duration-300 bg-white p-4 rounded-xl mt-10">
        <h2 className="text-xl font-semibold text-[var(--neutral-500)] mb-3">
          {t("dashboard.leaderboard.title")}
        </h2>

        {!filteredData || filteredData.length === 0 ? (
          <p className="text-[14px] text-[var(--neutral-400)] mb-8">
            {t("dashboard.leaderboard.noData")}
          </p>
        ) : (
          <p className="text-[14px] text-[var(--neutral-400)] mb-8">
            {t("dashboard.leaderboard.subtitle")}
          </p>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-300 mb-4">
          <table className="w-full text-center border-collapse min-h-[450px]">
            <thead className="bg-gray-100">
              <tr>
                <th className="border-b border-gray-300 px-2 py-7 text-xs text-gray-600">
                  {t("dashboard.leaderboard.headers.standing")}
                </th>
                <th className="border-b border-l border-gray-300 px-2 py-2 text-xs text-gray-600">
                  {t("dashboard.leaderboard.headers.name")}
                </th>
                <th className="border-b border-l border-gray-300 px-2 py-2 text-xs text-gray-600">
                  {t("dashboard.leaderboard.headers.course")}
                </th>
                <th className="border-b border-l border-gray-300 px-2 py-2 text-xs text-gray-600">
                  {t("dashboard.leaderboard.headers.marks")}
                </th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, index) => (
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
                  <td className="px-2 py-2 text-xs border-b border-l border-gray-300">
                    <div className="h-4 bg-gray-200 rounded-xl w-8 mx-auto"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            As you complete modules you will move top of the leaderboard and
            earn exciting rewards.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full lg:min-w-[270px] xl:min-w-[350px] transition-all duration-300 bg-white p-4 rounded-xl mt-10">
      <h2 className="text-xl font-semibold text-[var(--neutral-500)] mb-3">
        {t("dashboard.leaderboard.title")}
      </h2>
      <p className="text-[14px] text-[var(--neutral-400)] mb-8">
        {t("dashboard.leaderboard.subtitle")}
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-300 mb-4">
        <table className="w-full text-center border-collapse min-h-[450px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b border-gray-300 px-2 py-7 text-xs text-gray-600">
                {t("dashboard.leaderboard.headers.standing")}
              </th>
              <th className="border-b border-l border-gray-300 px-2 py-2 text-xs text-gray-600">
                {t("dashboard.leaderboard.headers.name")}
              </th>
              <th className="border-b border-l border-gray-300 px-2 py-2 text-xs text-gray-600">
                {t("dashboard.leaderboard.headers.course")}
              </th>
              <th className="border-b border-l border-gray-300 px-2 py-2 text-xs text-gray-600">
                {t("dashboard.leaderboard.headers.marks")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData?.map((item: LeaderboardItem, index: number) => {
              // Check if this entry is the current user (name is "You")
              const isCurrentUser = item.name === "You";
              const isLast = index === filteredData.length - 1;

              return (
                <tr
                  key={index}
                  className={`group relative transition-all duration-300 hover:bg-[#E9F7FA] ${
                    isCurrentUser
                      ? "bg-blue-100 text-[var(--secondary-700)]"
                      : ""
                  }`}
                >
                  <td
                    className={`px-2 py-2 text-xs border-gray-300 ${
                      isLast ? "" : "border-b"
                    }`}
                  >
                    <span>{item.rank}</span>
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
                    <span>
                      {item.course_name.length > 13
                        ? `${item.course_name.substring(0, 13)}...`
                        : item.course_name}
                    </span>
                  </td>
                  <td
                    className={`px-2 py-2 text-xs border-l border-gray-300 ${
                      isLast ? "" : "border-b"
                    }`}
                  >
                    <span>{item.marks}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
          As you complete modules you will move top of the leaderboard and earn
          exciting rewards.
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;
