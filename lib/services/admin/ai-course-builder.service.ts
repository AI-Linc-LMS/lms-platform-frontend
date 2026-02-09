import apiClient from "../api";
import { config } from "../../config";
import { AxiosError } from "axios";

// Config options for outline generation
export interface OutlineConfig {
  content_types?: string[];
  include_coding_problems?: boolean;
  difficulty_level?: "Easy" | "Medium" | "Hard";
  articles_per_submodule?: number;
  quizzes_per_submodule?: number;
  questions_per_quiz?: number;
  coding_problems_per_submodule?: number;
}

// Option 1 - Basic description payload
export interface GenerateOutlineDescriptionPayload {
  input_type: "description";
  title: string;
  description: string;
  target_audience?: string;
  duration_weeks?: number;
  config?: OutlineConfig;
}

// Structured plan submodule
export interface StructuredSubmodule {
  title: string;
  description: string;
}

// Structured plan module
export interface StructuredModule {
  week: number;
  title: string;
  description?: string;
  submodules: StructuredSubmodule[];
}

// Option 2 - Structured plan payload
export interface GenerateOutlineStructuredPayload {
  input_type: "structured_plan";
  title: string;
  modules: StructuredModule[];
  config?: OutlineConfig;
}

export type GenerateOutlinePayload =
  | GenerateOutlineDescriptionPayload
  | GenerateOutlineStructuredPayload;

// Outline types (API response)
export interface OutlineSubmoduleContentSuggestions {
  article_focus?: string | null;
  quiz_topics?: string | string[] | null;
  coding_problem_type?: string | null;
}

export interface OutlineSubmodule {
  title: string;
  description: string;
  key_concepts?: string[];
  estimated_duration_minutes?: number;
  content_suggestions?: OutlineSubmoduleContentSuggestions;
}

export interface OutlineModule {
  week: number;
  title: string;
  description?: string;
  learning_goals?: string[];
  submodules: OutlineSubmodule[];
}

export interface CourseOutline {
  course_title: string;
  course_description: string;
  learning_objectives?: string[];
  prerequisites?: string[];
  modules: OutlineModule[];
  total_estimated_hours?: number;
  skills_covered?: string[];
}

