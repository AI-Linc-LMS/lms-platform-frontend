import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { StudentActivityAnalytics } from "../../../../services/attendanceApis";

interface StudentPresentStreakGraphProps {
  data: StudentActivityAnalytics[];
  isLoading: boolean;
  error: Error | null;
}

const ErrorDashboard = ({ error }: { error: Error | null }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full max-w-[600px]">
    <strong className="font-bold">Error:</strong>
    <span className="block sm:inline ml-2">
      {error?.message || "An error occurred while loading the graph."}
    </span>
  </div>
);

const StudentPresentStreakGraph = ({
  data,
  isLoading,
  error,
}: StudentPresentStreakGraphProps) => {
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    return data
      .map((student) => ({
        studentName: student.studentName,
        presentStreak: student.Present_streak,
        activeDays: student.Active_days,
      }))
      .sort((a, b) => b.presentStreak - a.presentStreak) // Sort by present streak desc
      .slice(0, 10); // Show top 10 students
  }, [data]);

  const maxStreak = Math.max(...chartData.map((d) => d.presentStreak), 10);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <ErrorDashboard error={error} />;

  return (
    <div className="rounded-2xl bg-white p-6 w-full h-[430px] ring-1 ring-[var(--primary-100)] ring-offset-1 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-[var(--primary-500)]">
          Student Present Streak
        </h2>
        <div className="text-xs text-gray-500">Top 10 Students</div>
      </div>

      <div className="h-[300px] -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 20, bottom: 60, left: 0 }}
            barSize={30}
          >
            <CartesianGrid stroke="#E6EDF6" horizontal vertical={false} strokeWidth={1} />
            
            <XAxis
              dataKey="studentName"
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 11, fill: "#5D77A6", fontWeight: 500 }}
            />

            <YAxis
              domain={[0, maxStreak]}
              tick={{ fontSize: 11, fill: "#5D77A6" }}
              tickLine={false}
              axisLine={false}
              label={{ value: "Days", angle: -90, position: "insideLeft", style: { fill: "#5D77A6", fontSize: 11 } }}
            />

            <Tooltip
              cursor={{ fill: "rgba(93, 119, 166, 0.05)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white border border-[#D3E3F2] rounded-lg p-3 shadow-xl">
                      <p className="text-xs font-bold text-[var(--primary-600)] mb-2">
                        {data.studentName}
                      </p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between gap-6">
                          <span className="text-gray-600">Present Streak:</span>
                          <span className="font-semibold text-[var(--primary-600)]">
                            {data.presentStreak} days
                          </span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="text-gray-600">Active Days:</span>
                          <span className="font-medium text-gray-700">
                            {data.activeDays}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Bar
              dataKey="presentStreak"
              fill="url(#colorStreak)"
              radius={[6, 6, 0, 0]}
            />
            
            <defs>
              <linearGradient id="colorStreak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#34D399" stopOpacity={0.7} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-[#10B981] to-[#34D399]" />
          <span>Present Streak (Days)</span>
        </div>
      </div>
    </div>
  );
};

export default StudentPresentStreakGraph;
