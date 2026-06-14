import apiClient from "@/lib/services/api";
import type {
  AdaptiveArticleDetail,
  ArticleTierResult,
  ReadingTier,
} from "@/lib/services/adaptive-course.service";

const BASE = "/adaptive-quiz/api/admin";
const CODING_ADMIN = "/adaptive-coding/api/admin";

export interface AdaptiveCourseGenConfig {
  difficulty_levels?: Array<"Easy" | "Medium" | "Hard">;
  difficulty_level?: "Easy" | "Medium" | "Hard";
  questions_per_cell?: number;
  min_questions?: number;
  max_questions?: number;
  se_threshold?: number;
  hint_tokens?: number;
  confidence_prompt_enabled?: boolean;
  content_types?: Array<"quiz" | "article" | "coding" | "video">;
  /** AI Coding Mentor knobs — only used when content_types includes "coding". */
  coding_problems_per_submodule?: number;
  coding_language?: string;
  /** Allow copy/paste in the generated coding editors (default off = hardening). */
  coding_allow_clipboard?: boolean;
}

export interface GenerateAdaptiveCoursePayload {
  title: string;
  description: string;
  target_audience?: string;
  duration_weeks?: number;
  config?: AdaptiveCourseGenConfig;
}

/** One topic row in a CSV-derived plan → becomes an adaptive submodule. */
export interface CsvPlanSubmodule {
  title: string;
  description: string;
  /** Sub-skills the submodule teaches — drive quiz/article skill tags. */
  key_concepts: string[];
  /** Client-only stable React key (ignored by the backend serializer). */
  _uid?: string;
}

/** One week/module in a CSV-derived plan. */
export interface CsvPlanModule {
  week: number;
  title: string;
  submodules: CsvPlanSubmodule[];
  /** Client-only stable React key (ignored by the backend serializer). */
  _uid?: string;
}

/** Result of AI-mapping an uploaded curriculum CSV (preview, no DB writes). */
export interface CsvCoursePlan {
  modules: CsvPlanModule[];
  /** Which source column the AI mapped to each role (or null). Preview only. */
  column_mapping: Record<string, string | null>;
  warnings: string[];
}

export interface ParseCsvPayload {
  title?: string;
  /** Detected CSV headers. */
  columns: string[];
  /** Header→cell row objects from a client-side header-mode parse. */
  rows: Array<Record<string, string>>;
  /** Free-text guidance for the AI (e.g. "treat Module column as weeks"). */
  hint?: string;
}

export interface GenerateFromPlanPayload {
  title: string;
  description?: string;
  /** The (possibly admin-edited) module/submodule structure to build. */
  modules: CsvPlanModule[];
  config?: AdaptiveCourseGenConfig;
}

export type AdaptiveCourseJobStatus =
  | "pending"
  | "generating_outline"
  | "creating_structure"
  | "generating_content"
  | "completed"
  | "failed";

