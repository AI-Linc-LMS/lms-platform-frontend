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

interface AttendanceRecord {
  date: string;
  total_attendance_count: number;
}

type Period = "weekly" | "bimonthly" | "monthly";

interface AttendanceTrendGraphProps {
  attendance_activity_record: AttendanceRecord[];
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

const AttendanceTrendGraph = ({ attendance_activity_record, isLoading, error, period }: AttendanceTrendGraphProps) => {
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
    if (!Array.isArray(attendance_activity_record)) return [];
    const len = attendance_activity_record.length;
    const start = Math.max(0, len - windowSize);
    return attendance_activity_record.slice(start, len);
  }, [attendance_activity_record, windowSize]);

  // Format chart data for display
  const chartData = useMemo(() => {
    return visibleData.map((item) => ({
      date: new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      attendance: item.total_attendance_count,
    }));
  }, [visibleData]);

  const maxAttendance = Math.max(...chartData.map((d) => d.attendance), 10);

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

  return (
    <div className="rounded-2xl bg-white p-6 w-full h-[430px] ring-1 ring-[var(--primary-100)] ring-offset-1 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-[var(--primary-500)]">
          Attendance Trend
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
              domain={[0, maxAttendance]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#5D77A6" }}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #D3E3F2",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#5D77A6", fontWeight: "bold" }}
              itemStyle={{ color: "var(--primary-500)" }}
            />

            <defs>
              <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary-500)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary-500)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <Line
              type="monotone"
              dataKey="attendance"
              stroke="var(--primary-500)"
              strokeWidth={3}
              dot={{ r: 4, fill: "var(--primary-500)", strokeWidth: 2, stroke: "white" }}
              activeDot={{ r: 6, fill: "var(--primary-500)" }}
              fill="url(#colorAttendance)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center items-center gap-4 text-xs text-gray-600 mt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-[var(--primary-500)]" />
          <span>Total Attendance</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTrendGraph;
