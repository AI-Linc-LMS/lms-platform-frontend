import apiClient from "./api";
import { config } from "../config";

const clientId = config.clientId;

// Base URLs
const ADMIN_BASE = `/admin-dashboard/api/clients/${clientId}/jobs`;
const STUDENT_BASE = `/job-portal-v2/api/clients/${clientId}`;

// Types from spec
export type ApplicationStatus = "applied" | "shortlisted" | "rejected" | "selected";
export type JobType = "job" | "internship";

export interface EligibilityCriteria {
  min_graduation_year?: number;
  branches?: string[];
  degree_types?: string[];
}

export interface Job {
  id: number;
  role: string;
  company_name: string;
  company_logo: string | null;
  job_description: string;
  eligibility_criteria?: EligibilityCriteria;
  compensation: string | null;
  location: string | null;
  application_deadline: string | null;
  job_type: JobType;
  tags: string[];
  is_published?: boolean;
  target_courses?: number[];
  target_all_students?: boolean;
  created_at: string;
  updated_at: string;
  already_applied?: boolean;
}

export interface Application {
  id: number;
  job: number;
  job_role?: string;
  job_company_name?: string;
  applicant: number;
  applicant_name: string;
  applicant_email: string;
  status: ApplicationStatus;
  resume_url: string | null;
  cover_letter: string | null;
  applied_at: string;
  status_updated_at: string;
  created_at: string;
  updated_at: string;
}

export interface Pagination {
  current_page: number;
  total_pages: number;
  total: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface JobsListResponse {
  jobs: Job[];
  count: number;
  pagination: Pagination;
}

export interface ApplicationsListResponse {
  applications: Application[];
  count: number;
  pagination: Pagination;
}

// Student params
export interface BrowseJobsParams {
  job_type?: JobType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MyApplicationsParams {
  status?: ApplicationStatus;
  page?: number;
  limit?: number;
}

// Admin params
export interface AdminJobsListParams {
  is_published?: boolean;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface AdminApplicationsListParams {
  status?: ApplicationStatus;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface CreateJobPayload {
  role: string;
  company_name: string;
  company_logo?: string;
  job_description: string;
  eligibility_criteria?: EligibilityCriteria;
  compensation?: string;
  location?: string;
  application_deadline?: string;
  job_type?: JobType;
  tags?: string[];
  is_published?: boolean;
  target_all_students?: boolean;
  target_courses?: number[];
}

export interface ApplyPayload {
  resume_url?: string;
  cover_letter?: string;
}

export interface BulkUpdateStatusPayload {
  application_ids: number[];
  status: ApplicationStatus;
}

// Dashboard types
export interface DashboardOverview {
  total_jobs: number;
  published_jobs: number;
  total_applications: number;
  status_breakdown: Record<ApplicationStatus, number>;
}

export interface DailyTrendItem {
  date: string;
  applications: number;
}

export interface TopJobItem {
  id: number;
  role: string;
  company_name: string;
  application_count: number;
}

export interface DashboardResponse {
  overview: DashboardOverview;
  daily_trend: DailyTrendItem[];
  top_jobs: TopJobItem[];
}

export interface WeeklyReportResponse {
  week_start: string;
  week_end: string;
  new_applications: number;
  new_jds_published: number;
  status_changes: { shortlisted: number; rejected: number; selected: number };
  daily_breakdown: DailyTrendItem[];
}

// Helper to extract error message from API response
export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const res = (error as { response?: { data?: unknown } }).response?.data;
    if (res && typeof res === "object") {
      if ("error" in res && typeof (res as { error: unknown }).error === "string") {
        return (res as { error: string }).error;
      }
      const firstField = Object.values(res as Record<string, unknown>)[0];
      if (Array.isArray(firstField) && firstField[0]) {
        return String(firstField[0]);
      }
    }
  }
  return "An unexpected error occurred.";
}

// Student API
export const jobPortalV2StudentService = {
  getJobs: async (params?: BrowseJobsParams): Promise<JobsListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.job_type) searchParams.append("job_type", params.job_type);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    const qs = searchParams.toString();
    const url = `${STUDENT_BASE}/jobs/${qs ? `?${qs}` : ""}`;
    const res = await apiClient.get<JobsListResponse>(url);
    return res.data;
  },

  getJob: async (jdId: number): Promise<Job> => {
    const res = await apiClient.get<Job>(`${STUDENT_BASE}/jobs/${jdId}/`);
    return res.data;
  },

