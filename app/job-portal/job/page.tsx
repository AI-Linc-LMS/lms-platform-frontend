"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Typography,
  Button,
  Paper,
  Avatar,
  Chip,
  LinearProgress,
} from "@mui/material";
import { ArrowLeft, MapPin, DollarSign, Calendar } from "lucide-react";
import {
  jobPortalV2StudentService,
  getApiErrorMessage,
  type Job,
} from "@/lib/job-portal-v2";
import { ErrorAlert } from "@/components/job-portal-v2";

export default function JobDetailPage() {
  const searchParams = useSearchParams();
  const jdId = parseInt(String(searchParams.get("id")), 10);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const isDeadlinePassed = job?.application_deadline
    ? new Date(job.application_deadline) < new Date()
    : false;
  const canApply =
    job &&
    !job.already_applied &&
    !isDeadlinePassed &&
    job.is_published !== false;

  if (loading) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <LinearProgress sx={{ width: "100%", height: 2, borderRadius: 1 }} />
      </Box>
    );
  }

  if (error || !job) {
    return (
      <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <ErrorAlert
          message={error ?? "Job not found"}
          title="Error"
          backLink="/job-portal"
          backLabel="Back to Job Portal"
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 800, mx: "auto" }}>
      <Button
        component={Link}
        href="/job-portal"
        startIcon={<ArrowLeft size={18} />}
        sx={{
          mb: 2,
          color: "text.secondary",
          textTransform: "none",
          "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
        }}
      >
        Back to jobs
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
        <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
          <Avatar
            src={job.company_logo ?? undefined}
            alt={job.company_name}
            sx={{
              width: 64,
              height: 64,
              borderRadius: 1.5,
              backgroundColor: "#6366f1",
              color: "#fff",
              fontSize: "1.5rem",
              fontWeight: 600,
            }}
          >
            {job.company_name?.[0]?.toUpperCase() || "C"}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {job.role}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {job.company_name}
            </Typography>
            <Chip
              label={job.job_type === "internship" ? "Internship" : "Job"}
              size="small"
              sx={{
                textTransform: "capitalize",
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                color: "#6366f1",
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
          {job.location && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <MapPin size={14} style={{ color: "#6b7280" }} />
              <Typography variant="body2" color="text.secondary">
                {job.location}
              </Typography>
            </Box>
          )}
          {job.compensation && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <DollarSign size={14} style={{ color: "#6b7280" }} />
              <Typography variant="body2" color="text.secondary">
                {job.compensation}
              </Typography>
            </Box>
          )}
          {job.application_deadline && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Calendar size={14} style={{ color: "#6b7280" }} />
              <Typography
                variant="body2"
                color={isDeadlinePassed ? "error.main" : "text.secondary"}
              >
                {isDeadlinePassed
                  ? "Deadline passed"
                  : `Deadline: ${job.application_deadline}`}
              </Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Job Description
          </Typography>
          <Typography
            variant="body2"
            sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}
          >
            {job.job_description}
          </Typography>
        </Box>

        {job.tags && job.tags.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 3 }}>
            {job.tags.map((tag, i) => (
              <Chip
                key={i}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ borderColor: "#6366f1", color: "#6366f1" }}
              />
            ))}
          </Box>
        )}

        <Box
          sx={{
            pt: 2,
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          {job.already_applied ? (
            <Typography color="text.secondary" sx={{ fontWeight: 500 }}>
              You have already applied
            </Typography>
          ) : isDeadlinePassed ? (
            <Typography color="error.main" sx={{ fontWeight: 500 }}>
              Applications are closed
            </Typography>
          ) : canApply ? (
            <Button
              variant="contained"
              component={Link}
              href={`/job-portal/apply?id=${jdId}`}
              sx={{
                backgroundColor: "#6366f1",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#4f46e5" },
              }}
            >
              Apply now
            </Button>
          ) : null}
        </Box>
      </Paper>
    </Box>
  );
}
