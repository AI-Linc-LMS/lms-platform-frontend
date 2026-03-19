import apiClient from "../api";
import { config } from "../../config";
import { AxiosError } from "axios";
import type { JobV2 } from "../jobs-v2.service";
import type { JobApplicationV2 } from "../jobs-v2.service";

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

export interface JobCreateUpdatePayload {
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
  is_published?: boolean;
  status?: "active" | "inactive" | "closed" | "completed";
  application_deadline?: string | null;
  number_of_openings?: number | null;
  applicable_passout_year?: string | null;
  min_10th_percentage?: number | null;
  min_12th_percentage?: number | null;
  min_graduation_percentage?: number | null;
  college_mappings?: Array<{
    college_name: string;
    department?: string;
    batch?: string;
  }>;
  course_ids?: number[];
  question_ids?: number[];
}

export interface JobQuestionV2 {
  id: number;
  question_text: string;
  question_type: string;
  is_required: boolean;
  order: number;
  options?: string[];
  created_at?: string;
}

const getClientId = () => String(config.clientId);

export const adminJobsV2Service = {
  getJob: async (
    jobId: number,
    clientId?: string | number
  ): Promise<JobV2 & { college_mappings?: Array<{ id?: number; college_name: string; department?: string; batch?: string }> }> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.get<JobV2 & { college_mappings?: Array<{ id?: number; college_name: string }> }>(
        `/jobs-v2/api/admin/jobs/${jobId}/`,
        { params: { client_id: cid } }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to fetch job";
      throw new Error(message);
    }
  },

  getJobs: async (
    clientId?: string | number,
    options?: { status?: "active" | "inactive" | "closed" | "completed" }
  ): Promise<{ results: JobV2[]; count: number }> => {
    const cid = clientId ?? getClientId();
    const params: Record<string, string> = { client_id: String(cid) };
    if (options?.status) params.status = options.status;
    try {
      const response = await apiClient.get<{ results: JobV2[]; count: number }>(
        `/jobs-v2/api/admin/jobs/`,
        { params }
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

  createJob: async (
    payload: JobCreateUpdatePayload,
    clientId?: string | number
  ): Promise<JobV2> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.post<JobV2>(
        `/jobs-v2/api/admin/jobs/`,
        { ...payload, client_id: cid }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        (error.response?.status === 400 && typeof error.response?.data === "object"
          ? Object.entries(error.response.data)
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join("; ")
          : error.response?.data?.detail) ||
        "Failed to create job";
      throw new Error(message);
    }
  },

  updateJob: async (
    jobId: number,
    payload: Partial<JobCreateUpdatePayload>,
    clientId?: string | number
  ): Promise<JobV2> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.put<JobV2>(
        `/jobs-v2/api/admin/jobs/${jobId}/`,
        payload
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to update job";
      throw new Error(message);
    }
  },

  uploadJobJd: async (
    jobId: number,
    file: File,
    clientId?: string | number
  ): Promise<JobV2> => {
    const cid = clientId ?? getClientId();
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post<JobV2>(
      `/jobs-v2/api/admin/jobs/${jobId}/upload-jd/`,
      formData,
      {
        params: { client_id: cid },
      }
    );
    return response.data;
  },

  deleteJob: async (jobId: number, clientId?: string | number): Promise<void> => {
    const cid = clientId ?? getClientId();
    try {
      await apiClient.delete(`/jobs-v2/api/admin/jobs/${jobId}/`, {
        params: { client_id: cid },
      });
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to delete job";
      throw new Error(message);
    }
  },

  getJobApplications: async (
    jobId: number,
    clientId?: string | number,
    options?: { status?: string }
  ): Promise<{ results: JobApplicationV2[]; count: number }> => {
    const cid = clientId ?? getClientId();
    const params = new URLSearchParams();
    params.append("client_id", String(cid));
    if (options?.status) params.append("status", options.status);
    try {
      const response = await apiClient.get<{
        results: JobApplicationV2[];
        count: number;
      }>(`/jobs-v2/api/admin/jobs/${jobId}/applications/?${params.toString()}`);
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

  updateApplicationStatus: async (
    applicationId: number,
    updates: {
      status?: "applying" | "applied" | "shortlisted" | "interview_stage" | "rejected" | "selected";
      drive?: string;
      internal_shortlisting?: string;
      reason_not_shortlisted?: string;
      shortlisted_by_hr?: string;
      round_1?: string;
      round_2?: string;
      round_3?: string;
      round_4?: string;
      offered?: string;
    },
    clientId?: string | number
  ): Promise<JobApplicationV2> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.patch<JobApplicationV2>(
        `/jobs-v2/api/admin/applications/${applicationId}/`,
        updates,
        { params: { client_id: cid } }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to update status";
      throw new Error(message);
    }
  },

  bulkUpdateApplicationStatus: async (
    applicationIds: number[],
    status: "applying" | "applied" | "shortlisted" | "interview_stage" | "rejected" | "selected",
    clientId?: string | number
  ): Promise<{ updated: number }> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.post<{ updated: number }>(
        `/jobs-v2/api/admin/applications/bulk-update/`,
        { application_ids: applicationIds, status, client_id: cid }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to bulk update";
      throw new Error(message);
    }
  },

  exportReport: (filters?: {
    job_id?: number;
    status?: string;
  }): string => {
    const cid = getClientId();
    const params = new URLSearchParams();
    params.append("client_id", cid);
    if (filters?.job_id) params.append("job_id", String(filters.job_id));
    if (filters?.status) params.append("status", filters.status);
    return `${config.apiBaseUrl}/jobs-v2/api/admin/reports/export/?${params.toString()}`;
  },

  downloadExportReport: async (filters?: {
    job_id?: number;
    status?: string;
  }): Promise<void> => {
    const cid = getClientId();
    const params = new URLSearchParams();
    params.append("client_id", cid);
    if (filters?.job_id) params.append("job_id", String(filters.job_id));
    if (filters?.status) params.append("status", filters.status ?? "");
    const response = await apiClient.get<Blob>(
      `/jobs-v2/api/admin/reports/export/?${params.toString()}`,
      { responseType: "blob" }
    );
    const contentDisposition = response.headers["content-disposition"];
    let filename = `jobs_v2_report_${new Date().toISOString().slice(0, 10)}.csv`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";\n]+)"?/);
      if (match) filename = match[1].trim();
    }
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getQuestions: async (clientId?: string | number): Promise<JobQuestionV2[]> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.get<JobQuestionV2[]>(
        `/jobs-v2/api/admin/questions/`,
        { params: { client_id: cid } }
      );
      return response.data ?? [];
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to fetch questions";
      throw new Error(message);
    }
  },

  importQuestionsFromCsv: async (file: File, clientId?: string | number): Promise<{ created: number }> => {
    const cid = clientId ?? getClientId();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", String(cid));
    const response = await apiClient.post<{ created: number }>(
      `/jobs-v2/api/admin/questions/import/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  importApplicationStatusFromCsv: async (
    file: File,
    clientId?: string | number
  ): Promise<{ updated: number }> => {
    const cid = clientId ?? getClientId();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", String(cid));
    const response = await apiClient.post<{ updated: number }>(
      `/jobs-v2/api/admin/applications/import-status/`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  },

  createQuestion: async (
    data: {
      question_text: string;
      question_type?: string;
      is_required?: boolean;
      order?: number;
      options?: string[];
    },
    clientId?: string | number
  ): Promise<JobQuestionV2> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.post<JobQuestionV2>(
        `/jobs-v2/api/admin/questions/`,
        { ...data, client_id: cid }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to create question";
      throw new Error(message);
    }
  },
};
