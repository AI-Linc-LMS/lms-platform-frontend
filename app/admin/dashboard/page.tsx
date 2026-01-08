"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import {
  adminDashboardService,
  CoreAdminDashboard,
  AttendanceAnalytics,
  StudentActiveDaysAnalytics,
} from "@/lib/services/admin/admin-dashboard.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import { DashboardMetricCard } from "@/components/admin/dashboard/DashboardMetricCard";
import { TimeSpentChart } from "@/components/admin/dashboard/TimeSpentChart";
import { DailyActivityChart } from "@/components/admin/dashboard/DailyActivityChart";
import { DailyLoginsChart } from "@/components/admin/dashboard/DailyLoginsChart";
import { AttendanceTrendChart } from "@/components/admin/dashboard/AttendanceTrendChart";
import { SessionStartTimeChart } from "@/components/admin/dashboard/SessionStartTimeChart";
import { StudentActiveDaysChart } from "@/components/admin/dashboard/StudentActiveDaysChart";
import { StudentRankingCard } from "@/components/admin/dashboard/StudentRankingCard";
import { useToast } from "@/components/common/Toast";

type TimePeriod = "weekly" | "bimonthly" | "monthly";

function AdminDashboardPage() {
  const { showToast } = useToast();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedCourseName, setSelectedCourseName] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  const [coreData, setCoreData] = useState<CoreAdminDashboard | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [studentActivity, setStudentActivity] = useState<
    StudentActiveDaysAnalytics[] | null
  >(null);
  const [attendanceData, setAttendanceData] =
    useState<AttendanceAnalytics | null>(null);

  const [loading, setLoading] = useState(true);

  // Calculate window size based on time period
  const windowSize = useMemo(() => {
    switch (timePeriod) {
      case "weekly":
        return 7;
      case "bimonthly":
        return 60;
      case "monthly":
        return 30;
      default:
        return 7;
    }
  }, [timePeriod]);

  // Calculate date range based on time period
  useEffect(() => {
    const today = new Date();
    const endDate = new Date(today);
    let startDate = new Date(today);

    switch (timePeriod) {
      case "weekly":
        startDate.setDate(today.getDate() - 7);
        break;
      case "bimonthly":
        startDate.setDate(today.getDate() - 60);
        break;
      case "monthly":
        startDate.setDate(today.getDate() - 30);
        break;
    }

    setDateRange({
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    });
  }, [timePeriod]);

  // Load courses
  const loadCourses = useCallback(async () => {
    try {
      const data = await adminCoursesService.getCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (error) {}
  }, []);

  // Load core dashboard data
  const loadCoreData = useCallback(async () => {
    try {
      const courseId =
        selectedCourse !== "all" ? Number(selectedCourse) : undefined;
      const data = await adminDashboardService.getCoreAdminDashboard({
        course_id: courseId,
      });
      setCoreData(data);
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to load dashboard data",
        "error"
      );
    }
  }, [selectedCourse, showToast]);
  // Load student activity analytics (optional, for date range filtering)
  const loadStudentActivity = useCallback(async () => {
    if (!dateRange.start || !dateRange.end) return;
    try {
      const courseId =
        selectedCourse !== "all" ? Number(selectedCourse) : undefined;
      const data = await adminDashboardService.getStudentActivityAnalytics({
        course_id: courseId,
        start_date: dateRange.start,
        end_date: dateRange.end,
      });
      setStudentActivity(Array.isArray(data) ? data : []);
    } catch (error: any) {
      // Don't show error toast as core data is primary
    }
  }, [dateRange.start, dateRange.end, selectedCourse]);

  // Load attendance analytics
  const loadAttendanceData = useCallback(async () => {
    if (!dateRange.start || !dateRange.end) return;
    try {
      const courseId =
        selectedCourse !== "all" ? Number(selectedCourse) : undefined;
      const data = await adminDashboardService.getAttendanceAnalytics({
        course_id: courseId,
        start_date: dateRange.start,
        end_date: dateRange.end,
      });
      setAttendanceData(data);
    } catch (error: any) {
      showToast(
        error?.response?.data?.detail || "Failed to load attendance data",
        "error"
      );
    }
  }, [dateRange.start, dateRange.end, selectedCourse, showToast]);

  // Load core data immediately (doesn't require date range)
  useEffect(() => {
    const loadCore = async () => {
      setLoading(true);
      await Promise.all([loadCoreData(), loadCourses()]);
      setLoading(false);
    };
    loadCore();
  }, [loadCoreData, loadCourses, selectedCourse]);

  // Load date-dependent data when date range or course is set
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;

    const loadDateDependentData = async () => {
      await Promise.all([loadStudentActivity(), loadAttendanceData()]);
    };

    loadDateDependentData();
  }, [
    dateRange.start,
    dateRange.end,
    selectedCourse,
    loadStudentActivity,
    loadAttendanceData,
  ]);

  // Use coreData as primary source, fallback to studentActivity
  const dashboardData = coreData;

  // Calculate total time spent based on period window
  const calculatedTimeSpent = useMemo(() => {
    if (!dashboardData?.daily_time_spend) return { value: 0, unit: "hours" };

    const data = dashboardData.daily_time_spend;
    const len = data.length;
    const start = Math.max(0, len - windowSize);
    const windowData = data.slice(start, len);

    const totalHours = windowData.reduce(
      (sum: number, item: { time_spent?: number }) =>
        sum + (item.time_spent || 0),
      0
    );
    return { value: parseFloat(totalHours.toFixed(2)), unit: "hours" };
  }, [dashboardData?.daily_time_spend, windowSize]);

  // Calculate average daily login count based on period window
  const calculatedDailyLogin = useMemo(() => {
    if (!dashboardData?.daily_login_data) return 0;

    const data = dashboardData.daily_login_data;
    const len = data.length;
    const start = Math.max(0, len - windowSize);
    const windowData = data.slice(start, len);

    const totalLogins = windowData.reduce(
      (sum: number, item: { login_count?: number }) =>
        sum + (item.login_count || 0),
      0
    );
    const average = windowData.length > 0 ? totalLogins / windowData.length : 0;
    return parseFloat(average.toFixed(2));
  }, [dashboardData?.daily_login_data, windowSize]);

  // Filter chart data based on window size
  const filteredTimeSpentData = useMemo(() => {
    if (!dashboardData?.daily_time_spend) return [];
    const data = dashboardData.daily_time_spend;
    const len = data.length;
    const start = Math.max(0, len - windowSize);
    return data.slice(start, len);
  }, [dashboardData?.daily_time_spend, windowSize]);

  const filteredDailyLoginData = useMemo(() => {
    if (!dashboardData?.daily_login_data) return [];
    const data = dashboardData.daily_login_data;
    const len = data.length;
    const start = Math.max(0, len - windowSize);
    return data.slice(start, len);
  }, [dashboardData?.daily_login_data, windowSize]);

  const filteredDailyActivityData = useMemo(() => {
    if (!dashboardData?.student_daily_activity) return [];
    const data = dashboardData.student_daily_activity;
    const len = data.length;
    const start = Math.max(0, len - windowSize);
    return data.slice(start, len);
  }, [dashboardData?.student_daily_activity, windowSize]);

  // Filter attendance trend data based on window size
  const filteredAttendanceTrendData = useMemo(() => {
    if (!attendanceData) return [];

    const sourceData = attendanceData.attendance_activity_record
      ? attendanceData.attendance_activity_record
      : attendanceData.daily_breakdown || [];

    if (sourceData.length === 0) return [];

    const len = sourceData.length;
    const start = Math.max(0, len - windowSize);
    return sourceData.slice(start, len).map((item: any) => ({
      date: item.date,
      total_attendance_count: item.total_attendance_count || 0,
    }));
  }, [attendanceData, windowSize]);

  // Filter session start time data based on window size
  const filteredSessionStartTimeData = useMemo(() => {
    if (!attendanceData?.attendance_creation_time) return [];

    const data = attendanceData.attendance_creation_time;
    const len = data.length;
    const start = Math.max(0, len - windowSize);
    return data.slice(start, len);
  }, [attendanceData?.attendance_creation_time, windowSize]);

  // Get metric tooltip text
  const getMetricTooltip = (
    id: "total_students" | "active_students" | "time_spent" | "daily_logins"
  ) => {
    const suffix =
      selectedCourseId === ""
        ? "across all courses."
        : `in ${selectedCourseName}.`;
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

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header with Filters */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 4,
            gap: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#111827",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Dashboard
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <FormControl
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 150 } }}
            >
              <InputLabel>All Courses</InputLabel>
              <Select
                value={selectedCourse}
                onChange={(e) => {
                  const value = e.target.value;
                  setSelectedCourse(value);
                  if (value === "all") {
                    setSelectedCourseId("");
                    setSelectedCourseName("");
                  } else {
                    const course = courses.find(
                      (c: any) =>
                        c.id?.toString() === value || c.title === value
                    );
                    setSelectedCourseId(course?.id?.toString() || "");
                    setSelectedCourseName(course?.title || "");
                  }
                }}
                label="All Courses"
              >
                <MenuItem value="all">All Courses</MenuItem>
                {courses?.map((course: any) => (
                  <MenuItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 1 }}>
              {(["weekly", "bimonthly", "monthly"] as TimePeriod[]).map(
                (period) => (
                  <Box
                    key={period}
                    onClick={() => setTimePeriod(period)}
                    sx={{
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      cursor: "pointer",
                      backgroundColor:
                        timePeriod === period ? "#6366f1" : "transparent",
                      color: timePeriod === period ? "#ffffff" : "#6b7280",
                      fontWeight: timePeriod === period ? 600 : 500,
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      textTransform: "capitalize",
                      border: `1px solid ${
                        timePeriod === period ? "#6366f1" : "#e5e7eb"
                      }`,
                      transition: "all 0.2s",
                      "&:hover": {
                        backgroundColor:
                          timePeriod === period ? "#6366f1" : "#f3f4f6",
                      },
                    }}
                  >
                    {period === "bimonthly"
                      ? "Bimonthly"
                      : period.charAt(0).toUpperCase() + period.slice(1)}
                  </Box>
                )
              )}
            </Box>
          </Box>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Metric Cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: 3,
                mb: 4,
              }}
            >
              <DashboardMetricCard
                title="Number of students"
                value={dashboardData?.number_of_students || 0}
                icon="mdi:account-group"
                iconColor="#6366f1"
                tooltip={getMetricTooltip("total_students")}
              />
              <DashboardMetricCard
                title="Active Students"
                value={dashboardData?.active_students || 0}
                icon="mdi:monitor"
                iconColor="#10b981"
                tooltip={getMetricTooltip("active_students")}
              />
              <DashboardMetricCard
                title="Time Spent by Student"
                value={`${calculatedTimeSpent.value} ${calculatedTimeSpent.unit}`}
                icon="mdi:clock-outline"
                iconColor="#f59e0b"
                tooltip={getMetricTooltip("time_spent")}
              />
              <DashboardMetricCard
                title="Student Daily Logins"
                value={calculatedDailyLogin.toFixed(2)}
                icon="mdi:arrow-right-circle"
                iconColor="#8b5cf6"
                tooltip={getMetricTooltip("daily_logins")}
              />
            </Box>

            {/* Charts Row 1 */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "2fr 1fr",
                },
                gap: 3,
                mb: 3,
              }}
            >
              <TimeSpentChart data={filteredTimeSpentData} />
              <StudentRankingCard
                leaderboard={dashboardData?.leaderboard || []}
              />
            </Box>

            {/* Charts Row 2 */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "1fr 1fr",
                },
                gap: 3,
                mb: 3,
              }}
            >
              <DailyActivityChart data={filteredDailyActivityData} />
              <DailyLoginsChart data={filteredDailyLoginData} />
            </Box>

            {/* Charts Row 3 */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "1fr 1fr",
                },
                gap: 3,
                mb: 3,
              }}
            >
              <AttendanceTrendChart data={filteredAttendanceTrendData} />
              <SessionStartTimeChart data={filteredSessionStartTimeData} />
            </Box>

            {/* Charts Row 4 */}
            <Box sx={{ mb: 3 }}>
              <StudentActiveDaysChart data={studentActivity || []} />
            </Box>
          </>
        )}
      </Box>
    </MainLayout>
  );
}

export default AdminDashboardPage;
