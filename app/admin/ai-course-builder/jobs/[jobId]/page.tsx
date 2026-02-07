"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  aiCourseBuilderService,
  type JobDetailResponse,
  type ApproveOutlineBody,
} from "@/lib/services/admin/ai-course-builder.service";
import { OutlinePreview } from "@/components/admin/ai-course-builder/OutlinePreview";

const POLL_INTERVAL_MS = 10000;

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const { showToast } = useToast();

  const [data, setData] = useState<JobDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveSlug, setApproveSlug] = useState("");
  const [approveThumbnail, setApproveThumbnail] = useState("");
  const [approvePublished, setApprovePublished] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await aiCourseBuilderService.getJobDetails(jobId);
      setData(res);
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to load job",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [jobId, showToast]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  useEffect(() => {
    if (!data?.job || data.job.status !== "generating_content") return;
    const id = setInterval(loadJob, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [data?.job?.status, loadJob]);

  const handleRegenerateOutline = async () => {
    try {
      setRegenerating(true);
      await aiCourseBuilderService.regenerateOutline(jobId);
      showToast("Outline regeneration started", "success");
      await loadJob();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Regenerate failed",
        "error"
      );
    } finally {
      setRegenerating(false);
    }
  };

  const handleApprove = async () => {
    try {
      setApproving(true);
      const body: ApproveOutlineBody = {
        slug: approveSlug.trim() || undefined,
        thumbnail: approveThumbnail.trim() || undefined,
        published: approvePublished,
      };
      const res = await aiCourseBuilderService.approveOutline(jobId, body);
      showToast("Course structure created successfully", "success");
      setApproveOpen(false);
      await loadJob();
      if (res.course_id != null) {
        router.push(`/admin/course-builder/${res.course_id}/edit`);
      }
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Approve failed",
        "error"
      );
    } finally {
      setApproving(false);
    }
  };

  const handleGenerateAllContent = async () => {
    try {
      setGeneratingContent(true);
      await aiCourseBuilderService.generateAllContent(jobId);
      showToast("Content generation started", "success");
      await loadJob();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to start generation",
        "error"
      );
    } finally {
      setGeneratingContent(false);
    }
  };

  if (loading && !data) {
    return (
      <MainLayout>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 400,
            }}
          >
            <CircularProgress />
          </Box>
        </Box>
      </MainLayout>
    );
  }

  if (!data?.job) {
    return (
      <MainLayout>
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography color="error">Job not found.</Typography>
          <Button component={Link} href="/admin/ai-course-builder" sx={{ mt: 2 }}>
            Back to AI Course Builder
          </Button>
        </Box>
      </MainLayout>
    );
  }

  const job = data.job;
  const status = job.status;
  const outlineReady = status === "outline_ready";
  const progress = job.progress_percentage ?? 0;
  const isPolling = status === "generating_content";

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 2 }}>
          <Link
            href="/admin/ai-course-builder"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: "#6366f1",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            <IconWrapper icon="mdi:arrow-left" size={20} />
            Back to AI Course Builder
          </Link>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 0.5 }}>
                Status: {status.replace(/_/g, " ")}
              </Typography>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                Job ID: {job.job_id}
              </Typography>
            </Box>
            {isPolling && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                }}
              >
                <CircularProgress size={14} sx={{ color: "#059669" }} />
                <Typography variant="caption" sx={{ color: "#047857", fontWeight: 500 }}>
                  Live
                </Typography>
              </Box>
            )}
          </Box>
          
        </Box>

        {outlineReady && (
          <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              onClick={handleRegenerateOutline}
              disabled={regenerating}
              startIcon={
                regenerating ? (
                  <CircularProgress size={18} />
                ) : (
                  <IconWrapper icon="mdi:refresh" size={18} />
                )
              }
            >
              {regenerating ? "Regenerating..." : "Regenerate outline"}
            </Button>
            <Button
              variant="contained"
              onClick={() => setApproveOpen(true)}
              sx={{
                bgcolor: "#10b981",
                "&:hover": { bgcolor: "#059669" },
              }}
            >
              Approve outline & create course
            </Button>
          </Box>
        )}
        
        {(() => {
          const hasContentProgress =
            job.total_content_items != null && job.total_content_items > 0;
          const completed = job.completed_content_items ?? 0;
          const pct = job.progress_percentage ?? 0;
          const bothZero = completed === 0 && pct === 0;
          const hasTaskBreakdown =
            (data.pending_tasks ?? 0) +
              (data.generating_tasks ?? 0) +
              (data.completed_tasks ?? 0) +
              (data.failed_tasks ?? 0) >
            0;
          const showProgress =
            status !== "outline_ready" &&
            hasContentProgress &&
            !bothZero &&
            (status === "generating_content" ||
              status === "completed" ||
              status === "creating_structure");
          if (!showProgress) return null;
          return (
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Progress
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{ flex: 1, height: 8, borderRadius: 1 }}
                />
                <Typography variant="body2" sx={{ minWidth: 80 }}>
                  {job.completed_content_items ?? 0} / {job.total_content_items} (
                  {progress}%)
                </Typography>
              </Box>
              {hasTaskBreakdown && (
                <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mt: 0.5 }}>
                  Pending: {data.pending_tasks ?? 0} • Generating:{" "}
                  {data.generating_tasks ?? 0} • Completed: {data.completed_tasks}{" "}
                  • Failed: {data.failed_tasks ?? 0}
                </Typography>
              )}
            </Paper>
          );
        })()}

        {job.generated_course_id != null && (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              onClick={handleGenerateAllContent}
              disabled={
                generatingContent ||
                (data.pending_tasks === 0 && status === "completed")
              }
              startIcon={
                generatingContent ? (
                  <CircularProgress size={18} />
                ) : (
                  <IconWrapper icon="mdi:play" size={18} />
                )
              }
              sx={{
                bgcolor: "#6366f1",
                "&:hover": { bgcolor: "#4f46e5" },
              }}
            >
              {generatingContent
                ? "Starting..."
                : data.pending_tasks === 0 && status === "completed"
                  ? "All content generated"
                  : "Generate all content"}
            </Button>
          </Box>
        )}

        {job.outline && (
          <Box sx={{ mb: 3 }}>
            <OutlinePreview outline={job.outline} />
          </Box>
        )}


        {(() => {
          const rawLog = job.error_log;
          let entries: unknown[] = [];
          if (Array.isArray(rawLog)) entries = rawLog;
          else if (typeof rawLog === "string") {
            try {
              const parsed = JSON.parse(rawLog);
              entries = Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              entries = [rawLog];
            }
          }
          if (entries.length === 0) return null;
          return (
            <Paper
              sx={{
                p: 2,
                mb: 3,
                borderRadius: 2,
                bgcolor: "#fef2f2",
                border: "1px solid #fecaca",
              }}
            >
              <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                Error logs
              </Typography>
              <Box
                component="pre"
                sx={{
                  fontSize: "0.75rem",
                  overflow: "auto",
                  maxHeight: 320,
                  m: 0,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: "rgba(0,0,0,0.03)",
                }}
              >
                {entries.map((entry, i) => {
                  if (entry == null) return null;
                  if (typeof entry === "object" && "message" in entry) {
                    const e = entry as {
                      type?: string;
                      details?: { task_id?: number; content_type?: string };
                      message?: string;
                      timestamp?: string;
                    };
                    const parts = [
                      e.timestamp && `[${e.timestamp}]`,
                      e.type && e.type,
                      e.details?.task_id != null && `task_id=${e.details.task_id}`,
                      e.details?.content_type && e.details.content_type,
                      e.message,
                    ].filter(Boolean);
                    return (
                      <Box key={i} component="span" sx={{ display: "block", mb: 0.5 }}>
                        {parts.join(" · ")}
                      </Box>
                    );
                  }
                  return (
                    <Box key={i} component="span" sx={{ display: "block", mb: 0.5 }}>
                      {typeof entry === "string" ? entry : JSON.stringify(entry)}
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          );
        })()}

        <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Approve outline & create course</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Custom slug (optional)"
              value={approveSlug}
              onChange={(e) => setApproveSlug(e.target.value)}
              size="small"
              sx={{ mt: 1, mb: 2 }}
            />
            <TextField
              fullWidth
              label="Thumbnail URL (optional)"
              value={approveThumbnail}
              onChange={(e) => setApproveThumbnail(e.target.value)}
              size="small"
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={approvePublished}
                  onChange={(e) => setApprovePublished(e.target.checked)}
                />
              }
              label="Publish immediately"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setApproveOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleApprove}
              disabled={approving}
              sx={{
                bgcolor: "#10b981",
                "&:hover": { bgcolor: "#059669" },
              }}
            >
              {approving ? "Creating..." : "Create course"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
