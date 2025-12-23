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
            <h1 className="text-3xl font-bold text-[var(--font-primary)]">Dashboard</h1>
            <p className="text-[var(--font-secondary)] mt-2">
              Here is a glimpse of your overall progress.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <select
          className="rounded-xl p-2.5 border border-[var(--neutral-200)] text-sm text-[var(--font-primary)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-all shadow-sm w-auto min-w-[150px]"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => {
          const iconColors = [
            "bg-blue-100 text-blue-600",
            "bg-green-100 text-green-600",
            "bg-orange-100 text-orange-600",
            "bg-purple-100 text-purple-600",
          ];
          const iconColorClass = iconColors[idx % iconColors.length];
          
          return (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-card p-6 flex items-center justify-between hover:shadow-card-hover transition-all duration-200 border border-[var(--neutral-200)]"
            >
              <div className="flex-1">
                <div className="text-sm text-[var(--font-secondary)] font-medium mb-2 flex items-center gap-1">
                  {metric.label}
                  <span className="text-gray-400 cursor-default relative group">
                    <img src={i} alt="info" className="w-4 h-4" />
                    <div
                      role="tooltip"
                      className="absolute z-20 hidden group-hover:block bg-[var(--font-primary)] text-white text-[10px] leading-snug rounded-lg px-2 py-1 w-[120px] -top-2 left-1/2 -translate-x-1/2 -translate-y-full shadow-lg"
                    >
                      {getMetricTooltip(metric.id)}
                    </div>
                  </span>
                </div>
                <div className="text-3xl font-bold text-[var(--font-primary)]">
                  {metric.id === "time_spent" ? (
                    (() => {
                      const parts = String(metric.value).split(" ");
                      const num = parts[0];
                      const unit = parts.slice(1).join(" ");
                      return (
                        <span>
                          <span>{num}</span>
                          {unit && <span className="text-lg ml-2 font-normal">{unit}</span>}
                        </span>
                      );
                    })()
                  ) : (
                    metric.value
                  )}
                </div>
              </div>
              <div className={`${iconColorClass} rounded-xl p-3 flex items-center justify-center ml-4`}>
                <img src={metric.Icon} alt={metric.label} className="w-6 h-6" />
              </div>
            </div>
          );
        })}
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

      {/* Row 2: Student Daily Logins, Attendance Trend, Session Start Time Trend */}
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
          <AttendanceTrendGraph
            attendance_activity_record={attendanceAnalyticsData?.attendance_activity_record ?? []}
            isLoading={isAttendanceAnalyticsLoading}
            error={attendanceAnalyticsError as Error | null}
            period={period}
          />
        </div>

        <div className="flex-1">
          <SessionStartTimeTrendGraph
            attendance_creation_time={attendanceAnalyticsData?.attendance_creation_time ?? []}
            isLoading={isAttendanceAnalyticsLoading}
            error={attendanceAnalyticsError as Error | null}
            period={period}
          />
        </div>
      </div>

      {/* Row 3: Student Active Days (2/3 width), Future graphs */}
      <div className="flex gap-4 my-4">
        <div className="flex-[2]">
          <StudentPresentStreakGraph
            data={studentActivityData ?? []}
            isLoading={isStudentActivityLoading}
            error={studentActivityError as Error | null}
          />
        </div>

        <div className="flex-1">
          {/* Future graph 1 goes here */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
