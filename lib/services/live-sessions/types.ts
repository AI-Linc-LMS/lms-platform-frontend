/** Student live session item from live-activities list (Zoom and Google Meet). */
export interface StudentLiveSession {
  id: number;
  topic_name?: string;
  class_datetime?: string;
  /** IANA zone the session was scheduled in (authoritative for display; may be "" on legacy rows). */
  timezone?: string | null;
  duration_minutes?: number;
  time_remaining_minutes: number;
  is_zoom?: boolean;
  is_google_meet?: boolean;
  zoom_meeting_type?: "meeting" | "webinar" | null;
  join_link?: string | null;
  zoom_join_url?: string | null;
  zoom_password?: string | null;
  zoom_meeting_ended_at?: string | null;
  zoom_recording_url?: string | null;
  meeting_status?: "scheduled" | "live" | "ended" | "expired" | null;
  name?: string;
  expires_at?: string;
  has_marked_attendance?: boolean;
  /** The student's own Zoom attendance (from the live-activities serializer). */
  my_attendance?: { attended: boolean; duration_seconds: number } | null;
  zoom_ai_summary?: string | null;
  zoom_transcript_synced_at?: string | null;
  /**
   * Platform-authored cancellation / reschedule notice, posted by an admin or the assigned
   * instructor. Distinct from `google_status` / zoom status, which mirror what the PROVIDER did to
   * the meeting and carry no reason. `""`/null means the session is running normally.
   */
  /**
   * True when this tenant requires the trainer to actually open the meeting before students may
   * join. False means the old schedule-based behaviour — the backend deliberately fails open when
   * it cannot observe Zoom's started webhook, so `false` must be treated as "not gated", never as
   * "not started".
   */
  join_gated?: boolean;
  /** Whether the host has actually opened the meeting (from Zoom's started webhook). */
  host_started?: boolean;
  notice_type?: "" | "cancelled" | "rescheduled" | null;
  /** Why it was cancelled or moved — shown verbatim to the student. */
  notice_reason?: string | null;
  notice_at?: string | null;
  /** Start time before the most recent reschedule, so the banner can say "was X, now Y". */
  previous_class_datetime?: string | null;
  /** Google Meet lifecycle + post-meeting artifacts (parity with the zoom_* fields). */
  google_status?: "scheduled" | "cancelled" | null;
  google_artifacts_status?: string | null;
  google_recording_url?: string | null;
  google_ai_summary?: string | null;
  google_transcript_synced_at?: string | null;
  /** Manually pasted recording link (provider-independent). */
  recording_link?: string | null;
  /** Provider-neutral flag from the serializer: something is watchable for this session. */
  has_recording?: boolean;
  course_detail?: { title?: string } | null;
  cohort_detail?: { name?: string } | null;
  adaptive_course_detail?: { title?: string } | null;
  /** Instructor as shown to a student: their public CODE (real name hidden server-side). */
  instructor?: string | null;
  attendance_count?: number;
  /** The student's own per-session 'Remind me' email opt-in. */
  reminder_enabled?: boolean;
  /** Recurring series: a one-line summary + the concrete occurrences (recurring = one card). */
  recurrence_summary?: string | null;
  zoom_is_recurring?: boolean;
  occurrences?: StudentLiveOccurrence[];
  /**
   * Set ONLY on client-side expansions of a recurring series into one entry per date. `id` stays
   * the parent series id so API calls keep working; this disambiguates the React key and tells
   * the UI which dated instance it is looking at.
   */
  occurrence_id?: number;
  /** AI-generated (Phase 2A): planned agenda + 'come prepared' checklist + the student's ticks. */
  agenda?: string[];
  prep_items?: string[];
  agenda_generated_at?: string | null;
  my_prep?: number[];
}

/** One dated instance of a recurring series (from the live-activities serializer). */
export interface StudentLiveOccurrence {
  id: number;
  occurrence_datetime?: string | null;
  duration_minutes?: number | null;
  status?: string | null;
  meeting_status?: "scheduled" | "live" | "ended" | "expired" | "cancelled" | null;
  has_recording?: boolean;
  zoom_recording_url?: string | null;
}

/** GET .../live-activities/<id>/live-count/ — how many are in the Zoom session right now. */
export interface LiveJoinedCount {
  live: boolean;
  /** Current participants from Zoom's dashboard; null when unavailable for this tenant. */
  count: number | null;
  source: "zoom" | "unavailable" | "not_live";
}

/** GET .../my-live-stats/ - the student's own live-attendance summary. */
export interface MyLiveStats {
  sessions_attended: number;
  sessions_held: number;
  attendance_rate: number;
  cohort_avg_rate: number;
  live_hours: number;
  recordings_left: number;
  week: { day: string; date: string; state: "none" | "attended" | "missed" | "live" | "upcoming" }[];
}

/** GET .../live-activities/<id>/recording/ - provider-neutral availability. */
export interface LiveSessionRecordingResponse {
  provider: "zoom" | "google" | "manual";
  has_recording: boolean;
  /** True when the in-app player can stream it via .../recording/playback|stream/. */
  playable_in_app: boolean;
  recording_link?: string;
  google_artifacts_status?: string;
  has_transcript?: boolean;
  has_summary?: boolean;
}

export interface StudentLiveSessionTranscript {
  transcript_text: string;
  transcript_url: string;
  transcript_synced_at: string | null;
  summary: string;
  summary_generated_at: string | null;
}
