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
    <div className="flex flex-col w-full lg:max-w-[270px] xl:max-w-[300px] transition-all duration-300">
      <h2 className="text-xl font-semibold text-[#343A40] mb-2">
        Track Your Progress
      </h2>
      <p className="text-xs text-[#495057] mb-4">
        Keep grinding and stay top on our leaderboard
      </p>

      <div className="rounded-xl border border-gray-300 overflow-hidden ">
        <table className="w-full text-center border-collapse min-h-[350px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b border-r border-gray-300 px-2 py-2 text-xs text-gray-600">
                Standing
              </th>
              <th className="border-b border-r border-gray-300 px-2 py-2 text-xs text-gray-600">
                Name
              </th>
              <th className="border-b border-r border-gray-300 px-2 py-2 text-xs text-gray-600">
                Course
              </th>
              <th className="border-b border-gray-300 px-2 py-2 text-xs text-gray-600">
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
                    isLast
                      ? "bg-[#B4E0ED] text-[#264D64]"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <td className="border-b border-r border-gray-300 px-2 py-2 text-xs">
                    {item.standing}
                  </td>
                  <td className="border-b border-r border-gray-300 px-2 py-2 text-xs">
                    {item.name}
                  </td>
                  <td className="border-b border-r border-gray-300 px-2 py-2 text-xs">
                    {item.courseName}
                  </td>
                  <td className="border-b border-gray-300 px-2 py-2 text-xs">
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
