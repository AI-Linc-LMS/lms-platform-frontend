import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export type StudentDailyActivityApi = {
  video: number;
  article: number;
  quiz: number;
  assignment: number;
  coding_problem: number;
  dev_coding_problem: number;
  total: number;
  date: string; // YYYY-MM-DD
};

const colors: { [key: string]: string } = {
  Articles: "#234256",
  Videos: "var(--primary-500)",
  Problems: "var(--primary-400)",
  Quiz: "var(--primary-300)",
  Subjective: "var(--primary-300)",
  Development: "var(--primary-50)",
};

const StudentDailyActivityChart = ({
  student_daily_activity = [],
  isLoading,
  error,
}: {
  student_daily_activity?: StudentDailyActivityApi[];
  isLoading: boolean;
  error: Error | null;
}) => {
  const itemsPerPage = 7;
  const [page, setPage] = useState(0);
  const chartData = useMemo(() => {
    return (student_daily_activity ?? []).map((item) => {
      const d = new Date(item.date);
      const dateString = d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });
      return {
        date: dateString,
        Articles: item.article ?? 0,
        Videos: item.video ?? 0,
        Problems: item.coding_problem ?? 0,
        Quiz: item.quiz ?? 0,
        Subjective: item.assignment ?? 0,
        Development: item.dev_coding_problem ?? 0,
      };
    });
  }, [student_daily_activity]);
  const seriesKeys = useMemo(() => {
    return ["Articles", "Videos", "Problems", "Quiz", "Subjective", "Development"];
  }, []);

  const totalPages = Math.max(1, Math.ceil(chartData.length / itemsPerPage));

  const currentData = chartData.slice(page * itemsPerPage, page * itemsPerPage + itemsPerPage);

  const handleNext = () => {
    setPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrev = () => {
    setPage((prev) => Math.max(prev - 1, 0));
  };

  if (isLoading) {
    return (
      <div className="rounded-xl p-4 shadow-md w-full ring-1 ring-[var(--primary-100)] ring-offset-1 max-w-[700px] max-h-[430px]">
        <h2 className="text-xl font-bold mb-4 text-[var(--primary-500)]">Student Daily Activity →</h2>
        <div className="mt-8 animate-pulse h-60 bg-gray-100 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-4 shadow-md w-full ring-1 ring-red-200 ring-offset-1 max-w-[700px] max-h-[430px] text-red-600">
        <h2 className="text-xl font-bold mb-4 text-[var(--primary-500)]">Student Daily Activity →</h2>
        Failed to load activity data.
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 shadow-md w-full ring-1 ring-[var(--primary-100)] ring-offset-1 max-w-[700px] max-h-[430px]">
      <h2 className="text-xl font-bold mb-4 text-[var(--primary-500)]">
        Student Daily Activity →
      </h2>
      <div className="mt-8">
        <ResponsiveContainer height={240}>
          <BarChart
            data={currentData}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            barSize={20}
            barGap={0}
            barCategoryGap="0%"
          >
            <CartesianGrid
              stroke="#ccc"
              horizontal
              vertical={false}
              strokeWidth={1}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#5D77A6" }}
              tickLine={false}
              axisLine={false}
              interval={0}
              minTickGap={12}
              tickMargin={10}
              scale="band"
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              tickFormatter={(tick) => `${tick}`}
              tick={{ fontSize: 12, fill: "#5D77A6" }}
              tickLine={false}
              axisLine={false}
              padding={{ top: 10, bottom: 10 }}
            />
            {seriesKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={colors[key]}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-2 text-sm text-[#1A3C57] font-medium">
        {seriesKeys.map((key) => (
          <div key={key} className="flex items-center space-x-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: colors[key] }}
            />
            <span>{key}</span>
          </div>
        ))}
      </div>
      {chartData.length === 0 && (
        <div className="text-center text-sm text-gray-500 mt-4">No activity data available.</div>
      )}
      <div className="flex justify-end mt-6 space-x-2">
        <div className="flex items-center gap-2">
          <div
            onClick={handlePrev}
            className={`w-8 h-8 md:w-10 md:h-10 rounded-full border border-[#D3E3F2] flex items-center justify-center cursor-pointer ${
              page === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={page === 0 ? "Start of data" : "Previous"}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="text-[#1A3C57]"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </div>
          <div
            onClick={handleNext}
            className={`w-8 h-8 md:w-10 md:h-10 rounded-full border border-[#D3E3F2] flex items-center justify-center cursor-pointer ${
              page >= totalPages - 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={page >= totalPages - 1 ? "End of data" : "Next"}
          >
            <svg
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              className="text-[#1A3C57]"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDailyActivityChart;
