import apiClient from "../api";
import { config } from "../../config";

export interface AttendanceActivity {
  id: number;
  name: string;
  code: string;
  duration_minutes: number;
  is_active: boolean;
  is_valid: boolean;
  meeting_status?: string | null;
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
  is_zoom?: boolean;
  zoom_meeting_id?: string | null;
  zoom_meeting_uuid?: string | null;
  zoom_start_url?: string | null;
  zoom_join_url?: string | null;
  zoom_password?: string | null;
  zoom_recording_url?: string | null;
  zoom_recording_duration_seconds?: number | null;
  zoom_participants?: ZoomParticipant[];
}

export interface Attendee {
  id: number;
  user_name: string;
  user_email: string;
  marked_at: string;
}

export interface ZoomParticipant {
  id?: number;
  name: string;
  user_email?: string | null;
  email?: string | null;
  join_time?: string | null;
  leave_time?: string | null;
  duration?: number | null;
}

export interface CreateAttendanceActivityData {
  name: string;
  duration_minutes: number;
  is_zoom?: boolean;
}

export interface UpdateAttendanceActivityData {
  title?: string;
  topic_covered?: string;
  assignments_given?: string;
  hands_on_coding?: string;
  additional_comments?: string;
}

export interface SyncRecordingResponse {
  status: string;
  message: string;
  data?: {
    zoom_recording_url?: string;
    zoom_recording_file_id?: string;
  } | null;
}

export interface SyncAttendanceResponse {
  status: string;
  message: string;
  data?: { synced_count: number; meeting_ended?: boolean } | null;
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

  // Sync Zoom recording for an activity (200 = synced, 202 = still processing)
  syncRecording: async (
    activityId: number
  ): Promise<SyncRecordingResponse> => {
    const response = await apiClient.post<SyncRecordingResponse>(
      `/activity/clients/${config.clientId}/admin/attendance-activities/${activityId}/sync-recording/`
    );
    return response.data;
  },

  // Sync Zoom attendance for an activity
  syncAttendance: async (
    activityId: number
  ): Promise<SyncAttendanceResponse> => {
    const response = await apiClient.post<SyncAttendanceResponse>(
      `/activity/clients/${config.clientId}/zoom/activities/${activityId}/sync-attendance/`
    );
    return response.data;
  },

  // End Zoom meeting for an activity
  endMeeting: async (
    activityId: number
  ): Promise<{ status: string; message: string }> => {
    const response = await apiClient.post<{ status: string; message: string }>(
      `/activity/clients/${config.clientId}/zoom/activities/${activityId}/end-meeting/`
    );
    return response.data;
  },
};

