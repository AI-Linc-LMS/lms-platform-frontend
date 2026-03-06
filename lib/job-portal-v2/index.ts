/**
 * Job Portal V2 – public API.
 * Re-export service, types, and constants for a single import path.
 */

export {
  jobPortalV2StudentService,
  jobPortalV2AdminService,
  getApiErrorMessage,
} from "../services/job-portal-v2.service";

export type {
  Job,
  Application,
  ApplicationStatus,
  JobType,
  Pagination,
  JobsListResponse,
  ApplicationsListResponse,
  BrowseJobsParams,
  MyApplicationsParams,
  AdminJobsListParams,
  AdminApplicationsListParams,
  CreateJobPayload,
  ApplyPayload,
  BulkUpdateStatusPayload,
  EligibilityCriteria,
  DashboardResponse,
  WeeklyReportResponse,
} from "../services/job-portal-v2.service";

export { JOB_PORTAL_PAGE_SIZE, JOB_PORTAL_ADMIN_ROLES } from "./constants";
export type { JobPortalAdminRole } from "./constants";
