import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
          name: t("course.article"),
          value: article_progress,
          color: "var(--accent-blue)",
          ring: 0,
        },
        {
          name: t("course.video"),
          value: video_progress,
          color: "#EED21B",
          ring: 1,
        },
        {
          name: t("course.problems"),
          value: coding_problem_progress,
          color: "var(--secondary-200)",
          ring: 2,
        },
        {
          name: t("course.quiz"),
          value: quiz_progress,
          color: "var(--primary-400)",
          ring: 3,
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
        name: t("course.article"),
        value: 19,
        color: "var(--accent-blue)",
        ring: 0,
      },
      { name: t("course.video"), value: 22, color: "#EED21B", ring: 1 },
      {
        name: t("course.problems"),
        value: 5,
        color: "var(--secondary-200)",
        ring: 2,
      },
      {
        name: t("course.quiz"),
        value: 9,
        color: "var(--primary-400)",
        ring: 3,
      },
    ],
  };

  // Use provided data, mock data for testing, or defaults
  // Uncomment the line below to test with mock data
  // const chartData = processApiData(mockApiData);
  const chartData = data ? processApiData(data) : defaultData;

  // Ensure categories is always an array
  const categories = chartData?.categories || defaultData.categories;

  // Create concentric circles chart with consistent progress style
  const ConcentricCirclesChart = ({
    categories,
  }: {
    categories: Category[];
  }) => {
    // Define the radius values for each ring (from outer to inner)
    const ringRadii = [45, 35, 25, 15];
    const ringStrokeWidths = [10, 8, 6, 4];

    return (
      <div className="relative w-40 h-40">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform -rotate-90"
        >
          {ringRadii.map((radius, index) => (
            <circle
              key={`bg-${index}`}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#EEEEEE"
              strokeWidth={ringStrokeWidths[index]}
            />
          ))}

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
              <circle
                key={index}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={category.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dashoffset 0.5s ease",
                }}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  // Completion circle component
  const CompletionCircle = ({ percentage }: { percentage: number }) => {
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform -rotate-90"
        >
          {/* Gray background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#EEEEEE"
            strokeWidth="10"
          />

          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#2A9DC4"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.5s ease",
            }}
          />
        </svg>

        {/* Percentage text in the center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl md:text-3xl font-bold text-[#2A9DC4]">
            {percentage}%
          </span>
          <span className="text-sm md:text-lg text-[#2A9DC4]">
            {t("course.completed")}
          </span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div>{t("course.loadingDashboard")}</div>;
  }

  if (error) {
    return <div>{t("course.errorLoadingDashboard")}</div>;
  }

  // Ensure we have valid data before rendering
  if (!categories || !Array.isArray(categories)) {
    return <div>{t("course.invalidDataFormat")}</div>;
  }

  return (
    <div className="flex flex-col gap-4 items-center justify-center mx-auto">
      <div className="w-full rounded-3xl bg-[#EFF9FC] border border-[var(--primary-200)] p-3 md:p-4 shadow-sm">
        <h1 className="font-sans text-base md:text-[18px] text-[var(--neutral-500)]">
          {t("course.dashboard")}
        </h1>
        <p className="text-[var(--neutral-400)] font-normal text-xs md:text-[12px]">
          {t("course.dashboardDescription")}
        </p>
        {/* Charts container */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-4 md:mt-6 mb-4 md:mb-6">
          <ConcentricCirclesChart categories={categories} />
          <CompletionCircle percentage={chartData.totalCompletion || 0} />
        </div>
        {/* Stats row */}
        {/* <div className="grid grid-cols-2 md:flex md:justify-between gap-2 md:gap-0">
          {categories.map((category: Category, index: number) => (
            <div key={index} className="flex flex-col items-center">
              <span
                className="text-xl md:text-2xl font-bold"
                style={{ color: category.color }}
              >
                {category.value}%
              </span> */}
        {/* Category icons */}
        {/* <span className="text-xs md:text-sm">{category.name}</span>
            </div>
          ))}
        </div> */}
        <div className="w-full mx-auto h-auto md:h-[62px] bg-[#DEE2E6] rounded-xl flex flex-row items-center justify-center p-3 md:p-4 gap-2 md:gap-4 mt-3">
          <div className="flex-shrink-0">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5C12.1421 0.5 15.5 3.85786 15.5 8ZM8 12.3125C8.31065 12.3125 8.5625 12.0606 8.5625 11.75V7.25C8.5625 6.93935 8.31065 6.6875 8 6.6875C7.68935 6.6875 7.4375 6.93935 7.4375 7.25V11.75C7.4375 12.0606 7.68935 12.3125 8 12.3125ZM8 4.25C8.41423 4.25 8.75 4.58579 8.75 5C8.75 5.41421 8.41423 5.75 8 5.75C7.58577 5.75 7.25 5.41421 7.25 5C7.25 4.58579 7.58577 4.25 8 4.25Z"
                fill="var(--neutral-300)"
              />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-medium text-[var(--neutral-300)]">
              {t("course.dashboardInfo")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPieChart;
