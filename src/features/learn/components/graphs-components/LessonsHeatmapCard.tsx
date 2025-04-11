import { setYear } from "date-fns/fp/setYear";
// import { useState } from "react";

interface LessonsHeatmapCardProps {
  months: string[];
  days: string[];
  activityData: { day: number; month: number; level: number; value: number }[];
  hoveredCell: { day: number; month: number } | null;
  setHoveredCell: (cell: { day: number; month: number } | null) => void;
  year: string;
}

const LessonsHeatmapCard: React.FC<LessonsHeatmapCardProps> = ({
  months,
  days,
  activityData,
  hoveredCell,
  setHoveredCell,
  year,
}) => {
  const getActivityColor = (level: number) => {
    const colors = [
      "bg-gray-200",
      "bg-gray-300",
      "bg-gray-400",
      "bg-gray-600",
      "bg-gray-800",
    ];
    return colors[level];
  };

  const getActivityForCell = (day: number, month: number) => {
    return activityData.find(
      (item) => item.day === day && item.month === month
    );
  };

  return (
    <div className="w-full bg-white rounded-xl p-6 shadow-sm border border-[#DEE2E6]">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-medium text-gray-700">Lessons</h2>
        <div className="relative">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="appearance-none bg-white border border-gray-200 rounded-full px-4 py-2 pr-8 text-gray-700 focus:outline-none"
          >
            <option>2023</option>
            <option>2024</option>
            <option>2025</option>
          </select>
        </div>
      </div>

      <div className="flex text-sm text-gray-500 mb-2 pl-12">
        {months.map((month) => (
          <div key={month} className="flex-1 text-center">
            {month}
          </div>
        ))}
      </div>

      <div className="space-y-1">
        {days.map((day, dayIndex) => (
          <div key={day} className="flex items-center">
            <div className="w-12 text-right pr-2 text-gray-500">{day}</div>
            <div className="flex flex-1">
              {months.map((month, monthIndex) => {
                const activity = getActivityForCell(dayIndex, monthIndex);
                const isHovered =
                  hoveredCell?.day === dayIndex &&
                  hoveredCell?.month === monthIndex;

                return (
                  <div
                    key={`${month}-${day}`}
                    className="flex-1 flex justify-center relative"
                    onMouseEnter={() =>
                      setHoveredCell({ day: dayIndex, month: monthIndex })
                    }
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div
                      className={`w-6 h-6 rounded-sm ${
                        activity
                          ? getActivityColor(activity.level)
                          : "bg-gray-200"
                      } transition-transform ${
                        isHovered ? "transform scale-110 shadow-md" : ""
                      }`}
                    />
                    {isHovered && activity && (
                      <div className="absolute top-full mt-1 z-10 bg-white p-2 rounded shadow-md text-xs border border-gray-200 whitespace-nowrap">
                        <p className="font-medium">{`${months[monthIndex]} ${
                          dayIndex + 1
                        }`}</p>
                        <p className="text-gray-700">{`Activity: ${activity.value} hours`}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end mt-4 text-sm text-gray-500">
        <span>Less</span>
        <div className="flex mx-2">
          <div className="w-5 h-5 rounded-sm bg-gray-200 mx-0.5"></div>
          <div className="w-5 h-5 rounded-sm bg-gray-300 mx-0.5"></div>
          <div className="w-5 h-5 rounded-sm bg-gray-400 mx-0.5"></div>
          <div className="w-5 h-5 rounded-sm bg-gray-600 mx-0.5"></div>
          <div className="w-5 h-5 rounded-sm bg-gray-800 mx-0.5"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default LessonsHeatmapCard;
