"use client";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Box, LinearProgress } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { JobsV2BrowseDesktop } from "@/components/jobs-v2/JobsV2BrowseDesktop";
import { JobsV2BrowseMobile } from "@/components/jobs-v2/JobsV2BrowseMobile";
import type { Job, JobFilters } from "@/lib/services/jobs.service";
import { jobsV2Service, JobV2, JobV2Filters } from "@/lib/services/jobs-v2.service";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import { fetchAndMapExternalJsonJobs } from "@/lib/jobs/external-job-json-feed";
import {
  mergeApiJobsWithExternalJson,
  syncExternalJsonJobFavoriteFlags,
  filterStudentVisibleFeedJobs,
  subscribeStudentFeedSuppression,
} from "@/lib/jobs/external-json-jobs-store";
import {
  jobMatchesPostedWithin,
  clearJobsV2PendingListRestore,
  persistJobsV2BrowsePage,
  tryRestoreJobsV2ListPageFromDetailReturn,
} from "@/lib/jobs/jobs-v2-browse-page";

const ITEMS_PER_PAGE = 10;

function parseExperienceRange(str: string | null | undefined): { min: number; max: number } | null {
  if (!str || typeof str !== "string") return null;
  const s = str.toLowerCase().trim();
  if (!s) return null;

  if (/fresher|entry\s*level|0\s*[-–—to]+\s*1|upto\s*1|less\s*than\s*1/.test(s)) {
    return { min: 0, max: 1 };
  }

  const rangeMatch = s.match(/(\d+)\s*[-–—to]+\s*(\d+)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1], 10);
    const max = parseInt(rangeMatch[2], 10);
    return { min, max: Math.max(min, max) };
  }

  const plusMatch = s.match(/(\d+)\s*\+/);
  if (plusMatch) {
    const min = parseInt(plusMatch[1], 10);
    return { min, max: 99 };
  }

  const singleMatch = s.match(/(\d+)\s*(?:year|yr|y\.?)?s?/i) || s.match(/\b(\d+)\b/);
  if (singleMatch) {
    const n = parseInt(singleMatch[1], 10);
    return { min: n, max: n };
  }

  return null;
}

function experienceMatchesFilter(jobExp: string | null | undefined, filterExp: string): boolean {
  const filterRanges: Record<string, { min: number; max: number }> = {
    "0-1": { min: 0, max: 1 },
    "1-3": { min: 1, max: 3 },
    "3-5": { min: 3, max: 5 },
    "5-10": { min: 5, max: 10 },
    "10+": { min: 10, max: 99 },
  };

  const filterRange = filterRanges[filterExp];
  if (!filterRange) return true;

  const jobRange = parseExperienceRange(jobExp);

  if (!jobRange) {
    return filterExp === "0-1";
  }

  return jobRange.min <= filterRange.max && filterRange.min <= jobRange.max;
}

type JobsV2FiltersState = {
  location?: string;
  job_type?: string;
  employment_type?: string;
  experience?: string;
  search?: string;
  skills?: string[];
  posted_within?: string;
};

