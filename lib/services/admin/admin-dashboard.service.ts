import apiClient from "../api";
import { config } from "../../config";

export interface CoreAdminDashboard {
  number_of_students: number;
  active_students: number;
  time_spent_by_students?: {
    value: number;
    unit: string;
  };
  daily_login_count?: number;
  daily_login_data: Array<{
    date: string;
    login_count: number;
  }>;
  student_daily_activity: Array<{
    video: number;
    article: number;
    quiz: number;
    assignment: number;
    coding_problem: number;
    dev_coding_problem: number;
    total: number;
    date: string;
  }>;
  leaderboard?: Array<{
    name: string;
    course: string;
    marks: number;
    rank: number;
  }>;
  daily_time_spend: Array<{
    date: string;
    time_spent: number;
  }>;
  student_active_days?: Array<{
    studentName: string;
    Present_streak: number;
    Active_days: number;
  }>;
  // Legacy fields for backward compatibility
  total_students?: number;
  total_courses?: number;
  total_enrollments?: number;
  recent_activities?: any[];
}

export interface AttendanceAnalytics {
  total_activities: number;
  total_attendance: number;
  attendance_rate: number;
  daily_breakdown: Array<{
    date: string;
    activities_created: number;
    total_attendance_count: number;
  }>;
  attendance_activity_record?: Array<{
    date: string;
    activities_created: number;
    total_attendance_count: number;
  }>;
  attendance_creation_time?: Array<{
    date: string;
    activity_created_time: string;
    has_activity: boolean;
  }>;
}

export interface StudentActivityAnalytics {
  number_of_students: number;
  active_students: number;
  time_spent_by_students: {
    value: number;
    unit: string;
  };
  daily_login_count: number;
  daily_login_data: Array<{
    date: string;
    login_count: number;
  }>;
  student_daily_activity: Array<{
    video: number;
    article: number;
    quiz: number;
    assignment: number;
    coding_problem: number;
    dev_coding_problem: number;
    total: number;
    date: string;
  }>;
  leaderboard?: Array<{
    name: string;
    course: string;
    marks: number;
    rank: number;
  }>;
  daily_time_spend: Array<{
    date: string;
    time_spent: number;
  }>;
  student_active_days?: Array<{
    studentName: string;
    Active_days: number;
    Present_streak: number;
  }>;
}

export interface StudentActiveDaysAnalytics {
  studentName: string;
  Active_days: number;
  Present_streak: number;
}

export const adminDashboardService = {
  // Get core admin dashboard data
  getCoreAdminDashboard: async (params?: {
    course_id?: number;
  }): Promise<CoreAdminDashboard> => {
    const queryParams = new URLSearchParams();
    if (params?.course_id)
      queryParams.append("course_id", params.course_id.toString());

    const queryString = queryParams.toString();
    const url = `/admin-dashboard/api/clients/${
      config.clientId
    }/core-admin-dashboard/${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<CoreAdminDashboard>(url);
    return response.data;
  },

  // Get attendance analytics
  getAttendanceAnalytics: async (params?: {
    course_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<AttendanceAnalytics> => {
    const queryParams = new URLSearchParams();
    if (params?.course_id)
      queryParams.append("course_id", params.course_id.toString());
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);

    const queryString = queryParams.toString();
    const url = `/admin-dashboard/api/clients/${
      config.clientId
    }/attendance-analytics/${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<AttendanceAnalytics>(url);
    return response.data;
  },

  // Get student activity analytics (returns array of StudentActiveDaysAnalytics)
  getStudentActivityAnalytics: async (params?: {
    course_id?: number;
    student_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<StudentActiveDaysAnalytics[]> => {
    const queryParams = new URLSearchParams();
    if (params?.course_id)
      queryParams.append("course_id", params.course_id.toString());
    if (params?.student_id)
      queryParams.append("student_id", params.student_id.toString());
    if (params?.start_date) queryParams.append("start_date", params.start_date);
    if (params?.end_date) queryParams.append("end_date", params.end_date);

    const queryString = queryParams.toString();
    const url = `/admin-dashboard/api/clients/${
      config.clientId
    }/student-activity-analytics/${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<StudentActiveDaysAnalytics[]>(url);

    return Array.isArray(response.data) ? response.data : [];
  },
};
