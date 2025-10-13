import axiosInstance from "../axiosInstance";
import { AxiosError } from "axios";

type ApiErrorPayload = {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
};

// List item shape from Manage Students API (as per actual response)
export interface StudentListItem {
  id: number;
  user_id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  is_active: boolean;
  date_joined: string; // ISO
  last_login: string | null; // ISO or null
  total_marks: number;
  most_active_course: string; // e.g., "No Activity"
  total_time_spent: { value: number; unit: string };
  last_activity_date: string | null; // ISO or null
  current_streak: number;
  streak_data: boolean[]; // last 7 days
  enrollment_count: number;
  assessment_submissions: number;
  activity_summary: { total_activities: number; by_type: Record<string, number> };
}

export interface ManageStudentsPagination {
  current_page: number;
  total_pages: number;
  total_students: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ManageStudentsFiltersApplied {
  course_id: number | null;
  search: string;
  is_active: boolean | null;
  sort_by: string;
  sort_order: "asc" | "desc";
}

export interface ManageStudentsResponse {
  students: StudentListItem[];
  pagination: ManageStudentsPagination;
  filters_applied: ManageStudentsFiltersApplied;
}

export interface ManageStudentsParams {
  course_id?: number;
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort_by?: "marks" | "name" | "last_activity" | "time_spent" | "streak" | string;
  sort_order?: "asc" | "desc";
}

export const getManageStudents = async (
  clientId: number,
  params: ManageStudentsParams = {}
): Promise<ManageStudentsResponse> => {
  const query = new URLSearchParams();
  if (params.course_id !== undefined) query.set("course_id", String(params.course_id));
  if (params.search) query.set("search", params.search);
  if (params.is_active !== undefined) query.set("is_active", String(params.is_active));
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.sort_by) query.set("sort_by", params.sort_by);
  if (params.sort_order) query.set("sort_order", params.sort_order);

  try {
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/manage-students/${query.toString() ? `?${query.toString()}` : ""}`
    );
    return res.data as ManageStudentsResponse;
  } catch (error) {
    const message = (error as Error).message ?? "Failed to fetch students";
    throw new Error(message);
  }
};

// Detail endpoint for a single student
export interface StudentDetailCourse {
  id: number;
  title: string;
  description?: string;
  enrollment_date?: string | null;
  marks?: number;
  progress_percentage?: number;
  total_contents?: number;
  completed_contents?: number;
  last_activity?: string | null;
  activity_count?: number;
}

export interface StudentDetailAssessment {
  id: number;
  assessment_title: string;
  score: number;
  status: string;
  submitted_at: string | null;
  started_at: string | null;
  offered_scholarship_percentage?: number;
}

export interface StudentDetailActivityPoint {
  date: string; // YYYY-MM-DD
  activity_count: number;
  time_spent_hours: number;
  marks_earned: number;
}

export interface StudentDetail {
  id: number;
  user_id: number;
  personal_info: {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    date_joined: string; // ISO
    last_login: string | null; // ISO or null
    is_active: boolean;
  };
  academic_summary: {
    total_marks: number;
    total_time_spent: { value: number; unit: string };
    enrolled_courses_count: number;
    assessment_submissions_count: number;
    current_streak: number;
    total_activities: number;
  };
  enrolled_courses: StudentDetailCourse[];
  activity_pattern_30_days: StudentDetailActivityPoint[];
  assessments: StudentDetailAssessment[];
  activity_breakdown: Record<string, number>;
}

export const getManageStudentDetail = async (
  clientId: number,
  studentId: number
): Promise<StudentDetail> => {
  try {
    const res = await axiosInstance.get(
      `/admin-dashboard/api/clients/${clientId}/manage-student/${studentId}/`
    );
    return res.data;
  } catch (error) {
  const err = error as AxiosError<ApiErrorPayload>;
  const message = err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || err.message || "Failed to fetch student details";
    throw new Error(message);
  }
};

// PATCH: update allowed fields
export interface UpdateStudentPayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  is_active?: boolean;
}

export const patchManageStudent = async (
  clientId: number,
  studentId: number,
  payload: UpdateStudentPayload
): Promise<StudentDetail> => {
  try {
    const res = await axiosInstance.patch(
      `/admin-dashboard/api/clients/${clientId}/manage-student/${studentId}/`,
      payload
    );
    return res.data;
  } catch (error) {
  const err = error as AxiosError<ApiErrorPayload>;
  const message = err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || err.message || "Failed to update student";
    throw new Error(message);
  }
};

// DELETE: deactivate student
export const deactivateManageStudent = async (
  clientId: number,
  studentId: number
): Promise<void> => {
  try {
    await axiosInstance.delete(
      `/admin-dashboard/api/clients/${clientId}/manage-student/${studentId}/`
    );
  } catch (error) {
  const err = error as AxiosError<ApiErrorPayload>;
  const message = err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || err.message || "Failed to deactivate student";
    throw new Error(message);
  }
};

// POST actions
export type StudentAction =
  | { action: "activate" }
  | { action: "enroll_course"; course_id: number }
  | { action: "unenroll_course"; course_id: number }
  | { action: "reset_progress"; course_id?: number };

export const postManageStudentAction = async (
  clientId: number,
  studentId: number,
  payload: StudentAction
): Promise<{ status: string } | unknown> => {
  try {
    const res = await axiosInstance.post(
      `/admin-dashboard/api/clients/${clientId}/manage-student/${studentId}/`,
      payload
    );
    return res.data;
  } catch (error) {
  const err = error as AxiosError<ApiErrorPayload>;
  const message = err.response?.data?.error || err.response?.data?.message || err.response?.data?.detail || err.message || "Failed to perform student action";
    throw new Error(message);
  }
};
