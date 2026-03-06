"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Typography,
  Button,
  Paper,
  Tabs,
  Tab,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import {
  jobPortalV2AdminService,
  getApiErrorMessage,
  type Job,
} from "@/lib/job-portal-v2";
import { JDCreateEditForm } from "@/components/job-portal-v2";
import type { CreateJobFormData } from "@/lib/schemas/job-portal-v2.schema";
import { useToast } from "@/components/common/Toast";

export default function AdminJobDetailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();
  const jdId = parseInt(String(searchParams.get("id")), 10);

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState(0);

  const fetchJob = () => {
    if (isNaN(jdId)) return;
    jobPortalV2AdminService
      .getJob(jdId)
      .then(setJob)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isNaN(jdId)) {
      setError("Invalid job ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchJob();
  }, [jdId]);

  const handleUpdate = async (data: CreateJobFormData) => {
    if (isNaN(jdId)) return;
    try {
      setSubmitting(true);
      await jobPortalV2AdminService.updateJob(jdId, data);
      showToast("Job updated successfully", "success");
      setEditOpen(false);
      fetchJob();
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isNaN(jdId) || !confirm("Are you sure you want to delete this job?"))
      return;
    try {
      await jobPortalV2AdminService.deleteJob(jdId);
      showToast("Job deleted", "success");
      router.push("/admin/job-portal/jobs");
    } catch (err) {
      showToast(getApiErrorMessage(err), "error");
    }
  };

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
        <Typography color="error" sx={{ mb: 2 }}>
          {error ?? "Job not found"}
        </Typography>
        <Button component={Link} href="/admin/job-portal/jobs">
          Back to Job List
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: "auto" }}>
      <Button
        component={Link}
        href="/admin/job-portal/jobs"
        startIcon={<ArrowLeft size={18} />}
        sx={{
          mb: 2,
          color: "text.secondary",
          textTransform: "none",
          "&:hover": { backgroundColor: "rgba(99, 102, 241, 0.08)" },
        }}
      >
        Back to Job List
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {job.role}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {job.company_name}
            </Typography>
            <Typography
              variant="caption"
              color={job.is_published ? "success.main" : "text.secondary"}
              sx={{ display: "block", mt: 0.5 }}
            >
              {job.is_published ? "Published" : "Draft"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setEditOpen(true)}
              sx={{ borderColor: "#6366f1", color: "#6366f1" }}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Box>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => {
            if (v === 1) {
              router.push(`/admin/job-portal/applications?jdId=${jdId}`);
            } else {
              setTab(v);
            }
          }}
          sx={{ mb: 2 }}
        >
          <Tab label="Details" />
          <Tab label="Applications" />
        </Tabs>

        {tab === 0 && (
          <Box>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {job.job_description}
            </Typography>
            <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
              {job.tags?.map((t, i) => (
                <Typography
                  key={i}
                  component="span"
                  variant="caption"
                  sx={{
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    color: "#6366f1",
                  }}
                >
                  {t}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit job</DialogTitle>
        <DialogContent>
          <JDCreateEditForm
            job={job}
            onSubmit={handleUpdate}
            isSubmitting={submitting}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
