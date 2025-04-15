import React from "react";

interface LeaderboardItem {
  standing: string;
  name: string;
  courseName: string;
  marks: number;
}

interface LeaderboardProps {
  data: LeaderboardItem[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ data }) => {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-700 mb-2">
        Track Your Progress
      </h2>
      <h3 className="text-xs text-gray-600 mb-4">
        Keep grinding and stay top on our leaderboard
      </h3>

      <div className="overflow-x-auto rounded-xl border border-gray-300">
        <table className="w-full border-separate border-spacing-0 text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-2 py-2 text-xs text-gray-600">
                Standing
              </th>
              <th className="border border-gray-300 px-2 py-2 text-xs text-gray-600">
                Name
              </th>
              <th className="border border-gray-300 px-2 py-2 text-xs text-gray-600">
                Course Name
              </th>
              <th className="border border-gray-300 px-2 py-2 text-xs text-gray-600">
                Marks
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => {
              const isLast = index === data.length - 1;
              return (
                <tr
                  key={index}
                  className={`transition duration-200 ${
                    isLast ? "bg-blue-900 text-white" : "hover:bg-gray-50"
                  }`}
                >
                  <td className="border border-gray-300 px-2 py-2 text-xs">
                    {item.standing}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs">
                    {item.name}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs">
                    {item.courseName}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-xs">
                    {item.marks}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
