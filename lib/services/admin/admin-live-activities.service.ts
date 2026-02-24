import apiClient from "../api";
import { config } from "../../config";

/** All Live Class and Zoom admin APIs are under the live-class app (not /activity/). */
const BASE = `/live-class/api/clients/${config.clientId}`;

export interface ZoomParticipant {
  id?: number;
  name: string;
  user_email?: string | null;
  email?: string | null;
  join_time?: string | null;
  leave_time?: string | null;
  duration?: number | null;
}

export interface CourseDetail {
  id: number;
  title: string;
  slug: string;
}

export interface LiveActivity {
  id: number;
  client?: number;
  topic_name: string;
  description?: string | null;
  join_link?: string | null;
  recording_link?: string | null;
  class_datetime: string;
  duration_minutes: number;
  instructor?: unknown;
  is_zoom: boolean;
  zoom_meeting_id?: string | null;
  zoom_meeting_uuid?: string | null;
  zoom_start_url?: string | null;
  zoom_join_url?: string | null;
  zoom_password?: string | null;
  zoom_recording_url?: string | null;
  zoom_recording_file_id?: string | null;
  zoom_recording_duration_seconds?: number | null;
  zoom_meeting_ended_at?: string | null;
  meeting_status?: "live" | "ended" | "expired" | null;
  zoom_participants?: ZoomParticipant[];
  course?: number | null;
  course_detail?: CourseDetail | null;
  attendance_count?: number;
  zoom_attendance_synced_at?: string | null;
}

export interface ZoomCreateSuccessData {
  zoom_meeting_id?: string;
  zoom_meeting_uuid?: string;
  zoom_join_url?: string;
  zoom_start_url?: string;
}

export interface ZoomStatusResponse {
  meeting_status?: string;
  zoom_meeting_ended_at?: string | null;
}

export interface ZoomApiResponse<T = unknown> {
  status: "success" | "error";
  message: string;
  data: T | null;
}

export interface SyncRecordingData {
  zoom_recording_url?: string;
  zoom_recording_file_id?: string;
}

export interface ZoomAttendanceParticipant {
  id: number;
  email: string;
  name: string;
  join_time: string | null;
  leave_time: string | null;
  duration_seconds: number;
  zoom_participant_id: string;
  user_profile: number | null;
  user_profile_detail: { id: number; email: string; role: string } | null;
}

export interface ZoomAttendanceResponse {
  count: number;
  participants: ZoomAttendanceParticipant[];
  synced_at: string | null;
  sync_available: boolean;
}

export interface SyncAttendanceData {
  synced: boolean;
  total_participants: number;
  new_records: number;
}

export interface SyncAttendanceResponse {
  status: "success" | "error";
  message: string;
  data: SyncAttendanceData | null;
}

export const adminLiveActivitiesService = {
  getLiveActivities: async (): Promise<LiveActivity[]> => {
    const response = await apiClient.get<LiveActivity[]>(
      `${BASE}/live-activities/`
    );
    return response.data;
  },

  getLiveActivity: async (
    liveClassId: number
  ): Promise<LiveActivity> => {
    const response = await apiClient.get<LiveActivity>(
      `${BASE}/live-activities/${liveClassId}/`
    );
    return response.data;
  },

  createZoom: async (
    liveClassId: number
  ): Promise<ZoomApiResponse<ZoomCreateSuccessData>> => {
    const response = await apiClient.post<ZoomApiResponse<ZoomCreateSuccessData>>(
      `${BASE}/live-activities/${liveClassId}/zoom/create/`
    );
    return response.data;
  },

  endMeeting: async (
    liveClassId: number
  ): Promise<ZoomApiResponse<unknown>> => {
    const response = await apiClient.post<ZoomApiResponse<unknown>>(
      `${BASE}/live-activities/${liveClassId}/zoom/end-meeting/`
    );
    return response.data;
  },

  syncRecording: async (
    liveClassId: number
  ): Promise<ZoomApiResponse<SyncRecordingData>> => {
    const response = await apiClient.post<
      ZoomApiResponse<SyncRecordingData>
    >(`${BASE}/live-activities/${liveClassId}/zoom/sync-recording/`);
    return response.data;
  },

  getZoomStatus: async (
    liveClassId: number
  ): Promise<ZoomStatusResponse> => {
    const response = await apiClient.get<ZoomStatusResponse>(
      `${BASE}/live-activities/${liveClassId}/zoom/status/`
    );
    return response.data;
  },

  getZoomAttendance: async (
    liveClassId: number
  ): Promise<ZoomAttendanceResponse> => {
    const response = await apiClient.get<ZoomAttendanceResponse>(
      `${BASE}/live-activities/${liveClassId}/zoom/attendance/`
    );
    return response.data;
  },

  syncAttendance: async (
    liveClassId: number
  ): Promise<SyncAttendanceResponse> => {
    const response = await apiClient.post<SyncAttendanceResponse>(
      `${BASE}/live-activities/${liveClassId}/zoom/sync-attendance/`
    );
    return response.data;
  },
};
