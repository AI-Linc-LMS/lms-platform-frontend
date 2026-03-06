import apiClient from "./api";
import { config } from "../config";

export interface TrackTimePayload {
  time_spent_seconds: number;
  session_id: string;
  date: string;
  device_type: string;
  session_only: boolean;
}

/** Student live session item (GET student/live-sessions/). Prefer topic_name/class_datetime in UI. */
export interface LiveAttendanceActivity {
  id: number;
  topic_name?: string;
  class_datetime?: string;
  duration_minutes?: number;
  time_remaining_minutes: number;
  is_zoom?: boolean;
  zoom_join_url?: string | null;
  zoom_password?: string | null;
  zoom_meeting_ended_at?: string | null;
  zoom_recording_url?: string | null;
  meeting_status?: "live" | "ended" | "expired" | null;
  /** Backward compatibility if backend still sends */
  name?: string;
  expires_at?: string;
  has_marked_attendance?: boolean;
}

export interface AttendanceRecordingResponse {
  activity_name: string;
  recording_url: string;
  duration_seconds?: number;
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

  // Get live attendance activities for student (code-based attendance list)
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

  // Get recording for a live session (student). 404 if not available.
  getRecording: async (
    activityId: number
  ): Promise<AttendanceRecordingResponse> => {
    const endpoint = `/activity/clients/${config.clientId}/student/live-sessions/${activityId}/recording/`;
    const response = await apiClient.get<AttendanceRecordingResponse>(endpoint);
    return response.data;
  },
};





