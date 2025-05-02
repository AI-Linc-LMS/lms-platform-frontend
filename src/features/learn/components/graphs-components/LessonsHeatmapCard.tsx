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
import { getUserActivityHeatmapData } from "../../../../services/dashboardApis";
import { useQuery } from "@tanstack/react-query";

interface LessonsHeatmapCardProps {
  hoveredCell: string | null;
  setHoveredCell: (cell: string | null) => void;
}

const LessonsHeatmapCard: React.FC<LessonsHeatmapCardProps> = ({
  hoveredCell,
  setHoveredCell,
}) => {
  const { data: apiData, isLoading, error } = useQuery({
    queryKey: ["activityData"],
    queryFn: () => getUserActivityHeatmapData(1),
  });

  const [monthOffset, setMonthOffset] = useState(0);
  const [year, setYear] = useState(2025);

  // Activity weights - different activities have different importance
  const ACTIVITY_WEIGHTS = {
    articles: 1,    // Reading articles
    videos: 1.2,    // Watching videos
    problems: 1.5,  // Solving problems
    quizzes: 2      // Taking quizzes
  };

  // Calculate weighted score based on activities
  const calculateWeightedScore = (activities: any): number => {
    return (
      activities.articles * ACTIVITY_WEIGHTS.articles +
      activities.videos * ACTIVITY_WEIGHTS.videos +
      activities.problems * ACTIVITY_WEIGHTS.problems +
      activities.quizzes * ACTIVITY_WEIGHTS.quizzes
    );
  };

  // Calculate level based on weighted score
  const calculateLevel = (activities: any): number => {
    const weightedScore = calculateWeightedScore(activities);
    
    // Level thresholds based on weighted score
    if (weightedScore === 0) return 0;        // No activity
    if (weightedScore <= 2) return 1;         // Light activity
    if (weightedScore <= 4) return 2;         // Moderate activity
    if (weightedScore <= 6) return 3;         // Active
    if (weightedScore <= 8) return 4;         // Very active
    return 5;                                 // Highly active
  };

  // Transform API data into the format needed for the heatmap
  const activityData = useMemo(() => {
    if (!apiData) return [];
    
    return Object.entries(apiData).map(([date, value]: [string, any]) => {
      const activities = {
        articles: value.articles || 0,
        videos: value.videos || 0,
        problems: value.problems || 0,
        quizzes: value.quizzes || 0,
        total: value.total || 0
      };

      const level = calculateLevel(activities);
      const weightedScore = calculateWeightedScore(activities);
      
      return {
        date,
        ...activities,
        level,
        value: weightedScore / 10 
      };
    });
  }, [apiData]);

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

  if (isLoading) {
    return (
      <div className="flex flex-col w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-700">Lessons</h2>
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex justify-between items-start gap-1">
          {Array(5).fill(0).map((_, index) => (
            <div key={index} className="w-full h-40 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col w-full">
        <div className="text-red-500">Error loading activity data</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-700">Lessons</h2>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="appearance-none bg-white border border-gray-200 rounded-full px-4 py-2 text-gray-700"
          disabled
        >
          <option value="2023">2023</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>
      </div>

      {/* Month Heatmap View */}
      <div className="flex justify-between items-start gap-1">
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
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#12293A] shadow cursor-pointer"
        >
          <span className="text-lg">
            <img src={leftArrow} alt="Previous" />
          </span>
        </button>
        <button
          onClick={handleNext}
          disabled={monthOffset === 0}
          className={`w-10 h-10 flex items-center justify-center rounded-full ${
            monthOffset === 0
              ? "bg-gray-200 cursor-not-allowed"
              : "bg-[#12293A] cursor-pointer"
          } shadow`}
        >
          <span className="text-lg">
            <img src={rightArrow} alt="Next" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default LessonsHeatmapCard;
