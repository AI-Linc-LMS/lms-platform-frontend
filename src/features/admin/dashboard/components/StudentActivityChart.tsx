import { useMemo } from "react";
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

type Period = "weekly" | "bimonthly" | "monthly";

const StudentDailyActivityChart = ({
  student_daily_activity = [],
  isLoading,
  error,
  period,
}: {
  student_daily_activity?: StudentDailyActivityApi[];
  isLoading: boolean;
  error: Error | null;
  period: Period;
}) => {
  const chartData = useMemo(() => {
    return (student_daily_activity ?? []).map((item) => {
      const d = new Date(item.date);
      const dateString = d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      });
      return {
        // ISO string used for axis scale and tick formatter (e.g., YYYY-MM-DD)
        dateISO: item.date,
        // Legacy label (not used for axis now)
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

  // Determine window size based on period
  const windowSize = useMemo(() => {
    switch (period) {
      case "weekly":
        return 7;
      case "bimonthly":
        return 15;
      case "monthly":
        return 30;
      default:
        return 7;
    }
  }, [period]);

  // Take the most recent N days
  const currentData = useMemo(() => {
    const len = chartData.length;
    const start = Math.max(0, len - windowSize);
    return chartData.slice(start, len);
  }, [chartData, windowSize]);

  // Compute limited X-axis ticks (max 7) to avoid clutter
  const xTickLabels = useMemo(() => {
    const n = currentData.length;
    if (n === 0) return [] as string[];
    if (period === "weekly") {
      return currentData.map((d) => String(d.dateISO));
    }
    const maxTicks = 8;
    const step = period === "bimonthly" ? 2 : 4;
    const indices: number[] = [];
    for (let i = 0; i < n && indices.length < maxTicks; i += step) {
      indices.push(i);
    }
    if (!indices.includes(n - 1)) {
      if (indices.length >= maxTicks) {
        indices[indices.length - 1] = n - 1;
      } else {
        indices.push(n - 1);
      }
    }
    return indices.map((i) => String(currentData[i].dateISO));
  }, [currentData, period]);

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
        Student Daily Activity
      </h2>
      <div className="mt-8">
        <ResponsiveContainer height={260}>
          <BarChart
            data={currentData}
            // increase bottom margin to give room for two-line date labels
            margin={{ top: 0, right: 0, left: 0, bottom: 40 }}
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
              dataKey="dateISO"
              tickLine={false}
              axisLine={false}
              interval={0}
              ticks={xTickLabels}
              minTickGap={12}
              // provide more margin between axis and labels
              tickMargin={14}
              scale="band"
              padding={{ left: 10, right: 10 }}
              tick={({ x, y, payload }) => {
                const dateObj = new Date(payload.value);
                const day = dateObj.getDate();
                const month = dateObj.getMonth() + 1;
                const year = dateObj.getFullYear();
                // shift labels slightly lower to fit inside chart area
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={10}
                      textAnchor="middle"
                      fill="#5D77A6"
                      fontSize={12}
                    >
                      {`${day}/${month}`}
                    </text>
                    <text
                      x={0}
                      y={0}
                      dy={28}
                      textAnchor="middle"
                      fill="#B0B8C1"
                      fontSize={13}
                    >
                      {year}
                    </text>
                  </g>
                );
              }}
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
      {/* No arrows; period buttons on Dashboard control the window */}
    </div>
  );
};

export default StudentDailyActivityChart;
