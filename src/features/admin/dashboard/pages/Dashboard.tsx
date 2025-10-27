import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserGroupIcon from "../../../../commonComponents/icons/admin/dashboard/UserRounded.png";
import activeStudents from "../../../../commonComponents/icons/admin/dashboard/activestudents.png";
import dailylogins from "../../../../commonComponents/icons/admin/dashboard/dailylogins.png";
import timeSpent from "../../../../commonComponents/icons/admin/dashboard/ClockCircle.png";
import i from "../../../../commonComponents/icons/admin/dashboard/exclamation-circle.png";
import StudentRanking from "../components/RankingTable";
import TimeSpentGraph from "../components/TimeSpentGraph";
import StudentDailyLoginsGraph from "../components/StudentDailyLoginsGraph";
import StudentDailyActivityChart, { StudentDailyActivityApi } from "../components/StudentActivityChart";
import StudentPresentStreakGraph from "../components/StudentPresentStreakGraph";
import AttendanceTrendGraph from "../components/AttendanceTrendGraph";
import SessionStartTimeTrendGraph from "../components/SessionStartTimeTrendGraph";
import { useRole } from "../../../../hooks/useRole";
import AccessDenied from "../../../../components/AccessDenied";
import { useQuery } from "@tanstack/react-query";
import { coreAdminDashboard } from "../../../../services/admin/dashboardApis";
import { getCourses } from "../../../../services/admin/courseApis";
import { getStudentActivityAnalytics, getAttendanceAnalytics } from "../../../../services/attendanceApis";

