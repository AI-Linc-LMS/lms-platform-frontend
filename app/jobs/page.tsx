"use client";

import { useEffect, useMemo, useRef, useState, useCallback, startTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Box, LinearProgress } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { JobCard } from "@/components/jobs/JobCard";
import { JobSearchBar } from "@/components/jobs/JobSearchBar";
import { JobFiltersSidebar } from "@/components/jobs/JobFiltersSidebar";
import { MobileJobFilters } from "@/components/jobs/MobileJobFilters";
import { JobListHeader } from "@/components/jobs/JobListHeader";
import { JobPagination } from "@/components/jobs/JobPagination";
import { EmptyJobsState } from "@/components/jobs/EmptyJobsState";
import { JobsPageHeader } from "@/components/jobs/JobsPageHeader";
import { jobsService, Job, JobFilters } from "@/lib/services/jobs.service";
import { useToast } from "@/components/common/Toast";

const ITEMS_PER_PAGE = 10;
const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;
const LEGACY_JOBS_CACHE_TTL_MS = 120_000;

function parseJobsPageSize(raw: string | null): number {
  if (!raw) return ITEMS_PER_PAGE;
  const n = parseInt(raw, 10);
  return PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number])
    ? n
    : ITEMS_PER_PAGE;
}

/**
 * Normalized job for fast filtering
 */
type NormalizedJob = Job & {
  _location: string;
  _jobType: string;
  _title: string;
  _company: string;
  _description: string;
  _tags: string[];
  _postedAtIso?: string;
};

let legacyJobsNormalizedCache: { jobs: NormalizedJob[]; at: number } | null = null;

