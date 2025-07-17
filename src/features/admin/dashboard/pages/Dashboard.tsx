import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserGroupIcon from "../../../../commonComponents/icons/admin/dashboard/UserRounded.png";
import activeStudents from "../../../../commonComponents/icons/admin/dashboard/activestudents.png";
import dailylogins from "../../../../commonComponents/icons/admin/dashboard/dailylogins.png";
import timeSpent from "../../../../commonComponents/icons/admin/dashboard/ClockCircle.png";
import i from "../../../../commonComponents/icons/admin/dashboard/exclamation-circle.png";
import StudentRanking from "../components/RankingTable";
import TimeSpentGraph from "../components/TimeSpentGraph";
import StudentDailyActivityChart from "../components/StudentActivityChart";
import { useRole } from "../../../../hooks/useRole";
import AccessDenied from "../../../../components/AccessDenied";

const Dashboard = () => {
  const navigate = useNavigate();
  const [metrics] = useState([
    {
      label: "Number of students",
      value: 465,
      Icon: UserGroupIcon,
    },
    {
      label: "Active Students",
      value: 321,
      Icon: activeStudents,
    },
    {
      label: "Time Spent by Student",
      value: "4.5 hrs",
      Icon: timeSpent,
    },
    {
      label: "Student Daily Logins",
      value: 124,
      Icon: dailylogins,
    },
  ]);

  const handleBackToMain = () => {
    navigate("/");
  };

  const { isSuperAdmin } = useRole();

  if (!isSuperAdmin) {
    return <AccessDenied />;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col gap-4">
          <button
            onClick={handleBackToMain}
            className="w-fit flex items-center gap-2 px-4 py-2 bg-[#255C79] text-white rounded-lg hover:bg-[#1E4A63] transition-colors duration-200 shadow-md hover:shadow-lg"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M19 12H5M12 19l-7-7 7-7" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            Back to Main
          </button>
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Here is a glimpse of your overall progress.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <select className=" rounded-lg p-2 border border-[#B9E4F2] text-xs text-gray-700 w-1/10">
            <option value="1">Select Courses</option>
        </select>

        <div className="flex items-center text-[#255C79] text-sm gap-2">
            <p>Weekly</p>|
            <p>Monthly</p>|
            <p>Yearly</p>
        </div>
      </div>
      <div className="flex gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="flex-1 bg-white rounded-lg shadow p-4 flex items-center justify-between ring-1 ring-[#B9E4F2] ring-offset-1"

          >
            <div>
              <div className="text-xs text-[#255C79] flex items-center gap-1 mb-2">
                {metric.label}
                <span className="ml-1 text-gray-400 cursor-pointer">
                  <img src={i} alt="i" className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-bold text-[#255C79]">{metric.value}</div>
            </div>
            <div className="bg-[#D7EFF6] rounded-full p-4 flex items-center justify-center border border-[#255C79]">
              <img src={metric.Icon} alt={metric.label} />
            </div>
          </div>
        ))}
      </div>
      <div className="h-1 border-t border-[#D9E8FF] my-5"></div>
      <div className="flex gap-4 my-4">
        <TimeSpentGraph/>
        <StudentDailyActivityChart/>
        <StudentRanking clientId={1} />
      </div>
    </div>
  );
};

export default Dashboard;
