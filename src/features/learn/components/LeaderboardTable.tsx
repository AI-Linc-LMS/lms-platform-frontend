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
    <div className="flex flex-col transition-all duration-300 p-4 rounded-3xl lg:min-w-[270px] xl:min-w-[350px]">
      <h2 className="text-xl font-semibold text-[#343A40] mb-3">
        Track Your Progress
      </h2>
      <p className="text-[14px] text-[#495057] mb-8">
        Keep grinding and stay top on our leaderboard
      </p>

      <div className="rounded-xl border border-gray-300 overflow-hidden">
        <table className="w-full text-center border-collapse min-h-[450px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b border-r border-gray-300 w-[80px] h-[50px] text-[12px] text-gray-600">
                Standing
              </th>
              <th className="border-b border-r border-gray-300 w-[80px] h-[50px] text-[12px] text-gray-600">
                Name
              </th>
              <th className="border-b border-r border-gray-300 w-[80px] h-[50px] text-[12px] text-gray-600">
                Course
              </th>
              <th className="border-b border-gray-300 w-[80px] h-[50px] text-[12px] text-gray-600">
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
                    isLast ? "bg-[#B4E0ED] text-[#264D64]" : "hover:bg-gray-50"
                  }`}
                >
                  <td
                    className="border-b border-r border-gray-300 w-[70px] h-[50px] text-[12px] group relative transition-all duration-300 hover:bg-[#E9F7FA] "
                  >
                    <span >
                      {item.standing}
                    </span>
                  </td>
                  <td
                    className="border-b border-r border-gray-300 w-[120px] h-[50px] text-[12px] group relative transition-all duration-300 hover:bg-[#E9F7FA]"
                  >
                    <span >
                      {item.name}
                    </span>
                  </td>
                  <td
                    className="border-b border-r border-gray-300 w-[70px] h-[50px] text-[12px] p-1 group relative transition-all duration-300 hover:bg-[#E9F7FA]"
                  >
                    <span >
                      {item.courseName.length > 13
                        ? `${item.courseName.substring(0, 13)}...`
                        : item.courseName}
                    </span>
                  </td>
                  <td
                    className="border-b border-gray-300 w-[70px] h-[50px] text-[12px] group relative transition-all duration-300 hover:bg-[#E9F7FA]"
                  >
                    <span className="">
                      {item.marks}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-[#DEE2E6] rounded-xl px-4 py-5 flex items-center gap-2 max-w-md my-4">
        <div className="mt-0.5 text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
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
          As you complete modules you will move top of the leaderboard and earn
          exciting rewards.
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;