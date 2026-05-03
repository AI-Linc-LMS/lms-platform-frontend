"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Box, Button, Typography, Skeleton } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { jobsV2Service } from "@/lib/services/jobs-v2.service";
import { useToast } from "@/components/common/Toast";
import { ApplyJobPage } from "@/components/jobs-v2/ApplyJobPage";
import { JobDetailIllustration } from "@/components/jobs-v2/illustrations";
import {
  getJobsV2BrowseHref,
  getJobsV2JobDetailHref,
  getJobsV2ListQueryString,
} from "@/lib/utils/jobs-v2-navigation";

export default function ApplyJobRoutePage() {
  const params = useParams();
  const router = useRouter();
  const routeSearchParams = useSearchParams();
  const { showToast } = useToast();
  const id = Number(params?.id);

  const jobsListQueryString = useMemo(
    () => getJobsV2ListQueryString(routeSearchParams),
    [routeSearchParams]
  );
  const jobsListHref = useMemo(
    () => getJobsV2BrowseHref(jobsListQueryString),
    [jobsListQueryString]
  );
  const jobDetailHref = useMemo(
    () => getJobsV2JobDetailHref(id, jobsListQueryString),
    [id, jobsListQueryString]
  );
  const [job, setJob] = useState<Awaited<ReturnType<typeof jobsV2Service.getJobById>> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJob = useCallback(async () => {
    if (!id || isNaN(id)) return;
    try {
      setLoading(true);
      const data = await jobsV2Service.getJobById(id);
      setJob(data);
    } catch (err) {
      showToast((err as Error)?.message ?? "Failed to load job", "error");
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const handleApply = useCallback(
    async (payload: {
      resume_url?: string;
      saved_resume_id?: number;
      responses?: Array<{ question_id: number; response_text: string }>;
    }) => {
      if (!job) return;
      await jobsV2Service.applyForJob(job.id, payload);
      showToast("Application submitted successfully", "success");
      router.push(getJobsV2JobDetailHref(job.id, jobsListQueryString));
    },
    [job, router, showToast, jobsListQueryString]
  );

  const handleCancel = useCallback(() => {
    if (job) {
      router.push(getJobsV2JobDetailHref(job.id, jobsListQueryString));
    } else {
      router.push(jobsListHref);
    }
  }, [job, router, jobsListHref, jobsListQueryString]);

  if (loading || !job) {
    return (
      <MainLayout>
        <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "var(--background)" }}>
          <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto", width: "100%" }}>
            <Button
              component={Link}
              href={jobsListHref}
              startIcon={<ArrowLeft size={18} />}
              sx={{
                mb: 2,
                textTransform: "none",
                color: "var(--accent-indigo)",
                fontWeight: 500,
                "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)" },
              }}
            >
              Back to Jobs
            </Button>
            {loading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
                <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
              </Box>
            ) : (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <JobDetailIllustration width={140} height={115} primaryColor="var(--font-tertiary)" />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: "var(--font-primary)" }}>
                  Job not found
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                  This job may have been removed or the link is invalid.
                </Typography>
                <Button
                  component={Link}
                  href={jobsListHref}
                  startIcon={<ArrowLeft size={18} />}
                  sx={{
                    textTransform: "none",
                    backgroundColor: "var(--accent-indigo)",
                    "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
                  }}
                >
                  Back to Jobs
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </MainLayout>
    );
  }

  if (job.has_applied) {
    return (
      <MainLayout>
        <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "var(--background)" }}>
          <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto", width: "100%", textAlign: "center", py: 8 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              You have already applied for this role
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {job.job_title} at {job.company_name}
            </Typography>
            <Button
              component={Link}
              href={jobDetailHref}
              startIcon={<ArrowLeft size={18} />}
              sx={{
                textTransform: "none",
                backgroundColor: "var(--accent-indigo)",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              Back to Job
            </Button>
          </Box>
        </Box>
      </MainLayout>
    );
  }

  if (job.apply_link?.trim()) {
    return (
      <MainLayout>
        <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "var(--background)" }}>
          <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto", width: "100%", textAlign: "center", py: 8 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              Apply externally
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              This job requires you to apply through an external link.
            </Typography>
            <Button
              component="a"
              href={job.apply_link}
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              sx={{
                textTransform: "none",
                backgroundColor: "var(--accent-indigo)",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              Open Application Link
            </Button>
            <Box sx={{ mt: 2 }}>
              <Button
                component={Link}
                href={jobDetailHref}
                startIcon={<ArrowLeft size={18} />}
                sx={{ textTransform: "none", color: "var(--font-secondary)" }}
              >
                Back to Job
              </Button>
            </Box>
          </Box>
        </Box>
      </MainLayout>
    );
  }

  if (job.status !== "active") {
    const statusMessage =
      job.status === "inactive"
        ? "Applications are closed for this job (Inactive)."
        : job.status === "closed"
          ? "Applications are closed for this job."
          : job.status === "completed"
            ? "Applications are completed for this job."
            : "Applications are not open for this job.";
    return (
      <MainLayout>
        <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "var(--background)" }}>
          <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto", width: "100%", textAlign: "center", py: 8 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              Applications closed
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {statusMessage}
            </Typography>
            <Button
              component={Link}
              href={jobDetailHref}
              startIcon={<ArrowLeft size={18} />}
              sx={{
                textTransform: "none",
                backgroundColor: "var(--accent-indigo)",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              Back to Job
            </Button>
          </Box>
        </Box>
      </MainLayout>
    );
  }

  if (job.eligible_to_apply === false) {
    return (
      <MainLayout>
        <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "var(--background)" }}>
          <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto", width: "100%", textAlign: "center", py: 8 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              Not eligible to apply
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              You are not eligible to apply for this job based on college targeting.
            </Typography>
            <Button
              component={Link}
              href={jobDetailHref}
              startIcon={<ArrowLeft size={18} />}
              sx={{
                textTransform: "none",
                backgroundColor: "var(--accent-indigo)",
                "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
              }}
            >
              Back to Job
            </Button>
          </Box>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "var(--background)" }}>
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto", width: "100%" }}>
          <Button
            component={Link}
            href={jobDetailHref}
            startIcon={<ArrowLeft size={18} />}
            sx={{
              mb: 2,
              textTransform: "none",
              color: "var(--accent-indigo)",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": { backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)" },
            }}
          >
            Back to Job
          </Button>
          <ApplyJobPage
            jobId={job.id}
            jobTitle={job.job_title}
            companyName={job.company_name}
            questions={job.questions}
            onApply={handleApply}
            onCancel={handleCancel}
          />
        </Box>
      </Box>
    </MainLayout>
  );
}
