import apiClient from "../api";
import { AxiosError } from "axios";

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

export interface AssessmentEmailJob {
  id?: number;
  task_id: string;
  assessment_id?: number;
  assessment_title?: string;
  task_name?: string;
  subject?: string;
  status: string;
  created_at: string;
  total_emails?: number;
  successful_count?: number;
  failed_count?: number;
  [key: string]: unknown;
}

export interface AssessmentEmailJobDetail {
  id?: number;
  task_id: string;
  assessment_id?: number;
  task_name?: string;
  subject?: string;
  emails?: Array<{ name: string; email: string }>;
  email_body?: string;
  successful_emails?: Array<{ name: string; email: string }>;
  failed_emails?: Array<{ name: string; email: string }>;
  status: string;
  total_emails?: number;
  successful_count?: number;
  failed_count?: number;
  created_at: string;
  [key: string]: unknown;
}

const basePath = (clientId: string | number) =>
  `/admin-dashboard/api/clients/${clientId}/assessment-email-jobs`;

/**
 * List assessment email jobs
 * GET /admin-dashboard/api/clients/{client_id}/assessment-email-jobs/
 */
export const getAssessmentEmailJobs = async (
  clientId: string | number
): Promise<AssessmentEmailJob[]> => {
  try {
    const response = await apiClient.get(`${basePath(clientId)}/list`);
    const data = response.data;
    return Array.isArray(data) ? data : data?.results ?? [];
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (typeof error.response?.data?.detail === "string"
        ? error.response.data.detail
        : "Failed to fetch assessment email jobs");
    throw new Error(message);
  }
};

/**
 * Get assessment email job detail / status
 * GET /admin-dashboard/clients/{client_id}/assessment-email-jobs/{task_id}
 */
export const getAssessmentEmailJobDetail = async (
  clientId: string | number,
  taskId: string
): Promise<AssessmentEmailJobDetail> => {
  try {
    const response = await apiClient.get(
      `${basePath(clientId)}/${taskId}`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (typeof error.response?.data?.detail === "string"
        ? error.response.data.detail
        : "Failed to fetch job details");
    throw new Error(message);
  }
};

export interface CreateAssessmentEmailJobParams {
  assessment_id: number;
  subject: string;
  email_body: string;
}

/**
 * Create (trigger) assessment email job - first time only
 * POST /admin-dashboard/api/clients/{client_id}/assessment-email-jobs/
 */
export const createAssessmentEmailJob = async (
  clientId: string | number,
  params: CreateAssessmentEmailJobParams
): Promise<{ task_id: string; status?: string }> => {
  try {
    const response = await apiClient.post(`${basePath(clientId)}/`, params);
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (typeof error.response?.data?.detail === "string"
        ? error.response.data.detail
        : "Failed to trigger email job");
    throw new Error(message);
  }
};

/**
 * Retry failed assessment email job
 * POST /admin-dashboard/clients/{client_id}/assessment-email-jobs/{task_id}/retry/
 */
export const retryAssessmentEmailJob = async (
  clientId: string | number,
  taskId: string
): Promise<{ task_id: string; status?: string }> => {
  try {
    const response = await apiClient.post(
      `${basePath(clientId)}/${taskId}/retry/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (typeof error.response?.data?.detail === "string"
        ? error.response.data.detail
        : "Failed to retry email job");
    throw new Error(message);
  }
};

export const adminAssessmentEmailJobsService = {
  getAssessmentEmailJobs,
  getAssessmentEmailJobDetail,
  createAssessmentEmailJob,
  retryAssessmentEmailJob,
};
