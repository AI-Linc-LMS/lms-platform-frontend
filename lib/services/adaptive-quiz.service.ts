import apiClient from "./api";
import type {
  AdaptiveSessionDetail,
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

  /** Streams one narration section. The four sections — headline, per_question,
   *  misconceptions, remediation_path — can be fired in parallel from the
   *  results page. Each request returns cached output if available, otherwise
   *  fires its own AI call and persists the result.
   */
  async generateNarrationSection<T = unknown>(
    sessionId: string,
    section: "headline" | "per_question" | "misconceptions" | "remediation_path",
  ): Promise<T> {
    const { data } = await apiClient.post<{ section: string; value: T }>(
      `${BASE}/sessions/${sessionId}/narration/${section}/`,
      {},
    );
    return data.value;
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
