import apiClient from "./api";
import { config } from "../config";

export interface TrackTimePayload {
  time_spent_seconds: number;
  session_id: string;
  date: string;
  device_type: string;
  session_only: boolean;
}

export interface LiveAttendanceActivity {
  id: number;
  name: string;
  expires_at: string;
  time_remaining_minutes: number;
  has_marked_attendance: boolean;
}

export interface MarkAttendanceResponse {
  id: number;
  activity_id: number;
  marked_at: string;
  status: string;
}

export const activityService = {
  trackTime: async (payload: TrackTimePayload) => {
    const endpoint = `/activity/clients/${config.clientId}/track-time/`;
    const response = await apiClient.post(endpoint, payload);
    return response.data;
  },

  // Get live attendance activities for student
  getLiveAttendance: async (): Promise<LiveAttendanceActivity[]> => {
    const endpoint = `/activity/clients/${config.clientId}/student/live-attendance/`;
    const response = await apiClient.get<LiveAttendanceActivity[]>(endpoint);
    return response.data;
  },

  // Mark attendance for a specific activity
  markAttendance: async (
    activityId: number,
    code?: string
  ): Promise<MarkAttendanceResponse> => {
    const endpoint = `/activity/clients/${config.clientId}/student/mark-attendance/${activityId}/`;
    const response = await apiClient.post<MarkAttendanceResponse>(
      endpoint,
      code ? { code } : {}
    );
    return response.data;
  },
};





