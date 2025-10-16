import axiosInstance from "./axiosInstance";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ============================================
// Types
// ============================================

export interface AttendanceActivity {
  id: number;
  title: string;
  description?: string;
  code?: string; // Only available in admin APIs
  created_at: string;
  expires_at: string;
  is_active: boolean;
  course_id?: number;
  created_by?: number;
  attendee_count?: number;
}

export interface AttendanceRecord {
  id: number;
  attendance_activity_id: number;
  student_id: number;
  student_name: string;
  student_email?: string;
  marked_at: string;
  status: "present" | "absent";
}

export interface CreateAttendanceRequest {
  title: string;
  description?: string;
  course_id?: number;
}

export interface MarkAttendanceRequest {
  code: string;
}

export interface AttendanceActivityDetail extends AttendanceActivity {
  attendees: AttendanceRecord[];
}

// ============================================
// ADMIN APIs
// ============================================

/**
 * GET /clients/{client_id}/admin/attendance-activities/
 * List all attendance activities with codes (admin only)
 */
export const getAttendanceActivities = async (
  clientId: number
): Promise<AttendanceActivity[]> => {
  const response = await axiosInstance.get(
    `${API_BASE_URL}/clients/${clientId}/admin/attendance-activities/`
  );
  return response.data;
};

/**
 * POST /clients/{client_id}/admin/attendance-activities/
 * Create new attendance activity and get code (admin only)
 */
export const createAttendanceActivity = async (
  clientId: number,
  data: CreateAttendanceRequest
): Promise<AttendanceActivity> => {
  const response = await axiosInstance.post(
    `${API_BASE_URL}/clients/${clientId}/admin/attendance-activities/`,
    data
  );
  return response.data;
};

/**
 * GET /clients/{client_id}/admin/attendance-activities/{activity_id}/
 * View activity details with attendees list (admin only)
 */
export const getAttendanceActivityDetail = async (
  clientId: number,
  activityId: number
): Promise<AttendanceActivityDetail> => {
  const response = await axiosInstance.get(
    `${API_BASE_URL}/clients/${clientId}/admin/attendance-activities/${activityId}/`
  );
  return response.data;
};

// ============================================
// STUDENT APIs
// ============================================

/**
 * GET /clients/{client_id}/student/live-attendance/
 * View live attendance activities (NO codes shown to students)
 */
export const getLiveAttendanceActivities = async (
  clientId: number
): Promise<Omit<AttendanceActivity, "code">[]> => {
  const response = await axiosInstance.get(
    `${API_BASE_URL}/clients/${clientId}/student/live-attendance/`
  );
  return response.data;
};

/**
 * POST /clients/{client_id}/student/mark-attendance/{activity_id}/
 * Mark attendance by submitting code
 * Body: {"code": "XXXXXX"}
 */
export const markAttendance = async (
  clientId: number,
  activityId: number,
  data: MarkAttendanceRequest
): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.post(
    `${API_BASE_URL}/clients/${clientId}/student/mark-attendance/${activityId}/`,
    data
  );
  return response.data;
};
