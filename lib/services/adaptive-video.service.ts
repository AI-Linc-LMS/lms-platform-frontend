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

/** Learner-safe check-in marker - never carries the correct_option. */
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
  /** Null for a pasted link — only catalog videos have a Vimeo record behind them. Use
   *  `play_url` to decide whether there is anything to play; this is metadata, not the source. */
  video: VimeoVideoWire | null;
  /** The one field the player can always read: a catalog embed URL, or the pasted link. */
  play_url?: string;
  /** `catalog` (has a transcript, so check-ins exist) · `external` (pasted) · `none`. */
  source?: "catalog" | "external" | "none";
  concept_map: ConceptMap;
  chapters: Chapter[];
  takeaways: string[];
  target_skills: string[];
  check_ins: CheckInMarker[];
  /** Has this learner been through this video? Decides whether rewatch mode is offered — NOT
   *  whether the video counts as done; use `my_completed` for that. */
  rewatch_available?: boolean;
  /** Has this learner completed this video, on any visit? The same record the topic page's tick
   *  reads, so the badge here and the tick there cannot disagree. */
  my_completed?: boolean;
  /** The check-ins this learner has already answered correctly, in any visit. They come back
   *  marked - but they ARE asked again in a questioning mode, and answering one again is practice
   *  that does not score. Use `VideoSession.answered_check_in_ids` for what this watch has spent. */
  my_passed_check_in_ids?: number[];
  /** The most of this video the learner has covered in any visit, 0-100. */
  my_best_completeness_pct?: number;
  transcript_segments: TranscriptSegment[];
}

/**
 * `rewatch` plays the video straight through with no in-video check-ins.
 *
 * Offered only once the learner has already finished this video (`rewatch_available`), and a
 * session watched in it never moves the score - the server enforces both, because a question-free
 * watch scores from coverage alone, which is worth MORE than answering badly.
 */
export type WatchMode = "normal" | "pause_60s" | "plain_english" | "rewatch";
/**
 * The re-explain modes a learner can choose.
 *
 * "formal" was RETIRED: it and "plain" were the two ends of one register axis, and a learner
 * presses this button because the precise technical register already failed them. The server
 * still ACCEPTS "formal" from a tab opened before the deploy and answers in "plain" — which is
 * why `ReExplainResult.style` is typed as the surviving set: the response reports the style
 * that actually answered, never the retired one that was asked for.
 */
export type ReExplainStyle = "analogy" | "code" | "plain";

export interface VideoSession {
  id: string;
  status: "active" | "completed" | "abandoned";
  watch_mode: WatchMode;
  current_timestamp: number;
  completeness_pct: number;
  max_speed: number;
  comprehension_state: Record<string, number>;
  comprehension_score: number;
  /** The check-ins answered in THIS watch, right or wrong. The player's "already asked" set: a
   *  reload mid-watch is not asked the same question twice, and a NEW watch is asked them all
   *  again however many the learner has passed before. */
  answered_check_in_ids?: number[];
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
  /** This check-in had already been passed, so the answer is practice: recorded and explained,
   *  but never scored a second time. */
  practice?: boolean;
}

/**
 * A re-explanation, plus which slice of the video it was actually built from.
 *
 * `clip_start`/`clip_end` are the window the answer USED, which is not always the 30
 * seconds the student asked about: when those 30 seconds turn out to be throat-clearing
 * the server widens to the surrounding chapter rather than letting the model invent
 * something, and `context_note` is the sentence saying so. `requested_*` keeps the
 * moment the student actually pressed at. Render `context_note` whenever it is non-empty
 * - a silently widened answer is the bug this field exists to prevent.
 */
export interface ReExplainResult {
  content: string;
  style: ReExplainStyle;
  clip_start: number;
  clip_end: number;
  requested_start: number;
  requested_end: number;
  /** "clip" | "chapter" | "wide" | "video" - which rung of the widening ladder was used. */
  source: string;
  /** Learner-facing note about a deliberate widening. "" when the exact clip was enough. */
  context_note: string;
  /** Programming language the Code mode was told to answer in ("" for the prose modes). */
  language: string;
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
   *  transcript. Cached server-side and shared across learners - first viewer pays the generation. */
  async generateDescription(configId: number): Promise<string> {
    const { data } = await apiClient.post<{ description: string }>(
      `${BASE}/configs/${configId}/description/`,
      {},
    );
    return data.description;
  },

  /**
   * Open (or resume) a watch session.
   *
   * Omit `watchMode` and the SERVER picks: rewatch for a video this learner has already finished,
   * normal otherwise. That choice has to be made server-side, because it decides whether the
   * check-in questions are in the payload at all - a client that started "normal" and switched
   * afterwards would already be holding them.
   */
  async startSession(configId: number, watchMode?: WatchMode): Promise<StartSessionResult> {
    const { data } = await apiClient.post<StartSessionResult>(`${BASE}/sessions/start/`, {
      config_id: configId,
      // Absent, not "normal": the server cannot tell an omitted field from a chosen default.
      ...(watchMode ? { watch_mode: watchMode } : {}),
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