// Job list item (GET jobs/)
export interface CourseBuilderJobListItem {
  id: number;
  job_id: string;
  status: string;
  input_type: string;
  course_title?: string;
  total_content_items?: number;
  completed_content_items?: number;
  progress_percentage?: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// Full job (generate-outline response, get job details)
export interface CourseBuilderJob {
  id: number;
  job_id: string;
  client: number;
  created_by?: number;
  status: string;
  input_type: string;
  input_data?: Record<string, unknown>;
  config?: OutlineConfig;
  outline?: CourseOutline | null;
  generated_course_id?: number | null;
  generated_course_slug?: string | null;
  total_content_items?: number;
  completed_content_items?: number;
  progress_percentage?: number;
  error_log?: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// Content task (job detail)
export interface ContentTask {
  id: number;
  job: number;
  content: number | null;
  submodule: number;
  submodule_title: string;
  content_type: string;
  order: number;
  status: string;
  topic_context?: string;
  validation_status?: string;
  validation_errors?: string[];
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface JobDetailResponse {
  job: CourseBuilderJob;
  content_tasks: ContentTask[];
  pending_tasks: number;
  generating_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
}

// Approve outline body
export interface ApproveOutlineBody {
  modified_outline?: CourseOutline | null;
  slug?: string;
  thumbnail?: string;
  published?: boolean;
}

interface ApiErrorPayload {
  detail?: string;
  error?: string;
  message?: string;
  [key: string]: unknown;
}

const getBasePath = () =>
  `/admin-dashboard/api/clients/${config.clientId}/course-builder`;

function getErrorMessage(error: unknown): string {
  const apiError = error as AxiosError<ApiErrorPayload>;
  return (
    apiError.response?.data?.detail ||
    apiError.response?.data?.error ||
    (typeof apiError.response?.data?.message === "string"
      ? apiError.response.data.message
      : undefined) ||
    (apiError instanceof Error ? apiError.message : "Request failed")
  );
}

export const aiCourseBuilderService = {
  generateOutline: async (
    payload: GenerateOutlinePayload
  ): Promise<CourseBuilderJob> => {
    try {
      const res = await apiClient.post(
        `${getBasePath()}/generate-outline/`,
        payload
      );
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  listJobs: async (
    status?: string
  ): Promise<CourseBuilderJobListItem[]> => {
    try {
      const params = status ? { status } : {};
      const res = await apiClient.get(`${getBasePath()}/jobs/`, { params });
      return Array.isArray(res.data) ? res.data : [];
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  getJobDetails: async (jobId: string): Promise<JobDetailResponse> => {
    try {
      const res = await apiClient.get(
        `${getBasePath()}/jobs/${encodeURIComponent(jobId)}/`
      );
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  regenerateOutline: async (jobId: string): Promise<CourseBuilderJob> => {
    try {
      const res = await apiClient.post(
        `${getBasePath()}/jobs/${encodeURIComponent(jobId)}/regenerate-outline/`,
        {}
      );
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  approveOutline: async (
    jobId: string,
    body?: ApproveOutlineBody
  ): Promise<{ message: string; job: CourseBuilderJob; course_id: number; course_slug: string }> => {
    try {
      const res = await apiClient.post(
        `${getBasePath()}/jobs/${encodeURIComponent(jobId)}/approve-outline/`,
        body ?? {}
      );
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  generateAllContent: async (
    jobId: string
  ): Promise<{
    message: string;
    job_id: string;
    pending_tasks: number;
    status: string;
  }> => {
    try {
      const res = await apiClient.post(
        `${getBasePath()}/jobs/${encodeURIComponent(jobId)}/generate-all-content/`,
        {}
      );
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  generateModuleContent: async (
    jobId: string,
    moduleId: number
  ): Promise<{
    message: string;
    job_id: string;
    module_id: number;
    pending_tasks: number;
  }> => {
    try {
      const res = await apiClient.post(
        `${getBasePath()}/jobs/${encodeURIComponent(jobId)}/generate-module-content/${moduleId}/`,
        {}
      );
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  generateSubmoduleContent: async (
    jobId: string,
    submoduleId: number
  ): Promise<{
    message: string;
    job_id: string;
    submodule_id: number;
    pending_tasks: number;
  }> => {
    try {
      const res = await apiClient.post(
        `${getBasePath()}/jobs/${encodeURIComponent(jobId)}/generate-submodule-content/${submoduleId}/`,
        {}
      );
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  regenerateModule: async (
    moduleId: number
  ): Promise<{ message: string; module_id: number; tasks_queued: number }> => {
    try {
      const res = await apiClient.post(
        `${getBasePath()}/regenerate/module/${moduleId}/`,
        {}
      );
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  regenerateSubmodule: async (
    submoduleId: number
  ): Promise<{
    message: string;
    submodule_id: number;
    tasks_queued: number;
  }> => {
    try {
      const res = await apiClient.post(
        `${getBasePath()}/regenerate/submodule/${submoduleId}/`,
        {}
      );
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  regenerateContent: async (
    contentId: number
  ): Promise<{ message: string; content_id: number; task_id: number }> => {
    try {
      const res = await apiClient.post(
        `${getBasePath()}/regenerate/content/${contentId}/`,
        {}
      );
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  regenerateTask: async (
    taskId: number
  ): Promise<{
    message: string;
    task_id: number;
    content_type?: string;
    submodule?: string;
  }> => {
    try {
      const res = await apiClient.post(
        `${getBasePath()}/regenerate/task/${taskId}/`,
        {}
      );
      return res.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
