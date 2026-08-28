import apiClient from "../api";
import { config } from "../../config";
import { AxiosError } from "axios";

export interface ApiErrorPayload {
  error?: string;
  message?: string;
  detail?: string;
  [key: string]: unknown;
}

/** Where the scraper found the job. */
export type ScrapedJobSourceKind =
  | "greenhouse"
  | "lever"
  | "smartrecruiters"
  | "ashby"
  | "workday"
  | "jsearch"
  | "claude_page";

export type ScrapedJobStatus = "new" | "ready" | "irrelevant" | "expired";

export interface ScrapedJobDecision {
  decision: "imported" | "dismissed";
  decided_at: string;
  /** The draft JobV2 created on import; null for dismissals. */
  job_id: number | null;
  /** True when the original posting has since closed at the source. */
  source_expired: boolean;
}

export interface ScrapedJob {
  id: number;
  source_kind: string;
  source_name: string;
  external_id: string;
  job_title: string;
  company_name: string;
  company_logo: string | null;
  location: string | null;
  salary: string | null;
  employment_type: string | null;
  years_of_experience: string | null;
  job_type: string | null;
  apply_url: string | null;
  mandatory_skills: string[];
  key_skills: string[];
  /** Enrichment-classified job metadata - may be empty strings. */
  department: string;
  industry_type: string;
  role_category: string;
  education: string;
  description_preview: string;
  /** 0..1 relevance score from enrichment; null while un-enriched. */
  relevance: number | null;
  relevance_reason: string | null;
  suggested_course_titles: string[];
  status: ScrapedJobStatus;
  first_seen_at: string;
  last_seen_at: string;
  enriched_at: string | null;
  decision: ScrapedJobDecision | null;
}

/** Detail endpoint adds the full description + company blurb. */
export interface ScrapedJobDetail extends ScrapedJob {
  job_description: string;
  company_info: string | null;
}

export type ScrapedJobsTab = "review" | "imported" | "dismissed" | "irrelevant";

export interface ScrapedJobsCounts {
  review: number;
  imported: number;
  dismissed: number;
  irrelevant: number;
  expired: number;
}

export interface ScrapedJobsListResponse {
  counts: ScrapedJobsCounts;
  count: number;
  page: number;
  page_size: number;
  results: ScrapedJob[];
}

const getClientId = () => String(config.clientId);

export const adminScrapedJobsService = {
  getScrapedJobs: async (
    clientId?: string | number,
    options?: {
      tab?: ScrapedJobsTab;
      search?: string;
      source_kind?: string;
      page?: number;
      page_size?: number;
    }
  ): Promise<ScrapedJobsListResponse> => {
    const cid = clientId ?? getClientId();
    const params: Record<string, string> = { client_id: String(cid) };
    if (options?.tab) params.tab = options.tab;
    if (options?.search) params.search = options.search;
    if (options?.source_kind) params.source_kind = options.source_kind;
    if (options?.page) params.page = String(options.page);
    if (options?.page_size) params.page_size = String(options.page_size);
    try {
      const response = await apiClient.get<ScrapedJobsListResponse>(
        `/jobs-v2/api/admin/scraped-jobs/`,
        { params }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to fetch scraped jobs";
      throw new Error(message);
    }
  },

  getScrapedJob: async (
    scrapedJobId: number,
    clientId?: string | number
  ): Promise<ScrapedJobDetail> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.get<ScrapedJobDetail>(
        `/jobs-v2/api/admin/scraped-jobs/${scrapedJobId}/`,
        { params: { client_id: cid } }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to fetch scraped job";
      throw new Error(message);
    }
  },

  dismissScrapedJob: async (
    scrapedJobId: number,
    clientId?: string | number
  ): Promise<void> => {
    const cid = clientId ?? getClientId();
    try {
      await apiClient.post(
        `/jobs-v2/api/admin/scraped-jobs/${scrapedJobId}/dismiss/`,
        { client_id: cid }
      );
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to dismiss scraped job";
      throw new Error(message);
    }
  },

  restoreScrapedJob: async (
    scrapedJobId: number,
    clientId?: string | number
  ): Promise<void> => {
    const cid = clientId ?? getClientId();
    try {
      await apiClient.post(
        `/jobs-v2/api/admin/scraped-jobs/${scrapedJobId}/restore/`,
        { client_id: cid }
      );
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to restore scraped job";
      throw new Error(message);
    }
  },

  bulkDismissScrapedJobs: async (
    scrapedJobIds: number[],
    clientId?: string | number
  ): Promise<{ dismissed: number }> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.post<{ dismissed: number }>(
        `/jobs-v2/api/admin/scraped-jobs/bulk-dismiss/`,
        { client_id: cid, ids: scrapedJobIds }
      );
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to bulk dismiss scraped jobs";
      throw new Error(message);
    }
  },

  /** Imports the given staging rows as UNPUBLISHED draft jobs with no targeting. */
  bulkImportScrapedJobs: async (
    scrapedJobIds: number[],
    clientId?: string | number
  ): Promise<{ imported: number; job_ids: number[]; skipped: number[] }> => {
    const cid = clientId ?? getClientId();
    try {
      const response = await apiClient.post<{
        imported: number;
        job_ids: number[];
        skipped: number[];
      }>(`/jobs-v2/api/admin/scraped-jobs/bulk-import/`, {
        client_id: cid,
        ids: scrapedJobIds,
      });
      return response.data;
    } catch (err) {
      const error = err as AxiosError<ApiErrorPayload>;
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to import scraped jobs";
      throw new Error(message);
    }
  },
};
