import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserGroupIcon from "../../../../commonComponents/icons/admin/dashboard/UserRounded.png";
import activeStudents from "../../../../commonComponents/icons/admin/dashboard/activestudents.png";
import dailylogins from "../../../../commonComponents/icons/admin/dashboard/dailylogins.png";
import timeSpent from "../../../../commonComponents/icons/admin/dashboard/ClockCircle.png";
import i from "../../../../commonComponents/icons/admin/dashboard/exclamation-circle.png";
import StudentRanking from "../components/RankingTable";
import TimeSpentGraph from "../components/TimeSpentGraph";
import StudentDailyActivityChart, { StudentDailyActivityApi } from "../components/StudentActivityChart";
import { useRole } from "../../../../hooks/useRole";
import AccessDenied from "../../../../components/AccessDenied";
import { useQuery } from "@tanstack/react-query";
import { coreAdminDashboard } from "../../../../services/admin/dashboardApis";
import { getCourses } from "../../../../services/admin/courseApis";

export interface Dashboard {
  number_of_students: number;
  active_students: number;
  time_spent_by_students: {
    value: number;
    unit: string;
  };
  daily_login_count: number;
  student_daily_activity: StudentDailyActivityApi[];
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
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery<Dashboard>({
    queryKey: ["coreAdminDashboard", clientId],
    queryFn: () => coreAdminDashboard(clientId),
    retry: false,
  });

  // Load courses for dynamic dropdown
  const { data: coursesData } = useQuery({
    queryKey: ["admin-courses", clientId],
    queryFn: () => getCourses(clientId),
    retry: false,
  });
  const courseOptions = useMemo(() => {
    const arr = (coursesData as Array<{ id: number; title: string }>) || [];
    return arr.map((c) => ({ id: c.id, title: c.title }));
  }, [coursesData]);

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
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col gap-4">
          <button
            onClick={handleBackToMain}
            className="w-fit flex items-center gap-2 px-4 py-2 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg hover:bg-[var(--primary-600)] transition-colors duration-200 shadow-md hover:shadow-lg"
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
        <select
          className=" rounded-lg p-2 border border-[var(--primary-100)] text-xs text-gray-700 w-1/10"
          value={selectedCourseId}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedCourseId(val === "" ? "" : Number(val));
          }}
        >
          <option value="">All Courses</option>
          {courseOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <div className="flex items-center text-[var(--primary-500)] text-sm gap-2">
          <p>Weekly</p>|<p>Monthly</p>|<p>Yearly</p>
        </div>
      </div>
      <div className="flex gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className="flex-1 bg-white rounded-lg shadow p-4 flex items-center justify-between ring-1 ring-[var(--primary-100)] ring-offset-1"
          >
            <div>
              <div className="text-xs text-[var(--primary-500)] flex items-center gap-1 mb-2">
                {metric.label}
                <span className="ml-1 text-gray-400 cursor-pointer">
                  <img src={i} alt="i" className="w-4 h-4" />
                </span>
              </div>
              <div className="text-3xl font-bold text-[var(--primary-500)]">
                {metric.value}
              </div>
            </div>
            <div className="bg-[var(--primary-50)] rounded-full p-4 flex items-center justify-center border border-[var(--primary-500)]">
              <img src={metric.Icon} alt={metric.label} />
            </div>
          </div>
        ))}
      </div>
      <div className="h-1 border-t border-[#D9E8FF] my-5"></div>
      <div className="flex gap-4 my-4">
        <TimeSpentGraph
          daily_time_spend={dashboardData?.daily_time_spend ?? []}
          isLoading={isLoading}
          error={error}
        />
        <StudentDailyActivityChart
          student_daily_activity={dashboardData?.student_daily_activity ?? []}
          isLoading={isLoading}
          error={error as Error | null}
        />
        <StudentRanking
          leaderboard={dashboardData?.leaderboard ?? []}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
};

export default Dashboard;
