import apiClient from "./api";

const BASE = "/adaptive-quiz/api";

export interface AdaptiveCourseQuizSummary {
  config_id: number;
  quiz_title: string;
  target_skills: string[];
  mcq_count: number;
  min_questions: number;
  max_questions: number;
  hint_tokens: number;
  confidence_prompt_enabled: boolean;
}

export interface AdaptiveCourseSubModule {
  id: number;
  order: number;
  title: string;
  description: string;
  quizzes: AdaptiveCourseQuizSummary[];
}

export interface AdaptiveCourseModule {
  id: number;
  weekno: number;
  title: string;
  submodules: AdaptiveCourseSubModule[];
}

export interface AdaptiveCourseListItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  target_audience: string;
  duration_weeks: number;
  difficulty_levels: string[];
  module_count: number;
  submodule_count: number;
  quiz_count: number;
  updated_at: string;
}

export interface AdaptiveCourseDetail extends AdaptiveCourseListItem {
  modules: AdaptiveCourseModule[];
}

export const adaptiveCourseService = {
  async listCourses(): Promise<AdaptiveCourseListItem[]> {
    const { data } = await apiClient.get<AdaptiveCourseListItem[]>(`${BASE}/courses/`);
    return data;
  },

  async getCourse(courseId: number): Promise<AdaptiveCourseDetail> {
    const { data } = await apiClient.get<AdaptiveCourseDetail>(`${BASE}/courses/${courseId}/`);
    return data;
  },

  async getSubmodule(
    courseId: number,
    submoduleId: number,
  ): Promise<AdaptiveCourseSubModule> {
    const { data } = await apiClient.get<AdaptiveCourseSubModule>(
      `${BASE}/courses/${courseId}/submodules/${submoduleId}/`,
    );
    return data;
  },
};
