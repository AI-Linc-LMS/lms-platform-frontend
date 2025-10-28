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

type Period = "weekly" | "bimonthly" | "monthly";

interface StudentCompletionGraphProps {
  data: StudentActivityAnalytics[];
  isLoading: boolean;
  error: Error | null;
  period: Period;
}

const ErrorDashboard = ({ error }: { error: Error | null }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full max-w-[600px]">
    <strong className="font-bold">Error:</strong>
    <span className="block sm:inline ml-2">
      {error?.message || "An error occurred while loading the graph."}
    </span>
  </div>
);

const StudentCompletionGraph = ({
  data,
  isLoading,
  error,
  period,
}: StudentCompletionGraphProps) => {
  // Calculate completion percentage: (Active_days / total_possible_days) * 100
  // NOT capped - can exceed 100% if student has more active days than the period
  const chartData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    // Determine total possible days based on period
    const totalDays = period === "weekly" ? 7 : period === "bimonthly" ? 15 : 30;
    
    return data
      .map((student) => ({
        studentName: student.studentName,
        activeDays: student.Active_days,
        presentStreak: student.Present_streak,
        // Calculate completion percentage based on active days
        // Can exceed 100% if Active_days > totalDays
        completionPercentage: totalDays > 0 
          ? Math.round((student.Active_days / totalDays) * 100)
          : 0,
      }))
      .sort((a, b) => b.completionPercentage - a.completionPercentage) // Sort by completion desc
      .slice(0, 10); // Show top 10 students
  }, [data, period]);

  const maxPercentage = Math.max(...chartData.map((d) => d.completionPercentage), 100);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <ErrorDashboard error={error} />;

  return (
    <div className="rounded-2xl bg-white p-6 w-full h-[400px] ring-1 ring-[var(--primary-100)] ring-offset-1 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-[var(--primary-500)]">
          Student Course Completion Rate
        </h2>
        <div className="text-xs text-gray-500">Top 10 Students</div>
      </div>

      <div className="h-[280px] -ml-4">
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
              domain={[0, maxPercentage]}
              tickFormatter={(tick) => `${tick}%`}
              tick={{ fontSize: 11, fill: "#5D77A6" }}
              tickLine={false}
              axisLine={false}
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
                          <span className="text-gray-600">Completion:</span>
                          <span className="font-semibold text-[var(--primary-600)]">
                            {data.completionPercentage}%
                          </span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="text-gray-600">Active Days:</span>
                          <span className="font-medium text-gray-700">
                            {data.activeDays}
                          </span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="text-gray-600">Present Streak:</span>
                          <span className="font-medium text-gray-700">
                            {data.presentStreak}
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
              dataKey="completionPercentage"
              fill="url(#colorCompletion)"
              radius={[6, 6, 0, 0]}
            >
            </Bar>
            
            <defs>
              <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary-500)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--primary-300)" stopOpacity={0.7} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-b from-[var(--primary-500)] to-[var(--primary-300)]" />
          <span>Completion %</span>
        </div>
      </div>
    </div>
  );
};

export default StudentCompletionGraph;
