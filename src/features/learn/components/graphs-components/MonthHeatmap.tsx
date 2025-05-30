import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import ReactDOM from "react-dom";

interface ActivityData {
  date: string;
  level: number;
  value: number;
  Article?: number;
  VideoTutorial?: number;
  CodingProblem?: number;
  Assignment?: number;
  Quiz?: number;
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
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<ActivityData | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

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
    <div className="flex flex-col space-y-1 w-full px-2">
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
                  onMouseEnter={e => {
                    setHoveredCell(dateStr);
                    setHoveredActivity(activity || null);
                    setHoveredDate(date);
                    setMousePos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={e => {
                    if (isHovered) setMousePos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => {
                    setHoveredCell(null);
                    setHoveredActivity(null);
                    setHoveredDate(null);
                    setMousePos(null);
                  }}
                >
                  <div
                    className={`w-[8px] h-[8px] md:w-[10px] md:h-[10px] lg:w-[12px] lg:h-[12px] xl:w-[14px] xl:h-[14px] rounded-sm ${
                      activity
                        ? getActivityColor(activity.level)
                        : "bg-[#E9ECE9]"
                    } ${isHovered ? "transform scale-110 shadow-md" : ""} ${isMobile ? "w-[10px] h-[10px]" : ""}`}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="text-center md:text-end text-xs md:text-sm font-medium mb-1 md:mb-2">{monthName}</div>
      {mousePos && hoveredActivity && hoveredDate && ReactDOM.createPortal(
        <Tooltip
          x={mousePos.x}
          y={mousePos.y}
          activity={hoveredActivity}
          date={hoveredDate}
        />,
        document.body
      )}
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

// Tooltip component for portal rendering
const Tooltip: React.FC<{ x: number; y: number; activity: ActivityData; date: Date }> = ({ x, y, activity, date }) => {
  // Tooltip size and padding
  const tooltipWidth = 120;
  const tooltipHeight = 80;
  const padding = 12;
  // Calculate position to keep tooltip in viewport
  let left = x + padding;
  let top = y + padding;
  if (left + tooltipWidth > window.innerWidth) {
    left = x - tooltipWidth - padding;
  }
  if (top + tooltipHeight > window.innerHeight) {
    top = y - tooltipHeight - padding;
  }
  return (
    <div
      style={{
        position: "fixed",
        left,
        top,
        zIndex: 9999,
        minWidth: tooltipWidth,
        maxWidth: 200,
        pointerEvents: "none",
      }}
      className="bg-white p-2 rounded shadow-md text-[12px] border border-gray-200 whitespace-nowrap"
    >
      <p className="font-medium">{format(date, "MMM d")}</p>
      {(activity?.Article ?? 0) > 0 && (
        <p className="text-gray-700">Articles: {activity.Article}</p>
      )}
      {(activity.VideoTutorial ?? 0) > 0 && (
        <p className="text-gray-700">Videos: {activity.VideoTutorial ?? 0}</p>
      )}
      {(activity.CodingProblem ?? 0) > 0 && (
        <p className="text-gray-700">Problems: {activity.CodingProblem ?? 0}</p>
      )}
      {(activity.Assignment ?? 0) > 0 && (
        <p className="text-gray-700">Assignment: {activity.Assignment ?? 0}</p>
      )}
      {(activity.Quiz ?? 0) > 0 && (
        <p className="text-gray-700">Quiz: {activity.Quiz ?? 0}</p>
      )}
    </div>
  );
};

export default MonthHeatmap;
