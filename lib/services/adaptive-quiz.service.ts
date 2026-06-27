import apiClient from "./api";
import type {
  AdaptiveSessionDetail,
  RemediationProgress,
  RequizOutcome,
  StartSessionResponse,
  SubmitAnswerResponse,
} from "@/lib/types/adaptive-quiz";

const BASE = "/adaptive-quiz/api";

export interface AdaptiveAttemptSummary {
  session_id: string;
  config_id: number;
  quiz_title: string;
  status: "active" | "completed" | "abandoned";
  question_count: number;
  correct_count: number;
  accuracy: number;
  time_total_ms: number;
  started_at: string;
  completed_at: string | null;
  has_narration: boolean;
  is_personal: boolean;
}

export const adaptiveQuizService = {
  async listMyAttempts(): Promise<AdaptiveAttemptSummary[]> {
    const { data } = await apiClient.get<AdaptiveAttemptSummary[]>(`${BASE}/sessions/`);
    return data;
  },

  async startSession(configId: number): Promise<StartSessionResponse> {
    const { data } = await apiClient.post<StartSessionResponse>(
      `${BASE}/sessions/start/`,
      { config_id: configId },
    );
    return data;
  },

  async getSession(sessionId: string): Promise<AdaptiveSessionDetail> {
    const { data } = await apiClient.get<AdaptiveSessionDetail>(
      `${BASE}/sessions/${sessionId}/`,
    );
    return data;
  },

  async getRemediationProgress(sessionId: string): Promise<RemediationProgress> {
    const { data } = await apiClient.get<RemediationProgress>(
      `${BASE}/sessions/${sessionId}/remediation-progress/`,
    );
    return data;
  },

  async getRequizOutcome(sessionId: string): Promise<RequizOutcome> {
    const { data } = await apiClient.get<RequizOutcome>(
      `${BASE}/sessions/${sessionId}/requiz-outcome/`,
    );
    return data;
  },

  async submitAnswer(
    sessionId: string,
    payload: {
      mcq_id: number;
      selected_option: string;
      confidence?: number | null;
      time_ms?: number;
      hint_used?: boolean;
    },
  ): Promise<SubmitAnswerResponse> {
    const { data } = await apiClient.post<SubmitAnswerResponse>(
      `${BASE}/sessions/${sessionId}/answer/`,
      payload,
    );
    return data;
  },

  async abandonSession(sessionId: string): Promise<{ status: string }> {
    const { data } = await apiClient.post<{ status: string }>(
      `${BASE}/sessions/${sessionId}/abandon/`,
      {},
    );
    return data;
  },

  async requestHint(sessionId: string): Promise<{
    teaser: string;
    hint: string;
    hints_remaining: number;
  }> {
    const { data } = await apiClient.post<{
      teaser: string;
      hint: string;
      hints_remaining: number;
    }>(`${BASE}/sessions/${sessionId}/hint/`, {});
    return data;
  },

  async spawnRequiz(sessionId: string): Promise<{ session_id: string; config_id: number }> {
    const { data } = await apiClient.post(
      `${BASE}/sessions/${sessionId}/requiz/`,
      {},
    );
    return data;
  },

  /** Resolve one narration section. The backend generates it OFF the request thread (daemon
   *  worker) so HTTP workers never block on OpenAI: the POST kicks off (or returns cached) and
   *  we poll the GET until it's ready. Resolves with the section value, throws on failure/timeout
   *  so the caller's existing catch → retry path still works. The four sections are fired in
   *  parallel from the results page; cached sections resolve on the first POST. */
  async generateNarrationSection<T = unknown>(
    sessionId: string,
    section: "headline" | "per_question" | "misconceptions" | "remediation_path",
  ): Promise<T> {
    const url = `${BASE}/sessions/${sessionId}/narration/${section}/`;
    type SectionState = { section: string; status: "ready" | "generating" | "failed" | "pending"; value?: T };

    const kick = await apiClient.post<SectionState>(url, {});
    if (kick.data.status === "ready") return kick.data.value as T;
    if (kick.data.status === "failed") throw new Error(`narration section '${section}' failed`);

    // Poll until ready/failed. Each poll is a fast request (no server-side AI blocking).
    const deadline = Date.now() + 75000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 1500));
      const { data } = await apiClient.get<SectionState>(url);
      if (data.status === "ready") return data.value as T;
      if (data.status === "failed") throw new Error(`narration section '${section}' failed`);
    }
    throw new Error(`narration section '${section}' timed out`);
  },

  async listQuizzes(): Promise<Array<{
    config_id: number;
    quiz_title: string;
    target_skills: string[];
    min_questions: number;
    max_questions: number;
    mcq_count: number;
    hint_tokens: number;
    is_personal?: boolean;
    is_archived?: boolean;
    latest_session_id?: string | null;
    latest_session_status?: "active" | "completed" | "abandoned" | null;
    updated_at?: string;
  }>> {
    const { data } = await apiClient.get(`${BASE}/quizzes/`);
    return data;
  },
};
