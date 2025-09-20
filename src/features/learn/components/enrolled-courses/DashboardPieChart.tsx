import React from "react";
import { motion } from "framer-motion";
import {
  FaChartPie,
  FaVideo,
  FaFileAlt,
  FaCode,
  FaQuestionCircle,
  FaTrophy,
  FaFire,
} from "react-icons/fa";

interface Category {
  name: string;
  value: number;
  color: string;
  ring: number;
}

interface DashboardData {
  totalCompletion: number;
  categories: Category[];
}

interface ApiResponse {
  article_progress: number;
  video_progress: number;
  coding_problem_progress: number;
  quiz_progress: number;
  total_progress: number;
  [key: string]: number;
}

const DashboardPieChart = ({
  data,
  isLoading,
  error,
}: {
  data: ApiResponse | null;
  isLoading: boolean;
  error: Error | null;
}) => {
  const processApiData = (apiData: ApiResponse): DashboardData => {
    const {
      article_progress = 0,
      video_progress = 0,
      coding_problem_progress = 0,
      quiz_progress = 0,
      total_progress = 0,
    } = apiData || {};

    return {
      totalCompletion: total_progress,
      categories: [
        { name: "Article", value: article_progress, color: "#3B82F6", ring: 0 },
        { name: "Video", value: video_progress, color: "#EF4444", ring: 1 },
        {
          name: "Problems",
          value: coding_problem_progress,
          color: "#10B981",
          ring: 2,
        },
        { name: "Quiz", value: quiz_progress, color: "#8B5CF6", ring: 3 },
      ],
    };
  };

  const getCategoryIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "video":
        return FaVideo;
      case "article":
        return FaFileAlt;
      case "problems":
        return FaCode;
      case "quiz":
        return FaQuestionCircle;
      default:
        return FaChartPie;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8 border border-blue-200 shadow-sm">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="w-6 h-6 bg-blue-200 rounded"></div>
            <div className="h-6 bg-blue-200 rounded w-32"></div>
          </div>
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-blue-200 rounded-full mx-auto mb-4"></div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-3 sm:p-4">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full rounded-2xl lg:rounded-3xl bg-white p-4 sm:p-6 lg:p-8 border border-red-200 shadow-sm">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaChartPie className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Progress Unavailable
          </h3>
          <p className="text-sm text-gray-600">
            Unable to load your learning progress
          </p>
        </div>
      </div>
    );
  }

  const dashboardData = processApiData(data);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8 border border-blue-200 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 sm:mb-6">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-xl flex items-center justify-center">
          <FaChartPie className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
            Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            A quick overview of your learning status
          </p>
        </div>
      </div>

      {/* Progress Circle */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="relative inline-block">
          <svg
            className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 -rotate-90"
            viewBox="0 0 120 120"
          >
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r="54"
              stroke="#E5E7EB"
              strokeWidth="8"
              fill="transparent"
            />

            {/* Progress circle */}
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="transparent"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 54}`}
              strokeDashoffset={`${
                2 * Math.PI * 54 * (1 - dashboardData.totalCompletion / 100)
              }`}
              initial={{ strokeDashoffset: `${2 * Math.PI * 54}` }}
              animate={{
                strokeDashoffset: `${
                  2 * Math.PI * 54 * (1 - dashboardData.totalCompletion / 100)
                }`,
              }}
              transition={{ duration: 2, ease: "easeOut" }}
            />

            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1">
                {dashboardData.totalCompletion}%
              </div>
              <div className="text-xs sm:text-sm text-gray-500 font-medium">
                Completed
              </div>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-4">
          {dashboardData.totalCompletion === 0 ? (
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium">
              <FaFire className="w-4 h-4" />
              Ready to Start
            </div>
          ) : dashboardData.totalCompletion === 100 ? (
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-sm font-medium">
              <FaTrophy className="w-4 h-4" />
              Completed!
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium">
              <FaFire className="w-4 h-4" />
              In Progress
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {dashboardData.categories.map((category, index) => {
          const Icon = getCategoryIcon(category.name);
          return (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-3 sm:p-4 text-center shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg mx-auto mb-2 sm:mb-3 flex items-center justify-center"
                style={{ backgroundColor: `${category.color}15` }}
              >
                <Icon
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  style={{ color: category.color }}
                />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                {category.value}%
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-600">
                {category.name}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DashboardPieChart;
