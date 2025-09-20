import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { getCourseLeaderboard } from "../../../../services/enrolled-courses-content/courseContentApis";
import {
  FaTrophy,
  FaMedal,
  FaAward,
  FaInfo,
  FaCrown,
  FaStar,
  FaFire,
  FaChevronUp,
} from "react-icons/fa";

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  avatar?: string;
}

const EnrolledLeaderBoard = ({ courseId }: { courseId: number }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const {
    data = [],
    isLoading,
    error,
  } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", courseId],
    queryFn: () => getCourseLeaderboard(clientId, courseId),
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaCrown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <FaMedal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <FaAward className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBackground = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-500";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-400";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-500";
      default:
        return "bg-gray-100";
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl animate-pulse"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg"></div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-12"></div>
        </div>
      ))}
    </div>
  );

  if (error) {
    return (
      <div className="w-full rounded-2xl lg:rounded-3xl bg-white p-4 sm:p-6 lg:p-8 shadow-sm border border-red-100">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaTrophy className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Leaderboard Unavailable
          </h3>
          <p className="text-sm text-gray-600">
            Error loading leaderboard data
          </p>
        </div>
      </div>
    );
  }

  const displayedData = showAll ? data : data.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-2xl lg:rounded-3xl bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-4 sm:p-6 lg:p-8 shadow-lg border border-purple-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-xl flex items-center justify-center">
            <FaTrophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
              Leaderboard
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              See how you stack up with your peers
            </p>
          </div>
        </div>

        {/* Info Button */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowInfo(true)}
            onMouseLeave={() => setShowInfo(false)}
            onClick={() => setShowInfo(!showInfo)}
            className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-600 transition-colors"
          >
            <FaInfo className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="absolute right-0 top-10 z-10 bg-gray-900 text-white text-xs rounded-xl p-4 shadow-xl w-64 sm:w-80"
              >
                <div className="space-y-2">
                  <div className="font-semibold mb-2">Scoring System:</div>
                  <div className="flex justify-between">
                    <span>VideoTutorial:</span>
                    <span className="font-medium">10 Marks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quiz:</span>
                    <span className="font-medium">20 Marks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assignment:</span>
                    <span className="font-medium">30 Marks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Article:</span>
                    <span className="font-medium">5 Marks</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CodingProblem:</span>
                    <span className="font-medium">50 Marks</span>
                  </div>
                </div>
                <div className="absolute -top-2 right-4 w-4 h-4 bg-gray-900 rotate-45"></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Leaderboard Content */}
      {isLoading ? (
        renderSkeleton()
      ) : data.length === 0 ? (
        <div className="text-center py-8">
          <FaTrophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No leaderboard data available yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 sm:space-y-3">
            {displayedData.map((entry, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-all hover:scale-[1.02] ${
                  entry.rank <= 3
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200"
                    : "bg-white border border-gray-200"
                } ${
                  entry.name === "You" ? "ring-2 ring-blue-400 bg-blue-50" : ""
                }`}
              >
                {/* Rank */}
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${getRankBackground(
                    entry.rank
                  )}`}
                >
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg">
                  {entry.avatar || entry.name.charAt(0)}
                </div>

                {/* Name and Special Indicators */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-sm sm:text-base truncate ${
                        entry.name === "You" ? "text-blue-700" : "text-gray-900"
                      }`}
                    >
                      {entry.name}
                    </span>
                    {entry.name === "You" && (
                      <div className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        <FaStar className="w-3 h-3" />
                        <span>You</span>
                      </div>
                    )}
                    {entry.rank === 1 && (
                      <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        <FaFire className="w-3 h-3" />
                        <span>Leader</span>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Rank #{entry.rank}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    {entry.score}
                  </div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Show More/Less Button */}
          {data.length > 5 && (
            <div className="mt-4 sm:mt-6 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
              >
                {showAll ? (
                  <>
                    <FaChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <FaTrophy className="w-4 h-4" />
                    View Full Leaderboard ({data.length} students)
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default EnrolledLeaderBoard;
