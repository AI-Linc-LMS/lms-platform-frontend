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

/** Friendly recurrence rule sent to the backend (0=Sunday..6=Saturday for weekdays). */
export interface LiveSessionRecurrence {
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  weekly_days?: number[];
  monthly_day?: number;
  monthly_week?: number;
  monthly_week_day?: number;
  end: { type: "count"; count: number } | { type: "date"; date: string };
}

/** One dated instance of a recurring series (from the backend). */
export interface LiveClassOccurrence {
  id: number;
  zoom_occurrence_id: string;
  occurrence_datetime: string;
  duration_minutes: number;
  status: "scheduled" | "started" | "ended" | "cancelled";
  meeting_status: "scheduled" | "live" | "ended" | "expired" | "cancelled";
  zoom_recording_url?: string | null;
  zoom_recording_duration_seconds?: number | null;
  has_recording: boolean;
  zoom_ai_summary?: string | null;
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
  is_google_meet?: boolean;
  zoom_meeting_type?: "meeting" | "webinar" | null;
  closes_at?: string | null;
  // Google Meet (created via the Google Calendar API)
  google_source?: "platform" | "manual" | null;
  google_event_id?: string | null;
  google_html_link?: string | null;
  google_status?: "scheduled" | "cancelled" | null;
  google_cancelled_at?: string | null;
  google_meet_created_at?: string | null;
  // Admit-control + instructor co-host (Phase 2)
  google_admit_control_enabled?: boolean;
  google_access_type?: string | null;
  instructor_email?: string | null;
  google_instructor_cohost_state?: "none" | "manual_pending" | "invitee_can_admit" | "done" | null;
  zoom_source?: "platform" | "imported" | null;
  is_unassigned?: boolean;
  zoom_host_id?: string | null;
  zoom_status?: "scheduled" | "cancelled" | null;
  zoom_cancelled_at?: string | null;
  zoom_registration_url?: string | null;
  zoom_registration_required?: boolean;
  zoom_is_recurring?: boolean;
  zoom_recurrence?: LiveSessionRecurrence | null;
  recurrence_summary?: string | null;
  occurrences?: LiveClassOccurrence[];
  zoom_meeting_id?: string | null;
  zoom_meeting_uuid?: string | null;
  zoom_start_url?: string | null;
  zoom_join_url?: string | null;
  zoom_password?: string | null;
  zoom_recording_url?: string | null;
  zoom_recording_file_id?: string | null;
  zoom_recording_duration_seconds?: number | null;
  zoom_meeting_ended_at?: string | null;
  meeting_status?: "scheduled" | "live" | "ended" | "expired" | null;
  time_remaining_minutes?: number;
  zoom_participants?: ZoomParticipant[];
  course?: number | null;
  course_detail?: CourseDetail | null;
  attendance_count?: number;
  zoom_attendance_synced_at?: string | null;
  zoom_transcript_synced_at?: string | null;
  zoom_ai_summary?: string | null;
  zoom_ai_summary_generated_at?: string | null;
  my_attendance?: { attended: boolean; duration_seconds: number } | null;
}

export interface RosterStudent {
  user_profile_id: number;
  name: string;
  email: string;
  attended: boolean;
  duration_seconds: number;
  join_time: string | null;
  leave_time: string | null;
}

export interface UnmatchedParticipant {
  name: string;
  email: string;
  duration_seconds: number;
  join_time: string | null;
  leave_time: string | null;
}

export interface LiveSessionRosterResponse {
  course_tagged: boolean;
  enrolled_count: number;
  joined_count: number;
  missed_count: number;
  synced_at: string | null;
  sync_available: boolean;
  reliability_note: string;
  students: RosterStudent[];
  unmatched_participants: UnmatchedParticipant[];
}

export interface LiveSessionTranscriptResponse {
  transcript_text: string;
  transcript_url: string;
  transcript_synced_at: string | null;
  summary: string;
  summary_generated_at: string | null;
}

export interface ZoomCreateSuccessData {
  zoom_meeting_id?: string;
  zoom_meeting_uuid?: string;
  zoom_join_url?: string;
  zoom_start_url?: string;
}

/** Google Meet create/cancel envelope data (google/create, google/cancel). */
export interface GoogleMeetSuccessData {
  google_event_id?: string;
  join_link?: string;
  google_html_link?: string;
  google_status?: "scheduled" | "cancelled";
  google_admit_control_enabled?: boolean;
  google_access_type?: string;
  instructor_email?: string;
  google_instructor_cohost_state?: "none" | "manual_pending" | "invitee_can_admit" | "done";
  /** Set when admit-control was requested but couldn't be applied (personal Gmail / missing scope). */
  warning?: string;
}

