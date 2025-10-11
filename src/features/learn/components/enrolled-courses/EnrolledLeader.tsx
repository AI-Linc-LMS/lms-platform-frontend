import { useQuery } from "@tanstack/react-query";
import { getCourseLeaderboard } from "../../../../services/enrolled-courses-content/courseContentApis";
import React, { useState } from "react";
import {
  FaTrophy,
  FaMedal,
  FaAward,
  FaCrown,
  FaInfoCircle,
  FaStar,
  FaFire,
  FaRocket,
} from "react-icons/fa";

const EnrolledLeaderBoard = ({ courseId }: { courseId: number }) => {
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
    <tr className="animate-pulse">
      <td className="border-b border-gray-100 px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
        </div>
      </td>
      <td className="border-b border-l border-gray-100 px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-16 sm:w-24"></div>
        </div>
      </td>
      <td className="border-b border-l border-gray-100 px-2 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-center">
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-12 sm:w-16"></div>
        </div>
      </td>
    </tr>
  );

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaCrown className="text-yellow-500 text-base sm:text-lg" />;
      case 2:
        return <FaTrophy className="text-gray-400 text-base sm:text-lg" />;
      case 3:
        return <FaMedal className="text-amber-600 text-base sm:text-lg" />;
      default:
        return (
          <span className="text-gray-500 font-bold text-xs sm:text-sm">
            {rank}
          </span>
        );
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-yellow-200/50";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-gray-200/50";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-amber-200/50";
      default:
        return "bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 shadow-blue-100/50";
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80)
      return "bg-gradient-to-r from-green-500 to-emerald-600 text-white";
    if (score >= 60)
      return "bg-gradient-to-r from-blue-500 to-blue-600 text-white";
    if (score >= 40)
      return "bg-gradient-to-r from-amber-500 to-orange-600 text-white";
    return "bg-gradient-to-r from-gray-400 to-gray-500 text-white";
  };

  if (error) {
    return (
      <div className="w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-red-50/30 to-pink-50/30 border border-red-200/50 p-4 sm:p-6 md:p-8 shadow-xl sm:shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <FaTrophy className="text-white text-sm sm:text-lg" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                Leaderboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Competition results
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="flex flex-col items-center justify-center py-8 sm:py-12">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-3 sm:mb-4 animate-pulse">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-base sm:text-lg font-medium text-red-600 text-center mb-2">
            Unable to load leaderboard
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border border-gray-200/50 p-4 sm:p-6 md:p-8 shadow-xl sm:shadow-2xl">
      {/* Header */}
      <div className="flex justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
            <FaTrophy className="text-white text-sm sm:text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
              Leaderboard
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              See who's leading
            </p>
          </div>
        </div>

        <div className="relative flex-shrink-0">
          <button
            className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            onClick={() => setShowInfo(!showInfo)}
          >
            <FaInfoCircle className="text-xs sm:text-sm" />
          </button>
          {showInfo && (
            <>
              {/* Mobile backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-40 sm:hidden"
                onClick={() => setShowInfo(false)}
              />
              {/* Tooltip/Modal */}
              <div className="fixed sm:absolute left-1/2 top-1/2 sm:left-auto sm:top-12 -translate-x-1/2 -translate-y-1/2 sm:translate-x-0 sm:translate-y-0 sm:right-0 z-50 bg-gray-900 text-white p-4 sm:p-4 rounded-2xl shadow-2xl w-[90vw] max-w-[320px] sm:min-w-[280px] border border-gray-700">
                <button
                  className="absolute top-2 right-2 sm:hidden w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white"
                  onClick={() => setShowInfo(false)}
                >
                  ×
                </button>
                <h3 className="font-bold mb-3 text-sm sm:text-base">
                  Scoring System
                </h3>
                <div className="text-xs sm:text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <FaRocket className="text-blue-400 flex-shrink-0" />
                    <span>
                      Video Tutorial: <strong>10 Marks</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaStar className="text-yellow-400 flex-shrink-0" />
                    <span>
                      Quiz: <strong>20 Marks</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaFire className="text-orange-400 flex-shrink-0" />
                    <span>
                      Assignment: <strong>30 Marks</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaAward className="text-green-400 flex-shrink-0" />
                    <span>
                      Article: <strong>5 Marks</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaTrophy className="text-purple-400 flex-shrink-0" />
                    <span>
                      Coding Problem: <strong>50 Marks</strong>
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-gray-200/50 bg-white/70 backdrop-blur-sm shadow-lg -mx-4 sm:mx-0">
        <table className="w-full min-w-[320px]">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 border-b border-gray-200">
                Rank
              </th>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-left text-xs sm:text-sm font-semibold text-gray-700 border-b border-l border-gray-200">
                Participant
              </th>
              <th className="px-2 sm:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-700 border-b border-l border-gray-200">
                Score
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array(6)
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
                      className={`group hover:bg-blue-50/50 transition-all duration-300 ${
                        entry.name === "You"
                          ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-2 sm:border-l-4 border-blue-500"
                          : ""
                      }`}
                    >
                      <td className="border-b border-gray-100 px-2 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center justify-center">
                          <div
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 ${getRankBadge(
                              entry.rank
                            )}`}
                          >
                            {getRankIcon(entry.rank)}
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-l border-gray-100 px-2 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md flex-shrink-0">
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-900 text-xs sm:text-sm md:text-base truncate block">
                              {entry.name}
                            </span>
                            {entry.name === "You" && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-l border-gray-100 px-2 sm:px-4 py-3 sm:py-4">
                        <div className="flex items-center justify-center">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-bold shadow-lg transition-transform duration-300 group-hover:scale-105 ${getScoreBadge(
                              entry.score
                            )}`}
                          >
                            {entry.score}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                )}
          </tbody>
        </table>
      </div>

      {/* Info Banner */}
      <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl flex flex-row p-3 sm:p-4 gap-2 sm:gap-4 border border-blue-100 shadow-inner mt-4 sm:mt-6">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md">
            <FaStar className="text-white text-sm sm:text-lg" />
          </div>
        </div>
        <div className="flex-1">
          <p className="text-xs sm:text-sm font-medium text-blue-800 leading-relaxed">
            🏆 <strong>Keep climbing!</strong> Complete more modules to rise up
            the leaderboard and earn exciting rewards.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnrolledLeaderBoard;
