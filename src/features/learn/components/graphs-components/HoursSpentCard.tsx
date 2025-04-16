// import { useState } from "react";
import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import CustomTooltip from "./CustomTooltip";

interface HoursSpentCardProps {
  timeRange: string;
  setTimeRange: (value: string) => void;
  hourData: { day: string; hours: number }[];
  totalHours: number;
}

const HoursSpentCard = ({
  timeRange,
  setTimeRange,
  hourData,
  totalHours,
}: HoursSpentCardProps) => {
  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{totalHours}</h2>
          <p className="text-gray-500 text-md">Total hours spent</p>
        </div>
        <div className="relative">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="appearance-none bg-white border border-gray-200 rounded-full px-4 py-2 pr-8 text-gray-700 focus:outline-none"
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg
              className="fill-current h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="h-[200px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={hourData}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <defs>
              <linearGradient id="hoursFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="20%" stopColor="#417845" stopOpacity={3.0} />
                <stop offset="95%" stopColor="#F4F9F5" stopOpacity={0.1} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              angle={0}
              textAnchor="end"
              interval={Math.ceil(hourData.length / 7)} // Spread out labels if too many
            />
            <YAxis
              domain={[0, 24]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280" }}
              ticks={[0, 6, 12, 18, 24]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="linear"
              dataKey="hours"
              stroke="#417845"
              strokeWidth={3}
              fill="url(#hoursFill)"
              activeDot={{
                r: 6,
                fill: "#417845",
                strokeWidth: 2,
                stroke: "#fff",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/*<div className="flex justify-between mt-2 text-gray-500">
        <span>Sun</span>
        <span>Wed</span>
        <span>Sat</span>
      </div>*/}
    </div>
  );
};

export default HoursSpentCard;
