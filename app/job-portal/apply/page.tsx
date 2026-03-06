"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Box, Typography, Button, Paper, LinearProgress } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import {
  jobPortalV2StudentService,
  getApiErrorMessage,
  type Job,
} from "@/lib/job-portal-v2";
import { ApplyForm } from "@/components/job-portal-v2";
import type { ApplyFormData } from "@/lib/schemas/job-portal-v2.schema";
import { useToast } from "@/components/common/Toast";

export default function ApplyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const jdId = parseInt(String(searchParams.get("id")), 10);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isNaN(jdId)) {
      setError("Invalid job ID");
      setLoading(false);
      return;
    }
    jobPortalV2StudentService
      .getJob(jdId)
      .then(setJob)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [jdId]);

  const handleSubmit = async (data: ApplyFormData) => {
    if (isNaN(jdId)) return;
    try {
      setSubmitting(true);
      await jobPortalV2StudentService.apply(jdId, {
        resume_url: data.resume_url,
        cover_letter: data.cover_letter,
      });
      showToast("Application submitted successfully", "success");
      router.push("/job-portal/my-applications");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <LinearProgress sx={{ width: "100%", height: 2, borderRadius: 1 }} />
      </Box>
    );
  }

  if (error || !job) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Typography color="error" sx={{ mb: 2 }}>
          {error ?? "Job not found"}
        </Typography>
        <Button component={Link} href="/job-portal">
          Back to Job Portal
        </Button>
      </Box>
    );
  }

  const isDeadlinePassed = job.application_deadline
    ? new Date(job.application_deadline) < new Date()
    : false;
  if (job.already_applied || isDeadlinePassed) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {job.already_applied
            ? "You have already applied for this job."
            : "Applications are closed for this job."}
        </Typography>
        <Button component={Link} href={`/job-portal/job?id=${jdId}`}>
          Back to job
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 600, mx: "auto" }}>
      <Button
        component={Link}
        href={`/job-portal/job?id=${jdId}`}
        startIcon={<ArrowLeft size={18} />}
        sx={{
          mb: 2,
          color: "text.secondary",
          textTransform: "none",
          "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
        }}
      >
        Back to job
      </Button>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
          Apply for {job.role}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {job.company_name}
        </Typography>

        <ApplyForm onSubmit={handleSubmit} isSubmitting={submitting} />
      </Paper>
    </Box>
  );
}
