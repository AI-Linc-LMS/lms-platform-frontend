"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Box, Typography, LinearProgress, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import {
  jobPortalV2StudentService,
  getApiErrorMessage,
  JOB_PORTAL_PAGE_SIZE,
  type Application,
  type ApplicationStatus,
} from "@/lib/job-portal-v2";
import {
  ApplicationCard,
  EmptyState,
  ErrorAlert,
  JobPortalPagination,
} from "@/components/job-portal-v2";

export default function MyApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const status = (searchParams.get("status") as ApplicationStatus | null) || "";

  const [applications, setApplications] = useState<Application[]>([]);
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

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await jobPortalV2StudentService.getMyApplications({
        page,
        limit: JOB_PORTAL_PAGE_SIZE,
        status: status || undefined,
      });
      setApplications(res.applications ?? []);
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
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

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
      router.push(`/job-portal/my-applications?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handlePageChange = useCallback(
    (newPage: number) => updateParams({ page: String(newPage) }),
    [updateParams]
  );

  const handleStatusChange = useCallback(
    (value: ApplicationStatus | "") => updateParams({ status: value, page: "1" }),
    [updateParams]
  );

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        My Applications
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          mb: 3,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={status}
            label="Status"
            onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus | "")}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="applied">Applied</MenuItem>
            <MenuItem value="shortlisted">Shortlisted</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="selected">Selected</MenuItem>
          </Select>
        </FormControl>
        {!loading && applications.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ alignSelf: "center" }}>
            {count} application{count !== 1 ? "s" : ""} found
          </Typography>
        )}
      </Box>

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
      ) : applications.length === 0 ? (
        <EmptyState
          icon="mdi:file-document-outline"
          title="No applications yet"
          description="Apply to jobs from the Job Portal to see them here"
        />
      ) : (
        <>
          {applications.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
          <JobPortalPagination
            pagination={pagination}
            itemLabel="applications"
            onPageChange={handlePageChange}
          />
        </>
      )}
    </Box>
  );
}
