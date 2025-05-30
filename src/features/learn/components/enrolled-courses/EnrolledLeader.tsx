import { useQuery } from "@tanstack/react-query";
import { getCourseLeaderboard } from "../../../../services/enrolled-courses-content/courseContentApis";
import React from "react";

const EnrolledLeaderBoard = ({courseId}:{courseId:number}) => {
  const { data = [], isLoading, error } = useQuery<Array<{ rank: number; name: string; score: number }>>({
    queryKey: ["leaderboard"],
    queryFn: () => getCourseLeaderboard(1, courseId),
  });

  const renderSkeleton = () => (
    <tr>
      <td className="border-b border-gray-300 px-2 py-7">
        <div className="h-4 bg-gray-200 rounded w-10 animate-pulse"></div>
      </td>
      <td className="border-b border-l border-gray-300 px-2 py-2">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </td>
      <td className="border-b border-l border-gray-300 px-2 py-2">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
      </td>
    </tr>
  );

  if (error) {
    return (
      <div className="w-full rounded-3xl bg-white p-3 md:p-4">
        <h1 className="text-lg md:text-[22px] font-semibold">Leaderboard</h1>
        <p className="text-red-500 text-sm md:text-base">Error loading leaderboard data</p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-3xl bg-white p-3 md:p-4">
      <h1 className="text-lg md:text-[22px] font-semibold">Leaderboard</h1>
      <p className="text-sm md:text-base">Let's see who is on top of the leaderboard.</p>

      <div className="overflow-x-auto overflow-hidden rounded-xl border border-gray-300 my-3 md:my-5">
        <table className="w-full text-center border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b border-gray-300 px-2 py-3 md:py-4 text-xs text-gray-600 w-[80px] md:w-[120px]" style={{ height: "30px" }}>
                Standing
              </th>
              <th className="border-b border-l border-gray-300 px-2 text-xs text-gray-600 w-[100px] md:w-[120px]" style={{ height: "30px" }}>
                Name
              </th>
              <th className="border-b border-l border-gray-300 px-2 text-xs text-gray-600 w-[80px] md:w-[120px]" style={{ height: "30px" }}>
                Marks
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Show 6 skeleton rows while loading
              Array(6).fill(0).map((_, index) => (
                <React.Fragment key={index}>
                  {renderSkeleton()}
                </React.Fragment>
              ))
            ) : (
              data?.map((entry: { rank: number; name: string; score: number }) => (
                <tr 
                  key={entry.rank}
                  className={`${entry.name === 'You' ? 'bg-blue-50' : ''}`}
                >
                  <td className="border-b border-gray-300 px-2 py-2 md:py-4 text-xs md:text-sm">{entry.rank}</td>
                  <td className="border-b border-l border-gray-300 px-2 py-2 text-xs md:text-sm">{entry.name}</td>
                  <td className="border-b border-l border-gray-300 px-2 py-2 text-xs md:text-sm">{entry.score}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="w-full bg-[#DEE2E6] rounded-xl flex flex-row p-3 md:p-4 gap-2 md:gap-3">
        <svg className="flex-shrink-0" width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M21.5 14C21.5 18.1421 18.1421 21.5 14 21.5C9.85786 21.5 6.5 18.1421 6.5 14C6.5 9.85786 9.85786 6.5 14 6.5C18.1421 6.5 21.5 9.85786 21.5 14ZM14 18.3125C14.3106 18.3125 14.5625 18.0606 14.5625 17.75V13.25C14.5625 12.9394 14.3106 12.6875 14 12.6875C13.6894 12.6875 13.4375 12.9394 13.4375 13.25V17.75C13.4375 18.0606 13.6894 18.3125 14 18.3125ZM14 10.25C14.4142 10.25 14.75 10.5858 14.75 11C14.75 11.4142 14.4142 11.75 14 11.75C13.5858 11.75 13.25 11.4142 13.25 11C13.25 10.5858 13.5858 10.25 14 10.25Z" fill="#6C757D" />
        </svg>

        <p className="text-xs md:text-[12px] text-[#6C757D]">As you complete modules you will move top of the leaderboard and earn exciting rewards.</p>

      </div>

    </div>
  );
};

export default EnrolledLeaderBoard;