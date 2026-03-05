"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Box, Typography, Button, Paper, LinearProgress } from "@mui/material";
import {
  jobPortalV2AdminService,
  getApiErrorMessage,
  type DashboardResponse,
} from "@/lib/job-portal-v2";

export default function AdminJobPortalDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    jobPortalV2AdminService
      .getDashboard(7)
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        <LinearProgress sx={{ width: "100%", height: 2, borderRadius: 1 }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
        <Button component={Link} href="/admin/job-portal/jobs">
          Go to Job List
        </Button>
      </Box>
    );
  }

  const overview = data?.overview ?? {
    total_jobs: 0,
    published_jobs: 0,
    total_applications: 0,
    status_breakdown: { applied: 0, shortlisted: 0, rejected: 0, selected: 0 },
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
        Job Portal Dashboard
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Total jobs
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {overview.total_jobs}
          </Typography>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Published jobs
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {overview.published_jobs}
          </Typography>
        </Paper>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Total applications
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {overview.total_applications}
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          component={Link}
          href="/admin/job-portal/jobs"
          sx={{
            backgroundColor: "#6366f1",
            textTransform: "none",
            "&:hover": { backgroundColor: "#4f46e5" },
          }}
        >
          Manage jobs
        </Button>
        <Button
          variant="outlined"
          component={Link}
          href="/admin/job-portal/reports"
          sx={{ borderColor: "#6366f1", color: "#6366f1" }}
        >
          Reports
        </Button>
      </Box>
    </Box>
  );
}
