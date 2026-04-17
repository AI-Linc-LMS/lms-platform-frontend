"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Avatar,
  Chip,
  Skeleton,
  Breadcrumbs,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { JobCreateEditPage } from "@/components/admin/jobs-v2/JobCreateEditPage";
import {
  adminJobsV2Service,
  type JobCreateUpdatePayload,
} from "@/lib/services/admin/admin-jobs-v2.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { config } from "@/lib/config";

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const jobId = Number(params?.id);
  const [job, setJob] = useState<JobV2 | null>(null);
  const [courses, setCourses] = useState<Array<{ id: number; title?: string; name?: string }>>([]);
  const [loading, setLoading] = useState(true);

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const data = await adminJobsV2Service.getJob(jobId, config.clientId);
      setJob(data);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load job", "error");
      setJob(null);
    }
  }, [jobId, showToast]);

  const loadCourses = useCallback(async () => {
    try {
      const data = await adminCoursesService.getCourses({ limit: 1000 });
      const list = Array.isArray(data) ? data : (data.results || data.data || []);
      setCourses(list);
    } catch {
      setCourses([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadJob(), loadCourses()]).finally(() => setLoading(false));
  }, [loadJob, loadCourses]);

  const handleSubmit = useCallback(
    async (
      payload: Partial<JobCreateUpdatePayload>,
      options?: { jdFile?: File }
    ) => {
      if (!job) return;
      try {
        await adminJobsV2Service.updateJob(job.id, payload, config.clientId);
        if (options?.jdFile) {
          await adminJobsV2Service.uploadJobJd(job.id, options.jdFile, config.clientId);
        }
        showToast("Job updated successfully", "success");
        router.push("/admin/jobs-v2");
      } catch (err) {
        throw err;
      }
    },
    [job, router, showToast]
  );

  const handleCancel = useCallback(() => {
    router.push("/admin/jobs-v2");
  }, [router]);

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Skeleton variant="rectangular" width={120} height={36} sx={{ mb: 2, borderRadius: 1 }} />
          <Box sx={{ display: "flex", gap: 2, mb: 3,
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
          }}>
            <Skeleton variant="circular" width={64} height={64} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" height={24} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Skeleton variant="rounded" height={120} />
            <Skeleton variant="rounded" height={80} />
            <Skeleton variant="rounded" height={400} />
          </Box>
        </Box>
      </MainLayout>
    );
  }

  if (!job) {
    return (
      <MainLayout>
        <Box
          sx={{
            p: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400,
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: 2,
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <IconWrapper icon="mdi:alert-circle-outline" size={40} style={{ color: "#dc2626" }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#0f172a", mb: 0.5 }}>
            Job not found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This job may have been deleted or you don&apos;t have access to it.
          </Typography>
          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
            onClick={() => router.push("/admin/jobs-v2")}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              backgroundColor: "#6366f1",
              "&:hover": { backgroundColor: "#4f46e5" },
            }}
          >
            Back to Jobs
          </Button>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Breadcrumb */}
        <Breadcrumbs
          sx={{ mb: 2, "& .MuiBreadcrumbs-separator": { mx: 0.5 } }}
          aria-label="breadcrumb"
        >
          <Link
            href="/admin/jobs-v2"
            style={{
              color: "#64748b",
              textDecoration: "none",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Jobs
          </Link>
          <Typography variant="body2" color="text.secondary">
            Edit
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {job.job_title}
          </Typography>
        </Breadcrumbs>

        {/* Quick actions bar */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: "#f8fafc",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
              onClick={handleCancel}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                color: "#64748b",
                "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
              }}
            >
              Back
            </Button>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                src={job.company_logo}
                alt={job.company_name}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  backgroundColor: "#6366f1",
                  color: "#fff",
                  fontSize: "0.875rem",
                }}
              >
                {job.company_name?.[0]?.toUpperCase() || "C"}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                  {job.job_title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {job.company_name}
                  {job.location && ` · ${job.location}`}
                </Typography>
              </Box>
              <Chip
                label={job.is_published ? "Published" : "Draft"}
                size="small"
                sx={{
                  height: 22,
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  backgroundColor: job.is_published ? "rgba(34, 197, 94, 0.12)" : "rgba(99, 102, 241, 0.12)",
                  color: job.is_published ? "#16a34a" : "#6366f1",
                  border: "none",
                }}
              />
            </Box>
          </Box>
          <Button
            component={Link}
            href={`/admin/jobs-v2/${job.id}/applications`}
            variant="outlined"
            startIcon={<IconWrapper icon="mdi:account-group" size={18} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 2,
              borderColor: "#6366f1",
              color: "#6366f1",
              "&:hover": {
                borderColor: "#4f46e5",
                backgroundColor: "rgba(99, 102, 241, 0.08)",
              },
            }}
          >
            View Applications
          </Button>
        </Box>

        <JobCreateEditPage
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          title={job.job_title}
          initialData={job}
          courses={courses}
          isEditMode
        />
      </Box>
    </MainLayout>
  );
}