  apply: async (jdId: number, payload: ApplyPayload): Promise<Application> => {
    const res = await apiClient.post<Application>(
      `${STUDENT_BASE}/jobs/${jdId}/apply/`,
      payload
    );
    return res.data;
  },

  getMyApplications: async (
    params?: MyApplicationsParams
  ): Promise<ApplicationsListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    const qs = searchParams.toString();
    const url = `${STUDENT_BASE}/my-applications/${qs ? `?${qs}` : ""}`;
    const res = await apiClient.get<ApplicationsListResponse>(url);
    return res.data;
  },
};

// Admin API (will be extended in Phase 2)
export const jobPortalV2AdminService = {
  getJobs: async (params?: AdminJobsListParams): Promise<JobsListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.is_published !== undefined)
      searchParams.append("is_published", String(params.is_published));
    if (params?.search) searchParams.append("search", params.search);
    if (params?.sort_by) searchParams.append("sort_by", params.sort_by);
    if (params?.sort_order) searchParams.append("sort_order", params.sort_order);
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    const qs = searchParams.toString();
    const url = `${ADMIN_BASE}/${qs ? `?${qs}` : ""}`;
    const res = await apiClient.get<JobsListResponse>(url);
    return res.data;
  },

  createJob: async (payload: CreateJobPayload): Promise<Job> => {
    const res = await apiClient.post<Job>(`${ADMIN_BASE}/`, payload);
    return res.data;
  },

  getJob: async (jdId: number): Promise<Job> => {
    const res = await apiClient.get<Job>(`${ADMIN_BASE}/${jdId}/`);
    return res.data;
  },

  updateJob: async (
    jdId: number,
    payload: Partial<CreateJobPayload>
  ): Promise<Job> => {
    const res = await apiClient.patch<Job>(`${ADMIN_BASE}/${jdId}/`, payload);
    return res.data;
  },

  deleteJob: async (jdId: number): Promise<void> => {
    await apiClient.delete(`${ADMIN_BASE}/${jdId}/`);
  },

  getApplications: async (
    jdId: number,
    params?: AdminApplicationsListParams
  ): Promise<ApplicationsListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.sort_by) searchParams.append("sort_by", params.sort_by);
    if (params?.sort_order)
      searchParams.append("sort_order", params.sort_order);
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    const qs = searchParams.toString();
    const url = `${ADMIN_BASE}/${jdId}/applications/${qs ? `?${qs}` : ""}`;
    const res = await apiClient.get<ApplicationsListResponse>(url);
    return res.data;
  },

  updateApplicationStatus: async (
    jdId: number,
    appId: number,
    status: ApplicationStatus
  ): Promise<Application> => {
    const res = await apiClient.patch<Application>(
      `${ADMIN_BASE}/${jdId}/applications/${appId}/`,
      { status }
    );
    return res.data;
  },

  bulkUpdateStatus: async (payload: BulkUpdateStatusPayload): Promise<void> => {
    await apiClient.post(`${ADMIN_BASE}/applications/bulk-update/`, payload);
  },

  getDashboard: async (days?: number): Promise<DashboardResponse> => {
    const qs = days != null ? `?days=${days}` : "";
    const res = await apiClient.get<DashboardResponse>(
      `${ADMIN_BASE}/dashboard/${qs}`
    );
    return res.data;
  },

  getWeeklyReport: async (
    weekStart?: string,
    weekEnd?: string
  ): Promise<WeeklyReportResponse> => {
    const params = new URLSearchParams();
    if (weekStart) params.append("week_start", weekStart);
    if (weekEnd) params.append("week_end", weekEnd);
    const qs = params.toString();
    const res = await apiClient.get<WeeklyReportResponse>(
      `${ADMIN_BASE}/reports/weekly/${qs ? `?${qs}` : ""}`
    );
    return res.data;
  },

  exportCsv: async (params?: {
    date_from?: string;
    date_to?: string;
    status?: ApplicationStatus;
    jd_id?: number;
  }): Promise<Blob> => {
    const searchParams = new URLSearchParams();
    if (params?.date_from) searchParams.append("date_from", params.date_from);
    if (params?.date_to) searchParams.append("date_to", params.date_to);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.jd_id) searchParams.append("jd_id", String(params.jd_id));
    const qs = searchParams.toString();
    const res = await apiClient.get<Blob>(`${ADMIN_BASE}/reports/export/${qs ? `?${qs}` : ""}`, {
      responseType: "blob",
    });
    return res.data;
  },
};
