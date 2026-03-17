"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Button, Typography, Skeleton } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { jobsV2Service } from "@/lib/services/jobs-v2.service";
import { useToast } from "@/components/common/Toast";
import { ApplyJobPage } from "@/components/jobs-v2/ApplyJobPage";
import { JobDetailIllustration } from "@/components/jobs-v2/illustrations";

export default function ApplyJobRoutePage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = Number(params?.id);
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
      router.push(`/jobs-v2/${job.id}`);
    },
    [job, router, showToast]
  );

  const handleCancel = useCallback(() => {
    if (job) {
      router.push(`/jobs-v2/${job.id}`);
    } else {
      router.push("/jobs-v2");
    }
  }, [job, router]);

  if (loading || !job) {
    return (
      <MainLayout>
        <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "#f8fafc" }}>
          <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto", width: "100%" }}>
            <Button
              component={Link}
              href="/jobs-v2"
              startIcon={<ArrowLeft size={18} />}
              sx={{
                mb: 2,
                textTransform: "none",
                color: "#6366f1",
                fontWeight: 500,
                "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
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
                <JobDetailIllustration width={140} height={115} primaryColor="#94a3b8" />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: "#1e293b" }}>
                  Job not found
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                  This job may have been removed or the link is invalid.
                </Typography>
                <Button
                  component={Link}
                  href="/jobs-v2"
                  startIcon={<ArrowLeft size={18} />}
                  sx={{
                    textTransform: "none",
                    backgroundColor: "#6366f1",
                    "&:hover": { backgroundColor: "#4f46e5" },
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
        <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "#f8fafc" }}>
          <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto", width: "100%", textAlign: "center", py: 8 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>
              You have already applied for this role
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              {job.job_title} at {job.company_name}
            </Typography>
            <Button
              component={Link}
              href={`/jobs-v2/${job.id}`}
              startIcon={<ArrowLeft size={18} />}
              sx={{
                textTransform: "none",
                backgroundColor: "#6366f1",
                "&:hover": { backgroundColor: "#4f46e5" },
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
        <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "#f8fafc" }}>
          <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto", width: "100%", textAlign: "center", py: 8 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>
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
                backgroundColor: "#6366f1",
                "&:hover": { backgroundColor: "#4f46e5" },
              }}
            >
              Open Application Link
            </Button>
            <Box sx={{ mt: 2 }}>
              <Button
                component={Link}
                href={`/jobs-v2/${job.id}`}
                startIcon={<ArrowLeft size={18} />}
                sx={{ textTransform: "none", color: "#64748b" }}
              >
                Back to Job
              </Button>
            </Box>
          </Box>
        </Box>
      </MainLayout>
    );
  }

  if (job.eligible_to_apply === false) {
    return (
      <MainLayout>
        <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "#f8fafc" }}>
          <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto", width: "100%", textAlign: "center", py: 8 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1e293b" }}>
              Not eligible to apply
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
              You are not eligible to apply for this job based on college targeting.
            </Typography>
            <Button
              component={Link}
              href={`/jobs-v2/${job.id}`}
              startIcon={<ArrowLeft size={18} />}
              sx={{
                textTransform: "none",
                backgroundColor: "#6366f1",
                "&:hover": { backgroundColor: "#4f46e5" },
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
      <Box sx={{ minHeight: "calc(100vh - 64px)", backgroundColor: "#f8fafc" }}>
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1100, mx: "auto", width: "100%" }}>
          <Button
            component={Link}
            href={`/jobs-v2/${job.id}`}
            startIcon={<ArrowLeft size={18} />}
            sx={{
              mb: 2,
              textTransform: "none",
              color: "#6366f1",
              fontWeight: 600,
              borderRadius: 2,
              "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
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
