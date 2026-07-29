/**
 * Student live-sessions API. Uses the same list endpoint as admin so students
 * see the same live sessions. No separate student-only API.
 * List: GET /live-class/api/clients/{clientId}/live-activities/
 * Recording: fallback via getRecording (may 404); prefer zoom_recording_url from list.
 */
import apiClient from "../api";
import { config } from "../../config";
import type {
  LiveJoinedCount,
  StudentLiveSession,
  LiveSessionRecordingResponse,
  StudentLiveSessionTranscript,
  MyLiveStats,
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
    join_gated: Boolean(item.join_gated),
    host_started: Boolean(item.host_started),
    notice_type: (item.notice_type as StudentLiveSession["notice_type"]) ?? null,
    notice_reason: (item.notice_reason as string) ?? null,
    notice_at: (item.notice_at as string) ?? null,
    previous_class_datetime: (item.previous_class_datetime as string) ?? null,
    google_status: (item.google_status as StudentLiveSession["google_status"]) ?? null,
    google_artifacts_status: (item.google_artifacts_status as string) ?? null,
    google_recording_url: (item.google_recording_url as string) ?? null,
    google_ai_summary: (item.google_ai_summary as string) ?? null,
    google_transcript_synced_at: (item.google_transcript_synced_at as string) ?? null,
    recording_link: (item.recording_link as string) ?? null,
    has_recording: Boolean(item.has_recording),
    course_detail: (item.course_detail as StudentLiveSession["course_detail"]) ?? null,
    cohort_detail: (item.cohort_detail as StudentLiveSession["cohort_detail"]) ?? null,
    adaptive_course_detail: (item.adaptive_course_detail as StudentLiveSession["adaptive_course_detail"]) ?? null,
    instructor: (item.instructor as string) ?? null,
    attendance_count: (item.attendance_count as number) ?? 0,
    reminder_enabled: Boolean(item.reminder_enabled),
    recurrence_summary: (item.recurrence_summary as string) ?? null,
    zoom_is_recurring: Boolean(item.zoom_is_recurring),
    occurrences: (item.occurrences as StudentLiveSession["occurrences"]) ?? [],
    agenda: (item.agenda as string[]) ?? [],
    prep_items: (item.prep_items as string[]) ?? [],
    agenda_generated_at: (item.agenda_generated_at as string) ?? null,
    my_prep: (item.my_prep as number[]) ?? [],
  };
}

function isIncludedLiveSession(item: LiveActivityListItem): boolean {
  // A cancelled Google session keeps its (dead) Meet link - hide it like cancelled Zoom ones.
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

  getMyStats: async (): Promise<MyLiveStats> => {
    const response = await apiClient.get<MyLiveStats>(`${BASE}/my-live-stats/`);
    return response.data;
  },

  /** Current live participant count from Zoom (while the session is live). `count` is null when
   *  Zoom's dashboard metrics aren't available for this tenant — caller falls back to attendance. */
  getLiveCount: async (activityId: number): Promise<LiveJoinedCount> => {
    const response = await apiClient.get<LiveJoinedCount>(
      `${BASE}/live-activities/${activityId}/live-count/`
    );
    return response.data;
  },

  toggleReminder: async (
    activityId: number,
    enabled: boolean
  ): Promise<{ reminder_enabled: boolean }> => {
    const response = await apiClient.post(
      `${BASE}/live-activities/${activityId}/remind-me/`,
      { enabled }
    );
    return response.data;
  },

  togglePrep: async (
    activityId: number,
    index: number,
    done: boolean
  ): Promise<{ completed: number[] }> => {
    const response = await apiClient.post(
      `${BASE}/live-activities/${activityId}/prep/`,
      { index, done }
    );
    return response.data;
  },

  // .ics endpoints require the JWT header, so fetch as a blob and download client-side
  // (a plain link/window.open wouldn't authenticate).
  getSessionIcs: async (activityId: number): Promise<Blob> => {
    const response = await apiClient.get(
      `${BASE}/live-activities/${activityId}/calendar.ics`,
      { responseType: "blob" }
    );
    return response.data as Blob;
  },

  getMyCalendarIcs: async (): Promise<Blob> => {
    const response = await apiClient.get(`${BASE}/my-live-calendar.ics`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },
};

// --- Post-session feedback (the student's own) ------------------------------------------------ //

export interface MyLiveSessionFeedback {
  id: number;
  overall_rating: number;
  content_rating: number | null;
  instructor_rating: number | null;
  pace_rating: number | null;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface LiveSessionFeedbackState {
  session_ended: boolean;
  can_submit: boolean;
  my_feedback: MyLiveSessionFeedback | null;
}

export interface SubmitFeedbackPayload {
  overall_rating: number;
  content_rating?: number | null;
  instructor_rating?: number | null;
  pace_rating?: number | null;
  comment?: string;
}

/** Whether the form should be open, plus this student's existing answer if they already replied. */
export async function getMyLiveSessionFeedback(
  liveClassId: number
): Promise<LiveSessionFeedbackState> {
  const { data } = await apiClient.get<LiveSessionFeedbackState>(
    `${BASE}/live-activities/${liveClassId}/feedback/`
  );
  return data;
}

/** Create or update — the backend upserts, so re-submitting edits rather than duplicating. */
export async function submitLiveSessionFeedback(
  liveClassId: number,
  payload: SubmitFeedbackPayload
): Promise<MyLiveSessionFeedback> {
  const { data } = await apiClient.post<MyLiveSessionFeedback>(
    `${BASE}/live-activities/${liveClassId}/feedback/`,
    payload
  );
  return data;
}
