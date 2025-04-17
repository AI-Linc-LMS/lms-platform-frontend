import React, { useMemo, useState } from "react";
import leftArrow from "../../../../assets/dashboard_assets/leftArrow.png";
import rightArrow from "../../../../assets/dashboard_assets/rightArrow.png";
import MonthHeatmap from "./MonthHeatmap";
import {
  endOfToday,
  subMonths,
  getDate,
  getMonth,
  getYear,
  format,
} from "date-fns";

interface ActivityData {
  date: string;
  level: number;
  value: number;
}

interface LessonsHeatmapCardProps {
  hoveredCell: string | null;
  setHoveredCell: (cell: string | null) => void;
  activityData: ActivityData[];
}

const LessonsHeatmapCard: React.FC<LessonsHeatmapCardProps> = ({
  hoveredCell,
  setHoveredCell,
  activityData,
}) => {
  const [monthOffset, setMonthOffset] = useState(0);
  const [year, setYear] = useState(2025);

  const getLast6MonthsData = () => {
    const monthsData = [];
    const today = subMonths(endOfToday(), monthOffset);

    for (let i = 4; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthName = format(date, "MMM");
      const monthIndex = getMonth(date);
      const year = getYear(date);
      const totalDays = new Date(year, monthIndex + 1, 0).getDate();
      const lastDay =
        i === 0 && monthOffset === 0 ? getDate(endOfToday()) : totalDays;

      monthsData.push({
        monthName,
        month: monthIndex,
        year,
        daysCount: lastDay,
      });
    }

    return monthsData;
  };

  const monthsData = useMemo(() => getLast6MonthsData(), [monthOffset]);
  const activityMap = useMemo(() => {
    return new Map(activityData.map((item) => [item.date, item]));
  }, [activityData]);

  const handlePrev = () => setMonthOffset((prev) => prev + 1);
  const handleNext = () => {
    if (monthOffset > 0) setMonthOffset((prev) => prev - 1);
  };

  return (
    <div className="flex flex-col w-full max-w-[470px]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-700">Lessons</h2>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="appearance-none bg-white border border-gray-200 rounded-full px-4 py-2 text-gray-700"
          disabled // You may later support per-year filtering
        >
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
      </div>

      {/* Month Heatmap View */}
      <div className="flex justify-between items-start">
        {monthsData.map((monthData, monthIndex) => (
          <div key={monthIndex} className="flex flex-col items-center">
            <MonthHeatmap
              monthName={monthData.monthName}
              month={monthData.month}
              year={monthData.year}
              daysCount={monthData.daysCount}
              activityMap={activityMap}
              hoveredCell={hoveredCell}
              setHoveredCell={setHoveredCell}
            />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end m-4 text-sm text-gray-500">
        <span>Less</span>
        <div className="flex mx-2">
          <div className="w-5 h-5 rounded-sm bg-[#CDE5CE] mx-0.5" />
          <div className="w-5 h-5 rounded-sm bg-[#A6CFA9] mx-0.5" />
          <div className="w-5 h-5 rounded-sm bg-[#77B17B] mx-0.5" />
          <div className="w-5 h-5 rounded-sm bg-[#417845] mx-0.5" />
          <div className="w-5 h-5 rounded-sm bg-[#2E4D31] mx-0.5" />
        </div>
        <span>More</span>
      </div>

      {/* Navigation Arrows */}
      <div className="bottom-3 right-4 flex justify-end space-x-3">
        <button
          onClick={handlePrev}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#12293A] shadow"
        >
          <span className="text-lg">
            <img src={leftArrow} />
          </span>
        </button>
        <button
          onClick={handleNext}
          disabled={monthOffset === 0}
          className={`w-10 h-10 flex items-center justify-center rounded-full ${
            monthOffset === 0
              ? "bg-gray-200 cursor-not-allowed"
              : "bg-[#12293A]"
          } shadow`}
        >
          <span className="text-lg text-">
            <img src={rightArrow} />
          </span>
        </button>
      </div>
    </div>
  );
};

export default LessonsHeatmapCard;
