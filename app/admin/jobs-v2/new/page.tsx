"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import { JobCreateEditPage } from "@/components/admin/jobs-v2/JobCreateEditPage";
import {
  adminJobsV2Service,
  type JobCreateUpdatePayload,
} from "@/lib/services/admin/admin-jobs-v2.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import { config } from "@/lib/config";

export default function NewJobPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Array<{ id: number; title?: string; name?: string }>>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const loadCourses = useCallback(async () => {
    try {
      const data = await adminCoursesService.getCourses({ limit: 1000 });
      const list = Array.isArray(data) ? data : (data.results || data.data || []);
      setCourses(list);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const handleSubmit = useCallback(
    async (
      payload: JobCreateUpdatePayload | Partial<JobCreateUpdatePayload>,
      options?: { jdFile?: File }
    ) => {
      if (!payload.job_title || !payload.company_name) return;
      try {
        const job = await adminJobsV2Service.createJob(
          payload as JobCreateUpdatePayload,
          config.clientId
        );
        if (options?.jdFile) {
          await adminJobsV2Service.uploadJobJd(job.id, options.jdFile, config.clientId);
        }
        showToast("Job created successfully", "success");
        router.push("/admin/jobs-v2");
      } catch (err) {
        throw err;
      }
    },
    [router, showToast]
  );

  const handleCancel = useCallback(() => {
    router.push("/admin/jobs-v2");
  }, [router]);

  if (loadingCourses) {
    return (
      <MainLayout>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400,
            gap: 2,
          }}
        >
          <CircularProgress sx={{ color: "var(--accent-indigo)" }} />
          <Typography color="text.secondary">Loading...</Typography>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
          onClick={handleCancel}
          sx={{
            mb: 2,
            textTransform: "none",
            fontWeight: 500,
            color: "var(--font-secondary)",
            "&:hover": { backgroundColor: "color-mix(in srgb, var(--font-primary) 6%, transparent)" },
          }}
        >
          Back to Jobs
        </Button>
        <JobCreateEditPage
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          title="Create Job"
          courses={courses}
        />
      </Box>
    </MainLayout>
  );
}
