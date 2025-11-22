import React, { useEffect, useState } from "react";
import type { StreakData } from "../../../services/dashboardApis";
import Streak from "./Streak";
import { useStreakData } from "../hooks/useStreakData";

interface StreakTableProps {
  clientId: number;
  dataOverride?: StreakData | null;
}

const StreakTable: React.FC<StreakTableProps> = ({
  clientId,
  dataOverride,
}) => {
  const [activeDays, setActiveDays] = useState<number[]>([]);

  const { data, isLoading, error } = useStreakData(clientId, {
    enabled: !dataOverride,
  });

  const streakData = dataOverride ?? data;

  // Extract active days from the streak data
  useEffect(() => {
    if (!streakData || !streakData.streak) return;

    // Convert the streak object to an array of active days
    const days: number[] = [];

    // Loop through the streak object
    Object.entries(streakData.streak).forEach(([date, isActive]) => {
      // Skip the 'month' and 'year' properties
      if (date === "month" || date === "year") return;

      // Extract the day from the date string (e.g., "2025-04-01" -> 1)
      const day = parseInt(date.split("-")[2]);

      // If the day is active, add it to the array
      if (isActive === true) {
        days.push(day);
      }
    });

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
      dayStyles[day] = "bg-gray-200 text-[var(--font-dark)]";
    } else if (!isActive && !missedDayFound) {
      missedDayFound = true;
      dayStyles[day] =
        "border-2 border-[var(--secondsary-300)] text-[var(--secondsary-300)]";
    } else if (isActive && !missedDayFound) {
      dayStyles[day] = "bg-[var(--secondary-200)] text-[var(--font-light)]";
    } else if (isActive && missedDayFound) {
      dayStyles[day] = "bg-[var(--secondary-100)] text-[var(--font-dark)]";
    } else {
      dayStyles[day] =
        "border-2 border-[var(--secondsary-300)] text-[var(--secondsary-300)]";
    }
  }

  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const isLoadingState =
    (!dataOverride && isLoading) ||
    !streakData ||
    !streakData.streak ||
    Object.keys(streakData.streak).length === 0;

  if (isLoadingState || error) {
    return (
      <div className="flex flex-col w-full  transition-all duration-300 px-0 md:p-4 rounded-3xl md:mt-6">
        <Streak
          showProgress={false}
          clientId={clientId}
          dataOverride={streakData}
        />
        <h2 className="text-xl font-semibold text-gray-800 mb-3">
          Weekly Streaks
        </h2>
        {!streakData ||
        !streakData.streak ||
        Object.keys(streakData.streak).length === 0 ? (
          <p className="text-[14px] text-[var(--neutral-400)] mb-8">
            No Streak data available
          </p>
        ) : (
          <p className="text-[14px] text-gray-500 mb-6">
            Study everyday to build your streak 💪
          </p>
        )}
        <div className="grid grid-cols-5 gap-4">
          SS
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
    <div className="flex flex-col w-full lg:min-w-[270px] xl:min-w-[350px] transition-all duration-300 px-0 md:p-4 rounded-3xl md:mt-6">
      <Streak
        showProgress={false}
        clientId={clientId}
        dataOverride={streakData}
      />
      <h2 className="text-xl font-semibold text-gray-800 mb-3">
        Weekly Streaks
      </h2>
      <p className="text-[14px] text-gray-500 mb-4 md:mb-6">
        Study everyday to build your streak 💪
      </p>
      <div className="rounded-xl bg-white p-4">
        <div className="grid grid-cols-5 gap-4">
          {days.map((day) => {
            const tooltipText = dayStyles[day].includes(
              "border-[var(--secondsary-300)]"
            )
              ? "Missed day"
              : dayStyles[day].includes("bg-[var(--secondary-100)]")
              ? "Past streak"
              : dayStyles[day].includes("bg-[var(--secondary-200)]")
              ? "Current streak"
              : "";

            return (
              <div className="flex justify-center items-center w-full h-full">
                <div
                  key={day}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm ${dayStyles[day]} group transition-transform duration-300 hover:scale-110`}
                >
                  {tooltipText && (
                    <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-100 text-[var(--font-dark)] text-xs rounded-xl px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {tooltipText}
                    </div>
                  )}
                  {day}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StreakTable;
