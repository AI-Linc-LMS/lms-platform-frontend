import apiClient from "./api";

/**
 * AI Tutor API client.
 *
 * Note what is NOT here: anything that carries audio. The browser holds a WebRTC
 * connection straight to OpenAI, so this service only ever talks to Django about session
 * lifecycle, tool results and the record of what happened. See
 * `lib/hooks/useRealtimeTutor.ts` for the transport itself.
 */

const BASE = "/ai-tutor/api";

export type TutorLevel = "beginner" | "intermediate" | "advanced";

export type TutorSessionStatus =
  | "pending"
  | "live"
  | "completed"
  | "abandoned"
  | "failed";

export interface LessonPlanSection {
  title: string;
  detail: string;
}

export interface TutorSession {
  id: string;
  topic: string;
  level: TutorLevel;
  status: TutorSessionStatus;
  lesson_plan: LessonPlanSection[];
  plan_index: number;
  created_at: string;
  connected_at: string | null;
  ended_at: string | null;
  minutes: number;
  concepts_covered: string[];
  recap_status: string;
}

/** A quiz question as the learner sees it. Deliberately carries no answer key. */
export interface PooledQuestion {
  id: number;
  question: string;
  image: string;
  image_alt: string;
  options: { id: string; label: string }[];
  style: "single" | "multiple";
  difficulty: string;
  topic: string;
}

export interface StartSessionResponse {
  session: TutorSession;
  client_secret: string;
  realtime: { calls_url: string; model: string; voice: string };
  max_seconds: number;
  server_deadline_at: string;
  heartbeat_interval_seconds: number;
  usage_flush_interval_seconds: number;
  question_pool: PooledQuestion[];
  quota: TutorQuota;
}

export interface ReconnectResponse {
  client_secret: string;
  realtime: { calls_url: string; model: string; voice: string };
  max_seconds: number;
  server_deadline_at: string;
  heartbeat_interval_seconds: number;
  usage_flush_interval_seconds: number;
  reconnect_count: number;
  reconnects_left: number;
}

export interface TutorQuota {
  minutes_limit: number;
  minutes_used: number;
  minutes_remaining: number;
  max_session_minutes: number;
  coding_enabled: boolean;
  /**
   * True for staff, who bypass the minute reservation entirely so they can test the feature.
   * Their usage never moves, and rendering that as "30 of 30 min left" is indistinguishable
   * from a broken meter — which is exactly how it was first reported. Show "unlimited".
   */
  unmetered?: boolean;
  role?: string;
}

export interface TutorTopic {
  slug: string;
  title: string;
  track: string;
  blurb: string;
  icon: string;
  default_level: TutorLevel;
  suggested_minutes: number;
}

export interface TutorSuggestion {
  title: string;
  reason: string;
  source: "course" | "roadmap" | "weakness";
  level: TutorLevel;
}

export interface TutorNote {
  id: number;
  concept: string;
  summary: string;
  prompt: string;
  answer: string;
  topic: string;
  created_at: string;
}

export interface RecentSession {
  id: string;
  topic: string;
  level: TutorLevel;
  minutes: number;
  plan_total: number;
  plan_index: number;
  created_at: string;
  recap_status: string;
}

export interface TutorDashboard {
  quota: TutorQuota;
  recent_sessions: RecentSession[];
  suggestions: TutorSuggestion[];
  catalogue: TutorTopic[];
  notes: TutorNote[];
  stats: {
    minutes_tutored: number;
    sessions: number;
    questions_answered: number;
    notes_saved: number;
  };
}

export interface TutorRecap {
  session: TutorSession;
  recap: {
    summary?: string;
    concepts?: { name: string; status: string; note: string }[];
    next_topic?: { title: string; why: string };
  };
  recap_status: string;
  artifacts: { kind: string; payload: Record<string, unknown>; sequence: number }[];
  quiz: { question: PooledQuestion; selected: string[]; is_correct: boolean }[];
  transcript: { role: "tutor" | "student"; text: string; offset_ms: number }[];
}

export interface StartSessionInput {
  topic: string;
  level: TutorLevel;
  minutes: number;
  topic_slug?: string;
  topic_source?: string;
}

export interface TranscriptTurn {
  role: "tutor" | "student";
  text: string;
  sequence: number;
  offset_ms: number;
}

export interface CanvasArtifactPayload {
  kind: "slide" | "code" | "diagram" | "image" | "video" | "gif";
  payload: Record<string, unknown>;
  sequence: number;
}

