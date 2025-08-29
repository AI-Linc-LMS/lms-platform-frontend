import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import CustomTooltip from "./CustomTooltip";
import { getHoursSpentData } from "../../../../services/dashboardApis";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useMemo } from "react";

interface HoursSpentCardProps {
  timeRange: string;
  setTimeRange: (value: string) => void;
}

interface HoursSpentData {
  date_range: string[];
  hours_spent: number[];
  units: string;
}

const HoursSpentCard = ({
  timeRange,
  setTimeRange,
}: HoursSpentCardProps) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const { data, isLoading, error } = useQuery<HoursSpentData>({
    queryKey: ["hoursSpentData", timeRange],
    queryFn: () => getHoursSpentData(clientId, Number(timeRange)),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });


  // Transform API data into chart format
  const chartData = useMemo(() => {
    if (!data) return [];
    return data.date_range.map((date, index) => ({
      day: date,
      hours: data.hours_spent[index]
    }));
  }, [data]);


  // Calculate max hours for Y-axis
  const maxHours = useMemo(() => {
    if (!data?.hours_spent?.length) return 24;
    const max = Math.max(...data.hours_spent);
    // Round up to nearest multiple of 2
    return Math.ceil(max / 2) * 2;
  }, [data]);

  // Calculate total hours
  const totalHours = useMemo(() => {
    if (!data?.hours_spent?.length) return 0;
    const total = data.hours_spent.reduce((sum, hours) => sum + hours, 0);
    return Number(total.toFixed(1));
  }, [data]);

  // Format date for X-axis
  const formatDate = (date: string) => {
    try {
      return format(parseISO(date), 'MMM dd');
    } catch {
      return date;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col w-full max-w-[650px]">
        <div className="h-[200px] bg-gray-200 animate-pulse rounded"></div>
      </div>
    );
  }

  // Create empty data for error state
  const emptyData = Array(7).fill(0).map((_, index) => ({
    day: format(new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    hours: 0
  }));

  return (
    <div className="flex flex-col w-full max-w-full md:max-w-[650px]">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{totalHours}</h2>
          <p className="text-gray-500 text-md">Total hours spent</p>
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          {error && (
            <div className="text-sm">
              Error loading data
            </div>
          )}
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-full px-3 md:px-4 py-1 md:py-2 pr-8 text-sm text-gray-700 focus:outline-none"
            >
              <option value="7">Last Week</option>
              <option value="15">Last 15 Days</option>
              <option value="30">Last 30 Days</option>
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
      </div>

      <div className="h-[180px] md:h-[200px] mt-4 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={error ? emptyData : chartData}
            margin={{ top: 5, right: 20, bottom: 20, left: 0 }}
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
              tick={{ fill: "#6B7280", fontSize: 10 }}
              tickFormatter={formatDate}
              tickMargin={10}
            />

            <YAxis
              domain={[0, error ? 24 : maxHours]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 10 }}
              ticks={[0, error ? 12 : Math.floor(maxHours / 2), error ? 24 : maxHours]}
              tickMargin={5}
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
    </div>
  );
};

export default HoursSpentCard;
