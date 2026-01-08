"use client";

import { useEffect, useMemo, useRef, useState, useCallback, startTransition } from "react";
import { Box } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { Loading } from "@/components/common/Loading";
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
};

export default function JobsPage() {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);

  const [allJobs, setAllJobs] = useState<NormalizedJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<NormalizedJob[]>([]);

  const [filters, setFilters] = useState<JobFilters>({});
  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);

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
      setPage(1);
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
      try {
        setLoading(true);
        const res = await jobsService.getJobs();

        const normalized: NormalizedJob[] = res.results.map((job) => ({
          ...job,
          _location: String(job.location || "").toLowerCase(),
          _jobType: String(job.job_type || "").toLowerCase(),
          _title: String(job.job_title || "").toLowerCase(),
          _company: String(job.company_name || "").toLowerCase(),
          _description: String(job.job_description || "").toLowerCase(),
          _tags: Array.isArray(job.tags)
            ? job.tags.map((t) => String(t).toLowerCase())
            : [],
        }));

        setAllJobs(normalized);
        setFilteredJobs(normalized);
      } catch (err) {
        showToast("Failed to load jobs", "error");
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
      setPage(1);
    });
  }, [allJobs]);

  const handlePageChange = useCallback((_: unknown, value: number) => {
    startTransition(() => {
      setPage(value);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    startTransition(() => {
      setPageSize(size);
      setPage(1);
    });
  }, []);

  const handleSearchClear = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    startTransition(() => {
      setSearchQuery("");
    });
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <Loading fullScreen />
      </MainLayout>
    );
  }

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
            borderRight: "1px solid",
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
          {paginatedJobs.length === 0 ? (
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

              {filtering && <Loading />}

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
          {paginatedJobs.length === 0 ? (
            <EmptyJobsState />
          ) : (
            <>
              <JobListHeader
                totalCount={totalCount}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
              />

              {filtering && <Loading />}

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
