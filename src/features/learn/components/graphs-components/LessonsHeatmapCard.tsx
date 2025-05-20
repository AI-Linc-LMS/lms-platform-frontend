import React, { useMemo, useState, useEffect } from "react";
import leftArrow from "../../../../assets/dashboard_assets/leftArrow.png";
import rightArrow from "../../../../assets/dashboard_assets/rightArrow.png";
import MonthHeatmap from "./MonthHeatmap";
import {
  endOfToday,
  subMonths,
  getYear,
  format,
  eachDayOfInterval,
  isBefore,
  subDays,
} from "date-fns";
import { getUserActivityHeatmapData } from "../../../../services/dashboardApis";
import { useQuery } from "@tanstack/react-query";

interface LessonsHeatmapCardProps {
  hoveredCell: string | null;
  setHoveredCell: (cell: string | null) => void;
}


type ApiDataType = Record<
  string,
  {
    Article: number;
    Quiz: number;
    Assignment: number;
    CodingProblem: number;
    VideoTutorial: number;
    total: number;
  }
>;

const LessonsHeatmapCard: React.FC<LessonsHeatmapCardProps> = ({
  hoveredCell,
  setHoveredCell,
}) => {
  const { data: apiData, isLoading, error } = useQuery<ApiDataType>({
    queryKey: ["activityData"],
    queryFn: () => getUserActivityHeatmapData(1),
  });
  //console.log("apiData", apiData);
  const [monthOffset, setMonthOffset] = useState(0);
  const [year, setYear] = useState(getYear(new Date()));
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const monthsToShow = isMobile ? 5 : 4;
  const daysLimitDate = subDays(endOfToday(), 300);

  const ACTIVITY_WEIGHTS = {
    Article: 1,
    Quiz: 1,
    Assignment: 1,
    CodingProblem: 1,
    VideoTutorial: 1,
  };

  const calculateWeightedScore = (activities: {
    Article: number;
    Quiz: number;
    Assignment: number;
    CodingProblem: number;
    VideoTutorial: number;
    total: number;
  }): number => {
    return (
      activities.Article * ACTIVITY_WEIGHTS.Article +
      activities.Quiz * ACTIVITY_WEIGHTS.Quiz +
      activities.Assignment * ACTIVITY_WEIGHTS.Assignment +
      activities.CodingProblem * ACTIVITY_WEIGHTS.CodingProblem +
      activities.VideoTutorial * ACTIVITY_WEIGHTS.VideoTutorial
    );
  };

  const calculateLevel = (activities: {
    Article: number;
    Quiz: number;
    Assignment: number;
    CodingProblem: number;
    VideoTutorial: number;
    total: number;
  }): number => {
    const weightedScore = calculateWeightedScore(activities);
    if (weightedScore === 0) return 0;
    if (weightedScore <= 2) return 1;
    if (weightedScore <= 4) return 2;
    if (weightedScore <= 6) return 3;
    if (weightedScore <= 8) return 4;
    return 5;
  };


  const activityData = useMemo(() => {
    const dataSource = apiData || {};
    return Object.entries(dataSource)
      .filter(([dateStr]) => !isBefore(new Date(dateStr), daysLimitDate))
      .map(([date, value]) => {
        const activities = {
          Article: value?.Article ?? 0,
          Quiz: value.Quiz || 0,
          Assignment: value.Assignment || 0,
          CodingProblem: value.CodingProblem || 0,
          VideoTutorial: value.VideoTutorial || 0,
          total: value.total || 0,
        };

        const level = calculateLevel(activities);
        const weightedScore = calculateWeightedScore(activities);

        return {
          date,
          ...activities,
          level,
          value: weightedScore / 10,
        };
      });
  }, [apiData]);

  const activityMap = useMemo(() => {
    return new Map(activityData.map((item) => [item.date, item]));
  }, [activityData]);

  const getValidMonthsInPastYear = (): {
    monthName: string;
    month: number;
    year: number;
    daysCount: number;
  }[] => {
    const today = endOfToday();
    const startDate = subDays(today, 364);

    const months: {
      monthName: string;
      month: number;
      year: number;
      daysCount: number;
    }[] = [];

    let pointer = new Date(today.getFullYear(), today.getMonth(), 1); // Start of current month

    while (isBefore(startDate, pointer) || format(startDate, "yyyy-MM") === format(pointer, "yyyy-MM")) {
      const year = pointer.getFullYear();
      const month = pointer.getMonth();
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      // If entire month is before the start date, skip it
      if (monthEnd < startDate) break;

      // Determine valid day count
      const effectiveStart = isBefore(monthStart, startDate) ? startDate : monthStart;
      const effectiveEnd = monthEnd > today ? today : monthEnd;
      const daysCount = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd }).length;

      months.unshift({
        monthName: format(pointer, "MMM"),
        month,
        year,
        daysCount,
      });

      pointer = subMonths(pointer, 1);
    }

    return months;
  };


  const validMonths = useMemo(getValidMonthsInPastYear, []);
  const visibleMonths = validMonths.slice(
    validMonths.length - monthOffset - monthsToShow,
    validMonths.length - monthOffset
  );

  const handlePrev = () => {
    if (monthOffset + monthsToShow < validMonths.length) {
      setMonthOffset((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (monthOffset > 0) {
      setMonthOffset((prev) => prev - 1);
    }
  };

  if (isLoading || error) {
    return (
      <div className="flex flex-col w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-gray-700">Activity Map</h2>
          <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex justify-between items-start gap-1">
          {Array(monthsToShow)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="w-full h-40 bg-gray-200 rounded animate-pulse"></div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <div className="flex flex-row items-center justify-between w-full">
          <h2 className="text-[20px] font-medium text-gray-700">Activity Map</h2>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            disabled
            className="appearance-none bg-white border border-gray-200 rounded-full px-2 py-1 md:px-4 md:py-2 text-xs md:text-sm text-gray-700"
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>

        {isMobile && (
          <div className="flex items-center ml-2">
            <button onClick={handlePrev} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#12293A] shadow cursor-pointer">
              <img src={leftArrow} alt="Previous" className="w-3 h-3" />
            </button>
            <button
              onClick={handleNext}
              disabled={monthOffset === 0}
              className={`w-8 h-8 flex items-center justify-center rounded-full ml-2 ${monthOffset === 0 ? "bg-gray-200 cursor-not-allowed" : "bg-[#12293A]"
                } shadow`}
            >
              <img src={rightArrow} alt="Next" className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-start gap-1 overflow-x-auto mb-2">
        {visibleMonths.map((monthData, monthIndex) => (
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

      <div className="flex items-center justify-end m-2 md:m-4 text-xs md:text-sm text-gray-500">
        <span>Less</span>
        <div className="flex mx-2">
          <div className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-sm bg-[#CDE5CE] mx-0.5" />
          <div className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-sm bg-[#A6CFA9] mx-0.5" />
          <div className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-sm bg-[#77B17B] mx-0.5" />
          <div className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-sm bg-[#417845] mx-0.5" />
          <div className="w-3 h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 rounded-sm bg-[#2E4D31] mx-0.5" />
        </div>
        <span>More</span>
      </div>

      {!isMobile && (
        <div className="bottom-3 right-4 flex justify-end space-x-3">
          <button onClick={handlePrev} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-[#12293A] shadow cursor-pointer">
            <img src={leftArrow} alt="Previous" className="w-3 h-3 md:w-4 md:h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={monthOffset === 0}
            className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full ${monthOffset === 0 ? "bg-gray-200 cursor-not-allowed" : "bg-[#12293A]"
              } shadow`}
          >
            <img src={rightArrow} alt="Next" className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default LessonsHeatmapCard;
