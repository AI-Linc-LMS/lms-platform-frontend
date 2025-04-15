import React, { useMemo } from "react";
import { format } from "date-fns";

interface ActivityData {
  date: string;
  level: number;
  value: number;
}

interface MonthHeatmapProps {
  year: number; // ✅ Accept year from parent
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
  // ✅ Use passed year instead of hardcoding current year
  const daysInMonth = useMemo(() => {
    const days = [];
    for (let day = 1; day <= daysCount; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [year, month, daysCount]);

  const numOfWeeks = Math.ceil(daysInMonth.length / 7);

  const weeks = Array.from({ length: numOfWeeks }).map((_, weekIndex) => {
    const startDayIndex = weekIndex * 7;
    return daysInMonth.slice(startDayIndex, startDayIndex + 7);
  });

  return (
    <div className="w-full flex flex-col space-y-1">
      <div className="flex space-x-1">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col space-y-1">
            {week.map((date, dayIndex) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const activity = activityMap.get(dateStr);
              const isHovered = hoveredCell === dateStr;

              return (
                <div
                  key={dayIndex}
                  className="relative"
                  onMouseEnter={() => setHoveredCell(dateStr)}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  <div
                    className={`w-[13px] h-[13px] rounded-sm ${
                      activity ? getActivityColor(activity.level) : "bg-gray-200"
                    } ${isHovered ? "transform scale-110 shadow-md" : ""}`}
                  />
                  {isHovered && activity && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-10 bg-white p-2 rounded shadow-md text-xs border border-gray-200 whitespace-nowrap pointer-events-none"
                      style={{ minWidth: "max-content" }}
                    >
                      <p className="font-medium">{format(date, "MMM d")}</p>
                      <p className="text-gray-700">Activity: {activity.value} hrs</p>
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
  const colors = [
    "bg-gray-200",
    "bg-green-200",
    "bg-green-400",
    "bg-green-600",
    "bg-green-800",
  ];
  return colors[level];
};

export default MonthHeatmap;
