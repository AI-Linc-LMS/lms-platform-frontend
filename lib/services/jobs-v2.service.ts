import apiClient from "./api";
import { config } from "../config";
import { AxiosError } from "axios";
import {
  getExternalJobById,
  isLikelyExternalJsonSyntheticId,
} from "../jobs/external-json-jobs-store";
import { fetchAndMapExternalJsonJobs } from "../jobs/external-job-json-feed";

export interface JobV2 {
  id: number;
  job_title: string;
  company_name: string;
  company_logo?: string;
  company_info?: string;
  job_description?: string;
  role_process?: string;
  mandatory_skills?: string[];
  key_skills?: string[];
  industry_type?: string;
  department?: string;
  employment_type?: string;
  role_category?: string;
  education?: string;
  ug_requirements?: string;
  pg_requirements?: string;
  location?: string;
  years_of_experience?: string;
  salary?: string;
  apply_link?: string;
  job_type?: string;
  status?: "active" | "inactive" | "closed" | "completed" | "on_hold";
  application_deadline?: string;
  jd_file_url?: string;
  number_of_openings?: number | null;
  applicable_passout_year?: string | number | null;
  min_10th_percentage?: number | null;
  min_12th_percentage?: number | null;
  min_graduation_percentage?: number | null;
  tags?: string[];
  created_at?: string;
  is_published?: boolean;
  eligible_to_apply?: boolean;
  is_favourited?: boolean;
  has_applied?: boolean;
  favorites_count?: number;
  applications_count?: number;
  courses?: Array<{ id: number; title: string }>;
  college_mappings?: Array<{ id?: number; college_name: string; department?: string; batch?: string }>;
  questions?: Array<{
    id: number;
    question_text: string;
    question_type: string;
    is_required: boolean;
    order: number;
    options?: string[];
  }>;
  question_ids?: number[];
  /** Set only for client-merged static JSON feed listings (not from API). Legacy value `april11` may appear in old data. */
  listing_source?: "api" | "external_json" | "april11" | "job_scraper";
  /** Optional AI-generated copy (enriched JSON or on-demand API). */
  ai_summary?: string;
  ai_highlights?: string[];
}

/** Normalizes API `applicable_passout_year` for UI (string or number from JSON). */
export function formatJobPassoutYear(
  value: JobV2["applicable_passout_year"]
): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

export interface JobV2Filters {
  client_id?: string | number;
  location?: string;
  job_type?: string;
  employment_type?: string;
  search?: string;
}

export interface JobsV2Response {
  results: JobV2[];
  count: number;
}

export interface JobApplicationV2 {
  id: number;
  job: number;
  job_title: string;
  company_name: string;
  student: number;
  student_name: string;
  student_email: string;
  student_profile_pic_url?: string | null;
  student_phone?: string;
  student_college?: string;
  student_degree?: string;
  student_batch?: string;
  student_yop?: number | null;
  student_location?: string;
  student_skills?: string;
  student_experience?: string;
  status: "applying" | "applied" | "shortlisted" | "interview_stage" | "rejected" | "selected";
  resume_url?: string;
  drive?: string;
  internal_shortlisting?: string;
  reason_not_shortlisted?: string;
  shortlisted_by_hr?: string;
  round_1?: string;
  round_2?: string;
  round_3?: string;
  round_4?: string;
  offered?: string;
  applied_at: string;
  updated_at: string;
}

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

export const jobsV2Service = {
  getJobs: async (filters?: JobV2Filters): Promise<JobsV2Response> => {
    const clientId = filters?.client_id ?? config.clientId;
    const params = new URLSearchParams();
    params.append("client_id", String(clientId));
    if (filters?.location) params.append("location", filters.location);
    if (filters?.job_type) params.append("job_type", filters.job_type);
    if (filters?.employment_type) params.append("employment_type", filters.employment_type);
    if (filters?.search) params.append("search", filters.search);

    try {
      const response = await apiClient.get<JobsV2Response>(
        `/jobs-v2/api/jobs/?${params.toString()}`
      );
      return {
        results: response.data?.results ?? [],
        count: response.data?.count ?? 0,
      };
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to fetch jobs";
      throw new Error(message);
    }
  },

  getJobById: async (id: number): Promise<JobV2 | null> => {
    const fromStore = getExternalJobById(id);
    if (fromStore) return fromStore;

    if (isLikelyExternalJsonSyntheticId(id)) {
      await fetchAndMapExternalJsonJobs().catch(() => undefined);
      return getExternalJobById(id) ?? null;
    }

    try {
      const response = await apiClient.get<JobV2>(`/jobs-v2/api/jobs/${id}/`);
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      if (error.response?.status === 404) {
        return null;
      }
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to fetch job";
      throw new Error(message);
    }
  },

  applyForJob: async (
    jobId: number,
    payload?: {
      resume_url?: string;
      saved_resume_id?: number;
      responses?: Array<{ question_id: number; response_text: string }>;
      client_id?: string | number;
      external?: boolean;
    }
  ): Promise<{ id: number; status: string }> => {
    const clientId = payload?.client_id ?? config.clientId;
    try {
      const response = await apiClient.post<{ id: number; status: string }>(
        `/jobs-v2/api/jobs/${jobId}/apply/`,
        {
          client_id: clientId,
          resume_url: payload?.resume_url,
          saved_resume_id: payload?.saved_resume_id,
          responses: payload?.responses,
          external: payload?.external ?? false,
        }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to apply";
      throw new Error(message);
    }
  },

  toggleFavorite: async (
    jobId: number,
    clientId?: string | number
  ): Promise<{ favorited: boolean; message?: string }> => {
    const cid = clientId ?? config.clientId;
    try {
      const response = await apiClient.post<{ favorited: boolean; message?: string }>(
        `/jobs-v2/api/jobs/${jobId}/favorite/`,
        { client_id: cid }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to update favorite";
      throw new Error(message);
    }
  },

  confirmApplied: async (applicationId: number): Promise<JobApplicationV2> => {
    try {
      const response = await apiClient.patch<JobApplicationV2>(
        `/jobs-v2/api/applications/me/${applicationId}/confirm-applied/`
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to confirm application";
      throw new Error(message);
    }
  },

  getMyApplications: async (): Promise<{
    results: JobApplicationV2[];
    count: number;
  }> => {
    const params = new URLSearchParams();
    params.append("client_id", String(config.clientId));
    try {
      const response = await apiClient.get<{
        results: JobApplicationV2[];
        count: number;
      }>(`/jobs-v2/api/applications/me/?${params.toString()}`);
      return {
        results: response.data?.results ?? [],
        count: response.data?.count ?? 0,
      };
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to fetch applications";
      throw new Error(message);
    }
  },
};
