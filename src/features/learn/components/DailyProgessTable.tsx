import React from "react";
import light from "../../../assets/dashboard_assets/light.png";

interface DailyProgressItem {
  standing: string;
  name: string;
  time: string;
}

interface DailyProgressProps {
  data: DailyProgressItem[];
  progressMinutes: number;
  goalMinutes?: number; // default: 30 mins
}

const DailyProgress: React.FC<DailyProgressProps> = ({
  data,
  progressMinutes,
  goalMinutes = 30,
}) => {
  const progressPercent = Math.min((progressMinutes / goalMinutes) * 100, 100);

  return (
    <div className="flex flex-col w-full lg:max-w-[270px] xl:max-w-[300px] transition-all duration-300">
      <h2 className="text-xl font-semibold text-[#343A40] mb-2">
        Daily Progress
      </h2>
      <p className="text-xs text-[#495057] mb-4">
        Keep track of your daily learning ⚡
      </p>

      <div className="overflow-hidden rounded-xl border border-gray-300 mb-4">
        <table className="w-full text-center border-collapse min-h-[180px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b border-gray-300 px-2 py-2 text-xs text-gray-600">
                Standing
              </th>
              <th className="border-b border-l border-gray-300 px-2 py-2 text-xs text-gray-600">
                Name
              </th>
              <th className="border-b border-l border-gray-300 px-2 py-2 text-xs text-gray-600">
                Spent
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const isLast = index === data.length - 1;
              return (
                <tr
                  key={index}
                  className="transition duration-200 hover:bg-gray-50"
                >
                  <td
                    className={`px-2 py-2 text-xs border-gray-300 ${
                      isLast ? "" : "border-b"
                    }`}
                  >
                    {item.standing}
                  </td>
                  <td
                    className={`px-2 py-2 text-xs border-l border-gray-300 ${
                      isLast ? "" : "border-b"
                    }`}
                  >
                    {item.name}
                  </td>
                  <td
                    className={`px-2 py-2 text-xs border-l border-gray-300 ${
                      isLast ? "" : "border-b"
                    }`}
                  >
                    {item.time}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end items-center text-xs mb-1 text-green-700 font-semibold">
        <span className="text-xs text-green-700">+ {progressMinutes} mins</span>
      </div>

      <div className="relative h-5 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-green-600 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
        <span
          className="absolute top-1/2 -translate-y-1/2 text-white text-xs"
          style={{ left: `calc(${progressPercent}% - 18px)` }}
        >
          <img src={light} />
        </span>
      </div>

      <div className="flex justify-between text-xs mt-1 text-gray-500">
        <span>0 mins</span>
        <span>{goalMinutes} mins</span>
      </div>
      <div className="bg-[#DEE2E6] rounded-xl px-5 py-4 flex items-center gap-2 max-w-md mt-5">
        <div className="mt-0.5 text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4.5 h-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z"
            />
          </svg>
        </div>
        <p className="text-[13px] text-[#6C757D]">
          Log in every day and snag yourself a shiny +1 Streak point! Don’t miss
          out on the fun—keep those streaks rolling!
        </p>
      </div>
    </div>
  );
};

export default DailyProgress;
