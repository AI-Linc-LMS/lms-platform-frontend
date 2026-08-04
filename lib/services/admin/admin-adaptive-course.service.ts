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
  /** Adaptive articles generated per submodule (default 1). */
  articles_per_submodule?: number;
  /** Topics per week. Drives the estimate AND the structure the generator is told to build. */
  submodules_per_module?: number;
  min_questions?: number;
  max_questions?: number;
  se_threshold?: number;
  hint_tokens?: number;
  confidence_prompt_enabled?: boolean;
  content_types?: Array<"quiz" | "article" | "coding" | "video">;
  /** AI Coding Mentor knobs - only used when content_types includes "coding". */
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
  /** Sub-skills the submodule teaches - drive quiz/article skill tags. */
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
  // Full-course generation is gated: the admin's click files a request and a super admin
  // approves it before any tokens are spent. See `approval_status`.
  | "awaiting_approval"
  | "rejected"
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
  /** "not_required" for incremental module/topic generation, which stays immediate. */
  approval_status?: "not_required" | "pending" | "approved" | "rejected";
  /** The reviewer's reason. Always present on a rejection, and shown to the admin verbatim. */
  review_note?: string;
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

/**
 * Honest, per-job failure rollup. Surfaced both on a finished/running job
 * (`AdaptiveCourseJobDetail.error_summary`) and on the latest job attached to a
 * course's `content_health.last_job`. `dominant_error` carries human guidance -
 * e.g. the OpenAI quota/billing message an admin must act on before regenerating.
 */
export interface AdaptiveCourseJobErrorSummary {
  failed_count: number;
  /** Failures bucketed by content type; may include "video_no_match". */
  by_type: Record<string, number>;
  quota_failures: number;
  dominant_error: string | null;
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
  error_summary?: AdaptiveCourseJobErrorSummary | null;
  requested_note?: string;
  reviewed_at?: string | null;
  /** The brief as submitted, so an admin can see what a reviewer changed. */
  original_input_data?: Record<string, unknown> | null;
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

/** Full coding problem for admin review/edit - includes solution + test_cases. */
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
  /** Set when the admin pasted their own link instead of picking from the Vimeo catalog. */
  external_url?: string;
  thumbnail_url: string;
  duration_seconds: number;
  check_in_count: number;
  is_active: boolean;
}

