import apiClient from "@/lib/services/api";

const BASE = "/adaptive-quiz/api/admin";

export interface AdminAdaptiveQuiz {
  config_id: number;
  title: string;
  target_skills: string[];
  mcq_count: number;
  min_questions: number;
  max_questions: number;
  se_threshold: number;
  hint_tokens: number;
  confidence_prompt_enabled: boolean;
  is_active: boolean;
  updated_at: string;
}

export interface AdminMcq {
  id?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation?: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  skills?: string;
  topic?: string;
}

export interface AdminAdaptiveQuizDetail extends AdminAdaptiveQuiz {
  instructions: string;
  mcqs: Array<Required<Pick<AdminMcq, "id">> & AdminMcq>;
}

export interface FinalizeAdaptiveQuizPayload {
  title: string;
  instructions?: string;
  target_skills: string[];
  min_questions: number;
  max_questions: number;
  se_threshold: number;
  hint_tokens: number;
  confidence_prompt_enabled: boolean;
  mcqs: AdminMcq[];
}

export const adminAdaptiveQuizService = {
  async list(): Promise<AdminAdaptiveQuiz[]> {
    const { data } = await apiClient.get<AdminAdaptiveQuiz[]>(`${BASE}/quizzes/`);
    return data;
  },

  async toggleActive(configId: number): Promise<{ config_id: number; is_active: boolean }> {
    const { data } = await apiClient.post(`${BASE}/quizzes/${configId}/toggle-active/`, {});
    return data;
  },

  async getDetail(configId: number): Promise<AdminAdaptiveQuizDetail> {
    const { data } = await apiClient.get<AdminAdaptiveQuizDetail>(`${BASE}/quizzes/${configId}/`);
    return data;
  },

  /** Remove a quiz from the admin + learner library. This is intentionally a
   *  soft-delete on the backend (sets ``is_deleted=true`` + ``is_active=false``)
   *  so every learner's past session and per-question response stay intact -
   *  the row just disappears from every list view from now on. */
  async deleteQuiz(configId: number): Promise<void> {
    await apiClient.delete(`${BASE}/quizzes/${configId}/`);
  },

  async finalize(payload: FinalizeAdaptiveQuizPayload): Promise<AdminAdaptiveQuiz> {
    const { data } = await apiClient.post<AdminAdaptiveQuiz>(`${BASE}/quizzes/`, payload);
    return data;
  },

  /** Generate MCQs for one (sub_skill × difficulty) cell. The wizard's Step 2
   *  fires up to 4 of these in parallel so MCQs paint into the bank as each
   *  cell completes - see CellTypewriter for the per-cell reveal animation. */
  async generateDraftCell(payload: {
    topic: string;
    sub_skill: string;
    difficulty: "Easy" | "Medium" | "Hard";
    count: number;
  }): Promise<{
    sub_skill: string;
    difficulty: "Easy" | "Medium" | "Hard";
    mcqs: AdminMcq[];
    error: string | null;
    generation_ms: number;
  }> {
    const { data } = await apiClient.post(`${BASE}/quizzes/draft/generate-cell/`, payload);
    return data;
  },

  async regenerateQuestion(payload: {
    topic: string;
    sub_skill: string;
    difficulty: "Easy" | "Medium" | "Hard";
  }): Promise<AdminMcq> {
    const { data } = await apiClient.post<{ mcq: AdminMcq }>(
      `${BASE}/quizzes/draft/regenerate-question/`,
      payload,
    );
    return data.mcq;
  },

  async update(
    configId: number,
    payload: {
      config_fields?: Partial<{
        is_active: boolean;
        target_skills: string[];
        min_questions: number;
        max_questions: number;
        se_threshold: number;
        hint_tokens: number;
        confidence_prompt_enabled: boolean;
      }>;
      quiz_title?: string;
      quiz_instructions?: string;
      mcqs_upsert?: AdminMcq[];
      mcqs_delete?: number[];
    },
  ): Promise<AdminAdaptiveQuizDetail> {
    const { data } = await apiClient.patch<AdminAdaptiveQuizDetail>(
      `${BASE}/quizzes/${configId}/`,
      payload,
    );
    return data;
  },
};