/** Optional flags when creating a Google Meet. */
export interface CreateGoogleMeetOptions {
  /** Also add enrolled students as native Google Calendar attendees (Google sends invites). */
  invite_attendees?: boolean;
  /** Require a host to admit participants (RESTRICTED). Workspace hosts only; degrades with a warning. */
  require_admit?: boolean;
  /** Instructor to invite + make a co-host (they finish a one-time "Add co-hosts" in Calendar). */
  instructor_email?: string;
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

export type GoogleParticipantIdentity = "signed_in" | "anonymous" | "phone";

export interface GoogleMeetParticipant {
  id: number;
  display_name: string;
  identity_type: GoogleParticipantIdentity;
  earliest_start_time: string | null;
  latest_end_time: string | null;
  duration_seconds: number | null;
  user_profile: number | null;
  // Meet exposes no email, so this is a best-effort NAME match only; null for guests/dial-ins.
  matched_student: { id: number; email: string; name: string } | null;
}

export interface GoogleParticipantsResponse {
  provider: "google";
  count: number;
  participants: GoogleMeetParticipant[];
  synced_at: string | null;
  // pending = ended, still polling the roster; synced = have it; unavailable = no record (never held).
  sync_state: "pending" | "synced" | "unavailable";
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

/** Native Zoom meeting template (GET zoom/templates/). */
export interface MeetingTemplate {
  id: string;
  name: string;
  type?: number;
}

/** Platform-side reusable meeting-setting preset (zoom/presets/ CRUD). */
export interface MeetingPreset {
  id: number;
  name: string;
  settings: Record<string, unknown>;
  template_id: string;
  is_default: boolean;
  created_at?: string;
}

export interface MeetingPresetInput {
  name: string;
  settings?: Record<string, unknown>;
  template_id?: string;
  is_default?: boolean;
}

/** Account-level virtual background file (zoom/virtual-backgrounds/). */
export interface VirtualBackground {
  id: string;
  name?: string;
  type?: string;
  is_default?: boolean;
}

/** Optional preset/template + webinar core fields to apply when creating the Zoom meeting/webinar. */
export interface CreateZoomOptions {
  preset_id?: number;
  template_id?: string;
  passcode?: string;
  registration_required?: boolean;
  recurrence?: LiveSessionRecurrence;
}

/** Native Zoom webinar template (GET zoom/webinar-templates/). */
export interface WebinarTemplate {
  id: string;
  name: string;
}

/** Webinar settings read back from Zoom (Email/Branding tabs). */
export interface WebinarDetail {
  id?: number | string;
  topic?: string;
  start_time?: string | null;
  duration?: number;
  timezone?: string;
  passcode?: string | null;
  registration_url?: string | null;
  approval_type?: number | null;
  auto_recording?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  registrants_confirmation_email?: boolean | null;
  registrants_email_notification?: boolean | null;
  attendees_and_panelists_reminder_email?: unknown;
  alternative_hosts?: string | null;
  q_and_a?: unknown;
  recurrence?: unknown;
}

export interface Panelist {
  id?: string;
  name?: string;
  email: string;
  join_url?: string;
}

export interface Registrant {
  id?: string;
  registrant_id?: string;
  email: string;
  first_name?: string;
  last_name?: string;
  status?: string;
  join_url?: string;
  create_time?: string;
}

export interface WebinarInvitation {
  registration_url: string;
  join_url: string;
  passcode: string;
  topic: string;
  start_time: string;
  invitation_text: string;
}

export interface WebinarEditInput {
  topic?: string;
  start_time?: string;
  duration?: number;
  timezone?: string;
  passcode?: string;
  approval_type?: number;
  alternative_hosts?: string;
  contact_name?: string;
  contact_email?: string;
  registrants_confirmation_email?: boolean;
  registrants_email_notification?: boolean;
}

/** Payload to assign an imported (unassigned) meeting to a course/instructor. */
export interface AssignMeetingInput {
  course_id?: number | null;
  instructor?: string;
  topic_name?: string;
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

  deleteLiveActivity: async (
    liveClassId: number
  ): Promise<ZoomApiResponse<{ deleted_id: number; warnings: string[] }>> => {
    const response = await apiClient.delete<
      ZoomApiResponse<{ deleted_id: number; warnings: string[] }>
    >(`${BASE}/live-activities/${liveClassId}/`);
    return response.data;
  },