export interface RunCodeResult {
  ok: boolean;
  /** Present when ok is false: empty | too_long | unsupported_language | unrunnable | sandbox_unavailable | disabled */
  reason?: string;
  /** Learner-facing explanation for a refusal. Safe to show verbatim. */
  detail?: string;
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  status?: string;
  time?: string | null;
}

export interface QuizGradeResult {
  ok: boolean;
  is_correct?: boolean;
  correct?: string[];
  selected?: string[];
  explanation?: string;
  reason?: string;
}

export const aiTutorService = {
  dashboard: async (): Promise<TutorDashboard> =>
    (await apiClient.get(`${BASE}/dashboard/`)).data,

  startSession: async (input: StartSessionInput): Promise<StartSessionResponse> =>
    (await apiClient.post(`${BASE}/sessions/`, input)).data,

  /**
   * Report the realtime call id read from the SDP response's `Location` header.
   *
   * This is what makes the server-side controls real. Without it an overrunning session
   * can only be marked dead in the database; with it the sweep can hang the call up at the
   * provider, which is the thing that actually stops the spend.
   */
  reportConnected: async (sessionId: string, callId: string) =>
    (await apiClient.post(`${BASE}/sessions/${sessionId}/connected/`, { call_id: callId }))
      .data,

  /**
   * Re-issue a credential after a dropped connection.
   *
   * A WebRTC call cannot be resumed, so this mints a fresh secret for the SAME session, with a
   * server-built primer that tells the model where the lesson had reached. Costs no extra
   * minutes (they were reserved at start) and does not extend the deadline. Capped server-side,
   * because every reconnect is a mint.
   */
  reconnect: async (sessionId: string): Promise<ReconnectResponse> =>
    (await apiClient.post(`${BASE}/sessions/${sessionId}/reconnect/`, {})).data,

  heartbeat: async (
    sessionId: string
  ): Promise<{ should_end: boolean; remaining_seconds: number }> =>
    (await apiClient.post(`${BASE}/sessions/${sessionId}/heartbeat/`, {})).data,

  pushEvents: async (
    sessionId: string,
    body: {
      turns?: TranscriptTurn[];
      artifacts?: CanvasArtifactPayload[];
      usage?: unknown[];
      plan_index?: number;
    }
  ) => (await apiClient.post(`${BASE}/sessions/${sessionId}/events/`, body)).data,

  endSession: async (sessionId: string, reason = "learner") =>
    (await apiClient.post(`${BASE}/sessions/${sessionId}/end/`, { reason })).data,

  recap: async (sessionId: string): Promise<TutorRecap> =>
    (await apiClient.get(`${BASE}/sessions/${sessionId}/recap/`)).data,

  // --- Tools the model triggers, resolved through Django ---

  findImage: async (sessionId: string, query: string, caption = "") =>
    (
      await apiClient.post(`${BASE}/sessions/${sessionId}/tools/image/`, {
        query,
        caption,
      })
    ).data,

  /** Grading happens server-side. The browser never held the answer key. */
  gradeQuiz: async (
    sessionId: string,
    questionId: number,
    selected: string[]
  ): Promise<QuizGradeResult> =>
    (
      await apiClient.post(`${BASE}/sessions/${sessionId}/tools/quiz-answer/`, {
        question_id: questionId,
        selected,
      })
    ).data,

  /**
   * Run the learner's code.
   *
   * AI Tutor's own endpoint, deliberately not adaptive-quiz's. The two features are gated
   * separately, so borrowing that route meant a tenant with the tutor and no adaptive
   * courses got a 403 on the first press of Run.
   *
   * Always resolves 200. A failed run is a fact about the code or the sandbox, not a
   * failed request, and both the learner and the tutor need to read it.
   */
  runCode: async (
    sessionId: string,
    payload: { source: string; language: string; stdin?: string }
  ): Promise<RunCodeResult> =>
    (await apiClient.post(`${BASE}/sessions/${sessionId}/tools/run/`, payload)).data,

  saveNote: async (
    sessionId: string,
    note: {
      concept: string;
      summary: string;
      flashcard_prompt?: string;
      flashcard_answer?: string;
    }
  ) => (await apiClient.post(`${BASE}/sessions/${sessionId}/tools/note/`, note)).data,
};

export const aiTutorKeys = {
  dashboard: ["ai-tutor", "dashboard"] as const,
  recap: (id: string) => ["ai-tutor", "recap", id] as const,
};
