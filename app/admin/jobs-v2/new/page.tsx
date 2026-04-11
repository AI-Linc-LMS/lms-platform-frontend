"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
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
import { fetchAndMapExternalJsonJobs } from "@/lib/jobs/external-job-json-feed";
import { getExternalJobById, isLikelyExternalJsonSyntheticId } from "@/lib/jobs/external-json-jobs-store";

function NewJobPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [courses, setCourses] = useState<Array<{ id: number; title?: string; name?: string }>>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [seedJob, setSeedJob] = useState<JobV2 | null>(null);
  const [loadingSeed, setLoadingSeed] = useState(false);

  const seedParam = searchParams.get("seedId");
  const seedId = seedParam != null && seedParam !== "" ? Number(seedParam) : NaN;
  const hasValidSeed = Number.isFinite(seedId) && isLikelyExternalJsonSyntheticId(seedId);

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
    if (!hasValidSeed) {
      setSeedJob(null);
      setLoadingSeed(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingSeed(true);
      try {
        await fetchAndMapExternalJsonJobs().catch(() => {});
        if (cancelled) return;
        const j = getExternalJobById(seedId);
        setSeedJob(j ?? null);
        if (!j) {
          showToast("Could not load that feed job. It may have been removed from the JSON.", "warning");
        }
      } finally {
        if (!cancelled) setLoadingSeed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hasValidSeed, seedId, showToast]);

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

  if (loadingCourses || loadingSeed) {
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
          title={seedJob ? "Import job from student feed" : "Create Job"}
          courses={courses}
          initialData={seedJob ?? undefined}
        />
      </Box>
    </MainLayout>
  );
}

export default function NewJobPage() {
  return (
    <Suspense
      fallback={
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
      }
    >
      <NewJobPageInner />
    </Suspense>
  );
}