/** A handout on a topic. `url` is signed per read and expires — render it, never store it. */
export interface AdminAdaptiveCourseAttachment {
  id: number;
  title: string;
  /** Coarse family derived server-side from the extension: pdf | slides | doc | sheet | image | file. */
  kind: string;
  extension: string;
  original_name: string;
  size_bytes: number;
  is_active: boolean;
  /** Null when the stored key no longer signs — a moved or revoked object. */
  url: string | null;
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
  attachments?: AdminAdaptiveCourseAttachment[];
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
  /** When true, every active student of the tenant is auto-enrolled (existing on toggle/publish,
   *  new students on signup), so the course appears in their courses without an admin acting. */
  auto_enroll: boolean;
  /** When true, the published course is listed in the learner catalog and any active student of
   *  the tenant may enroll themselves (a pull, distinct from auto_enroll's push). */
  self_enroll_enabled: boolean;
  /** Learners must purchase this course before they can enrol. */
  is_paid: boolean;
  /** DRF DecimalField — arrives as a string like "1499.00". Parse at render, never with float maths. */
  price: string | null;
  currency: string;
  /** Weekly cohort gate. False = every week open + full XP (admin toggle). */
  content_locked: boolean;
  /** Course-wide copy/paste policy for the code editor. Was per coding set. */
  allow_clipboard: boolean;
  /** "" unless an instructor built this course. */
  instructor_review_status?: "" | "draft" | "pending_review" | "approved" | "rejected";
  instructor_review_note?: string;
  /** Who built it, when an instructor did. */
  authored_by?: { id: number; name: string; email: string } | null;
  module_count: number;
  submodule_count: number;
  quiz_count: number;
  article_count: number;
  coding_count?: number;
  video_count?: number;
  // Cover art - admins always get the URLs (even when hidden) to preview/manage;
  // the *_hidden flags drive the toggle state.
  header_image_url?: string | null;
  card_image_url?: string | null;
  header_image_hidden: boolean;
  card_image_hidden: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Honest content-completeness signal for a course. The builder can "complete" a
 * job while individual content calls fail (usually OpenAI quota/429 mid-run),
 * leaving submodules empty. This rollup tells the admin exactly what's missing
 * and whether an LLM regeneration would help (video gaps need a catalog video,
 * not the LLM).
 */
export interface AdminAdaptiveCourseContentHealth {
  submodules_total: number;
  /** e.g. ["quiz"] or ["quiz","article"] - the content types this course expects. */
  expected_content_types: string[];
  missing: { quiz?: number; article?: number; coding?: number; video?: number };
  total_missing: number;
  /** True when NON-video content is missing (i.e. LLM regeneration would help). */
  needs_regeneration: boolean;
  last_job:
    | null
    | (AdaptiveCourseJobErrorSummary & {
        id: number;
        status: string;
      });
}

/** How a student ended up in a course. Mirrors ENROLLMENT_SOURCE_CHOICES on the backend. */
export type EnrollmentSource = "self" | "paid" | "admin" | "bulk" | "seed" | "migration";

export interface AdminAdaptiveCourseEnrollmentSummary {
  total: number;
  /** Counts keyed by source; absent keys mean zero. */
  by_source: Partial<Record<EnrollmentSource | "unknown", number>>;
}

export interface AdminAdaptiveCourseDetail extends AdminAdaptiveCourseListItem {
  modules: AdminAdaptiveCourseModule[];
  skills: AdaptiveCourseSkill[];
  content_health?: AdminAdaptiveCourseContentHealth | null;
  /**
   * Cohorts this course is assigned to. There was no course -> cohorts reverse lookup at all
   * before this; the only route was per-cohort, so the UI would have needed one request per
   * cohort in the tenant to show it.
   */
  assigned_cohorts?: { id: number; name: string }[];
  /**
   * Who is enrolled and how they got here. `source` has always been stored per row and never
   * surfaced, so an admin could not tell an auto-enrolled tenant from students who chose the
   * course. Also supplies the N for a blast-radius confirmation.
   */
  enrollment_summary?: AdminAdaptiveCourseEnrollmentSummary;
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
  /** Derived from the LEDGER, not the enrolment row — money is the durable fact. */
  paid?: boolean;
  /** How they got in: self | paid | admin | bulk | seed | migration. */
  access_source?: string;
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

/* ---------- Deep student activity & performance analytics ---------- */

export type RiskSeverity = "warning" | "serious" | "critical";
export type MasteryLevel = "not_started" | "attempted" | "familiar" | "proficient" | "mastered";

export interface SkillMasteryRow {
  skill: string;
  mastery_pct: number;
  level: MasteryLevel;
  last_practiced: string | null;
  days_since: number | null;
  /** Decayed recall estimate: mastery · 2^(-Δ/half-life). Weakest first = revision queue.
   *  null when the skill was never practised in THIS course - decay is unknown, not zero. */
  retention_pct: number | null;
  /** False for calibration/interview-seeded skills (and coding/video, which log no skill tag). */
  practiced_here: boolean;
}

export interface StudentAnalytics {
  course: { id: number; title: string };
  student: {
    id: number;
    name: string;
    email: string;
    enrolled_at: string | null;
    last_active: string | null;
    days_inactive: number | null;
  };
  kpis: {
    completion_pct: number;
    completed: number;
    total: number;
    mastery_pct: number;
    points: number;
    points_tier: string;
    streak_current: number;
    streak_longest: number;
    time_on_task_minutes: number;
    activities_logged: number;
    active_days: number;
    risk_level: "ok" | "watch" | "at_risk";
  };
  mastery_vs_completion: {
    completion_pct: number;
    mastery_pct: number;
    levels: Record<MasteryLevel, number>;
  };
  by_type: Record<string, { completed?: number; total: number; read?: number | null }>;
  progress_over_time: { date: string; items: number; points: number; cum_items: number; cum_points: number }[];
  activity_heatmap: { date: string; count: number; minutes: number }[];
  study_pattern: { by_weekday: number[]; by_hour: number[] };
  skill_mastery: SkillMasteryRow[];
  difficulty: { difficulty: string; attempted: number; correct: number; accuracy: number }[];
  quiz: {
    sessions: number;
    questions_answered: number;
    correct: number;
    accuracy: number;
    avg_time_ms: number;
    hints_used: number;
    /** Self-reported confidence (1-4) vs actual accuracy - over/under-confidence. */
    confidence_calibration: { confidence: number; answered: number; correct: number; accuracy: number }[];
  };
  coding: {
    problems_attempted: number;
    problems_solved: number;
    acceptance_rate: number;
    submissions: number;
    avg_attempts_to_solve: number;
    by_language: { language: string; submissions: number }[];
    /** AI-classified misconceptions - more actionable than "wrong answer". */
    top_misconceptions: { gap: string; count: number }[];
  };
  video: { sessions: number; avg_completeness: number; avg_comprehension: number };
  effort_vs_outcome: { activity_type: string; minutes: number; correctness: number; at: string }[];
  /** True number of points available; the array above is capped to the most recent N. */
  effort_vs_outcome_total: number;
  struggle_items: { content_key: string; activity_type: string; attempts: number; best_correctness: number }[];
  mock_interviews: { date: string | null; score: number; title: string }[];
  cohort: {
    cohort_size: number;
    completion_percentile: number;
    points_percentile: number;
    avg_completion: number;
    avg_points: number;
  };
  risk_signals: { code: string; severity: RiskSeverity; title: string; detail: string }[];
  badges: { name: string; icon: string; earned_at: string | null }[];
  timeline: {
    at: string;
    activity_type: string;
    difficulty: string;
    earned: number;
    correctness: number;
    content_key: string;
    attempt_no: number;
  }[];
}


/* ---------------------------------------------------------------- manual authoring */

/** A verified-library MCQ, as offered by the bank picker. */
export interface BankMcq {
  id: number;
  question_text: string;
  options: { a: string; b: string; c: string; d: string };
  correct_option: string;
  explanation: string;
  difficulty_level: string;
  topic: string;
  skills: string[];
}

export interface BankCodingProblem {
  id: number;
  title: string;
  problem_statement: string;
  difficulty_level: string;
  topic: string;
  skills: string[];
  test_cases: number;
}

export interface BankSearchResult<T> {
  results: T[];
  total: number;
  offset: number;
  limit: number;
  note: string;
}

export interface SubmoduleSuggestions {
  submodule: { id: number; title: string };
  has: { article: boolean; quiz: boolean; coding: boolean; video: boolean };
  gaps: Array<{ kind: "article" | "quiz" | "coding" | "video"; title: string; why: string }>;
  bank_matches: {
    mcqs: Array<{ id: number; question_text: string; difficulty_level: string; topic: string }>;
    coding: Array<{ id: number; title: string; difficulty_level: string; topic: string }>;
  };
  matched_on: string;
}

/** The video endpoints answer with what they could and could not build. */
export interface AttachVideoResult {
  id: number;
  title: string;
  source: "catalog" | "external";
  check_ins_built: boolean;
  note: string;
}

export const adminAdaptiveCourseService = {

  /* -------------------------------------------------- manual authoring (no AI) */

  /** A blank course. Unlike `generateCourse` this returns the course itself, not a job. */
  async createBlankCourse(payload: {
    title: string;
    description?: string;
    target_audience?: string;
    duration_weeks?: number;
  }): Promise<AdminAdaptiveCourseDetail> {
    const { data } = await apiClient.post(`${BASE}/courses/create/`, payload);
    return data;
  },

  async createModule(courseId: number, payload: { title: string; weekno?: number }) {
    const { data } = await apiClient.post(`${BASE}/courses/${courseId}/modules/`, payload);
    return data as AdminAdaptiveCourseModule;
  },

  async updateModule(courseId: number, moduleId: number, payload: { title?: string; weekno?: number }) {
    const { data } = await apiClient.patch(`${BASE}/courses/${courseId}/modules/${moduleId}/`, payload);
    return data as AdminAdaptiveCourseModule;
  },

  async deleteModule(courseId: number, moduleId: number) {
    const { data } = await apiClient.delete(`${BASE}/courses/${courseId}/modules/${moduleId}/`);
    return data as { deleted: boolean; submodules_removed: number };
  },

  async createSubmodule(courseId: number, moduleId: number, payload: { title: string; description?: string }) {
    const { data } = await apiClient.post(
      `${BASE}/courses/${courseId}/modules/${moduleId}/submodules/`,
      payload
    );
    return data;
  },

  async updateSubmodule(submoduleId: number, payload: { title?: string; description?: string; order?: number }) {
    const { data } = await apiClient.patch(`${BASE}/submodules/${submoduleId}/`, payload);
    return data;
  },

  async deleteSubmodule(submoduleId: number) {
    const { data } = await apiClient.delete(`${BASE}/submodules/${submoduleId}/`);
    return data as { deleted: boolean };
  },

  /** Sends the whole arrangement, not a move-one-step: a lost request cannot half-apply a drag. */
  async reorderTree(
    courseId: number,
    modules: Array<{ id: number; weekno: number; submodules: Array<{ id: number; order: number }> }>
  ) {
    const { data } = await apiClient.post(`${BASE}/courses/${courseId}/reorder/`, { modules });
    return data as { modules_updated: number; submodules_updated: number };
  },

  async addArticle(submoduleId: number, payload: {
    title: string; body: string; summary?: string; reading_tier?: string;
  }) {
    const { data } = await apiClient.post(`${BASE}/submodules/${submoduleId}/article/`, payload);
    return data as { id: number; title: string; reading_tier: string };
  },

  /** `mcq_ids` pulls from the verified bank; `mcqs` are hand-written. Both may be sent. */
  async addQuiz(submoduleId: number, payload: {
    title?: string;
    instructions?: string;
    mcq_ids?: number[];
    mcqs?: Array<Record<string, unknown>>;
  }) {
    const { data } = await apiClient.post(`${BASE}/submodules/${submoduleId}/quiz/`, payload);
    return data as { id: number; title: string; questions: number };
  },

  /** `problem_ids` pulls from the verified bank; `problems` are hand-written. Both may be sent. */
  async addCoding(submoduleId: number, payload: {
    problem_ids?: number[];
    problems?: Array<{
      title: string;
      problem_statement: string;
      test_cases: Array<{ input: string; output: string }>;
      difficulty_level?: string;
      input_format?: string;
      output_format?: string;
      constraints?: string;
      sample_input?: string;
      sample_output?: string;
    }>;
    title?: string; instructions?: string; default_language?: string;
  }) {
    const { data } = await apiClient.post(`${BASE}/submodules/${submoduleId}/coding/`, payload);
    return data as { id: number; title: string; problems: number };
  },

  /** Either `vimeo_id` (catalog, brings a transcript) or `url` (plain watch). */
  async addVideo(submoduleId: number, payload: {
    vimeo_id?: string; url?: string; title?: string; description?: string;
  }): Promise<AttachVideoResult> {
    const { data } = await apiClient.post(`${BASE}/submodules/${submoduleId}/video/`, payload);
    return data;
  },

  /**
   * Record an already-uploaded handout against a topic.
   *
   * Two calls on purpose: the file goes through the shared media endpoint (which owns the size
   * cap and the type allowlist), and this one records WHICH object belongs here. It takes the
   * S3 object key, never the URL — presigned URLs expire, and a stored one would leave every
   * handout on the course broken about a week later.
   */
  async addAttachment(submoduleId: number, payload: {
    file_key: string;
    title?: string;
    description?: string;
    original_name?: string;
    content_type?: string;
    size_bytes?: number;
  }) {
    const { data } = await apiClient.post(`${BASE}/submodules/${submoduleId}/attachment/`, payload);
    return data as {
      id: number; title: string; kind: string; original_name: string;
      size_bytes: number; url: string | null;
    };
  },

  /**
   * One route for all five content types. The alternative was reaching into the coding service
   * for one delete and the quiz service for another, with nothing for articles or videos.
   */
  async updateContent(
    submoduleId: number,
    kind: "article" | "quiz" | "coding" | "video" | "attachment",
    contentId: number,
    payload: { title?: string; body?: string; summary?: string; instructions?: string; is_active?: boolean; reading_tier?: string }
  ) {
    const { data } = await apiClient.patch(
      `${BASE}/submodules/${submoduleId}/content/${kind}/${contentId}/`,
      payload
    );
    return data as { id: number; kind: string; updated: string[] };
  },

  /** Soft where the model allows it, so a student mid-attempt does not hit a 500. */
  async deleteContent(
    submoduleId: number,
    kind: "article" | "quiz" | "coding" | "video" | "attachment",
    contentId: number
  ) {
    const { data } = await apiClient.delete(
      `${BASE}/submodules/${submoduleId}/content/${kind}/${contentId}/`
    );
    return data as { deleted: boolean; kind: string; soft: boolean };
  },

  async getSuggestions(submoduleId: number): Promise<SubmoduleSuggestions> {
    const { data } = await apiClient.get(`${BASE}/submodules/${submoduleId}/suggestions/`);
    return data;
  },

  async searchBank<T = BankMcq | BankCodingProblem>(
    kind: "mcq" | "coding",
    params: { q?: string; difficulty?: string; topic?: string; limit?: number; offset?: number } = {}
  ): Promise<BankSearchResult<T>> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
    });
    const { data } = await apiClient.get(`${BASE}/bank/${kind}/?${qs.toString()}`);
    return data;
  },

  // Generation (all return `AdaptiveCourseJobDetail`)
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

  /** Build an adaptive course from an edited CSV plan - returns the started job. */
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

  /**
   * Edit course fields (title/description/content lock/auto-enroll/self-enroll/pricing).
   *
   * `grandfathered_students` comes back only when a course is turned PAID: it counts the learners
   * already enrolled, who keep free access and are never charged retroactively.
   */
  async updateCourse(
    courseId: number,
    payload: {
      title?: string;
      description?: string;
      content_locked?: boolean;
      auto_enroll?: boolean;
      self_enroll_enabled?: boolean;
      is_paid?: boolean;
      /** Send as a string; the server validates it as a Decimal. */
      price?: string | null;
      /** ISO code. Frozen server-side once the course has payment activity. */
      currency?: string;
    },
  ): Promise<AdminAdaptiveCourseDetail & { grandfathered_students?: number }> {
    const { data } = await apiClient.patch<AdminAdaptiveCourseDetail & { grandfathered_students?: number }>(
      `${BASE}/courses/${courseId}/`,
      payload,
    );
    return data;
  },

  /** AI-draft a course description (from the title + modules). Returns the text only -
   *  the admin reviews/edits it, then saves with updateCourse. */
  async generateCourseDescription(courseId: number): Promise<string> {
    const { data } = await apiClient.post<{ description: string }>(
      `${BASE}/courses/${courseId}/generate-description/`,
      {},
    );
    return data?.description ?? "";
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
    // Don't set Content-Type - the browser adds `multipart/form-data; boundary=…`
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

  /** Deep activity & performance report for one student (powers the full-page dashboard). */
  async getStudentAnalytics(
    courseId: number,
    studentId: number,
  ): Promise<StudentAnalytics> {
    const { data } = await apiClient.get<StudentAnalytics>(
      `${BASE}/courses/${courseId}/students/${studentId}/analytics/`,
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

  /**
   * Idempotently re-generate ONLY the submodules still missing content (the
   * recovery path for jobs that "completed" while content calls failed mid-run,
   * usually on OpenAI quota). Returns a fresh generation job to track.
   */
  async regenerateMissingContent(courseId: number): Promise<AdaptiveCourseJobDetail> {
    const { data } = await apiClient.post<AdaptiveCourseJobDetail>(
      `${BASE}/courses/${courseId}/regenerate-content/`,
      {},
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

  /**
   * Withdraw a generation request that is still waiting, or dismiss a rejected one.
   *
   * Only those two states — the backend refuses once a build is running, because cancelling
   * then would leave a half-written course with no owner.
   */
  async withdrawJob(jobId: string): Promise<void> {
    await apiClient.delete(`${BASE}/courses/jobs/${jobId}/`);
  },


  /** Instructor hands their finished course to a tenant admin. */
  async submitCourseForReview(courseId: number) {
    const { data } = await apiClient.post(`${BASE}/courses/${courseId}/submit-review/`, {});
    return data as { id: number; instructor_review_status: string };
  },

  /** The admin's decision. A rejection must carry a reason — the server enforces it too. */
  async reviewCourse(courseId: number, decision: "approve" | "reject", note = "") {
    const { data } = await apiClient.post(`${BASE}/courses/${courseId}/review/`, { decision, note });
    return data as { id: number; instructor_review_status: string; instructor_review_note: string };
  },

};
