import apiClient from "@/lib/services/api";

const BASE = "/adaptive-quiz/api/admin";

export interface AdaptiveCourseGenConfig {
  difficulty_levels?: Array<"Easy" | "Medium" | "Hard">;
  difficulty_level?: "Easy" | "Medium" | "Hard";
  questions_per_cell?: number;
  min_questions?: number;
  max_questions?: number;
  se_threshold?: number;
  hint_tokens?: number;
  confidence_prompt_enabled?: boolean;
}

export interface GenerateAdaptiveCoursePayload {
  title: string;
  description: string;
  target_audience?: string;
  duration_weeks?: number;
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
  question_count: number;
}

export interface AdaptiveCourseJobTreeModule {
  id: number;
  weekno: number;
  title: string;
  submodules: AdaptiveCourseJobTreeSubmodule[];
}

export interface AdaptiveCourseJobLogEntry {
  id: number;
  skill: string;
  difficulty: string;
  text: string;
}

export interface AdaptiveCourseJobStats {
  submodules_total: number;
  submodules_done: number;
  questions_planned: number;
  questions_generated: number;
  by_difficulty: Record<string, number>;
  elapsed_seconds: number;
}

export interface AdaptiveCourseSkill {
  skill: string;
  question_count: number;
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

export interface AdminAdaptiveCourseSubModule {
  id: number;
  order: number;
  title: string;
  description: string;
  quizzes: AdminAdaptiveCourseQuiz[];
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
  created_at: string;
  updated_at: string;
}

export interface AdminAdaptiveCourseDetail extends AdminAdaptiveCourseListItem {
  modules: AdminAdaptiveCourseModule[];
  skills: AdaptiveCourseSkill[];
}

export const adminAdaptiveCourseService = {
  async generateCourse(payload: GenerateAdaptiveCoursePayload): Promise<AdaptiveCourseJobDetail> {
    const { data } = await apiClient.post<AdaptiveCourseJobDetail>(
      `${BASE}/courses/generate/`,
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

  async publishCourse(courseId: number): Promise<{ course_id: number; is_published: boolean }> {
    const { data } = await apiClient.post(`${BASE}/courses/${courseId}/publish/`, {});
    return data;
  },

  async deleteCourse(courseId: number): Promise<void> {
    await apiClient.delete(`${BASE}/courses/${courseId}/`);
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
};
