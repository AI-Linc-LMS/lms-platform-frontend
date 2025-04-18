import React from "react";

interface StreakTablesProps {
  activeDays: number[]; // e.g. [1, 2, 3, 4, 9, 10, 11]
}

const StreakTable: React.FC<StreakTablesProps> = ({ activeDays }) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const todayDate = today.getDate();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Build streak state from today backwards
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

  return (
    <div className="flex flex-col w-full max-w-[300px] transition-all duration-300">
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Weekly Streaks
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Study everyday to build your streak 💪
      </p>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => (
          <div
            key={day}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${dayStyles[day]}`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StreakTable;
