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
  completed?: boolean;
  /** Latest completed session id — used to "Review" past results instead of restarting. */
  last_session_id?: string | null;
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
  completed?: boolean;
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

export interface RunSnippetResult {
  stdout: string;
  stderr: string | null;
  compile_output: string | null;
  status: string | null;
  time?: string | null;
  memory?: number | null;
}

export interface AdaptiveCourseCodingProblemSummary {
  problem_id: number;
  title: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  target_skills: string[];
  completed?: boolean;
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
  completed?: boolean;
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
  /** AI/admin card thumbnail; null when absent or hidden by the admin. */
  card_image_url?: string | null;
  updated_at: string;
}

export interface AdaptiveCourseDetail extends AdaptiveCourseListItem {
  /** AI/admin header banner; null when absent or hidden by the admin. */
  header_image_url?: string | null;
  modules: AdaptiveCourseModule[];
}

// --- Additional Practice (learner-generated, no points) ---
export type PracticeKind = "quiz" | "coding" | "article";
export type PracticeDifficulty = "Easy" | "Medium" | "Hard" | "match";

export interface PracticeUsage {
  used: number;
  limit: number;
  left: number;
  by_kind: { quiz: number; coding: number; article: number };
}

export interface PracticeItem {
  id: string;
  kind: PracticeKind;
  title: string;
  item_count: number;
  created_at: string;
  config_id?: number;
  problem_id?: number | null;
  article_id?: number;
}

export interface PracticeState {
  usage: PracticeUsage;
  items: PracticeItem[];
}

export interface GeneratePracticeBody {
  kind: PracticeKind;
  difficulty: PracticeDifficulty;
  count?: number;
  focus?: string;
}

export interface GeneratePracticeResult extends PracticeState {
  item: PracticeItem;
}

// --- Points breakdown (per-content on-offer + earned) ---
export type PointsKind = "quiz" | "coding" | "article" | "video";

export interface PointsBreakdownItem {
  kind: PointsKind;
  title: string;
  detail: string;
  content_key: string;
  on_offer: number;
  earned: number;
  status: "earned" | "available";
  breakdown?: {
    base: number;
    after_decay: number;
    correctness_factor: number;
    late_penalty_mult: number;
    weight: number;
    earned_at: string | null;
  };
}

export interface SubmodulePointsBreakdown {
  topic: { earned: number; on_offer: number };
  items: PointsBreakdownItem[];
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

  async getSubmodulePractice(courseId: number, submoduleId: number): Promise<PracticeState> {
    const { data } = await apiClient.get<PracticeState>(
      `${BASE}/courses/${courseId}/submodules/${submoduleId}/practice/`,
    );
    return data;
  },

  async generatePractice(
    courseId: number,
    submoduleId: number,
    body: GeneratePracticeBody,
  ): Promise<GeneratePracticeResult> {
    const { data } = await apiClient.post<GeneratePracticeResult>(
      `${BASE}/courses/${courseId}/submodules/${submoduleId}/practice/generate/`,
      body,
    );
    return data;
  },

  async getSubmodulePoints(courseId: number, submoduleId: number): Promise<SubmodulePointsBreakdown> {
    const { data } = await apiClient.get<SubmodulePointsBreakdown>(
      `${BASE}/courses/${courseId}/submodules/${submoduleId}/points/`,
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

  /** Mark an article as read — awards points + keeps the daily streak alive.
   *  Idempotent per student+article; safe to call once the article is opened. */
  async completeArticle(articleId: number): Promise<void> {
    await apiClient.post(`${BASE}/articles/${articleId}/complete/`, {});
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

  async runSnippet(payload: { source: string; language: string; stdin?: string }): Promise<RunSnippetResult> {
    const { data } = await apiClient.post<RunSnippetResult>(`${BASE}/run-snippet/`, payload);
    return data;
  },
};