export interface Dashboard {
  number_of_students: number;
  active_students: number;
  time_spent_by_students: {
    value: number;
    unit: string;
  };
  daily_login_count: number;
  daily_login_data: Array<{ date: string; login_count: number }>;
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
  const [period, setPeriod] = useState<"weekly" | "bimonthly" | "monthly">("weekly");
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useQuery<Dashboard>({
    queryKey: ["coreAdminDashboard", clientId, selectedCourseId],
    queryFn: () => coreAdminDashboard(clientId, selectedCourseId === "" ? undefined : selectedCourseId),
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

  // Load student activity analytics for completion graph
  const {
    data: studentActivityData,
    isLoading: isStudentActivityLoading,
    error: studentActivityError,
  } = useQuery({
    queryKey: ["studentActivityAnalytics", clientId, selectedCourseId],
    queryFn: () =>
      getStudentActivityAnalytics(
        clientId,
        selectedCourseId === "" ? undefined : selectedCourseId
      ),
    retry: false,
  });

  // Load attendance analytics for attendance trend graph
  const {
    data: attendanceAnalyticsData,
    isLoading: isAttendanceAnalyticsLoading,
    error: attendanceAnalyticsError,
  } = useQuery({
    queryKey: ["attendanceAnalytics", clientId, selectedCourseId],
    queryFn: () =>
      getAttendanceAnalytics(
        clientId,
        selectedCourseId === "" ? undefined : selectedCourseId
      ),
    retry: false,
  });

  const selectedCourseName = useMemo(() => {
    if (selectedCourseId === "") return "All Courses";
    const found = courseOptions.find((c) => c.id === selectedCourseId);
    return found?.title || "selected course";
  }, [selectedCourseId, courseOptions]);

  // Calculate window size based on period
  const windowSize = useMemo(() => {
    switch (period) {
      case "weekly":
        return 7;
      case "bimonthly":
        return 15;
      case "monthly":
        return 30;
      default:
        return 7;
    }
  }, [period]);

  // Calculate total time spent based on period window
  const calculatedTimeSpent = useMemo(() => {
    if (!dashboardData?.daily_time_spend) return { value: 0, unit: "hours" };
    
    const data = dashboardData.daily_time_spend;
    const len = data.length;
    const start = Math.max(0, len - windowSize);
    const windowData = data.slice(start, len);
    
    const totalHours = windowData.reduce((sum, item) => sum + (item.time_spent || 0), 0);
    return { value: parseFloat(totalHours.toFixed(2)), unit: "hours" };
  }, [dashboardData?.daily_time_spend, windowSize]);

  // Calculate average daily login count based on period window
  const calculatedDailyLogin = useMemo(() => {
    if (!dashboardData?.daily_login_data) return 0;
    
    const data = dashboardData.daily_login_data;
    const len = data.length;
    const start = Math.max(0, len - windowSize);
    const windowData = data.slice(start, len);
    
    const totalLogins = windowData.reduce((sum, item) => sum + (item.login_count || 0), 0);
    const average = windowData.length > 0 ? totalLogins / windowData.length : 0;
    return parseFloat(average.toFixed(2));
  }, [dashboardData?.daily_login_data, windowSize]);

  const navigate = useNavigate();
  const metrics = dashboardData
    ? [
        {
          id: "total_students" as const,
          label: "Number of students",
          value: dashboardData.number_of_students,
          Icon: UserGroupIcon,
        },
        {
          id: "active_students" as const,
          label: "Active Students",
          value: dashboardData.active_students,
          Icon: activeStudents,
        },
        {
          id: "time_spent" as const,
          label: "Time Spent by Student",
          value: `${calculatedTimeSpent.value} ${calculatedTimeSpent.unit}`,
          Icon: timeSpent,
        },
        {
          id: "daily_logins" as const,
          label: "Student Daily Logins",
          value: calculatedDailyLogin,
          Icon: dailylogins,
        },
      ]
    : [];

  const getMetricTooltip = (
    id: "total_students" | "active_students" | "time_spent" | "daily_logins"
  ) => {
    const suffix = selectedCourseId === "" ? "across all courses." : `in ${selectedCourseName}.`;
    switch (id) {
      case "total_students":
        return `Total number of students ${suffix}`;
      case "active_students":
        return `Number of students logged in the platform in last 15 days ${suffix}`;
      case "time_spent":
        return `Total time spent by students ${suffix}`;
      case "daily_logins":
        return `Average number of students logged in the platform in last 7 days ${suffix}`;
      default:
        return "";
    }
  };

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
          <button
            className={`px-2 py-1 rounded ${period === "weekly" ? "bg-[var(--primary-100)] text-[var(--primary-700)]" : "hover:underline"}`}
            onClick={() => setPeriod("weekly")}
          >
            Weekly
          </button>
          |
          <button
            className={`px-2 py-1 rounded ${period === "bimonthly" ? "bg-[var(--primary-100)] text-[var(--primary-700)]" : "hover:underline"}`}
            onClick={() => setPeriod("bimonthly")}
          >
            Bimonthly
          </button>
          |
          <button
            className={`px-2 py-1 rounded ${period === "monthly" ? "bg-[var(--primary-100)] text-[var(--primary-700)]" : "hover:underline"}`}
            onClick={() => setPeriod("monthly")}
          >
            Monthly
          </button>
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
                <span className="ml-1 text-gray-400 cursor-default relative group">
                  <img src={i} alt="info" className="w-4 h-4" />
                  <div
                    role="tooltip"
                    className="absolute z-20 hidden group-hover:block bg-gray-700 text-white text-[10px] leading-snug rounded px-2 py-1 w-[120px] -top-2 left-1/2 -translate-x-1/2 -translate-y-full shadow-lg"
                  >
                    {getMetricTooltip(metric.id)}
                  </div>
                </span>
              </div>
              <div className="text-3xl font-bold text-[var(--primary-500)]">
                {metric.id === "time_spent" ? (
                  // metric.value has format "<number> <unit>"
                  (() => {
                    const parts = String(metric.value).split(" ");
                    const num = parts[0];
                    const unit = parts.slice(1).join(" ");
                    return (
                      <span>
                        <span>{num}</span>
                        {unit && <span className="text-base ml-2">{unit}</span>}
                      </span>
                    );
                  })()
                ) : (
                  metric.value
                )}
              </div>
            </div>
            <div className="bg-[var(--primary-50)] rounded-full p-4 flex items-center justify-center border border-[var(--primary-500)]">
              <img src={metric.Icon} alt={metric.label} />
            </div>
          </div>
        ))}
      </div>
      <div className="h-1 border-t border-[#D9E8FF] my-5"></div>
      
      {/* Row 1: Time Spent, Student Activity, Student Ranking */}
      <div className="flex gap-4 my-4">
        <div className="flex-1">
          <TimeSpentGraph
            daily_time_spend={dashboardData?.daily_time_spend ?? []}
            isLoading={isLoading}
            error={error}
            period={period}
          />
        </div>

        <div className="flex-1">
          <StudentDailyActivityChart
            student_daily_activity={dashboardData?.student_daily_activity ?? []}
            isLoading={isLoading}
            error={error as Error | null}
            period={period}
          />
        </div>

        <div className="flex-1">
          <StudentRanking
            leaderboard={dashboardData?.leaderboard ?? []}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>

      {/* Row 2: Student Daily Logins, Student Present Streak, Attendance Trend */}
      <div className="flex gap-4 my-4">
        <div className="flex-1">
          <StudentDailyLoginsGraph
            daily_login_data={dashboardData?.daily_login_data ?? []}
            isLoading={isLoading}
            error={error as Error | null}
            period={period}
          />
        </div>

        <div className="flex-1">
          <StudentPresentStreakGraph
            data={studentActivityData ?? []}
            isLoading={isStudentActivityLoading}
            error={studentActivityError as Error | null}
          />
        </div>

        <div className="flex-1">
          <AttendanceTrendGraph
            attendance_activity_record={attendanceAnalyticsData?.attendance_activity_record ?? []}
            isLoading={isAttendanceAnalyticsLoading}
            error={attendanceAnalyticsError as Error | null}
            period={period}
          />
        </div>
      </div>

      {/* Row 3: Session Start Time Trend, (Future graphs can be added here) */}
      <div className="flex gap-4 my-4">
        <div className="flex-1">
          <SessionStartTimeTrendGraph
            attendance_creation_time={attendanceAnalyticsData?.attendance_creation_time ?? []}
            isLoading={isAttendanceAnalyticsLoading}
            error={attendanceAnalyticsError as Error | null}
            period={period}
          />
        </div>

        <div className="flex-1">
          {/* Future graph 1 goes here */}
        </div>

        <div className="flex-1">
          {/* Future graph 2 goes here */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
