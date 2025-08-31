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
import { useQuery } from "@tanstack/react-query";
import { coreAdminDashboard } from "../../../../services/admin/dashboardApis";

export interface Dashboard {
  number_of_students: number;
  active_students: number;
  time_spent_by_students: {
    value: number;
    unit: string;
  };
  daily_login_count: number;
  leaderboard: LeaderboardEntry[];
  daily_time_spend: DailyTimeSpentAdmin[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  course: string;
  marks: number;
}

export interface DailyTimeSpentAdmin {
  date: Date;
  time_spent: number;
}

const Dashboard = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery<Dashboard>({
    queryKey: ["coreAdminDashboard", clientId],
    queryFn: () => coreAdminDashboard(clientId),
    retry: false,
  });

  const navigate = useNavigate();
  const metrics = dashboardData
    ? [
      {
        label: "Number of students",
        value: dashboardData.number_of_students,
        Icon: UserGroupIcon,
      },
      {
        label: "Active Students",
        value: dashboardData.active_students,
        Icon: activeStudents,
      },
      {
        label: "Time Spent by Student",
        value: `${dashboardData.time_spent_by_students.value} ${dashboardData.time_spent_by_students.unit}`,
        Icon: timeSpent,
      },
      {
        label: "Student Daily Logins",
        value: dashboardData.daily_login_count,
        Icon: dailylogins,
      },
    ]
    : [];

  const handleBackToMain = () => {
    navigate("/");
  };

  const { isSuperAdmin } = useRole();

  if (!isSuperAdmin) {
    return <AccessDenied />;
  }

  if (isLoading || !dashboardData) {
    return (
      <div className="p-8 text-center text-lg text-gray-500">
        Loading dashboard data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-lg text-red-600">
        Error loading dashboard data.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 mb-6 md:mb-8">
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
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Here is a glimpse of your overall progress.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <select className="rounded-lg p-2 border border-[#B9E4F2] text-xs text-gray-700 w-full sm:w-auto min-w-[150px]">
          <option value="1">Select Courses</option>
        </select>

        <div className="flex items-center text-[#255C79] text-sm gap-2 justify-center sm:justify-end">
          <p className="cursor-pointer hover:font-medium">Weekly</p>|
          <p className="cursor-pointer hover:font-medium">Monthly</p>|
          <p className="cursor-pointer hover:font-medium">Yearly</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg shadow p-4 flex items-center justify-between ring-1 ring-[#B9E4F2] ring-offset-1"
          >
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#255C79] flex items-center gap-1 mb-2">
                <span className="truncate">{metric.label}</span>
                <span className="text-gray-400 cursor-pointer flex-shrink-0">
                  <img src={i} alt="i" className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl md:text-2xl lg:text-3xl font-bold text-[#255C79] truncate">
                {metric.value}
              </div>
            </div>
            <div className="bg-[#D7EFF6] rounded-full p-3 md:p-4 flex items-center justify-center border border-[#255C79] flex-shrink-0 ml-2">
              <img src={metric.Icon} alt={metric.label} className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="h-1 border-t border-[#D9E8FF] my-5"></div>
      
      <div className="flex flex-col lg:flex-row gap-4 my-4">
        <div className="w-full lg:w-1/2">
          <TimeSpentGraph
            daily_time_spend={dashboardData?.daily_time_spend ?? []}
            isLoading={isLoading}
            error={error}
          />
        </div>
        <div className="w-full lg:w-1/4">
          <StudentDailyActivityChart />
        </div>
        <div className="w-full lg:w-1/4">
          <StudentRanking
            leaderboard={dashboardData?.leaderboard ?? []}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
