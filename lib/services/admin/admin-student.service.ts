import apiClient from "../api";
import { config } from "../../config";

export interface Student {
  id: number;
  user_id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  total_marks: number;
  most_active_course: string;
  total_time_spent: {
    value: number;
    unit: string;
  };
  last_activity_date: string | null;
  current_streak: number;
  streak_data: boolean[];
  enrollment_count: number;
  assessment_submissions: number;
  activity_summary: {
    total_activities: number;
    by_type: Record<string, number>;
  };
}

export interface CourseCompletionStats {
  student_id: number;
  name: string;
  email: string;
  course_id?: number;
  course_title?: string;
  completed_contents: number;
  total_contents: number;
  completion_percentage: number;
  attended_activities: number;
  total_attendance_activities: number;
  attendance_percentage: number;
}

export interface ManageStudentsParams {
  search?: string;
  role?: string;
  course_id?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface ManageStudentsResponse {
  students: Student[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_students: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
  };
  filters_applied: {
    course_id?: string;
    search?: string;
    is_active?: string | null;
    sort_by?: string;
    sort_order?: string;
  };
}

export interface StudentDetail {
  id: number;
  user_id: number;
  personal_info: {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    date_joined: string;
    last_login: string | null;
    is_active: boolean;
  };
  academic_summary: {
    total_marks: number;
    total_time_spent: {
      value: number;
      unit: string;
    };
    enrolled_courses_count: number;
    assessment_submissions_count: number;
    current_streak: number;
    total_activities: number;
  };
  enrolled_courses: Array<{
    id: number;
    title?: string;
    category?: string;
    level?: string;
    progress?: number;
    status?: string;
    score?: number;
    certificate?: string;
    lessons_count?: number;
    hours?: number;
  }>;
  activity_pattern_30_days: Array<{
    date: string;
    activity_count: number;
    time_spent_hours: number;
    marks_earned: number;
  }>;
  assessments: Array<{
    id: number;
    title: string;
    score: number;
    max_score: number;
    date: string;
  }>;
  activity_breakdown: Record<string, number>;
}

export const adminStudentService = {
  // Get student list with filters
  getManageStudents: async (
    params?: ManageStudentsParams
  ): Promise<ManageStudentsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.role) queryParams.append("role", params.role);
    if (params?.course_id)
      queryParams.append("course_id", params.course_id.toString());
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.sort_by) queryParams.append("sort_by", params.sort_by);
    if (params?.sort_order) queryParams.append("sort_order", params.sort_order);

    const queryString = queryParams.toString();
    const url = `/admin-dashboard/api/clients/${
      config.clientId
    }/manage-students/${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<ManageStudentsResponse>(url);
    return response.data;
  },

  // Get course completion stats
  getCourseCompletionStats: async (
    courseId?: number
  ): Promise<CourseCompletionStats[]> => {
    const queryParams = new URLSearchParams();
    if (courseId) queryParams.append("course_id", courseId.toString());

    const response = await apiClient.get<CourseCompletionStats[]>(
      `/admin-dashboard/api/clients/${
        config.clientId
      }/course-completion-stats/${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`
    );
    return response.data;
  },

  // Get single student
  getStudent: async (studentId: number): Promise<StudentDetail> => {
    const response = await apiClient.get<StudentDetail>(
      `/admin-dashboard/api/clients/${config.clientId}/manage-student/${studentId}/`
    );
    return response.data;
  },

  // Update student
  updateStudent: async (
    studentId: number,
    data: {
      role?: string;
      is_active?: boolean;
      first_name?: string;
      last_name?: string;
      email?: string;
    }
  ) => {
    const response = await apiClient.patch(
      `/admin-dashboard/api/clients/${config.clientId}/manage-student/${studentId}/`,
      data
    );
    return response.data;
  },

  // Activate student
  activateStudent: async (studentId: number) => {
    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${config.clientId}/manage-student/${studentId}/`,
      { action: "activate" }
    );
    return response.data;
  },

  // Deactivate student
  deactivateStudent: async (studentId: number) => {
    const response = await apiClient.delete(
      `/admin-dashboard/api/clients/${config.clientId}/manage-student/${studentId}/`
    );
    return response.data;
  },

  // Manage student actions (enroll, unenroll, reset progress)
  manageStudentAction: async (
    studentId: number,
    action: "enroll_course" | "unenroll_course" | "reset_progress",
    courseId?: number
  ) => {
    const body: { action: string; course_id?: number } = { action };
    if (courseId !== undefined) {
      body.course_id = courseId;
    }

    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${config.clientId}/manage-student/${studentId}/`,
      body
    );
    return response.data;
  },
};

