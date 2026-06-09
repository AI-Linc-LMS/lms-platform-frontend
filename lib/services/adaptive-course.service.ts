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

export type ReadingTier = "Beginner" | "Intermediate" | "Advanced" | "Expert";
export const READING_TIERS: ReadingTier[] = ["Beginner", "Intermediate", "Advanced", "Expert"];

export interface AdaptiveCourseArticleSummary {
  article_id: number;
  title: string;
  default_tier: ReadingTier;
  available_tiers: ReadingTier[];
  reading_time_minutes: number;
  concepts: string[];
}

export interface AdaptiveArticleDetail {
  id: number;
  title: string;
  default_tier: ReadingTier;
  rendered_tier: ReadingTier;
  available_tiers: ReadingTier[];
  content_html: string;
  reading_time_minutes: number;
  summary: string;
  concepts: string[];
  glossary: Record<string, string>;
  explain_terms: string[];
}

export interface ArticleTierResult {
  tier: ReadingTier;
  content_html: string;
  reading_time_minutes: number;
}

export interface ExplainResult {
  explanation: string;
  followups: { even_simpler: string; show_diagram: string; real_example: string };
}

export interface SummariseResult {
  summary_html: string;
  bullets: string[];
}

export interface AdaptiveCourseCodingProblemSummary {
  problem_id: number;
  title: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  target_skills: string[];
}

export interface AdaptiveCourseCodingSet {
  config_id: number;
  title: string;
  target_skills: string[];
  default_language: string;
  hint_layers: number;
  problems: AdaptiveCourseCodingProblemSummary[];
}

export interface AdaptiveCourseVideoCompanionSummary {
  id: number;
  title: string;
  video_title: string;
  thumbnail_url: string;
  duration_seconds: number;
  check_in_count: number;
}

export interface AdaptiveCourseSubModule {
  id: number;
  order: number;
  title: string;
  description: string;
  articles: AdaptiveCourseArticleSummary[];
  quizzes: AdaptiveCourseQuizSummary[];
  coding_sets?: AdaptiveCourseCodingSet[];
  video_companions?: AdaptiveCourseVideoCompanionSummary[];
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
  article_count: number;
  coding_count?: number;
  video_count?: number;
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

  async getArticle(articleId: number, tier?: ReadingTier): Promise<AdaptiveArticleDetail> {
    const { data } = await apiClient.get<AdaptiveArticleDetail>(
      `${BASE}/articles/${articleId}/`,
      { params: tier ? { tier } : {} },
    );
    return data;
  },

  async renderArticleTier(articleId: number, tier: ReadingTier): Promise<ArticleTierResult> {
    const { data } = await apiClient.post<ArticleTierResult>(
      `${BASE}/articles/${articleId}/tier/${tier}/`,
      {},
    );
    return data;
  },

  async explainTerm(
    articleId: number,
    payload: { term: string; context?: string; tier?: ReadingTier },
  ): Promise<ExplainResult> {
    const { data } = await apiClient.post<ExplainResult>(
      `${BASE}/articles/${articleId}/explain/`,
      payload,
    );
    return data;
  },

  async summarise(
    articleId: number,
    payload: { up_to_text?: string; tier?: ReadingTier },
  ): Promise<SummariseResult> {
    const { data } = await apiClient.post<SummariseResult>(
      `${BASE}/articles/${articleId}/summarise/`,
      payload,
    );
    return data;
  },
};
