import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStreakTableData, StreakData } from "../../../services/dashboardApis";

interface StreakTableProps {
  clientId: number;
}

const StreakTable: React.FC<StreakTableProps> = ({ clientId }) => {
  const [activeDays, setActiveDays] = useState<number[]>([]);

  const { data, isLoading, error } = useQuery<StreakData>({
    queryKey: ['streakTable', clientId],
    queryFn: () => getStreakTableData(clientId),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });

  // Extract active days from the streak data
  useEffect(() => {
    if (!data || !data.streak) return;

    // Convert the streak object to an array of active days
    const days: number[] = [];

    // Loop through the streak object
    Object.entries(data.streak).forEach(([date, isActive]) => {
      // Skip the 'month' and 'year' properties
      if (date === 'month' || date === 'year') return;

      // Extract the day from the date string (e.g., "2025-04-01" -> 1)
      const day = parseInt(date.split('-')[2]);

      // If the day is active, add it to the array
      if (isActive === true) {
        days.push(day);
      }
    });

    console.log("Active days extracted:", days);
    setActiveDays(days);
  }, [data]);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const todayDate = today.getDate();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  let missedDayFound = false;
  const dayStyles: Record<number, string> = {};

  for (let day = totalDays; day >= 1; day--) {
    const isFuture = day > todayDate;
    const isActive = activeDays.includes(day);

    if (isFuture) {
      dayStyles[day] = "bg-gray-200 text-black";
    } else if (!isActive && !missedDayFound) {
      missedDayFound = true;
      dayStyles[day] = "border-2 border-[#AE0606] text-[#AE0606]";
    } else if (isActive && !missedDayFound) {
      dayStyles[day] = "bg-[#417845] text-white";
    } else if (isActive && missedDayFound) {
      dayStyles[day] = "bg-[#CDE5CE] text-black";
    } else {
      dayStyles[day] = "border-2 border-[#AE0606] text-[#AE0606]";
    }
  }

  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  if (isLoading || error || !data || !data.streak || Object.keys(data.streak).length === 0) {
    return (
      <div className="flex flex-col w-full lg:min-w-[270px] xl:min-w-[350px] transition-all duration-300 p-4 rounded-3xl mt-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          Weekly Streaks
        </h2>

        {
          (!data || !data.streak || Object.keys(data.streak).length === 0) ?
            <p className="text-[14px] text-[#495057] mb-8">
              No Streak data available
            </p> : <p className="text-[14px] text-gray-500 mb-6">
              Study everyday to build your streak 💪
            </p>
        }
        <div className="grid grid-cols-5 gap-4">
          {[...Array(30)].map((_, index) => (
            <div
              key={index}
              className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full lg:min-w-[270px] xl:min-w-[350px] transition-all duration-300 p-4 rounded-3xl mt-12">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">
        Weekly Streaks
      </h2>
      <p className="text-[14px] text-gray-500 mb-6">
        Study everyday to build your streak 💪
      </p>

      <div className="grid grid-cols-5 gap-4">
        {days.map((day) => {
          const tooltipText = dayStyles[day].includes("border-[#AE0606]")
            ? "Missed day"
            : dayStyles[day].includes("bg-[#CDE5CE]")
              ? "Past streak"
              : dayStyles[day].includes("bg-[#417845]")
                ? "Current streak"
                : "";

          return (
            <div
              key={day}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${dayStyles[day]} group transition-transform duration-300 hover:scale-110`}
            >
              {tooltipText && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-100 text-black text-xs rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {tooltipText}
                </div>
              )}
              {day}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StreakTable;