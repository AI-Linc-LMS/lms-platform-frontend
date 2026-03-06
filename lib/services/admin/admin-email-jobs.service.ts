import apiClient from "../api";
import { config } from "../../config";
import { AxiosError } from "axios";

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

export interface EmailRecipient {
  name: string;
  email: string;
}

export interface EmailJob {
  id?: number;
  task_id: string;
  task_name?: string;
  subject: string;
  status: string;
  created_at: string;
  [key: string]: unknown;
}

export interface EmailJobDetail {
  id?: number;
  task_id: string;
  task_name?: string;
  emails: EmailRecipient[];
  subject: string;
  email_body?: string;
  successful_emails: EmailRecipient[];
  failed_emails: EmailRecipient[];
  status: string;
  created_at: string;
  /** @deprecated use emails */
  body?: string;
  /** @deprecated use emails.length */
  recipients_count?: number;
  /** @deprecated use successful_emails.length */
  sent_count?: number;
  /** @deprecated use failed_emails.length */
  failed_count?: number;
  completed_at?: string;
  [key: string]: unknown;
}

/**
 * List email jobs
 * GET /admin-dashboard/api/clients/{client_id}/email-jobs/
 */
export const getEmailJobs = async (
  clientId: string | number
): Promise<EmailJob[]> => {
  try {
    const response = await apiClient.get(
      `/admin-dashboard/api/clients/${clientId}/email-jobs/`
    );
    const data = response.data;
    return Array.isArray(data) ? data : data?.results ?? [];
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (typeof error.response?.data?.detail === "string"
        ? error.response.data.detail
        : "Failed to fetch email jobs");
    throw new Error(message);
  }
};

/**
 * Get email job detail
 * GET /admin-dashboard/api/clients/{client_id}/email-jobs/{task_id}/
 */
export const getEmailJobDetail = async (
  clientId: string | number,
  taskId: string
): Promise<EmailJobDetail> => {
  try {
    const response = await apiClient.get(
      `/admin-dashboard/api/clients/${clientId}/email-jobs/${taskId}/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (typeof error.response?.data?.detail === "string"
        ? error.response.data.detail
        : "Failed to fetch email job details");
    throw new Error(message);
  }
};

/**
 * Resend/retry email job
 * POST /admin-dashboard/api/clients/{client_id}/email-resend-jobs/{task_id}/
 */
export const resendEmailJob = async (
  clientId: string | number,
  taskId: string
): Promise<{ task_id: string; status: string; message?: string }> => {
  try {
    const response = await apiClient.post(
      `/admin-dashboard/api/clients/${clientId}/email-resend-jobs/${taskId}/`
    );
    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorPayload>;
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      (typeof error.response?.data?.detail === "string"
        ? error.response.data.detail
        : "Failed to resend email job");
    throw new Error(message);
  }
};

export const adminEmailJobsService = {
  getEmailJobs,
  getEmailJobDetail,
  resendEmailJob,
};