function JobsV2PageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [allJobs, setAllJobs] = useState<JobV2[]>([]);
  const [filters, setFilters] = useState<JobsV2FiltersState>({});
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [experienceInput, setExperienceInput] = useState("");
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [activeTab, setActiveTab] = useState<"browse" | "applied">("browse");
  const [feedSuppressionRevision, setFeedSuppressionRevision] = useState(0);

  const navigateToListPage = useCallback(
    (nextPage: number, opts?: { replace?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextPage <= 1) params.delete("page");
      else params.set("page", String(nextPage));
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (opts?.replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const apiFilters: JobV2Filters = {
      client_id: config.clientId,
      location: filters.location || undefined,
      job_type: filters.job_type || undefined,
      employment_type: filters.employment_type || undefined,
      search: filters.search?.trim() || undefined,
    };
    let apiResults: JobV2[] = [];
    try {
      const res = await jobsV2Service.getJobs(apiFilters);
      apiResults = res.results;
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load jobs", "error");
    }
    const externalJsonJobs = await fetchAndMapExternalJsonJobs().catch((): JobV2[] => []);
    setAllJobs(
      syncExternalJsonJobFavoriteFlags(mergeApiJobsWithExternalJson(apiResults, externalJsonJobs))
    );
    setLoading(false);
  }, [filters.location, filters.job_type, filters.employment_type, filters.search, showToast]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchJobs();
    });
  }, [fetchJobs]);

  useEffect(() => {
    return subscribeStudentFeedSuppression(() => setFeedSuppressionRevision((n) => n + 1));
  }, []);

  const handleSearchClick = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput.trim() || undefined,
      location: locationInput.trim() || undefined,
      experience: experienceInput.trim() || undefined,
    }));
    navigateToListPage(1, { replace: true });
  }, [searchInput, locationInput, experienceInput, navigateToListPage]);

  const filteredJobs = useMemo(() => {
    let result = filterStudentVisibleFeedJobs(allJobs);
    if (searchInput.trim()) {
      const words = searchInput.toLowerCase().trim().split(/\s+/).filter(Boolean);
      result = result.filter((job) => {
        const searchable = [
          job.job_title ?? "",
          job.company_name ?? "",
          job.location ?? "",
          job.job_description ?? "",
          ...(job.tags ?? []),
          ...(job.mandatory_skills ?? []),
          ...(job.key_skills ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return words.every((w) => searchable.includes(w));
      });
    }
    if (locationInput.trim()) {
      const loc = locationInput.trim().toLowerCase();
      result = result.filter((job) => (job.location ?? "").toLowerCase().includes(loc));
    }
    if (filters.skills && filters.skills.length > 0) {
      const skillsLower = filters.skills.map((s) => s.toLowerCase());
      result = result.filter((job) => {
        const jobTags = [
          ...(job.tags ?? []),
          ...(job.mandatory_skills ?? []),
          ...(job.key_skills ?? []),
        ].map((t) => String(t).toLowerCase());
        return skillsLower.some((s) => jobTags.some((t) => t.includes(s)));
      });
    }
    if (filters.experience || experienceInput.trim()) {
      const expToUse = experienceInput.trim() || filters.experience;
      if (expToUse) {
        result = result.filter((job) => experienceMatchesFilter(job.years_of_experience, expToUse));
      }
    }
    if (filters.posted_within) {
      result = result.filter((job) => jobMatchesPostedWithin(job, filters.posted_within));
    }
    return result;
  }, [
    allJobs,
    feedSuppressionRevision,
    searchInput,
    locationInput,
    experienceInput,
    filters.skills,
    filters.experience,
    filters.posted_within,
  ]);

  const pageFromQuery = useMemo(() => {
    const raw = searchParams.get("page");
    const p = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(p) && p >= 1 ? p : 1;
  }, [searchParams]);

  useEffect(() => {
    persistJobsV2BrowsePage(pageFromQuery);
  }, [pageFromQuery]);

  const maxPage = useMemo(
    () => Math.max(1, Math.ceil(filteredJobs.length / pageSize) || 1),
    [filteredJobs.length, pageSize]
  );

  const page = Math.min(pageFromQuery, maxPage);

  useEffect(() => {
    if (loading) return;

    if (pageFromQuery > maxPage) {
      navigateToListPage(Math.max(1, maxPage), { replace: true });
      return;
    }

    if (activeTab !== "browse") return;

    if (searchParams.get("page")) {
      clearJobsV2PendingListRestore();
      return;
    }

    tryRestoreJobsV2ListPageFromDetailReturn({
      maxPage,
      navigateToListPage,
    });
  }, [activeTab, loading, searchParams, maxPage, pageFromQuery, navigateToListPage]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page, pageSize]);

  const handleFilterChange = useCallback(
    (key: keyof JobFilters, value: string | string[]) => {
      if (key === "page" || key === "page_size") return;
      setFilters((prev) => ({
        ...prev,
        [key]: Array.isArray(value) && value.length === 0 ? undefined : value ?? undefined,
      }));
      navigateToListPage(1, { replace: true });
    },
    [navigateToListPage]
  );

  const handleSearchInputChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      navigateToListPage(1, { replace: true });
    },
    [navigateToListPage]
  );

  const handleSearchClear = useCallback(() => {
    setSearchInput("");
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    setSearchInput("");
    setLocationInput("");
    setExperienceInput("");
    navigateToListPage(1, { replace: true });
  }, [navigateToListPage]);

  const handlePageChange = useCallback(
    (e: unknown, value: number) => {
      navigateToListPage(value);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [navigateToListPage]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      navigateToListPage(1, { replace: true });
    },
    [navigateToListPage]
  );

  const handleFavoriteChange = useCallback((jobId: number, favorited: boolean) => {
    setAllJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, is_favourited: favorited } : j)));
  }, []);

  const jobsForFilters = useMemo(
    (): Job[] =>
      filterStudentVisibleFeedJobs(allJobs).map((j) => ({
        id: j.id,
        job_title: j.job_title,
        company_name: j.company_name,
        company_logo: j.company_logo,
        location: j.location ?? "",
        job_description: j.job_description ?? "",
        tags: [...(j.tags ?? []), ...(j.mandatory_skills ?? []), ...(j.key_skills ?? [])],
        job_post_date: j.created_at ?? "",
        job_url: j.apply_link ?? "",
        job_type: j.job_type ?? "",
      })),
    [allJobs, feedSuppressionRevision]
  );

  const compatibleFilters = {
    location: filters.location,
    job_type: filters.job_type,
    employment_type: filters.employment_type,
    experience: filters.experience,
    search: filters.search,
    skills: filters.skills,
    posted_within: filters.posted_within,
  };

  const locationOptions = useMemo(() => {
    const seen = new Set<string>();
    const locations: string[] = [];
    for (const job of filterStudentVisibleFeedJobs(allJobs)) {
      const loc = (job.location ?? "").trim();
      if (loc && !seen.has(loc)) {
        seen.add(loc);
        locations.push(loc);
      }
    }
    return locations.sort((a, b) => a.localeCompare(b));
  }, [allJobs, feedSuppressionRevision]);

  const browseLayoutProps = {
    searchInput,
    locationInput,
    experienceInput,
    locationOptions,
    compatibleFilters,
    jobsForFilters,
    handleSearchInputChange,
    handleSearchClear,
    handleSearchClick,
    setLocationInput,
    setExperienceInput,
    navigateToListPage,
    handleFilterChange,
    handleClearAllFilters,
    activeTab,
    setActiveTab,
    loading,
    paginatedJobs,
    filteredJobsLength: filteredJobs.length,
    pageSize,
    page,
    pageFromQuery,
    handlePageChange,
    handlePageSizeChange,
    handleFavoriteChange,
  };

  return (
    <MainLayout>
      <JobsV2BrowseDesktop {...browseLayoutProps} />
      <JobsV2BrowseMobile {...browseLayoutProps} />
    </MainLayout>
  );
}

export default function JobsV2Page() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
            <LinearProgress sx={{ width: "50%", maxWidth: 400 }} />
          </Box>
        </MainLayout>
      }
    >
      <JobsV2PageInner />
    </Suspense>
  );
}
