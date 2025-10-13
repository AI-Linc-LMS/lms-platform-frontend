import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getCourseLeaderboard } from "../../../../services/enrolled-courses-content/courseContentApis";
import React, { useState } from "react";

const EnrolledLeaderBoard = ({ courseId }: { courseId: number }) => {
  const { t } = useTranslation();
  const [showInfo, setShowInfo] = useState(false);
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const {
    data = [],
    isLoading,
    error,
  } = useQuery<Array<{ rank: number; name: string; score: number }>>({
    queryKey: ["leaderboard", courseId],
    queryFn: () => getCourseLeaderboard(clientId, courseId),
  });

  const renderSkeleton = () => (
    <tr>
      <td className="border-b border-gray-300 px-2 py-7">
        <div className="h-4 bg-gray-200 rounded w-10 animate-pulse"></div>
      </td>
      <td className="border-b border-l border-gray-300 px-2 py-2">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </td>
      <td className="border-b border-l border-gray-300 px-2 py-2">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
      </td>
    </tr>
  );

  if (error) {
    return (
      <div className="w-full rounded-3xl bg-white p-3 md:p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg md:text-[22px] font-semibold">
            {t("course.leaderboard")}
          </h1>
          <div className="relative">
            <button
              className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
              onMouseEnter={() => setShowInfo(true)}
              onMouseLeave={() => setShowInfo(false)}
              onClick={() => setShowInfo(!showInfo)}
            >
              <span className="text-xs font-medium">i</span>
            </button>
            {showInfo && (
              <div className="absolute right-0 top-8 z-10 bg-gray-800 text-[var(--font-light)] p-3 rounded-lg shadow-lg min-w-[200px]">
                <div className="text-xs space-y-1">
                  <div>
                    {t("course.videoTutorial")}: 10 {t("course.marks")}
                  </div>
                  <div>
                    {t("course.quiz")}: 20 {t("course.marks")}
                  </div>
                  <div>
                    {t("course.assignment")}: 30 {t("course.marks")}
                  </div>
                  <div>
                    {t("course.article")}: 5 {t("course.marks")}
                  </div>
                  <div>
                    {t("course.codingProblem")}: 50 {t("course.marks")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-red-500 text-sm md:text-base">
          {t("course.errorLoadingLeaderboard")}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl bg-white p-3 md:p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg md:text-[22px] font-semibold">
          {t("course.leaderboard")}
        </h1>
        <div className="relative">
          <button
            className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            onClick={() => setShowInfo(!showInfo)}
          >
            <span className="text-xs font-medium">i</span>
          </button>
          {showInfo && (
            <div className="absolute right-0 top-8 z-10 bg-gray-800 text-[var(--font-light)] p-3 rounded-lg shadow-lg min-w-[200px]">
              <div className="text-xs space-y-1">
                <div>
                  {t("course.videoTutorial")}: 10 {t("course.marks")}
                </div>
                <div>
                  {t("course.quiz")}: 20 {t("course.marks")}
                </div>
                <div>
                  {t("course.assignment")}: 30 {t("course.marks")}
                </div>
                <div>
                  {t("course.article")}: 5 {t("course.marks")}
                </div>
                <div>
                  {t("course.codingProblem")}: 50 {t("course.marks")}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm md:text-base">
        {t("course.leaderboardDescription")}
      </p>

      <div className="overflow-x-auto overflow-hidden rounded-xl border border-gray-300 my-3 md:my-5">
        <div className="overflow-y-auto max-h-[220px]">
          <table className="w-full text-center border-collapse">
            <thead className="bg-gray-100 sticky top-0 z-10">
              <tr>
                <th
                  className="border-b border-gray-300 px-2 py-3 md:py-4 text-xs text-gray-600 w-[80px] md:w-[120px] bg-gray-100"
                  style={{ height: "30px" }}
                >
                  {t("course.standing")}
                </th>
                <th
                  className="border-b border-l border-gray-300 px-2 text-xs text-gray-600 w-[100px] md:w-[120px] bg-gray-100"
                  style={{ height: "30px" }}
                >
                  {t("course.name")}
                </th>
                <th
                  className="border-b border-l border-gray-300 px-2 text-xs text-gray-600 w-[80px] md:w-[120px] bg-gray-100"
                  style={{ height: "30px" }}
                >
                  {t("course.marks")}
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? // Show 5 skeleton rows while loading
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <React.Fragment key={index}>
                        {renderSkeleton()}
                      </React.Fragment>
                    ))
                : data?.map(
                    (entry: { rank: number; name: string; score: number }) => (
                      <tr
                        key={entry.rank}
                        className={`${
                          entry.name === "You" ? "bg-blue-50" : ""
                        }`}
                      >
                        <td className="border-b border-gray-300 px-2 py-2 md:py-4 text-xs md:text-sm">
                          {entry.rank}
                        </td>
                        <td className="border-b border-l border-gray-300 px-2 py-2 text-xs md:text-sm">
                          {entry.name}
                        </td>
                        <td className="border-b border-l border-gray-300 px-2 py-2 text-xs md:text-sm">
                          {entry.score}
                        </td>
                      </tr>
                    )
                  )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="w-full bg-[#DEE2E6] rounded-xl flex flex-row p-3 md:p-4 gap-2 md:gap-3">
        <svg
          className="flex-shrink-0"
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M21.5 14C21.5 18.1421 18.1421 21.5 14 21.5C9.85786 21.5 6.5 18.1421 6.5 14C6.5 9.85786 9.85786 6.5 14 6.5C18.1421 6.5 21.5 9.85786 21.5 14ZM14 18.3125C14.3106 18.3125 14.5625 18.0606 14.5625 17.75V13.25C14.5625 12.9394 14.3106 12.6875 14 12.6875C13.6894 12.6875 13.4375 12.9394 13.4375 13.25V17.75C13.4375 18.0606 13.6894 18.3125 14 18.3125ZM14 10.25C14.4142 10.25 14.75 10.5858 14.75 11C14.75 11.4142 14.4142 11.75 14 11.75C13.5858 11.75 13.25 11.4142 13.25 11C13.25 10.5858 13.5858 10.25 14 10.25Z"
            fill="var(--neutral-300)"
          />
        </svg>

        <p className="text-xs md:text-[12px] text-[var(--neutral-300)]">
          {t("course.leaderboardInfo")}
        </p>
      </div>
    </div>
  );
};

export default EnrolledLeaderBoard;
