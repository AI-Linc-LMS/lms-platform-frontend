import apiClient from "@/lib/services/api";

const BASE = "/adaptive-video/api";

// --- Wire types --------------------------------------------------------------

export interface VimeoVideoWire {
  id: number;
  vimeo_id: string;
  title: string;
  description: string;
  duration_seconds: number;
  thumbnail_url: string;
  tags: string[];
  has_text_track: boolean;
  embed_url: string;
  synced_at?: string;
}

export interface TranscriptSegment {
  start_seconds: number;
  end_seconds: number;
  text: string;
}

/** Learner-safe check-in marker — never carries the correct_option. */
export interface CheckInMarker {
  id: number;
  timestamp_seconds: number;
  concept: string;
  order: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

export interface ConceptNode {
  id: string;
  label: string;
  timestamp_seconds: number;
}
export interface ConceptEdge {
  from: string;
  to: string;
}
export interface ConceptMap {
  center?: string;
  nodes?: ConceptNode[];
  edges?: ConceptEdge[];
}

export interface Chapter {
  start_seconds: number;
  title: string;
}

export interface VideoCompanion {
  id: number;
  title: string;
  instructions: string;
  /** AI-generated learner-facing summary, derived from the transcript (cached server-side). */
  description: string;
  video: VimeoVideoWire | null;
  concept_map: ConceptMap;
  chapters: Chapter[];
  takeaways: string[];
  target_skills: string[];
  check_ins: CheckInMarker[];
  transcript_segments: TranscriptSegment[];
}

export type WatchMode = "normal" | "pause_60s" | "plain_english";
export type ReExplainStyle = "analogy" | "code" | "formal";

export interface VideoSession {
  id: string;
  status: "active" | "completed" | "abandoned";
  watch_mode: WatchMode;
  current_timestamp: number;
  completeness_pct: number;
  max_speed: number;
  comprehension_state: Record<string, number>;
  comprehension_score: number;
  started_at: string;
  completed_at: string | null;
}

export interface StartSessionResult {
  session_id: string;
  companion: VideoCompanion;
  session: VideoSession;
}

export interface CheckInResult {
  is_correct: boolean;
  correct_option: string;
  explanation: string;
  rewind_to_seconds: number | null;
}

export interface ReExplainResult {
  content: string;
  style: ReExplainStyle;
  clip_start: number;
  clip_end: number;
  cached: boolean;
}

export interface AskResult {
  question: string;
  answer: string;
  timestamp: number;
  others_asked: { timestamp: number; question: string; answer: string }[];
}

export interface SyncSignals {
  current_timestamp?: number;
  completeness_pct?: number;
  max_speed?: number;
  watch_mode?: WatchMode;
  rewinds?: { from: number; to: number; at?: string }[];
  pauses?: { at_seconds: number; duration_ms: number }[];
}

// --- Service -----------------------------------------------------------------

export const adaptiveVideoService = {
  async getCompanion(configId: number): Promise<VideoCompanion> {
    const { data } = await apiClient.get<VideoCompanion>(`${BASE}/configs/${configId}/`);
    return data;
  },

  /** Fetch (or generate-and-cache) the AI description for a companion, distilled from its
   *  transcript. Cached server-side and shared across learners — first viewer pays the generation. */
  async generateDescription(configId: number): Promise<string> {
    const { data } = await apiClient.post<{ description: string }>(
      `${BASE}/configs/${configId}/description/`,
      {},
    );
    return data.description;
  },

  async startSession(configId: number, watchMode: WatchMode = "normal"): Promise<StartSessionResult> {
    const { data } = await apiClient.post<StartSessionResult>(`${BASE}/sessions/start/`, {
      config_id: configId,
      watch_mode: watchMode,
    });
    return data;
  },

  async getSession(sessionId: string): Promise<VideoSession> {
    const { data } = await apiClient.get<VideoSession>(`${BASE}/sessions/${sessionId}/`);
    return data;
  },

  async sync(sessionId: string, signals: SyncSignals): Promise<VideoSession> {
    const { data } = await apiClient.post<VideoSession>(`${BASE}/sessions/${sessionId}/sync/`, signals);
    return data;
  },

  async answerCheckIn(
    sessionId: string,
    checkInId: number,
    selectedOption: string,
    timeMs = 0
  ): Promise<CheckInResult> {
    const { data } = await apiClient.post<CheckInResult>(`${BASE}/sessions/${sessionId}/checkin/`, {
      check_in_id: checkInId,
      selected_option: selectedOption,
      time_ms: timeMs,
    });
    return data;
  },

  async endSession(sessionId: string): Promise<VideoSession> {
    const { data } = await apiClient.post<VideoSession>(`${BASE}/sessions/${sessionId}/end/`, {});
    return data;
  },

  async reExplain(
    sessionId: string,
    clipStart: number,
    style: ReExplainStyle,
    clipEnd = 0
  ): Promise<ReExplainResult> {
    const { data } = await apiClient.post<ReExplainResult>(`${BASE}/sessions/${sessionId}/reexplain/`, {
      clip_start: clipStart,
      clip_end: clipEnd,
      style,
    });
    return data;
  },

  async ask(sessionId: string, question: string, timestampSeconds: number): Promise<AskResult> {
    const { data } = await apiClient.post<AskResult>(`${BASE}/sessions/${sessionId}/ask/`, {
      question,
      timestamp_seconds: timestampSeconds,
    });
    return data;
  },
};

// --- Admin / course-builder authoring ---------------------------------------

const ADMIN = `${BASE}/admin`;

export const adaptiveVideoAdminService = {
  async searchCatalog(q = "", transcribedOnly = false): Promise<{ results: VimeoVideoWire[] }> {
    const { data } = await apiClient.get<{ results: VimeoVideoWire[] }>(`${ADMIN}/catalog/`, {
      params: { q, transcribed_only: transcribedOnly ? 1 : undefined },
    });
    return data;
  },

  async getCompanion(configId: number): Promise<VideoCompanion> {
    const { data } = await apiClient.get<VideoCompanion>(`${ADMIN}/configs/${configId}/`);
    return data;
  },

  async toggleActive(configId: number): Promise<{ config_id: number; is_active: boolean }> {
    const { data } = await apiClient.post(`${ADMIN}/configs/${configId}/toggle-active/`, {});
    return data;
  },

  async swapVideo(configId: number, vimeoId: string): Promise<VideoCompanion> {
    const { data } = await apiClient.post<VideoCompanion>(`${ADMIN}/configs/${configId}/swap/`, {
      vimeo_id: vimeoId,
    });
    return data;
  },

  async regenerate(configId: number): Promise<VideoCompanion> {
    const { data } = await apiClient.post<VideoCompanion>(`${ADMIN}/configs/${configId}/regenerate/`, {});
    return data;
  },
};
