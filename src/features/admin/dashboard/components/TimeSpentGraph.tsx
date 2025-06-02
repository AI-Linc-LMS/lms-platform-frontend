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

const dummyData = [
  { day: "1 Jan", hours: 4 },
  { day: "2 Jan", hours: 9 },
  { day: "3 Jan", hours: 7 },
  { day: "4 Jan", hours: 6 },
  { day: "5 Jan", hours: 8 },
  { day: "6 Jan", hours: 2 },
  { day: "7 Jan", hours: 11 },
  { day: "8 Jan", hours: 4 },
  { day: "9 Jan", hours: 9 },
  { day: "10 Jan", hours: 7 },
  { day: "11 Jan", hours: 10 },
  { day: "12 Jan", hours: 12 },
  { day: "13 Jan", hours: 11 },
  { day: "14 Jan", hours: 9 },
  { day: "15 Jan", hours: 8 },
];

const HorizontalLines = ({ xAxisMap, yAxisMap }: any) => {
  const x0 = xAxisMap[Object.keys(xAxisMap)[0]]?.x ?? 0;
  const width = xAxisMap[Object.keys(xAxisMap)[0]]?.width ?? 0;
  const yAxis = yAxisMap[Object.keys(yAxisMap)[0]];
  const yScale = yAxis?.scale;
  const ticks = yAxis?.ticks ?? [];

  return (
    <>
      {ticks.map((tickValue: number, index: number) => {
        const y = yScale?.(tickValue);
        if (y === undefined) return null;
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

const TimeSpentGraph = () => {
  // State to track the start index of visible data window
  const [startIndex, setStartIndex] = useState(0);
  const windowSize = 10;

  // Clamp startIndex so that window stays within data range
  const maxStartIndex = Math.max(0, dummyData.length - windowSize);

  // Get the visible slice of data for current window
  const visibleData = useMemo(() => {
    return dummyData.slice(startIndex, startIndex + windowSize);
  }, [startIndex]);

  // Handle arrow click to scroll right (forward)
  const handleNext = () => {
    setStartIndex((prev) => Math.min(prev + 1, maxStartIndex));
  };

  // Handle arrow click to scroll left (backward)
  const handlePrev = () => {
    setStartIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="rounded-2xl border border-[#E3ECF5] bg-white p-4 md:p-6 w-full max-w-[700px] max-h-[370px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-[#1A3C57]">
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
              dataKey="day"
              tick={{ fontSize: 12, fill: "#5D77A6" }}
              tickLine={false}
              axisLine={false}
              interval={0}
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              domain={[0, 12]}
              ticks={[0, 3, 6, 9, 12]}
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
            <Customized
              component={(props: any) => <HorizontalLines {...props} />}
            />
            <Line
              type="linear"
              dataKey="hours"
              stroke="#8CD3E8"
              strokeWidth={3}
              dot={{
                fill: "#255C79",
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 5,
                fill: "#255C79",
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
