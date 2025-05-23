import React, { useMemo } from "react";
import { format } from "date-fns";

interface ActivityData {
  date: string;
  level: number;
  value: number;
}

interface MonthHeatmapProps {
  year: number;
  monthName: string;
  month: number;
  daysCount: number;
  activityMap: Map<string, ActivityData>;
  hoveredCell: string | null;
  setHoveredCell: (cell: string | null) => void;
}

const MonthHeatmap: React.FC<MonthHeatmapProps> = ({
  year,
  monthName,
  month,
  daysCount,
  activityMap,
  hoveredCell,
  setHoveredCell,
}) => {
  const daysInMonth = useMemo(() => {
    const days: Date[] = [];
    for (let d = 1; d <= daysCount; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }, [year, month, daysCount]);


  const startWeekday = new Date(year, month, 1).getDay();
  const weeksCount = Math.ceil((startWeekday + daysInMonth.length) / 7);
  
  const allCells = useMemo(() => {
    const prefix = Array(startWeekday).fill(null);
    const middle = daysInMonth;
    const suffixCount = weeksCount * 7 - (prefix.length + middle.length);
    const suffix = Array(Math.max(0, suffixCount)).fill(null);

    return [...prefix, ...middle, ...suffix];
  }, [daysInMonth, startWeekday, weeksCount]);

  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    for (let i = 0; i < weeksCount; i++) {
      result.push(allCells.slice(i * 7, (i + 1) * 7));
    }
    return result;
  }, [allCells, weeksCount]);

  return (
    <div className="flex flex-col space-y-1 w-full">
      <div className="flex space-x-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col space-y-1">
            {week.map((date, dateIndex) => {
              if (!date) {
                return <div key={dateIndex} className="lg:w-[10px] lg:h-[10px] xl:w-[13px] xl:h-[13px] bg-transparent" />;
              }

              const dateStr = format(date, "yyyy-MM-dd");
              const activity = activityMap.get(dateStr);
              const isHovered = hoveredCell === dateStr;

              return (
                <div
                  key={dateIndex}
                  className="relative"
                  onMouseEnter={() => setHoveredCell(dateStr)}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  <div
                    className={`lg:w-[10px] lg:h-[10px] xl:w-[13px] xl:h-[13px] rounded-sm ${
                      activity
                        ? getActivityColor(activity.level)
                        : "bg-gray-200"
                    } ${isHovered ? "transform scale-110 shadow-md" : ""}`}
                  />
                  {isHovered && activity && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-10 bg-white p-2 rounded shadow-md text-xs border border-gray-200 whitespace-nowrap pointer-events-none"
                      style={{ minWidth: "max-content" }}
                    >
                      <p className="font-medium">{format(date, "MMM d")}</p>
                      <p className="text-gray-700">
                        Activity: {activity.value} hrs
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="text-end text-sm font-medium mb-2">{monthName}</div>
    </div>
  );
};

const getActivityColor = (level: number) => {
  const customColors = [
    "bg-gray-200",   // No activity
    "bg-[#CDE5CE]",  // Light green
    "bg-[#A6CFA9]",  // Medium light green
    "bg-[#77B17B]",  // Medium green
    "bg-[#417845]",  // Dark green
    "bg-[#2E4D31]",  // Very dark green
  ];
  return customColors[level] ?? "bg-gray-200";  
};

export default MonthHeatmap;
