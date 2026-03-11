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
  application_deadline?: string | null;
  college_mappings?: Array<{
    college_name: string;
    department?: string;
    batch?: string;
  }>;
  course_ids?: number[];
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

  getJobs: async (clientId?: string | number): Promise<{ results: JobV2[]; count: number }> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.get<{ results: JobV2[]; count: number }>(
        `/jobs-v2/api/admin/jobs/`,
        { params: { client_id: cid } }
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
    clientId?: string | number
  ): Promise<{ results: JobApplicationV2[]; count: number }> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.get<{
        results: JobApplicationV2[];
        count: number;
      }>(`/jobs-v2/api/admin/jobs/${jobId}/applications/?client_id=${cid}`);
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
    status: "applying" | "applied" | "shortlisted" | "rejected" | "selected",
    clientId?: string | number
  ): Promise<JobApplicationV2> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.patch<JobApplicationV2>(
        `/jobs-v2/api/admin/applications/${applicationId}/`,
        { status },
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
    status: "applying" | "applied" | "shortlisted" | "rejected" | "selected",
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
};