  createZoom: async (
    liveClassId: number,
    options?: CreateZoomOptions
  ): Promise<ZoomApiResponse<ZoomCreateSuccessData>> => {
    const response = await apiClient.post<ZoomApiResponse<ZoomCreateSuccessData>>(
      `${BASE}/live-activities/${liveClassId}/zoom/create/`,
      options ?? {}
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

  /** Create a Google Meet for the session via the Google Calendar API (idempotent). */
  createGoogleMeet: async (
    liveClassId: number,
    options?: CreateGoogleMeetOptions
  ): Promise<ZoomApiResponse<GoogleMeetSuccessData>> => {
    const response = await apiClient.post<ZoomApiResponse<GoogleMeetSuccessData>>(
      `${BASE}/live-activities/${liveClassId}/google/create/`,
      options ?? {}
    );
    return response.data;
  },

  /** Push topic/time/duration changes to the backing Google Calendar event. */
  updateGoogleMeet: async (
    liveClassId: number
  ): Promise<ZoomApiResponse<GoogleMeetSuccessData>> => {
    const response = await apiClient.post<ZoomApiResponse<GoogleMeetSuccessData>>(
      `${BASE}/live-activities/${liveClassId}/google/update/`
    );
    return response.data;
  },

  /** Cancel (delete) the Google Calendar event backing this session. */
  cancelGoogleMeet: async (
    liveClassId: number
  ): Promise<ZoomApiResponse<GoogleMeetSuccessData>> => {
    const response = await apiClient.post<ZoomApiResponse<GoogleMeetSuccessData>>(
      `${BASE}/live-activities/${liveClassId}/google/cancel/`
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

  // Google Meet attendance roster — synced automatically post-meeting (no manual sync button;
  // Google has no sync-on-demand, the backend poller fills it in).
  getGoogleParticipants: async (
    liveClassId: number
  ): Promise<GoogleParticipantsResponse> => {
    const response = await apiClient.get<GoogleParticipantsResponse>(
      `${BASE}/live-activities/${liveClassId}/google/participants/`
    );
    return response.data;
  },

  getRoster: async (
    liveClassId: number
  ): Promise<LiveSessionRosterResponse> => {
    const response = await apiClient.get<LiveSessionRosterResponse>(
      `${BASE}/live-activities/${liveClassId}/zoom/roster/`
    );
    return response.data;
  },

  getTranscript: async (
    liveClassId: number
  ): Promise<LiveSessionTranscriptResponse> => {
    const response = await apiClient.get<LiveSessionTranscriptResponse>(
      `${BASE}/live-activities/${liveClassId}/transcript/`
    );
    return response.data;
  },

  // ── Native Zoom meeting templates ──────────────────────────────────────────
  getMeetingTemplates: async (): Promise<MeetingTemplate[]> => {
    const response = await apiClient.get<
      ZoomApiResponse<{ templates: MeetingTemplate[] }>
    >(`${BASE}/zoom/templates/`);
    return response.data.data?.templates ?? [];
  },

  // ── Platform-side meeting presets ──────────────────────────────────────────
  listPresets: async (): Promise<MeetingPreset[]> => {
    const response = await apiClient.get<
      ZoomApiResponse<{ presets: MeetingPreset[] }>
    >(`${BASE}/zoom/presets/`);
    return response.data.data?.presets ?? [];
  },

  createPreset: async (input: MeetingPresetInput): Promise<MeetingPreset> => {
    const response = await apiClient.post<ZoomApiResponse<MeetingPreset>>(
      `${BASE}/zoom/presets/`,
      input
    );
    return response.data.data as MeetingPreset;
  },

  updatePreset: async (
    presetId: number,
    input: Partial<MeetingPresetInput>
  ): Promise<MeetingPreset> => {
    const response = await apiClient.put<ZoomApiResponse<MeetingPreset>>(
      `${BASE}/zoom/presets/${presetId}/`,
      input
    );
    return response.data.data as MeetingPreset;
  },

  deletePreset: async (presetId: number): Promise<void> => {
    await apiClient.delete(`${BASE}/zoom/presets/${presetId}/`);
  },

  // ── Account-level virtual backgrounds (applies account-wide) ───────────────
  listVirtualBackgrounds: async (): Promise<{
    virtual_backgrounds: VirtualBackground[];
    note: string;
  }> => {
    const response = await apiClient.get<
      ZoomApiResponse<{ virtual_backgrounds: VirtualBackground[]; note: string }>
    >(`${BASE}/zoom/virtual-backgrounds/`);
    return (
      response.data.data ?? { virtual_backgrounds: [], note: "" }
    );
  },

  uploadVirtualBackground: async (
    file: File
  ): Promise<ZoomApiResponse<{ file: VirtualBackground; note: string }>> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<
      ZoomApiResponse<{ file: VirtualBackground; note: string }>
    >(`${BASE}/zoom/virtual-backgrounds/`, formData);
    return response.data;
  },

  deleteVirtualBackground: async (
    fileIds: string | string[]
  ): Promise<void> => {
    const ids = Array.isArray(fileIds) ? fileIds.join(",") : fileIds;
    await apiClient.delete(`${BASE}/zoom/virtual-backgrounds/`, {
      params: { file_ids: ids },
    });
  },

  // ── Inbound sync: imported (unassigned) meetings inbox + assign ────────────
  getUnassigned: async (): Promise<LiveActivity[]> => {
    const response = await apiClient.get<LiveActivity[]>(
      `${BASE}/live-activities/unassigned/`
    );
    return response.data;
  },

  assignMeeting: async (
    liveClassId: number,
    input: AssignMeetingInput
  ): Promise<ZoomApiResponse<LiveActivity>> => {
    const response = await apiClient.post<ZoomApiResponse<LiveActivity>>(
      `${BASE}/live-activities/${liveClassId}/assign/`,
      input
    );
    return response.data;
  },

  // ── Webinar management ─────────────────────────────────────────────────────
  getWebinarTemplates: async (): Promise<WebinarTemplate[]> => {
    const response = await apiClient.get<ZoomApiResponse<{ templates: WebinarTemplate[] }>>(
      `${BASE}/zoom/webinar-templates/`
    );
    return response.data.data?.templates ?? [];
  },

  getWebinarDetail: async (liveClassId: number): Promise<WebinarDetail> => {
    const response = await apiClient.get<ZoomApiResponse<WebinarDetail>>(
      `${BASE}/live-activities/${liveClassId}/webinar/`
    );
    return (response.data.data ?? {}) as WebinarDetail;
  },

  editWebinar: async (
    liveClassId: number,
    input: WebinarEditInput
  ): Promise<ZoomApiResponse<LiveActivity>> => {
    const response = await apiClient.patch<ZoomApiResponse<LiveActivity>>(
      `${BASE}/live-activities/${liveClassId}/webinar/edit/`,
      input
    );
    return response.data;
  },

  deleteWebinar: async (
    liveClassId: number
  ): Promise<ZoomApiResponse<LiveActivity>> => {
    const response = await apiClient.delete<ZoomApiResponse<LiveActivity>>(
      `${BASE}/live-activities/${liveClassId}/webinar/`
    );
    return response.data;
  },

  getPanelists: async (liveClassId: number): Promise<Panelist[]> => {
    const response = await apiClient.get<ZoomApiResponse<{ panelists: Panelist[] }>>(
      `${BASE}/live-activities/${liveClassId}/webinar/panelists/`
    );
    return response.data.data?.panelists ?? [];
  },

  addPanelists: async (
    liveClassId: number,
    panelists: Array<{ name?: string; email: string }>
  ): Promise<ZoomApiResponse<{ panelists: Panelist[] }>> => {
    const response = await apiClient.post<ZoomApiResponse<{ panelists: Panelist[] }>>(
      `${BASE}/live-activities/${liveClassId}/webinar/panelists/`,
      { panelists }
    );
    return response.data;
  },

  deletePanelist: async (liveClassId: number, panelistId: string): Promise<void> => {
    await apiClient.delete(`${BASE}/live-activities/${liveClassId}/webinar/panelists/`, {
      params: { panelist_id: panelistId },
    });
  },

  getRegistrants: async (
    liveClassId: number,
    status: string = "approved"
  ): Promise<Registrant[]> => {
    const response = await apiClient.get<ZoomApiResponse<{ registrants: Registrant[] }>>(
      `${BASE}/live-activities/${liveClassId}/webinar/registrants/`,
      { params: { status } }
    );
    return response.data.data?.registrants ?? [];
  },

  addRegistrants: async (
    liveClassId: number,
    registrants: Array<{ name?: string; email: string; first_name?: string; last_name?: string }>
  ): Promise<ZoomApiResponse<{ added: unknown[]; failed: Array<{ email: string; reason: string }> }>> => {
    const response = await apiClient.post<
      ZoomApiResponse<{ added: unknown[]; failed: Array<{ email: string; reason: string }> }>
    >(`${BASE}/live-activities/${liveClassId}/webinar/registrants/`, { registrants });
    return response.data;
  },

  getWebinarInvitation: async (liveClassId: number): Promise<WebinarInvitation> => {
    const response = await apiClient.get<ZoomApiResponse<WebinarInvitation>>(
      `${BASE}/live-activities/${liveClassId}/webinar/invitation/`
    );
    return (response.data.data ?? {
      registration_url: "", join_url: "", passcode: "", topic: "", start_time: "", invitation_text: "",
    }) as WebinarInvitation;
  },
};
