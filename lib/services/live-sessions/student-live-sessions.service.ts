/**
 * Student live-sessions API. Uses the same list endpoint as admin so students
 * see the same live sessions. No separate student-only API.
 * List: GET /live-class/api/clients/{clientId}/live-activities/
 * Recording: fallback via getRecording (may 404); prefer zoom_recording_url from list.
 */
import apiClient from "../api";
import { config } from "../../config";
import type {
  StudentLiveSession,
  LiveSessionRecordingResponse,
} from "./types";

const BASE = `/live-class/api/clients/${config.clientId}`;

/** Backend list item shape (same as admin live-activities). */
interface LiveActivityListItem {
  id: number;
  topic_name?: string;
  class_datetime?: string;
  duration_minutes?: number;
  is_zoom?: boolean;
  zoom_join_url?: string | null;
  zoom_password?: string | null;
  zoom_recording_url?: string | null;
  zoom_meeting_ended_at?: string | null;
  meeting_status?: "live" | "ended" | "expired" | null;
  time_remaining_minutes?: number;
  [key: string]: unknown;
}

function toStudentSession(item: LiveActivityListItem): StudentLiveSession {
  return {
    id: item.id,
    topic_name: item.topic_name,
    class_datetime: item.class_datetime,
    duration_minutes: item.duration_minutes,
    is_zoom: item.is_zoom,
    zoom_join_url: item.zoom_join_url,
    zoom_password: item.zoom_password,
    zoom_recording_url: item.zoom_recording_url,
    zoom_meeting_ended_at: item.zoom_meeting_ended_at,
    meeting_status: item.meeting_status,
    time_remaining_minutes: item.time_remaining_minutes ?? 0,
  };
}

function isZoomSession(item: LiveActivityListItem): boolean {
  return item.is_zoom === true || Boolean(item.zoom_join_url?.trim());
}

export const studentLiveSessionsService = {
  getSessions: async (): Promise<StudentLiveSession[]> => {
    const response = await apiClient.get<LiveActivityListItem[]>(
      `${BASE}/live-activities/`
    );
    const data = response.data;
    const list = Array.isArray(data) ? data : [];
    return list.filter(isZoomSession).map(toStudentSession);
  },

  getRecording: async (
    activityId: number
  ): Promise<LiveSessionRecordingResponse> => {
    const response = await apiClient.get<LiveSessionRecordingResponse>(
      `${BASE}/live-activities/${activityId}/recording/`
    );
    return response.data;
  },
};
