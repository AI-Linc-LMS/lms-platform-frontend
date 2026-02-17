/** Student live session item (GET student/live-sessions/). Zoom-only. */
export interface StudentLiveSession {
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
  name?: string;
  expires_at?: string;
  has_marked_attendance?: boolean;
}

export interface LiveSessionRecordingResponse {
  activity_name: string;
  recording_url: string;
  duration_seconds?: number;
}
