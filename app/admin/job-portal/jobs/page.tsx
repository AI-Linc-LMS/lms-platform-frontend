"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import {
  jobPortalV2AdminService,
  getApiErrorMessage,
  JOB_PORTAL_PAGE_SIZE,
  type Job,
} from "@/lib/job-portal-v2";
import {
  JobCardV2,
  JobListFilters,
  EmptyState,
  ErrorAlert,
  JobPortalPagination,
  JDCreateEditForm,
} from "@/components/job-portal-v2";
import type { CreateJobFormData } from "@/lib/schemas/job-portal-v2.schema";
import { useToast } from "@/components/common/Toast";

export default function AdminJobListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const isPublished =
    searchParams.get("is_published") === "true"
      ? true
      : searchParams.get("is_published") === "false"
        ? false
        : "";
  const search = searchParams.get("search") ?? "";
  const sortBy = searchParams.get("sort_by") ?? "created_at";
  const sortOrder = (searchParams.get("sort_order") as "asc" | "desc") ?? "desc";

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
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });
      router.push(`/admin/job-portal/jobs?${params.toString()}`);
    },
    [router, searchParams]
  );

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await jobPortalV2AdminService.getJobs({
        page,
        limit: JOB_PORTAL_PAGE_SIZE,
        is_published: isPublished === "" ? undefined : isPublished,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
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
  }, [page, isPublished, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleCreate = async (data: CreateJobFormData) => {
    try {
      setSubmitting(true);
      await jobPortalV2AdminService.createJob(data);
      showToast("Job created successfully", "success");
      setCreateOpen(false);
      fetchJobs();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1200, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Job List
        </Typography>
        <Button
          variant="contained"
          onClick={() => setCreateOpen(true)}
          sx={{
            backgroundColor: "#6366f1",
            textTransform: "none",
            "&:hover": { backgroundColor: "#4f46e5" },
          }}
        >
          Create job
        </Button>
      </Box>

      <Box sx={{ display: { xs: "block", lg: "flex" }, gap: 3 }}>
        <Box sx={{ width: { lg: 260 }, flexShrink: 0, mb: 2 }}>
          <JobListFilters
            isPublished={isPublished}
            search={search}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onIsPublishedChange={(v) => updateParams({ is_published: v === "" ? "" : String(v), page: "1" })}
            onSearchChange={(v) => updateParams({ search: v, page: "1" })}
            onSortByChange={(v) => updateParams({ sort_by: v })}
            onSortOrderChange={(v) => updateParams({ sort_order: v })}
            onSortChange={(by, order) => updateParams({ sort_by: by, sort_order: order })}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {error && (
            <ErrorAlert
              message={error}
              backLink="/admin/job-portal"
              backLabel="Back to Dashboard"
            />
          )}

          {loading ? (
            <LinearProgress sx={{ width: "100%", height: 2, borderRadius: 1 }} />
          ) : jobs.length === 0 ? (
            <EmptyState
              title="No jobs found"
              description="Create your first job to get started"
            />
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {count} job{count !== 1 ? "s" : ""} found
              </Typography>
              {jobs.map((job) => (
                <Box key={job.id} sx={{ mb: 2 }}>
                  <JobCardV2 job={job} href={`/admin/job-portal/job?id=${job.id}`} />
                </Box>
              ))}
              <JobPortalPagination
                pagination={pagination}
                itemLabel="jobs"
                onPageChange={(p) => updateParams({ page: String(p) })}
              />
            </>
          )}
        </Box>
      </Box>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create job</DialogTitle>
        <DialogContent>
          <JDCreateEditForm onSubmit={handleCreate} isSubmitting={submitting} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
