import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Customized,
} from "recharts";
import React from "react";

interface SessionCreationTime {
  date: string;
  activity_created_time: string;
  has_activity: boolean;
}

type Period = "weekly" | "bimonthly" | "monthly";

interface SessionStartTimeTrendGraphProps {
  attendance_creation_time: SessionCreationTime[];
  isLoading: boolean;
  error: Error | null;
  period: Period;
}

const ErrorDashboard = ({ error }: { error: Error | null }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full max-w-[600px]">
    <strong className="font-bold">Error:</strong>
    <span className="block sm:inline ml-2">{error?.message || "An error occurred while loading the graph."}</span>
  </div>
);

const SessionStartTimeTrendGraph = ({ attendance_creation_time, isLoading, error, period }: SessionStartTimeTrendGraphProps) => {
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

  const visibleData = useMemo(() => {
    if (!Array.isArray(attendance_creation_time)) return [];
    const len = attendance_creation_time.length;
    const start = Math.max(0, len - windowSize);
    return attendance_creation_time.slice(start, len);
  }, [attendance_creation_time, windowSize]);

  // Format chart data for display - convert time string to decimal hours
  const chartData = useMemo(() => {
    return visibleData
      .filter((item) => item.has_activity) // Only include days with activities
      .map((item) => {
        const timeStr = item.activity_created_time; // Format: "HH:MM:SS"
        const [hours, minutes] = timeStr.split(':').map(Number);
        const decimalHours = hours + (minutes / 60);
        
        return {
          date: new Date(item.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          time: decimalHours,
          timeFormatted: timeStr.substring(0, 5), // "HH:MM"
        };
      });
  }, [visibleData]);

  // Calculate min and max time for Y-axis domain
  const { minTime, maxTime } = useMemo(() => {
    if (chartData.length === 0) return { minTime: 8, maxTime: 18 }; // Default 8 AM to 6 PM
    const times = chartData.map((d) => d.time);
    const min = Math.floor(Math.min(...times));
    const max = Math.ceil(Math.max(...times));
    return { minTime: Math.max(0, min - 1), maxTime: Math.min(24, max + 1) };
  }, [chartData]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <ErrorDashboard error={error} />;

  // Custom grid component with faint horizontal lines
  const CustomGrid: React.FC = () => (
    <g>
      {[0, 1, 2, 3, 4].map((i) => {
        const y = (i / 4) * 260;
        return (
          <line
            key={i}
            x1={0}
            x2="100%"
            y1={y}
            y2={y}
            stroke="#E6EDF6"
            strokeWidth={1}
          />
        );
      })}
    </g>
  );

  // Format Y-axis tick to show time (e.g., 9:00, 10:00)
  const formatTime = (decimalHour: number) => {
    const hour = Math.floor(decimalHour);
    const minute = Math.round((decimalHour - hour) * 60);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return minute > 0 ? `${displayHour}:${minute.toString().padStart(2, '0')} ${period}` : `${displayHour} ${period}`;
  };

  return (
    <div className="rounded-2xl bg-white p-6 w-full h-[430px] ring-1 ring-[var(--primary-100)] ring-offset-1 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-[var(--primary-500)]">
          Session Start Time Trend
        </h2>
      </div>

      <div className="h-[260px] -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <Customized component={CustomGrid} />
            
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#5D77A6" }}
              dy={5}
            />

            <YAxis
              domain={[minTime, maxTime]}
              tickFormatter={formatTime}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "#5D77A6" }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #D3E3F2",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#5D77A6", fontWeight: "bold" }}
              formatter={(value: number, name: string) => {
                if (name === "time") {
                  const item = chartData.find(d => d.time === value);
                  return [item?.timeFormatted || formatTime(value), "Start Time"];
                }
                return [value, name];
              }}
            />

            <defs>
              <linearGradient id="colorSessionTime" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <Line
              type="monotone"
              dataKey="time"
              stroke="var(--primary-500)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--primary-500)", strokeWidth: 2, stroke: "white" }}
              activeDot={{ r: 6, fill: "var(--primary-500)" }}
              fill="url(#colorSessionTime)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center items-center gap-4 text-xs text-gray-600 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[var(--primary-500)]" />
          <span>Session Start Time</span>
        </div>
      </div>
    </div>
  );
};

export default SessionStartTimeTrendGraph;
