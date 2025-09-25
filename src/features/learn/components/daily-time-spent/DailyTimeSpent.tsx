import { useState } from "react";

export default function DailyTimeSpent() {
  const [users] = useState([
    { name: "Shane", time: 388 }, // 6hr 28min in minutes
    { name: "Wade", time: 268 }, // 4hr 28min in minutes
    { name: "Darrell", time: 148 }, // 2hr 28min in minutes
  ]);

  const [selectedTime] = useState(30);
  const maxTime = 30;

  // Format minutes into hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}hr ${mins}min`;
  };

  return (
    <div className="bg-white rounded-3xl p-8 max-w-md mx-auto shadow-sm">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">Daily Progress</h1>
      <p className="text-xl text-gray-600 mb-8 flex items-center">
        Keep track of your daily learning
        <span className="ml-2">
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M11.3 1.046A1 1 0 0010 1.5V9h-8.5a1 1 0 00-.5 1.857l16 7a1 1 0 001.316-1.5L11.3 1.046z" />
          </svg>
        </span>
      </p>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border border-gray-200 mb-8">
        <div className="grid grid-cols-3 bg-gray-50">
          <div className="p-4 font-medium text-gray-700">Standing</div>
          <div className="p-4 font-medium text-gray-700">Name</div>
          <div className="p-4 font-medium text-gray-700">Spent</div>
        </div>

        {users.map((user, index) => (
          <div
            key={index}
            className="grid grid-cols-3 border-t border-gray-200"
          >
            <div className="p-4 text-gray-800">#{index + 1}</div>
            <div className="p-4 text-gray-800">{user.name}</div>
            <div className="p-4 text-gray-800">{formatTime(user.time)}</div>
          </div>
        ))}
      </div>

      {/* Time selector */}
      <div className="mb-4 text-right">
        <span className="text-green-600 font-medium text-lg">
          + {selectedTime} mins
        </span>
      </div>

      <div className="relative mb-2">
        <div className="h-12 bg-green-500 rounded-full flex items-center justify-end px-4">
          <svg
            className="w-6 h-6 text-[var(--font-light)]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M11.3 1.046A1 1 0 0010 1.5V9h-8.5a1 1 0 00-.5 1.857l16 7a1 1 0 001.316-1.5L11.3 1.046z" />
          </svg>
        </div>
      </div>

      <div className="flex justify-between mb-12">
        <span className="text-gray-700 font-medium">0 mins</span>
        <span className="text-gray-700 font-medium">{maxTime} mins</span>
      </div>

      {/* Info box */}
      <div className="bg-gray-200 rounded-xl p-6 flex">
        <div className="w-8 h-8 rounded-full bg-gray-500 text-[var(--font-light)] flex items-center justify-center mr-4 flex-shrink-0">
          <span className="font-bold">i</span>
        </div>
        <p className="text-gray-600">
          Log in every day and snag yourself a shiny +1 Streak point! Don't miss
          out on the fun—keep those streaks rolling!
        </p>
      </div>
    </div>
  );
}
