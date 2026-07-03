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
  StudentLiveSessionTranscript,
} from "./types";

const BASE = `/live-class/api/clients/${config.clientId}`;

/** Backend list item shape (same as admin live-activities). */
interface LiveActivityListItem {
  id: number;
  topic_name?: string;
  class_datetime?: string;
  duration_minutes?: number;
  is_zoom?: boolean;
  is_google_meet?: boolean;
  zoom_meeting_type?: "meeting" | "webinar" | null;
  join_link?: string | null;
  zoom_join_url?: string | null;
  zoom_password?: string | null;
  zoom_recording_url?: string | null;
  zoom_meeting_ended_at?: string | null;
  meeting_status?: "scheduled" | "live" | "ended" | "expired" | null;
  time_remaining_minutes?: number;
  my_attendance?: { attended: boolean; duration_seconds: number } | null;
  zoom_ai_summary?: string | null;
  zoom_transcript_synced_at?: string | null;
  [key: string]: unknown;
}

function toStudentSession(item: LiveActivityListItem): StudentLiveSession {
  return {
    id: item.id,
    topic_name: item.topic_name,
    class_datetime: item.class_datetime,
    duration_minutes: item.duration_minutes,
    is_zoom: item.is_zoom,
    is_google_meet: item.is_google_meet,
    zoom_meeting_type: item.zoom_meeting_type ?? null,
    join_link: item.join_link,
    zoom_join_url: item.zoom_join_url,
    zoom_password: item.zoom_password,
    zoom_recording_url: item.zoom_recording_url,
    zoom_meeting_ended_at: item.zoom_meeting_ended_at,
    meeting_status: item.meeting_status,
    time_remaining_minutes: item.time_remaining_minutes ?? 0,
    my_attendance: item.my_attendance ?? null,
    zoom_ai_summary: item.zoom_ai_summary ?? null,
    zoom_transcript_synced_at: item.zoom_transcript_synced_at ?? null,
    google_status: (item.google_status as StudentLiveSession["google_status"]) ?? null,
    google_artifacts_status: (item.google_artifacts_status as string) ?? null,
    google_recording_url: (item.google_recording_url as string) ?? null,
    google_ai_summary: (item.google_ai_summary as string) ?? null,
    google_transcript_synced_at: (item.google_transcript_synced_at as string) ?? null,
    recording_link: (item.recording_link as string) ?? null,
    has_recording: Boolean(item.has_recording),
    course_detail: (item.course_detail as StudentLiveSession["course_detail"]) ?? null,
  };
}

function isIncludedLiveSession(item: LiveActivityListItem): boolean {
  // A cancelled Google session keeps its (dead) Meet link — hide it like cancelled Zoom ones.
  if (item.google_status === "cancelled") return false;
  if (item.is_zoom === true || Boolean(item.zoom_join_url?.trim())) {
    return true;
  }
  if (item.is_google_meet === true && Boolean(item.join_link?.trim())) {
    return true;
  }
  return false;
}

export const studentLiveSessionsService = {
  getSessions: async (): Promise<StudentLiveSession[]> => {
    const response = await apiClient.get<LiveActivityListItem[]>(
      `${BASE}/live-activities/`
    );
    const data = response.data;
    const list = Array.isArray(data) ? data : [];
    return list.filter(isIncludedLiveSession).map(toStudentSession);
  },

  getRecording: async (
    activityId: number
  ): Promise<LiveSessionRecordingResponse> => {
    const response = await apiClient.get<LiveSessionRecordingResponse>(
      `${BASE}/live-activities/${activityId}/recording/`
    );
    return response.data;
  },

  getTranscript: async (
    activityId: number
  ): Promise<StudentLiveSessionTranscript> => {
    const response = await apiClient.get<StudentLiveSessionTranscript>(
      `${BASE}/live-activities/${activityId}/transcript/`
    );
    return response.data;
  },
};
