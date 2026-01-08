import apiClient from "../api";
import { config } from "../../config";

export interface AttendanceActivity {
  id: number;
  name: string;
  code: string;
  duration_minutes: number;
  is_active: boolean;
  is_valid: boolean;
  expires_at: string;
  attendees_count: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  topic_covered?: string | null;
  assignments_given?: string | null;
  hands_on_coding?: string | null;
  additional_comments?: string | null;
  attendees?: Attendee[];
}

export interface Attendee {
  id: number;
  user_name: string;
  user_email: string;
  marked_at: string;
}

export interface CreateAttendanceActivityData {
  name: string;
  duration_minutes: number;
}

export interface UpdateAttendanceActivityData {
  title?: string;
  topic_covered?: string;
  assignments_given?: string;
  hands_on_coding?: string;
  additional_comments?: string;
}

export const adminAttendanceService = {
  // List/Create attendance activities
  getAttendanceActivities: async (params?: {
    page?: number;
    limit?: number;
  }): Promise<AttendanceActivity[]> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const url = `/activity/clients/${config.clientId}/admin/attendance-activities/${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await apiClient.get<AttendanceActivity[]>(url);
    return response.data;
  },

  // Create attendance activity
  createAttendanceActivity: async (
    data: CreateAttendanceActivityData
  ): Promise<AttendanceActivity> => {
    const response = await apiClient.post<AttendanceActivity>(
      `/activity/clients/${config.clientId}/admin/attendance-activities/`,
      data
    );
    return response.data;
  },

  // Get attendance activity detail
  getAttendanceActivity: async (
    activityId: number
  ): Promise<AttendanceActivity> => {
    const response = await apiClient.get<AttendanceActivity>(
      `/activity/clients/${config.clientId}/admin/attendance-activities/${activityId}/`
    );
    return response.data;
  },

  // Update attendance activity
  updateAttendanceActivity: async (
    activityId: number,
    data: UpdateAttendanceActivityData
  ): Promise<AttendanceActivity> => {
    const response = await apiClient.put<AttendanceActivity>(
      `/activity/clients/${config.clientId}/admin/attendance-activities/${activityId}/update/`,
      data
    );
    return response.data;
  },

  // Delete attendance activity
  deleteAttendanceActivity: async (
    activityId: number
  ): Promise<void> => {
    await apiClient.delete(
      `/activity/clients/${config.clientId}/admin/attendance-activities/${activityId}/`
    );
  },
};

