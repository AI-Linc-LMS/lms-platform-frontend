import React from "react";
import {
  FaBookOpen,
  FaPlay,
  FaCode,
  FaQuestionCircle,
  FaTrophy,
  FaFire,
  FaStar,
  FaRocket,
} from "react-icons/fa";

interface Category {
  name: string;
  value: number;
  color: string;
  gradient: string;
  ring: number;
  icon: React.ReactNode;
  bgColor: string;
  shadowColor: string;
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
  [key: string]: number; // For any other fields that might be present
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
    // Extract progress values from API response
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
        {
          name: "Articles",
          value: article_progress,
          color: "#3B82F6",
          gradient: "linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)",
          ring: 0,
          icon: <FaBookOpen />,
          bgColor: "bg-blue-50",
          shadowColor: "shadow-blue-200/50",
        },
        {
          name: "Videos",
          value: video_progress,
          color: "#F59E0B",
          gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
          ring: 1,
          icon: <FaPlay />,
          bgColor: "bg-amber-50",
          shadowColor: "shadow-amber-200/50",
        },
        {
          name: "Problems",
          value: coding_problem_progress,
          color: "#10B981",
          gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
          ring: 2,
          icon: <FaCode />,
          bgColor: "bg-emerald-50",
          shadowColor: "shadow-emerald-200/50",
        },
        {
          name: "Quizzes",
          value: quiz_progress,
          color: "#8B5CF6",
          gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
          ring: 3,
          icon: <FaQuestionCircle />,
          bgColor: "bg-violet-50",
          shadowColor: "shadow-violet-200/50",
        },
      ],
    };
  };

  // For testing purposes only - comment out in production
  /* 
  const mockApiData: ApiResponse = {
    article_progress: 75,
    video_progress: 80,
    coding_problem_progress: 40,
    quiz_progress: 60,
    total_progress: 60
  };
  */

  // Default data if none is provided
  const defaultData = {
    totalCompletion: 25,
    categories: [
      {
        name: "Articles",
        value: 19,
        color: "#3B82F6",
        gradient: "linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)",
        ring: 0,
        icon: <FaBookOpen />,
        bgColor: "bg-blue-50",
        shadowColor: "shadow-blue-200/50",
      },
      {
        name: "Videos",
        value: 22,
        color: "#F59E0B",
        gradient: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
        ring: 1,
        icon: <FaPlay />,
        bgColor: "bg-amber-50",
        shadowColor: "shadow-amber-200/50",
      },
      {
        name: "Problems",
        value: 5,
        color: "#10B981",
        gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        ring: 2,
        icon: <FaCode />,
        bgColor: "bg-emerald-50",
        shadowColor: "shadow-emerald-200/50",
      },
      {
        name: "Quizzes",
        value: 9,
        color: "#8B5CF6",
        gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
        ring: 3,
        icon: <FaQuestionCircle />,
        bgColor: "bg-violet-50",
        shadowColor: "shadow-violet-200/50",
      },
    ],
  };

  // Use provided data, mock data for testing, or defaults
  // Uncomment the line below to test with mock data
  // const chartData = processApiData(mockApiData);
  const chartData = data ? processApiData(data) : defaultData;

  // Ensure categories is always an array
  const categories = chartData?.categories || defaultData.categories;

  // Create concentric circles chart with modern gradient design
  const ConcentricCirclesChart = ({
    categories,
  }: {
    categories: Category[];
  }) => {
    // Define the radius values for each ring (from outer to inner)
    const ringRadii = [50, 40, 30, 20];
    const ringStrokeWidths = [8, 7, 6, 5];

    return (
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-full blur-xl"></div>
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full transform -rotate-90 relative z-10"
        >
          {/* Background circles with subtle glow */}
          {ringRadii.map((radius, index) => (
            <g key={`bg-group-${index}`}>
              {/* Glow effect */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={categories[index]?.color || "#E5E7EB"}
                strokeWidth={ringStrokeWidths[index] + 2}
                opacity="0.1"
                className="blur-sm"
              />
              {/* Main background circle */}
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#F3F4F6"
                strokeWidth={ringStrokeWidths[index]}
                strokeLinecap="round"
              />
            </g>
          ))}

          {/* Gradient definitions */}
          <defs>
            {categories.map((category, index) => (
              <linearGradient
                key={`gradient-${index}`}
                id={`gradient-${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={category.color} stopOpacity="1" />
                <stop
                  offset="100%"
                  stopColor={category.color}
                  stopOpacity="0.7"
                />
              </linearGradient>
            ))}
          </defs>

          {/* Draw progress arcs for each category */}
          {categories.map((category, index) => {
            const radius = ringRadii[category.ring];
            const strokeWidth = ringStrokeWidths[category.ring];
            const circumference = 2 * Math.PI * radius;

            // Calculate stroke dash properties
            const strokeDasharray = circumference;
            const strokeDashoffset =
              circumference - (category.value / 100) * circumference;

            return (
              <g key={`progress-${index}`}>
                {/* Shadow/glow effect */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={category.color}
                  strokeWidth={strokeWidth + 1}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  opacity="0.3"
                  className="blur-sm"
                  style={{
                    transition:
                      "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    transitionDelay: `${index * 0.2}s`,
                  }}
                />
                {/* Main progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke={`url(#gradient-${index})`}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transition:
                      "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    transitionDelay: `${index * 0.2}s`,
                  }}
                />
              </g>
            );
          })}
        </svg>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <FaTrophy className="text-white text-lg" />
          </div>
        </div>
      </div>
    );
  };

  // Modern completion circle component with animations
  const CompletionCircle = ({ percentage }: { percentage: number }) => {
    const circumference = 2 * Math.PI * 55;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getCompletionLevel = (percent: number) => {
      if (percent >= 90)
        return { level: "Excellent", color: "#10B981", icon: <FaTrophy /> };
      if (percent >= 75)
        return { level: "Great", color: "#3B82F6", icon: <FaStar /> };
      if (percent >= 50)
        return { level: "Good", color: "#F59E0B", icon: <FaFire /> };
      return { level: "Start", color: "#6B7280", icon: <FaRocket /> };
    };

    const completion = getCompletionLevel(percentage);

    return (
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* Animated background glow */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-20 animate-pulse"
          style={{ backgroundColor: completion.color }}
        ></div>

        <svg
          viewBox="0 0 140 140"
          className="w-full h-full transform -rotate-90 relative z-10"
        >
          {/* Gradient definitions */}
          <defs>
            <linearGradient
              id="completionGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={completion.color} stopOpacity="1" />
              <stop
                offset="100%"
                stopColor={completion.color}
                stopOpacity="0.6"
              />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background circle with subtle inner shadow */}
          <circle
            cx="70"
            cy="70"
            r="55"
            fill="none"
            stroke="#F3F4F6"
            strokeWidth="12"
          />

          {/* Glow effect for progress */}
          <circle
            cx="70"
            cy="70"
            r="55"
            fill="none"
            stroke={completion.color}
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            opacity="0.3"
            className="blur-sm"
            style={{
              transition: "stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)",
              transitionDelay: "0.5s",
            }}
          />

          {/* Main progress circle */}
          <circle
            cx="70"
            cy="70"
            r="55"
            fill="none"
            stroke="url(#completionGradient)"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#glow)"
            style={{
              transition: "stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)",
              transitionDelay: "0.5s",
            }}
          />
        </svg>

        {/* Center content with icon and percentage */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2 shadow-xl"
            style={{ backgroundColor: completion.color }}
          >
            <span className="text-white text-2xl">{completion.icon}</span>
          </div>
          <span
            className="text-4xl font-bold mb-1"
            style={{ color: completion.color }}
          >
            {percentage}%
          </span>
          <span className="text-sm font-medium text-gray-600">
            {completion.level}
          </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center mx-auto max-w-6xl">
        <div className="w-full rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border border-gray-200/50 p-6 md:p-8 shadow-2xl shadow-blue-100/50">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-600 rounded-full animate-spin animation-delay-150"></div>
            </div>
            <p className="mt-4 text-lg font-medium text-gray-600 animate-pulse">
              Loading your amazing progress...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 items-center justify-center mx-auto max-w-6xl">
        <div className="w-full rounded-3xl bg-gradient-to-br from-red-50 via-pink-50/30 to-red-50/30 border border-red-200/50 p-6 md:p-8 shadow-2xl shadow-red-100/50">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-white"
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
            <p className="text-lg font-medium text-red-600 text-center">
              Oops! Unable to load dashboard data
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please try refreshing the page
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure we have valid data before rendering
  if (!categories || !Array.isArray(categories)) {
    return <div>Invalid data format</div>;
  }

  return (
    <div className="flex flex-col gap-1 items-center justify-center mx-auto max-w-xl animate-in fade-in duration-700">
      <div className="w-full rounded-3xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 border border-gray-200/50 p-6 md:p-8 shadow-2xl shadow-blue-100/50 backdrop-blur-sm hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]">
        {/* Header with modern styling */}
        <div className="mb-8 animate-in slide-in-from-top duration-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300 hover:rotate-12">
              <FaRocket className="text-white text-lg" />
            </div>
            <h1 className="font-bold text-2xl md:text-3xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Learning Dashboard
            </h1>
          </div>
          <p className="text-gray-500 font-medium text-sm md:text-base ml-13">
            Track your progress across all learning modules
          </p>
        </div>

        {/* Charts container with enhanced layout */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 mb-8 animate-in slide-in-from-bottom duration-700 delay-200">
          <ConcentricCirclesChart categories={categories} />
          <CompletionCircle percentage={chartData.totalCompletion || 0} />
        </div>

        {/* Enhanced stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-in slide-in-from-bottom duration-700 delay-300">
          {categories.map((category: Category, index: number) => (
            <div
              key={index}
              className={`${category.bgColor} ${category.shadowColor} rounded-2xl p-4 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group cursor-pointer animate-in fade-in duration-500`}
              style={{ animationDelay: `${index * 100 + 400}ms` }}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:rotate-6"
                  style={{ backgroundColor: category.color }}
                >
                  <span className="text-white text-lg">{category.icon}</span>
                </div>
                <div>
                  <span
                    className="text-2xl md:text-3xl font-bold block"
                    style={{ color: category.color }}
                  >
                    {category.value}%
                  </span>
                  <span className="text-sm md:text-base font-medium text-gray-700">
                    {category.name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modern info banner */}
        <div className="w-full mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl flex flex-row items-center justify-center p-4 gap-4 border border-blue-100 shadow-inner animate-in slide-in-from-bottom duration-700 delay-500">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 hover:rotate-12">
              <svg
                width="18"
                height="18"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5C12.1421 0.5 15.5 3.85786 15.5 8ZM8 12.3125C8.31065 12.3125 8.5625 12.0606 8.5625 11.75V7.25C8.5625 6.93935 8.31065 6.6875 8 6.6875C7.68935 6.6875 7.4375 6.93935 7.4375 7.25V11.75C7.4375 12.0606 7.68935 12.3125 8 12.3125ZM8 4.25C8.41423 4.25 8.75 4.58579 8.75 5C8.75 5.41421 8.41423 5.75 8 5.75C7.58577 5.75 7.25 5.41421 7.25 5C7.25 4.58579 7.58577 4.25 8 4.25Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800 leading-relaxed">
              🎯 <strong>Great progress!</strong> Your learning journey is
              visualized through these beautiful charts. Each ring represents a
              different content type, and the colors show your mastery level
              across all areas!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPieChart;
