"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, LinearProgress, Typography } from "@mui/material";
import {
  jobPortalV2StudentService,
  getApiErrorMessage,
  JOB_PORTAL_PAGE_SIZE,
  type Job,
  type JobType,
} from "@/lib/job-portal-v2";
import {
  JobCardV2,
  BrowseJobsFilters,
  EmptyState,
  ErrorAlert,
  JobPortalPagination,
} from "@/components/job-portal-v2";

export default function JobPortalBrowsePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const jobType = (searchParams.get("job_type") as JobType | null) || "";
  const search = searchParams.get("search") ?? "";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [count, setCount] = useState(0);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total: 0,
    limit: JOB_PORTAL_PAGE_SIZE,
    has_next: false,
    has_previous: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await jobPortalV2StudentService.getJobs({
        page,
        limit: JOB_PORTAL_PAGE_SIZE,
        job_type: jobType || undefined,
        search: search || undefined,
      });
      setJobs(res.jobs ?? []);
      setCount(res.count ?? 0);
      setPagination(
        res.pagination ?? {
          current_page: page,
          total_pages: 1,
          total: res.count ?? 0,
          limit: JOB_PORTAL_PAGE_SIZE,
          has_next: false,
          has_previous: false,
        }
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [page, jobType, search]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.push(`/job-portal?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handlePageChange = useCallback(
    (newPage: number) => updateParams({ page: String(newPage) }),
    [updateParams]
  );

  const handleJobTypeChange = useCallback(
    (value: JobType | "") => updateParams({ job_type: value, page: "1" }),
    [updateParams]
  );

  const handleSearchChange = useCallback(
    (value: string) => updateParams({ search: value, page: "1" }),
    [updateParams]
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Browse Jobs
        </Typography>

        <Box
          sx={{
            display: { xs: "block", lg: "flex" },
            gap: 3,
            minHeight: "calc(100vh - 180px)",
          }}
        >
          <Box
            sx={{
              width: { lg: 280 },
              flexShrink: 0,
              mb: { xs: 2, lg: 0 },
            }}
          >
            <BrowseJobsFilters
              jobType={jobType as JobType | ""}
              search={search}
              onJobTypeChange={handleJobTypeChange}
              onSearchChange={handleSearchChange}
            />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {error && (
              <ErrorAlert
                message={error}
                backLink="/job-portal"
                backLabel="Back to Job Portal"
              />
            )}

            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 200,
                }}
              >
                <LinearProgress sx={{ width: "80%", height: 2, borderRadius: 1 }} />
              </Box>
            ) : jobs.length === 0 ? (
              <EmptyState
                title="No jobs found"
                description="Try adjusting your filters or search terms"
              />
            ) : (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {count} job{count !== 1 ? "s" : ""} found
                  </Typography>
                </Box>
                {jobs.map((job) => (
                  <JobCardV2 key={job.id} job={job} />
                ))}
                <JobPortalPagination
                  pagination={pagination}
                  itemLabel="jobs"
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </Box>
        </Box>
    </Box>
  );
}