export default function JobsPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);

  const [allJobs, setAllJobs] = useState<NormalizedJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<NormalizedJob[]>([]);

  const [filters, setFilters] = useState<JobFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  const page = useMemo(() => {
    const raw = searchParams.get("page");
    const n = raw ? parseInt(raw, 10) : 1;
    return Number.isFinite(n) && n >= 1 ? n : 1;
  }, [searchParams]);

  const pageSize = useMemo(
    () => parseJobsPageSize(searchParams.get("page_size")),
    [searchParams]
  );

  const syncJobsListUrl = useCallback(
    (overrides: { page?: number; page_size?: number }) => {
      const p = new URLSearchParams(searchParams.toString());
      const currentPage = (() => {
        const r = p.get("page");
        const n = r ? parseInt(r, 10) : 1;
        return Number.isFinite(n) && n >= 1 ? n : 1;
      })();
      const currentSize = parseJobsPageSize(p.get("page_size"));
      const nextPage = overrides.page !== undefined ? overrides.page : currentPage;
      const nextSize =
        overrides.page_size !== undefined ? overrides.page_size : currentSize;
      if (nextPage <= 1) p.delete("page");
      else p.set("page", String(nextPage));
      if (nextSize === ITEMS_PER_PAGE) p.delete("page_size");
      else p.set("page_size", String(nextSize));
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const syncJobsListUrlRef = useRef(syncJobsListUrl);
  syncJobsListUrlRef.current = syncJobsListUrl;

  const workerRef = useRef<Worker | null>(null);
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Init Web Worker ONCE
   */
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../../workers/jobFilter.worker.ts", import.meta.url)
    );

    workerRef.current.onmessage = (e) => {
      setFilteredJobs(e.data);
      syncJobsListUrlRef.current({ page: 1 });
      setFiltering(false);
    };

    return () => {
      workerRef.current?.terminate();
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Load & normalize jobs
   */
  useEffect(() => {
    const loadJobs = async () => {
      const now = Date.now();
      const cached =
        legacyJobsNormalizedCache &&
        now - legacyJobsNormalizedCache.at < LEGACY_JOBS_CACHE_TTL_MS
          ? legacyJobsNormalizedCache.jobs
          : null;
      if (cached) {
        setAllJobs(cached);
        setFilteredJobs(cached);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const res = await jobsService.getJobs();

        const normalized: NormalizedJob[] = res.results.map((job) => {
          const postedRaw = job.created_at || job.job_post_date;
          const postedStr =
            postedRaw != null && String(postedRaw).trim()
              ? String(postedRaw).trim()
              : undefined;
          return {
            ...job,
            _location: String(job.location || "").toLowerCase(),
            _jobType: String(job.job_type || "").toLowerCase(),
            _title: String(job.job_title || "").toLowerCase(),
            _company: String(job.company_name || "").toLowerCase(),
            _description: String(job.job_description || "").toLowerCase(),
            _tags: Array.isArray(job.tags)
              ? job.tags.map((t) => String(t).toLowerCase())
              : [],
            _postedAtIso: postedStr,
          };
        });

        legacyJobsNormalizedCache = { jobs: normalized, at: Date.now() };
        setAllJobs(normalized);
        setFilteredJobs(normalized);
      } catch (err) {
        showToast(t("jobs.failedToLoad"), "error");
        if (!cached) {
          setAllJobs([]);
          setFilteredJobs([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [showToast]);

  /**
   * Run filtering in Web Worker (NON-BLOCKING) - Debounced
   */
  useEffect(() => {
    if (!workerRef.current || !allJobs.length) return;

    // Debounce filtering to prevent rapid worker messages
    const timeoutId = setTimeout(() => {
      setFiltering(true);
      workerRef.current?.postMessage({
        jobs: allJobs,
        filters,
        searchQuery,
      });
    }, 200); // 200ms debounce

    return () => {
      clearTimeout(timeoutId);
    };
  }, [allJobs, filters, searchQuery]);

  /**
   * Pagination
   */
  const paginatedJobs = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredJobs.slice(start, start + pageSize);
  }, [filteredJobs, page, pageSize]);

  const totalCount = filteredJobs.length;

  const maxPage = useMemo(
    () => Math.max(1, Math.ceil(filteredJobs.length / pageSize) || 1),
    [filteredJobs.length, pageSize]
  );

  useEffect(() => {
    if (page > maxPage) {
      syncJobsListUrl({ page: maxPage });
    }
  }, [page, maxPage, syncJobsListUrl]);

  /**
   * Handlers - Memoized and optimized
   */
  const handleFilterChange = useCallback((
    key: keyof JobFilters,
    value: string | string[]
  ) => {
    // Clear any pending filter update
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    // Debounce filter changes to prevent rapid updates
    filterTimeoutRef.current = setTimeout(() => {
      startTransition(() => {
        setFilters((prev) => ({
          ...prev,
          [key]:
            Array.isArray(value) && value.length === 0
              ? undefined
              : value || undefined,
        }));
      });
    }, 150); // 150ms debounce
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    // Clear any pending search update
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Update search query immediately for better UX (non-blocking)
    startTransition(() => {
      setSearchQuery(value);
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    // Clear all timeouts
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Clear filters with transition
    startTransition(() => {
      setFilters({});
      setSearchQuery("");
      setFilteredJobs(allJobs);
      syncJobsListUrl({ page: 1 });
    });
  }, [allJobs, syncJobsListUrl]);

  const handlePageChange = useCallback(
    (_: unknown, value: number) => {
      syncJobsListUrl({ page: value });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [syncJobsListUrl]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      syncJobsListUrl({ page: 1, page_size: size });
    },
    [syncJobsListUrl]
  );

  const handleSearchClear = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    startTransition(() => {
      setSearchQuery("");
    });
  }, []);


  return (
    <MainLayout>
      {/* Desktop Layout */}
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {/* Desktop Filters */}
        <Box
          sx={{
            width: 320,
            borderInlineEnd: "1px solid",
            borderColor: "divider",
            p: 3,
          }}
        >
          <JobsPageHeader />
          <JobSearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClear={handleSearchClear}
          />
          <JobFiltersSidebar
            filters={filters}
            jobs={allJobs}
            onFilterChange={handleFilterChange}
            onClearAll={handleClearAllFilters}
          />
        </Box>

        {/* Desktop Job List */}
        <Box sx={{ flex: 1, p: 3 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
              <LinearProgress sx={{ width: "80%", height: 2, borderRadius: 1 }} />
            </Box>
          ) : paginatedJobs.length === 0 ? (
            <EmptyJobsState />
          ) : (
            <>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}
              >
                <JobListHeader
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageSizeChange={handlePageSizeChange}
                />
              </Box>


              {paginatedJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}

              <JobPagination
                totalCount={totalCount}
                pageSize={pageSize}
                page={page}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </Box>
      </Box>

      {/* Mobile Layout */}
      <Box
        sx={{
          display: { xs: "flex", lg: "none" },
          flexDirection: "column",
          height: "calc(100vh - 64px)",
          overflow: "hidden",
        }}
      >
        {/* Mobile Filters - Fixed at top */}
        <Box
          sx={{
            flexShrink: 0,
            backgroundColor: "#ffffff",
            borderBottom: "1px solid",
            borderColor: "divider",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <MobileJobFilters
            searchQuery={searchQuery}
            filters={filters}
            jobs={allJobs}
            onSearchChange={handleSearchChange}
            onFilterChange={handleFilterChange}
            onSearchClear={handleSearchClear}
          />
        </Box>

        {/* Mobile Job List - Scrollable */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            p: { xs: 2, sm: 3 },
            backgroundColor: "#f9fafb",
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 200 }}>
              <LinearProgress sx={{ width: "80%", height: 2, borderRadius: 1 }} />
            </Box>
          ) : paginatedJobs.length === 0 ? (
            <EmptyJobsState />
          ) : (
            <>
              <JobListHeader
                totalCount={totalCount}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
              />


              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
              >
                {paginatedJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </Box>

              <Box sx={{ mt: 3, mb: 4 }}>
                <JobPagination
                  totalCount={totalCount}
                  pageSize={pageSize}
                  page={page}
                  onPageChange={handlePageChange}
                />
              </Box>
            </>
          )}
        </Box>
      </Box>
    </MainLayout>
  );
}
