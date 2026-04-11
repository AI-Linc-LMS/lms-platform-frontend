import type { Job, JobFilters } from "@/lib/services/jobs.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";

export type JobsV2BrowseLayoutProps = {
  searchInput: string;
  locationInput: string;
  experienceInput: string;
  locationOptions: string[];
  compatibleFilters: {
    location?: string;
    job_type?: string;
    employment_type?: string;
    experience?: string;
    search?: string;
    skills?: string[];
    posted_within?: string;
  };
  jobsForFilters: Job[];
  handleSearchInputChange: (value: string) => void;
  handleSearchClear: () => void;
  handleSearchClick: () => void;
  setLocationInput: (v: string) => void;
  setExperienceInput: (v: string) => void;
  navigateToListPage: (nextPage: number, opts?: { replace?: boolean }) => void;
  handleFilterChange: (key: keyof JobFilters, value: string | string[]) => void;
  handleClearAllFilters: () => void;
  activeTab: "browse" | "applied";
  setActiveTab: (v: "browse" | "applied") => void;
  loading: boolean;
  paginatedJobs: JobV2[];
  filteredJobsLength: number;
  pageSize: number;
  page: number;
  pageFromQuery: number;
  handlePageChange: (e: unknown, value: number) => void;
  handlePageSizeChange: (size: number) => void;
  handleFavoriteChange: (jobId: number, favorited: boolean) => void;
};
