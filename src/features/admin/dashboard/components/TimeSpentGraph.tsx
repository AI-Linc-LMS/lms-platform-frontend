import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Customized,
} from "recharts";
import { DailyTimeSpentAdmin } from "../pages/Dashboard";
import React from "react";

// Error dashboard component
const ErrorDashboard = ({ error }: { error: Error | null }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full max-w-[600px]">
    <strong className="font-bold">Error:</strong>
    <span className="block sm:inline ml-2">
      {error?.message || "An error occurred while loading the dashboard."}
    </span>
  </div>
);

interface TimeSpentProps {
  daily_time_spend: DailyTimeSpentAdmin[];
  isLoading: boolean;
  error: Error | null;
}

const TimeSpentGraph = ({
  daily_time_spend,
  isLoading,
  error,
}: TimeSpentProps) => {
  // State to track the start index of visible data window
  const [startIndex, setStartIndex] = useState(0);
  const windowSize = 6;

  // Clamp startIndex so that window stays within data range
  const maxStartIndex = Math.max(0, daily_time_spend.length - windowSize);

  // Get the visible slice of data for current window
  const visibleData = useMemo(() => {
    return daily_time_spend.slice(startIndex, startIndex + windowSize);
  }, [startIndex, daily_time_spend]);

  // Handle arrow click to scroll right (forward)
  const handleNext = () => {
    setStartIndex((prev) => Math.min(prev + 1, maxStartIndex));
  };

  // Handle arrow click to scroll left (backward)
  const handlePrev = () => {
    setStartIndex((prev) => Math.max(prev - 1, 0));
  };

  const maxTimeSpent = Math.max(...visibleData.map((d) => d.time_spent ?? 0));
  const step = maxTimeSpent / 4;

  // Generate ticks based on min and max
  function generateTicks(max: number, step = 3) {
    const ticks = [];
    for (let t = 0; t <= max; t += step) {
      ticks.push(Number(t.toFixed(1)));
    }
    // Always include 0 and max
    if (!ticks.includes(0)) ticks.unshift(0);
    if (!ticks.includes(max)) ticks.push(Number(max.toFixed(1)));
    // Remove duplicates and sort numerically
    return Array.from(new Set(ticks)).sort((a, b) => a - b);
  }

  // Avoid NaN step
  const safeStep = isFinite(step) && step > 0 ? step : 1;
  const ticks = generateTicks(maxTimeSpent, safeStep);
  console.log(ticks);

  if (isLoading) {
    return <div> Loading... </div>;
  }

  if (error) {
    return <ErrorDashboard error={error} />;
  }

  return (
    <div className="rounded-2xl bg-white p-4 md:p-6 w-full max-w-[600px] max-h-[370px] ring-1 ring-[var(--primary-100)] ring-offset-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold mb-4 text-[var(--default-primary)]">
          Total Time Spent by Students →
        </h2>
        <div className="flex items-center gap-2">
          <div
            onClick={handlePrev}
            className={`w-8 h-8 md:w-10 md:h-10 rounded-full border border-[#D3E3F2] flex items-center justify-center cursor-pointer ${
              startIndex >= maxStartIndex ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={startIndex >= maxStartIndex ? "End of data" : "Next 10 days"}
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
              startIndex >= maxStartIndex ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={startIndex >= maxStartIndex ? "End of data" : "Next 10 days"}
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

      <div className="h-[240px] -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={visibleData}
            margin={{ top: 0, right: 20, bottom: 10, left: 0 }}
          >
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              interval={0}
              padding={{ left: 10, right: 10 }}
              tick={({ x, y, payload }) => {
                // Expecting payload.value to be a date string (e.g., '2023-10-03')
                const dateObj = new Date(payload.value);
                const day = dateObj.getDate();
                const month = dateObj.getMonth() + 1;
                const year = dateObj.getFullYear();
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      x={0}
                      y={0}
                      dy={8}
                      textAnchor="middle"
                      fill="#5D77A6"
                      fontSize={12}
                    >
                      {`${day}/${month}`}
                    </text>
                    <text
                      x={0}
                      y={0}
                      dy={22}
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
              domain={[0, maxTimeSpent]}
              ticks={ticks}
              tickFormatter={(tick) => `${tick} hr`}
              tick={{ fontSize: 12, fill: "#5D77A6" }}
              tickLine={false}
              axisLine={false}
              padding={{ top: 10, bottom: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #D3E3F2",
                borderRadius: "8px",
              }}
              formatter={(value) => [`${value} hr`, "Time Spent"]}
            />
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Customized
              component={React.memo(CustomHorizontalGrid) as React.FC<any>}
            />

            <Line
              type="linear"
              dataKey="time_spent"
              stroke="#8CD3E8"
              strokeWidth={3}
              dot={{
                fill: "var(--default-primary)",
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 5,
                fill: "var(--default-primary)",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 ml-2 text-sm text-[#003153] font-medium flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-[#003153] inline-block mr-2" />
        No. of hours
      </div>
    </div>
  );
};

export default TimeSpentGraph;

// Custom grid lines component
const CustomHorizontalGrid = ({
  xAxisMap,
  yAxisMap,
}: {
  xAxisMap: Record<string, any>;
  yAxisMap: Record<string, any>;
}) => {
  const x0 = xAxisMap[Object.keys(xAxisMap)[0]]?.x ?? 0;
  const width = xAxisMap[Object.keys(xAxisMap)[0]]?.width ?? 0;
  const yAxis = yAxisMap[Object.keys(yAxisMap)[0]];
  const yScale = yAxis?.scale;
  const ticks = yAxis?.ticks ?? [];

  return (
    <>
      {ticks.map((tickValue: number, index: number) => {
        const y = yScale?.(tickValue);
        if (typeof y !== "number" || isNaN(y)) return null;
        return (
          <line
            key={`hline-${index}`}
            x1={x0}
            x2={x0 + width}
            y1={y}
            y2={y}
            stroke="#E6F0FF"
            strokeWidth={1}
          />
        );
      })}
    </>
  );
};
