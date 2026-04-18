"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import type { JobV2 } from "@/lib/services/jobs-v2.service";
import { jobsV2Service } from "@/lib/services/jobs-v2.service";

export default function NewJobPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Array<{ id: number; title?: string; name?: string }>>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [seedJob, setSeedJob] = useState<JobV2 | null>(null);

  const seedIdKey = searchParams.get("seedId")?.trim() ?? "";
  const [seedResolved, setSeedResolved] = useState(!seedIdKey);

  const adminJobsListBackHref = useMemo(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete("seedId");
    const qs = p.toString();
    return qs ? `/admin/jobs-v2?${qs}` : "/admin/jobs-v2";
  }, [searchParams]);

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

  useEffect(() => {
    if (!seedIdKey) {
      setSeedJob(null);
      setSeedResolved(true);
      return;
    }
    const id = parseInt(seedIdKey, 10);
    if (!Number.isFinite(id)) {
      setSeedJob(null);
      setSeedResolved(true);
      showToast("Invalid job id to import.", "warning");
      return;
    }
    let cancelled = false;
    setSeedResolved(false);
    jobsV2Service
      .getJobById(id)
      .then((j) => {
        if (!cancelled) {
          setSeedJob(j);
          if (!j) showToast("Could not load that job for import.", "warning");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSeedJob(null);
          showToast("Could not load that job for import.", "error");
        }
      })
      .finally(() => {
        if (!cancelled) setSeedResolved(true);
      });
    return () => {
      cancelled = true;
    };
  }, [seedIdKey, showToast]);

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
        router.push(adminJobsListBackHref);
      } catch (err) {
        throw err;
      }
    },
    [router, showToast, adminJobsListBackHref]
  );

  const handleCancel = useCallback(() => {
    router.push(adminJobsListBackHref);
  }, [router, adminJobsListBackHref]);

  if (loadingCourses || !seedResolved) {
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
          <CircularProgress sx={{ color: "#6366f1" }} />
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
            color: "#64748b",
            "&:hover": { backgroundColor: "rgba(0,0,0,0.04)" },
          }}
        >
          Back to Jobs
        </Button>
        <JobCreateEditPage
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          title={seedJob ? "Import job" : "Create Job"}
          courses={courses}
          initialData={seedJob}
        />
      </Box>
    </MainLayout>
  );
}
