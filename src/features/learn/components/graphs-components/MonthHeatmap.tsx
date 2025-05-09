import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

interface ActivityData {
  date: string;
  level: number;
  value: number;
  articles?: number;
  videos?: number;
  problems?: number;
  quizzes?: number;
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);
  

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
                return (
                  <div
                    key={dateIndex}
                    className={`w-[8px] h-[8px] md:w-[10px] md:h-[10px] lg:w-[12px] lg:h-[12px] xl:w-[14px] xl:h-[14px] bg-transparent rounded-sm`}
                  />
                );
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
                    className={`w-[8px] h-[8px] md:w-[10px] md:h-[10px] lg:w-[12px] lg:h-[12px] xl:w-[14px] xl:h-[14px] rounded-sm ${
                      activity
                        ? getActivityColor(activity.level)
                        : "bg-[#E9ECE9]"
                    } ${isHovered ? "transform scale-110 shadow-md" : ""} ${isMobile ? "w-[10px] h-[10px]" : ""}`}
                  />
                  {isHovered && activity && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-10 bg-white p-2 rounded shadow-md text-xs border border-gray-200 whitespace-nowrap pointer-events-none"
                      style={{ minWidth: "max-content" }}
                    >
                      <p className="font-medium">{format(date, "MMM d")}</p>
                      {(activity?.articles ?? 0) > 0 && (
                        <p className="text-gray-700">
                          Articles: {activity.articles}
                        </p>
                      )}
                      {(activity.videos ?? 0) > 0 && (
                        <p className="text-gray-700">
                          Videos: {activity.videos ?? 0}
                        </p>
                      )}
                      {(activity.problems ?? 0) > 0 && (
                        <p className="text-gray-700">
                          Problems: {activity.problems ?? 0}
                        </p>
                      )}
                      {(activity.quizzes ?? 0) > 0 && (
                        <p className="text-gray-700">
                          Quizzes: {activity.quizzes ?? 0}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="text-center md:text-end text-xs md:text-sm font-medium mb-1 md:mb-2">{monthName}</div>
    </div>
  );
};

const getActivityColor = (level: number) => {
  const customColors = [
    "bg-[#E9ECE9]", // No activity
    "bg-[#CDE5CE]", // Light green
    "bg-[#A6CFA9]", // Medium light green
    "bg-[#77B17B]", // Medium green
    "bg-[#417845]", // Dark green
    "bg-[#2E4D31]", // Very dark green
  ];
  return customColors[level] ?? "bg-[#E9ECE9]";
};

export default MonthHeatmap;
