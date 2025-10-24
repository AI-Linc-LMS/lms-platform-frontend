import { useMemo, useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";

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
  Articles: "var(--chart-articles, #FF6B6B)",
  Videos: "var(--chart-videos, #4ECDC4)",
  Problems: "var(--chart-problems, #FFD93D)",
  Quiz: "var(--chart-quiz, #6C5CE7)",
  Subjective: "var(--chart-subjective, #A8E6CF)",
  Development: "var(--chart-development, #FF8B94)",
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
      const dateString = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
      return {
        dateISO: item.date,
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

  const seriesKeys = useMemo(() => ["Articles", "Videos", "Problems", "Quiz", "Subjective", "Development"], []);

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

  const currentData = useMemo(() => {
    const len = chartData.length;
    const start = Math.max(0, len - windowSize);
    return chartData.slice(start, len);
  }, [chartData, windowSize]);

  const xTickLabels = useMemo(() => {
    const n = currentData.length;
    if (n === 0) return [] as string[];
    if (period === "weekly") return currentData.map((d) => String(d.dateISO));
    const maxTicks = 8;
    const step = period === "bimonthly" ? 2 : 4;
    const indices: number[] = [];
    for (let i = 0; i < n && indices.length < maxTicks; i += step) indices.push(i);
    if (!indices.includes(n - 1)) {
      if (indices.length >= maxTicks) indices[indices.length - 1] = n - 1;
      else indices.push(n - 1);
    }
    return indices.map((i) => String(currentData[i].dateISO));
  }, [currentData, period]);

  const [hoveredSegment, setHoveredSegment] = useState<
    | null
    | { name: string; value: number; dateISO: string; color: string; x: number; y: number }
    >(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Recharts sometimes passes (data, index, event) or an event-like object.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBarMouseMove = (payloadOrEvent: any, key: string, e?: any) => {
    const data = payloadOrEvent?.payload ?? payloadOrEvent;
    const val = data?.[key] ?? 0;
    const dateISO = data?.dateISO ?? "";
    const rect = containerRef.current?.getBoundingClientRect();
    const x = e?.clientX && rect ? e.clientX - rect.left : 0;
    const y = e?.clientY && rect ? e.clientY - rect.top : 0;
    setHoveredSegment({ name: key, value: val, dateISO, color: colors[key], x, y });
  };

  const handleBarMouseLeave = () => setHoveredSegment(null);

  if (isLoading)
    return (
      <div className="rounded-2xl p-6 shadow-md w-full ring-1 ring-[var(--primary-100)] ring-offset-1 max-w-[900px] h-[430px]">
        <h2 className="text-xl font-bold mb-6 text-[var(--primary-500)]">Student Daily Activity</h2>
        <div className="mt-8 animate-pulse h-60 bg-gray-100 rounded" />
      </div>
    );

  if (error)
    return (
      <div className="rounded-2xl p-6 shadow-md w-full ring-1 ring-red-200 ring-offset-1 max-w-[900px] h-[430px] text-red-600">
        <h2 className="text-xl font-bold mb-6 text-[var(--primary-500)]">Student Daily Activity</h2>
        Failed to load activity data.
      </div>
    );

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl p-6 shadow-md w-full ring-1 ring-[var(--primary-100)] ring-offset-1 h-[430px]"
    >
      <h2 className="text-xl font-bold mb-6 text-[var(--primary-500)]">Student Daily Activity</h2>

      <div className="mt-4">
        <ResponsiveContainer height={280}>
          <BarChart data={currentData} margin={{ top: 0, right: 20, left: 0, bottom: 40 }} barSize={25} barGap={26} barCategoryGap="20%">
            <CartesianGrid stroke="#E6EDF6" horizontal vertical={false} strokeWidth={1} />
            <XAxis
              dataKey="dateISO"
              tickLine={false}
              axisLine={false}
              interval={0}
              ticks={xTickLabels}
              minTickGap={12}
              tickMargin={14}
              scale="point"
              padding={{ left: 10, right: 10 }}
              tick={({ x, y, payload }) => {
                const dateObj = new Date(payload.value);
                const day = dateObj.getDate();
                const month = dateObj.getMonth() + 1;
                const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={10} textAnchor="middle" fill="#5D77A6" fontSize={10}>{`${day}/${month}`}</text>
                    <text x={0} y={0} dy={24} textAnchor="middle" fill="#B0B8C1" fontSize={11}>{dayName}</text>
                  </g>
                );
              }}
            />

            <YAxis tickFormatter={(tick) => `${tick}`} tick={{ fontSize: 12, fill: "#5D77A6" }} tickLine={false} axisLine={false} padding={{ top: 10, bottom: 10 }} />

            {seriesKeys.map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="a"
                fill={colors[key]}
                radius={[2, 2, 0, 0]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onMouseMove={(payload: any, _index: number, e: any) => handleBarMouseMove(payload, key, e)}
                onMouseLeave={handleBarMouseLeave}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mt-2 text-sm text-[#1A3C57] font-medium">
        {seriesKeys.map((key) => (
          <div key={key} className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[key] }} />
            <span>{key}</span>
          </div>
        ))}
      </div>

      {chartData.length === 0 && <div className="text-center text-sm text-gray-500 mt-4">No activity data available.</div>}

      {/* Absolute tooltip for hovered segment */}
      {hoveredSegment && (
        <div className="absolute z-20" style={{ left: Math.min(hoveredSegment.x + 12, 720), top: hoveredSegment.y + 12 }}>
    <div className="bg-[var(--card-bg)] border border-[#D3E3F2] rounded-lg p-3 shadow-lg min-w-[140px]">
            <p className="text-xs font-semibold text-gray-700 mb-2">{new Date(hoveredSegment.dateISO).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredSegment.color }} />
                <span className="text-gray-600">{hoveredSegment.name}:</span>
              </div>
              <span className="font-medium text-gray-800">{hoveredSegment.value}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDailyActivityChart;