export interface AdaptiveCourseJob {
  id: number;
  job_id: string;
  title: string;
  status: AdaptiveCourseJobStatus;
  scope: "full_course" | "module" | "submodule";
  total_content_items: number;
  completed_content_items: number;
  progress_percentage: number;
  generated_course_id: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface AdaptiveCourseErrorEntry {
  timestamp: string;
  type: string;
  message: string;
}

export interface AdaptiveCourseJobTreeSubmodule {
  id: number;
  title: string;
  quiz_ready: boolean;
  article_ready?: boolean;
  coding_ready?: boolean;
  video_ready?: boolean;
  question_count: number;
  coding_problem_count?: number;
  video_count?: number;
}

export interface AdaptiveCourseJobTreeModule {
  id: number;
  weekno: number;
  title: string;
  submodules: AdaptiveCourseJobTreeSubmodule[];
}

export interface AdaptiveCourseJobLogEntry {
  key: string;
  kind: "quiz" | "article" | "coding" | "video";
  id: number;
  skill: string;
  difficulty: string;
  text: string;
  title?: string;
}

export interface AdaptiveCourseJobStats {
  submodules_total: number;
  submodules_done: number;
  questions_planned: number;
  questions_generated: number;
  articles_generated: number;
  coding_generated?: number;
  videos_generated?: number;
  by_difficulty: Record<string, number>;
  elapsed_seconds: number;
}

export interface AdaptiveCourseSkill {
  skill: string;
  question_count: number;
  article_count: number;
}

export interface AdaptiveCourseJobDetail extends AdaptiveCourseJob {
  input_data: Record<string, unknown>;
  config: AdaptiveCourseGenConfig;
  outline_data: Record<string, unknown> | null;
  error_log: AdaptiveCourseErrorEntry[];
  tree: AdaptiveCourseJobTreeModule[];
  log: AdaptiveCourseJobLogEntry[];
  stats: AdaptiveCourseJobStats;
  skills: AdaptiveCourseSkill[];
}

export interface AdminAdaptiveCourseQuiz {
  config_id: number;
  title: string;
  target_skills: string[];
  mcq_count: number;
  min_questions: number;
  max_questions: number;
  is_active: boolean;
}

export interface AdminAdaptiveCourseArticle {
  article_id: number;
  title: string;
  default_tier: ReadingTier;
  available_tiers: ReadingTier[];
  reading_time_minutes: number;
  concepts: string[];
  is_active: boolean;
}

export interface AdminAdaptiveCourseCodingProblem {
  problem_id: number;
  title: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  target_skills: string[];
  is_active?: boolean;
}

export interface AdminAdaptiveCourseCodingSet {
  config_id: number;
  title: string;
  target_skills: string[];
  default_language: string;
  hint_layers: number;
  is_active?: boolean;
  allow_clipboard?: boolean;
  problems: AdminAdaptiveCourseCodingProblem[];
}

/** Full coding problem for admin review/edit — includes solution + test_cases. */
export interface AdminCodingProblemDetail {
  id: number;
  title: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  problem_statement: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  constraints: string;
  test_cases: Array<{ input: string; expected_output: string }>;
  template_code: Record<string, string>;
  solution: Record<string, string>;
  time_limit: number;
  memory_limit: number;
  tags: string;
  target_skills: string[];
  misconception_taxonomy: Array<{ id: string; label: string; skill: string }>;
  topic: string;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminAdaptiveCourseVideoCompanion {
  id: number;
  title: string;
  video_title: string;
  thumbnail_url: string;
  duration_seconds: number;
  check_in_count: number;
  is_active: boolean;
}

export interface AdminAdaptiveCourseSubModule {
  id: number;
  order: number;
  title: string;
  description: string;
  articles: AdminAdaptiveCourseArticle[];
  quizzes: AdminAdaptiveCourseQuiz[];
  coding_sets?: AdminAdaptiveCourseCodingSet[];
  video_companions?: AdminAdaptiveCourseVideoCompanion[];
}

export interface AdminAdaptiveCourseModule {
  id: number;
  weekno: number;
  title: string;
  submodules: AdminAdaptiveCourseSubModule[];
}

export interface AdminAdaptiveCourseListItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  target_audience: string;
  duration_weeks: number;
  difficulty_levels: string[];
  is_published: boolean;
  module_count: number;
  submodule_count: number;
  quiz_count: number;
  article_count: number;
  coding_count?: number;
  video_count?: number;
  // Cover art — admins always get the URLs (even when hidden) to preview/manage;
  // the *_hidden flags drive the toggle state.
  header_image_url?: string | null;
  card_image_url?: string | null;
  header_image_hidden: boolean;
  card_image_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminAdaptiveCourseDetail extends AdminAdaptiveCourseListItem {
  modules: AdminAdaptiveCourseModule[];
  skills: AdaptiveCourseSkill[];
}

export type CourseImageTarget = "header" | "card";

export interface CourseImageResult {
  target: CourseImageTarget;
  url: string | null;
  hidden: boolean;
}

// --- Student enrollment / management ---

export interface AdaptiveProgressByType {
  quiz: { completed: number; total: number };
  coding: { completed: number; total: number };
  video: { completed: number; total: number };
  article: { total: number; read: number | null };
}

export interface AdaptiveCourseProgress {
  progress_percentage: number;
  completed: number;
  total: number;
  by_type: AdaptiveProgressByType;
  last_activity: string | null;
}

export interface EnrolledAdaptiveStudent {
  student_id: number;
  name: string;
  email: string;
  phone: string;
  enrolled_at: string;
  progress_percentage: number;
  completed: number;
  total: number;
  last_activity: string | null;
}

export interface EnrolledStudentsResponse {
  count: number;
  page: number;
  page_size: number;
  results: EnrolledAdaptiveStudent[];
}

export interface EnrollActionResult {
  succeeded: number;
  skipped?: number;
  failed?: Array<{ student_id: number | null; detail: string }>;
  missing?: number[];
}

export interface AdaptiveStudentProgressDetail {
  student_id: number;
  name: string;
  email: string;
  phone: string;
  enrolled_at: string;
  progress: AdaptiveCourseProgress;
}

export const adminAdaptiveCourseService = {
  async generateCourse(payload: GenerateAdaptiveCoursePayload): Promise<AdaptiveCourseJobDetail> {
    const { data } = await apiClient.post<AdaptiveCourseJobDetail>(
      `${BASE}/courses/generate/`,
      payload,
    );
    return data;
  },

  /** AI-map an uploaded curriculum CSV into an editable course plan (no job). */
  async parseCsv(payload: ParseCsvPayload): Promise<CsvCoursePlan> {
    const { data } = await apiClient.post<CsvCoursePlan>(
      `${BASE}/courses/parse-csv/`,
      payload,
    );
    return data;
  },

  /** Build an adaptive course from an edited CSV plan — returns the started job. */
  async generateFromPlan(payload: GenerateFromPlanPayload): Promise<AdaptiveCourseJobDetail> {
    const { data } = await apiClient.post<AdaptiveCourseJobDetail>(
      `${BASE}/courses/generate-from-plan/`,
      payload,
    );
    return data;
  },

  async listJobs(): Promise<AdaptiveCourseJob[]> {
    const { data } = await apiClient.get<AdaptiveCourseJob[]>(`${BASE}/courses/jobs/`);
    return data;
  },

  async getJob(jobId: string): Promise<AdaptiveCourseJobDetail> {
    const { data } = await apiClient.get<AdaptiveCourseJobDetail>(
      `${BASE}/courses/jobs/${encodeURIComponent(jobId)}/`,
    );
    return data;
  },

  async listCourses(): Promise<AdminAdaptiveCourseListItem[]> {
    const { data } = await apiClient.get<AdminAdaptiveCourseListItem[]>(`${BASE}/courses/`);
    return data;
  },

  async getCourse(courseId: number): Promise<AdminAdaptiveCourseDetail> {
    const { data } = await apiClient.get<AdminAdaptiveCourseDetail>(
      `${BASE}/courses/${courseId}/`,
    );
    return data;
  },

  async getCourseArticle(
    courseId: number,
    articleId: number,
    tier?: ReadingTier,
  ): Promise<AdaptiveArticleDetail> {
    const { data } = await apiClient.get<AdaptiveArticleDetail>(
      `${BASE}/courses/${courseId}/articles/${articleId}/`,
      { params: tier ? { tier } : {} },
    );
    return data;
  },

  async renderCourseArticleTier(
    courseId: number,
    articleId: number,
    tier: ReadingTier,
  ): Promise<ArticleTierResult> {
    const { data } = await apiClient.post<ArticleTierResult>(
      `${BASE}/courses/${courseId}/articles/${articleId}/tier/${tier}/`,
      {},
    );
    return data;
  },

  async publishCourse(courseId: number): Promise<{ course_id: number; is_published: boolean }> {
    const { data } = await apiClient.post(`${BASE}/courses/${courseId}/publish/`, {});
    return data;
  },

  async deleteCourse(courseId: number): Promise<void> {
    await apiClient.delete(`${BASE}/courses/${courseId}/`);
  },

  // --- Course cover art (header banner + card thumbnail) ---

  async regenerateCourseImage(courseId: number, target: CourseImageTarget): Promise<CourseImageResult> {
    const { data } = await apiClient.post<CourseImageResult>(
      `${BASE}/courses/${courseId}/images/regenerate/`,
      { target },
    );
    return data;
  },

  async uploadCourseImage(
    courseId: number,
    target: CourseImageTarget,
    file: File,
  ): Promise<CourseImageResult> {
    const form = new FormData();
    form.append("target", target);
    form.append("file", file);
    // Don't set Content-Type — the browser adds `multipart/form-data; boundary=…`
    // automatically; forcing it without the boundary breaks DRF's parser.
    const { data } = await apiClient.post<CourseImageResult>(
      `${BASE}/courses/${courseId}/images/upload/`,
      form,
    );
    return data;
  },

  async setCourseImageVisibility(
    courseId: number,
    target: CourseImageTarget,
    hidden: boolean,
  ): Promise<{ target: CourseImageTarget; hidden: boolean }> {
    const { data } = await apiClient.post(
      `${BASE}/courses/${courseId}/images/visibility/`,
      { target, hidden },
    );
    return data;
  },

  // --- Student enrollment / management ---

  async listCourseStudents(
    courseId: number,
    params?: { search?: string; page?: number; page_size?: number },
  ): Promise<EnrolledStudentsResponse> {
    const { data } = await apiClient.get<EnrolledStudentsResponse>(
      `${BASE}/courses/${courseId}/students/`,
      { params },
    );
    return data;
  },

  async enrollStudents(courseId: number, studentIds: number[]): Promise<EnrollActionResult> {
    const { data } = await apiClient.post<EnrollActionResult>(
      `${BASE}/courses/${courseId}/students/enroll/`,
      { student_ids: studentIds },
    );
    return data;
  },

  async unenrollStudents(courseId: number, studentIds: number[]): Promise<EnrollActionResult> {
    const { data } = await apiClient.post<EnrollActionResult>(
      `${BASE}/courses/${courseId}/students/unenroll/`,
      { student_ids: studentIds },
    );
    return data;
  },

  async getStudentProgress(
    courseId: number,
    studentId: number,
  ): Promise<AdaptiveStudentProgressDetail> {
    const { data } = await apiClient.get<AdaptiveStudentProgressDetail>(
      `${BASE}/courses/${courseId}/students/${studentId}/`,
    );
    return data;
  },

  async suggestTopic(
    courseId: number,
    payload: { scope: "module" | "submodule"; module_id?: number },
  ): Promise<{ topic: string; rationale: string }> {
    const { data } = await apiClient.post<{ topic: string; rationale: string }>(
      `${BASE}/courses/${courseId}/suggest-topic/`,
      payload,
    );
    return data;
  },

  async addModule(
    courseId: number,
    payload: { topic: string; submodules_count?: number; config?: AdaptiveCourseGenConfig },
  ): Promise<AdaptiveCourseJobDetail> {
    const { data } = await apiClient.post<AdaptiveCourseJobDetail>(
      `${BASE}/courses/${courseId}/modules/generate/`,
      payload,
    );
    return data;
  },

  async addSubmodule(
    courseId: number,
    moduleId: number,
    payload: { topic: string; config?: AdaptiveCourseGenConfig },
  ): Promise<AdaptiveCourseJobDetail> {
    const { data } = await apiClient.post<AdaptiveCourseJobDetail>(
      `${BASE}/courses/${courseId}/modules/${moduleId}/submodules/generate/`,
      payload,
    );
    return data;
  },

  // --- AI Coding Mentor admin management (separate /adaptive-coding/api/admin base) ---

  async getCodingProblem(problemId: number): Promise<AdminCodingProblemDetail> {
    const { data } = await apiClient.get<AdminCodingProblemDetail>(`${CODING_ADMIN}/problems/${problemId}/`);
    return data;
  },

  async updateCodingProblem(
    problemId: number,
    patch: Partial<AdminCodingProblemDetail>,
  ): Promise<AdminCodingProblemDetail> {
    const { data } = await apiClient.patch<AdminCodingProblemDetail>(
      `${CODING_ADMIN}/problems/${problemId}/`,
      patch,
    );
    return data;
  },

  async toggleCodingProblemActive(problemId: number): Promise<{ problem_id: number; is_active: boolean }> {
    const { data } = await apiClient.post(`${CODING_ADMIN}/problems/${problemId}/toggle-active/`);
    return data;
  },

  async deleteCodingProblem(problemId: number): Promise<{ problem_id: number; is_deleted: boolean }> {
    const { data } = await apiClient.delete(`${CODING_ADMIN}/problems/${problemId}/`);
    return data;
  },

  async toggleCodingConfigActive(configId: number): Promise<{ config_id: number; is_active: boolean }> {
    const { data } = await apiClient.post(`${CODING_ADMIN}/configs/${configId}/toggle-active/`);
    return data;
  },

  async toggleCodingConfigClipboard(configId: number): Promise<{ config_id: number; allow_clipboard: boolean }> {
    const { data } = await apiClient.post(`${CODING_ADMIN}/configs/${configId}/toggle-clipboard/`);
    return data;
  },

  async deleteCodingConfig(configId: number): Promise<{ config_id: number; is_deleted: boolean }> {
    const { data } = await apiClient.delete(`${CODING_ADMIN}/configs/${configId}/`);
    return data;
  },
};
