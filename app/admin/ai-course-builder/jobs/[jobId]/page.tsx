"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  AlertTitle,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  aiCourseBuilderService,
  type JobDetailResponse,
  type ApproveOutlineBody,
  type ContentTask,
  type CourseOutline,
  type OutlineModule,
  type OutlineSubmodule,
} from "@/lib/services/admin/ai-course-builder.service";
import { OutlinePreview } from "@/components/admin/ai-course-builder/OutlinePreview";

const POLL_INTERVAL_MS = 10000;
const POLL_INTERVAL_STALLED_MS = 30000;
// Poll while the job is still working; stop on terminal states.
const NON_TERMINAL_STATUSES = [
  "pending",
  "generating_outline",
  "creating_structure",
  "generating_content",
];
const TERMINAL_STATUSES = ["completed", "failed"];
// Client-side fallback: treat as stalled if no progress change for this long.
const CLIENT_STALL_MS = 120000;

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.jobId as string;
  const { showToast } = useToast();
  const { t } = useTranslation("common");

  const [data, setData] = useState<JobDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveSlug, setApproveSlug] = useState("");
  const [approveThumbnail, setApproveThumbnail] = useState("");
  const [approvePublished, setApprovePublished] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingContent, setGeneratingContent] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [retryingFailed, setRetryingFailed] = useState(false);
  const [regeneratingTaskId, setRegeneratingTaskId] = useState<number | null>(null);
  const [regeneratingSubmoduleId, setRegeneratingSubmoduleId] = useState<number | null>(null);
  const [regeneratingContentId, setRegeneratingContentId] = useState<number | null>(null);

  // Client-side stall fallback: remember the last progress value we saw and
  // when it last changed, so we can flag a wedge even if the server flag lags.
  const lastProgressRef = useRef<string | null>(null);
  const lastProgressAtRef = useRef<number>(Date.now());
  const [clientStalled, setClientStalled] = useState(false);

  const loadJob = useCallback(async () => {
    if (!jobId) return;
    try {
      const res = await aiCourseBuilderService.getJobDetails(jobId);
      setData(res);
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : t("adminAICourseBuilder.failedToLoadJob"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [jobId, showToast, t]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  // (A) Track progress changes to drive the client-side stall fallback.
  useEffect(() => {
    if (!data?.job) return;
    const sig = `${data.job.completed_content_items ?? 0}:${data.job.progress_percentage ?? 0}`;
    if (lastProgressRef.current !== sig) {
      lastProgressRef.current = sig;
      lastProgressAtRef.current = Date.now();
      setClientStalled(false);
    }
  }, [data?.job?.completed_content_items, data?.job?.progress_percentage, data?.job]);

  // (A) Poll on ALL non-terminal statuses; back off while stalled. The recovery
  // banner - not fast polling - is the path out of a wedge.
  const serverStalled = data?.is_stalled === true;
  const pollStatus = data?.job?.status;
  const isStalled = serverStalled || clientStalled;
  useEffect(() => {
    if (!pollStatus || !NON_TERMINAL_STATUSES.includes(pollStatus)) return;
    const interval = isStalled ? POLL_INTERVAL_STALLED_MS : POLL_INTERVAL_MS;
    const tick = () => {
      // Client-side fallback: while generating with no progress change, flag stalled.
      if (
        data?.job?.status === "generating_content" &&
        Date.now() - lastProgressAtRef.current > CLIENT_STALL_MS
      ) {
        setClientStalled(true);
      }
      loadJob();
    };
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [pollStatus, isStalled, loadJob, data?.job?.status]);

  const hasFailedTasks = (data?.failed_tasks ?? 0) > 0;
  const hasContentTasks = (data?.content_tasks?.length ?? 0) > 0;
  const isLive = data?.job?.status === "generating_content";
  const canResume = data?.can_resume === true;
  // (C) Recovery section is no longer hidden while live - show whenever a course
  // exists and there are tasks (or failures) to act on.
  const showRegenerateSection =
    data?.job?.generated_course_id != null &&
    (hasContentTasks || hasFailedTasks);

  const handleRegenerateOutline = async () => {
    try {
      setRegenerating(true);
      await aiCourseBuilderService.regenerateOutline(jobId);
      showToast(t("adminAICourseBuilder.outlineRegenerationStarted"), "success");
      await loadJob();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : t("adminAICourseBuilder.regenerateFailed"),
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
        is_free:true,
        thumbnail: approveThumbnail.trim() || undefined,
        published: approvePublished,
      };
      await aiCourseBuilderService.approveOutline(jobId, body);
      showToast(t("adminAICourseBuilder.courseStructureCreated"), "success");
      setApproveOpen(false);
      await loadJob();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : t("adminAICourseBuilder.approveFailed"),
        "error"
      );
    } finally {
      setApproving(false);
    }
  };

  const handleGenerateAllContent = async () => {
    try {
      setGeneratingContent(true);
      await aiCourseBuilderService.generateAllContent(jobId, {});
      showToast(t("adminAICourseBuilder.contentGenerationStarted"), "success");
      await loadJob();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : t("adminAICourseBuilder.failedToStartGeneration"),
        "error"
      );
    } finally {
      setGeneratingContent(false);
    }
  };

  // (C) Resume even when status === 'generating_content'; force reclaims orphans.
  const handleResume = async () => {
    try {
      setResuming(true);
      const res = await aiCourseBuilderService.resumeGeneration(jobId, {
        force: true,
      });
      showToast(res.message ?? t("adminAICourseBuilder.resumeStarted"), "success");
      setClientStalled(false);
      lastProgressAtRef.current = Date.now();
      await loadJob();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : t("adminAICourseBuilder.resumeFailed"),
        "error"
      );
    } finally {
      setResuming(false);
    }
  };

  // (C) Resume AND retry previously-failed items.
  const handleRetryFailed = async () => {
    try {
      setRetryingFailed(true);
      const res = await aiCourseBuilderService.regenerateFailed(jobId);
      showToast(res.message ?? t("adminAICourseBuilder.retryFailedStarted"), "success");
      setClientStalled(false);
      lastProgressAtRef.current = Date.now();
      await loadJob();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : t("adminAICourseBuilder.retryFailedFailed"),
        "error"
      );
    } finally {
      setRetryingFailed(false);
    }
  };

  const handleRegenerateTask = async (taskId: number) => {
    try {
      setRegeneratingTaskId(taskId);
      const res = await aiCourseBuilderService.regenerateTask(taskId);
      showToast(res.message ?? t("adminAICourseBuilder.regenerationStartedTask"), "success");
      await loadJob();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : t("adminAICourseBuilder.regenerateTaskFailed"),
        "error"
      );
    } finally {
      setRegeneratingTaskId(null);
    }
  };

  const handleRegenerateSubmodule = async (submoduleId: number) => {
    try {
      setRegeneratingSubmoduleId(submoduleId);
      const res = await aiCourseBuilderService.regenerateSubmodule(submoduleId);
      showToast(res.message ?? t("adminAICourseBuilder.regenerationStartedSubmodule"), "success");
      await loadJob();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : t("adminAICourseBuilder.regenerateSubmoduleFailed"),
        "error"
      );
    } finally {
      setRegeneratingSubmoduleId(null);
    }
  };

  const handleRegenerateContent = async (contentId: number) => {
    try {
      setRegeneratingContentId(contentId);
      const res = await aiCourseBuilderService.regenerateContent(contentId);
      showToast(res.message ?? t("adminAICourseBuilder.regenerationStartedContent"), "success");
      await loadJob();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : t("adminAICourseBuilder.regenerateContentFailed"),
        "error"
      );
    } finally {
      setRegeneratingContentId(null);
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
          <Typography color="error">{t("adminAICourseBuilder.jobNotFound")}</Typography>
          <Button component={Link} href="/admin/ai-course-builder" sx={{ mt: 2 }}>
            {t("adminAICourseBuilder.backToAICourseBuilder")}
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
  const isTerminal = TERMINAL_STATUSES.includes(status);

  // Recovery signals.
  const pendingTasks = data.pending_tasks ?? 0;
  const generatingTasks = data.generating_tasks ?? 0;
  const completedTasks = data.completed_tasks ?? 0;
  const failedTasks = data.failed_tasks ?? 0;
  const totalTasks =
    data.total_tasks ??
    pendingTasks + generatingTasks + completedTasks + failedTasks;
  const staleSeconds = data.stale_seconds ?? 0;
  // Prefer server staleness; fall back to client timer.
  const staleMs = serverStalled
    ? staleSeconds * 1000
    : Date.now() - lastProgressAtRef.current;
  const staleMinutes = Math.max(1, Math.round(staleMs / 60000));
  const hasCourse = job.generated_course_id != null;
  // Resume should be offered whenever the job is stalled OR the server says it
  // can be resumed - INCLUDING while status === 'generating_content'.
  const showResume = !isTerminal && hasCourse && (isStalled || canResume);

  // (E) Build a per-task failure-reason lookup from the job error log.
  const taskErrorMessages: Record<number, string> = {};
  if (Array.isArray(job.error_log)) {
    for (const entry of job.error_log as unknown[]) {
      if (entry && typeof entry === "object") {
        const e = entry as {
          message?: string;
          details?: { task_id?: number };
        };
        const tid = e.details?.task_id;
        if (tid != null && e.message) {
          taskErrorMessages[tid] = taskErrorMessages[tid]
            ? `${taskErrorMessages[tid]} · ${e.message}`
            : e.message;
        }
      }
    }
  }

  // (E) Status chip helper.
  const renderStatusChip = (taskStatus: string) => {
    const s = taskStatus.toLowerCase();
    let color: "default" | "primary" | "success" | "error" = "default";
    if (s === "generating" || s === "validating") color = "primary";
    else if (s === "completed") color = "success";
    else if (s === "failed") color = "error";
    return (
      <Chip
        label={taskStatus}
        size="small"
        color={color}
        variant={color === "default" ? "outlined" : "filled"}
        sx={{ height: 20, fontSize: "0.7rem" }}
      />
    );
  };

  // (E) Single task row - status chip, failure reason, attempts, and actions.
  // Destructive regenerate is disabled while a task is actively generating to
  // avoid double-runs.
  const renderTaskRow = (task: ContentTask) => {
    const loadingTask = regeneratingTaskId === task.id;
    const loadingContent =
      task.content != null && regeneratingContentId === task.content;
    const isPending = task.status === "pending";
    const isActive =
      task.status === "generating" || task.status === "validating";
    const isFailed = task.status === "failed";
    const failureReason = taskErrorMessages[task.id];
    const attempts = task.attempts ?? 0;
    return (
      <Box
        component="li"
        key={task.id}
        sx={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
          ...(isFailed && {
            bgcolor:
              "color-mix(in srgb, var(--error-500) 12%, var(--surface) 88%)",
            borderLeft: "3px solid",
            borderColor: "error.main",
            pl: 0.75,
            borderRadius: 0.5,
          }),
        }}
      >
        <Typography variant="caption" sx={{ mr: 0.5 }}>
          {task.content_type}
        </Typography>
        {renderStatusChip(task.status)}
        {attempts > 1 && (
          <Typography variant="caption" color="text.secondary">
            {t("adminAICourseBuilder.attemptsLabel", { count: attempts })}
          </Typography>
        )}
        {isFailed && failureReason && (
          <Typography
            variant="caption"
            color="error"
            sx={{ flexBasis: "100%", wordBreak: "break-word" }}
          >
            {failureReason}
          </Typography>
        )}
        <Button
          size="small"
          variant="text"
          disabled={loadingTask || isActive}
          onClick={() => handleRegenerateTask(task.id)}
          startIcon={
            loadingTask ? (
              <CircularProgress size={12} />
            ) : (
              <IconWrapper icon={isPending ? "mdi:play" : "mdi:refresh"} size={12} />
            )
          }
        >
          {isPending
            ? t("adminAICourseBuilder.generateTask")
            : t("adminAICourseBuilder.regenerateTask")}
        </Button>
        {task.content != null && (
          <Button
            size="small"
            variant="text"
            disabled={loadingContent || isActive}
            onClick={() => handleRegenerateContent(task.content!)}
            startIcon={
              loadingContent ? (
                <CircularProgress size={12} />
              ) : (
                <IconWrapper icon="mdi:refresh" size={12} />
              )
            }
          >
            {t("adminAICourseBuilder.regenerateContent")}
          </Button>
        )}
      </Box>
    );
  };

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
              color: "var(--accent-indigo)",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            <IconWrapper icon="mdi:arrow-left" size={20} />
            {t("adminAICourseBuilder.backToAICourseBuilder")}
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
              <Typography variant="body2" sx={{ color: "var(--font-secondary)", mb: 0.5 }}>
                {t("adminAICourseBuilder.status")} {status.replace(/_/g, " ")}
              </Typography>
              <Typography variant="caption" sx={{ color: "var(--font-tertiary)" }}>
                {t("adminAICourseBuilder.jobId")} {job.job_id}
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
                  bgcolor:
                    "color-mix(in srgb, var(--success-500) 12%, var(--surface) 88%)",
                  border:
                    "1px solid color-mix(in srgb, var(--success-500) 35%, var(--border-default) 65%)",
                }}
              >
                <CircularProgress size={14} sx={{ color: "var(--success-500)" }} />
                <Typography variant="caption" sx={{ color: "var(--success-500)", fontWeight: 500 }}>
                  {t("adminAICourseBuilder.live")}
                </Typography>
              </Box>
            )}
          </Box>

        </Box>

        {/* (B) Stall banner - prominent warning + primary Resume action. */}
        {isStalled && (
          <Alert
            severity="warning"
            sx={{ mb: 3 }}
            action={
              hasCourse ? (
                <Button
                  color="warning"
                  variant="contained"
                  size="small"
                  onClick={handleResume}
                  disabled={resuming}
                  startIcon={
                    resuming ? (
                      <CircularProgress size={16} />
                    ) : (
                      <IconWrapper icon="mdi:play" size={16} />
                    )
                  }
                >
                  {resuming
                    ? t("adminAICourseBuilder.resuming")
                    : t("adminAICourseBuilder.resumeGeneration")}
                </Button>
              ) : undefined
            }
          >
            <AlertTitle>{t("adminAICourseBuilder.generationStalled")}</AlertTitle>
            {t("adminAICourseBuilder.generationStalledBody", { minutes: staleMinutes })}
            <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
              {t("adminAICourseBuilder.completedLabel")} {completedTasks} •{" "}
              {t("adminAICourseBuilder.failedLabel")} {failedTasks} •{" "}
              {t("adminAICourseBuilder.total")} {totalTasks}
            </Typography>
          </Alert>
        )}

        {/* (C) Recovery actions - Resume / Retry failed. Visible even while live. */}
        {(showResume || failedTasks > 0) && (
          <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
            {showResume && (
              <Button
                variant="contained"
                onClick={handleResume}
                disabled={resuming}
                startIcon={
                  resuming ? (
                    <CircularProgress size={18} />
                  ) : (
                    <IconWrapper icon="mdi:play" size={18} />
                  )
                }
                sx={{
                  bgcolor: "var(--accent-indigo)",
                  color: "var(--font-light)",
                  "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
                }}
              >
                {resuming
                  ? t("adminAICourseBuilder.resuming")
                  : t("adminAICourseBuilder.resumeGeneration")}
              </Button>
            )}
            {failedTasks > 0 && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleRetryFailed}
                disabled={retryingFailed}
                startIcon={
                  retryingFailed ? (
                    <CircularProgress size={18} />
                  ) : (
                    <IconWrapper icon="mdi:refresh" size={18} />
                  )
                }
              >
                {retryingFailed
                  ? t("adminAICourseBuilder.retrying")
                  : t("adminAICourseBuilder.retryFailedItems", { count: failedTasks })}
              </Button>
            )}
          </Box>
        )}

        {outlineReady && job.generated_course_id == null && (
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
              {regenerating ? t("adminAICourseBuilder.regenerating") : t("adminAICourseBuilder.regenerateOutline")}
            </Button>
            <Button
              variant="contained"
              onClick={() => setApproveOpen(true)}
              sx={{
                bgcolor: "var(--success-500)",
                color: "var(--font-light)",
                "&:hover": {
                  bgcolor:
                    "color-mix(in srgb, var(--success-500) 85%, black 15%)",
                },
              }}
            >
              {t("adminAICourseBuilder.approveOutlineCreateCourse")}
            </Button>
          </Box>
        )}
        
        {/* (D) Progress card - never freeze silently. Always shown while a
            generated course exists in a non-terminal state, and on completion. */}
        {(() => {
          const totalItems = job.total_content_items ?? 0;
          const showProgress =
            status !== "outline_ready" &&
            ((hasCourse && !isTerminal) || status === "completed");
          if (!showProgress) return null;
          const indeterminate = totalItems === 0 && status !== "completed";
          return (
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t("adminAICourseBuilder.progress")}
              </Typography>
              {indeterminate ? (
                <Box>
                  <LinearProgress sx={{ height: 8, borderRadius: 1 }} />
                  <Typography
                    variant="body2"
                    sx={{ color: "var(--font-secondary)", mt: 0.5 }}
                  >
                    {t("adminAICourseBuilder.preparingContentTasks")}
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ flex: 1, height: 8, borderRadius: 1 }}
                  />
                  <Typography variant="body2" sx={{ minWidth: 80 }}>
                    {job.completed_content_items ?? 0} / {totalItems} ({progress}%)
                  </Typography>
                </Box>
              )}
              <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mt: 0.5 }}>
                {t("adminAICourseBuilder.pendingLabel")} {pendingTasks} • {t("adminAICourseBuilder.generatingLabel")}{" "}
                {generatingTasks} • {t("adminAICourseBuilder.completedLabel")} {completedTasks}{" "}
                • {t("adminAICourseBuilder.failedLabel")} {failedTasks}
              </Typography>
            </Paper>
          );
        })()}

        {/* Fresh-start / "all generated" indicator. Hidden when the dedicated
            Resume action above is offered (it supersedes this for a wedge). */}
        {job.generated_course_id != null && !isLive && !showResume && (
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
                bgcolor: "var(--accent-indigo)",
                color: "var(--font-light)",
                "&:hover": { bgcolor: "var(--accent-indigo-dark)" },
              }}
            >
              {generatingContent
                ? t("adminAICourseBuilder.starting")
                : data.pending_tasks === 0 && status === "completed"
                  ? t("adminAICourseBuilder.allContentGenerated")
                  : t("adminAICourseBuilder.generateAllContent")}
            </Button>
          </Box>
        )}

        {showRegenerateSection && (
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                {t("adminAICourseBuilder.regenerateContentSection")}
              </Typography>
              {hasFailedTasks && (
                <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                  {t("adminAICourseBuilder.someTasksFailed")}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t("adminAICourseBuilder.regenerateBySubmoduleNote")}
              </Typography>
              {!hasContentTasks && hasFailedTasks ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                  <Typography variant="body2" color="text.secondary">
                    {t("adminAICourseBuilder.taskListNotLoaded")}
                  </Typography>
                  <Button size="small" variant="outlined" onClick={loadJob} startIcon={<IconWrapper icon="mdi:refresh" size={16} />}>
                    {t("adminAICourseBuilder.refresh")}
                  </Button>
                </Box>
              ) : (
              (() => {
                const tasks = (data.content_tasks ?? []) as ContentTask[];
                const outline = job.outline as CourseOutline | null | undefined;

                const tasksBySubmoduleTitle = tasks.reduce<Record<string, ContentTask[]>>(
                  (acc, t) => {
                    const key = t.submodule_title?.trim() ?? "";
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(t);
                    return acc;
                  },
                  {}
                );

                const subProgress = (taskList: ContentTask[]) => {
                  const total = taskList.length;
                  const completed = taskList.filter((t) => t.status === "completed").length;
                  return { completed, total, pct: total ? Math.round((completed / total) * 100) : 0 };
                };

                if (outline?.modules?.length) {
                  return (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {(outline.modules as OutlineModule[]).map((mod, modIdx) => {
                        const modTasks: ContentTask[] = [];
                        (mod.submodules ?? []).forEach((sub: OutlineSubmodule) => {
                          const key = sub.title?.trim() ?? "";
                          const list = tasksBySubmoduleTitle[key] ?? [];
                          modTasks.push(...list);
                        });
                        const modProg = subProgress(modTasks);
                        return (
                          <Accordion
                            key={`week-${mod.week}-${modIdx}`}
                            disableGutters
                            sx={{ "&:before": { display: "none" }, borderBottom: "1px solid", borderColor: "divider" }}
                          >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 56 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%", pr: 1 }}>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  Week {mod.week}: {mod.title}
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={modProg.pct}
                                  sx={{ flex: 1, maxWidth: 200, height: 8, borderRadius: 1 }}
                                />
                                <Typography variant="caption" sx={{ minWidth: 48 }}>
                                  {modProg.completed} / {modProg.total} ({modProg.pct}%)
                                </Typography>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0 }}>
                              {(mod.submodules ?? []).map((sub: OutlineSubmodule, subIdx: number) => {
                                const key = sub.title?.trim() ?? "";
                                const subTasks = tasksBySubmoduleTitle[key] ?? [];
                                const subProg = subProgress(subTasks);
                                const subId = subTasks[0]?.submodule;
                                const loadingSub = subId != null && regeneratingSubmoduleId === subId;
                                return (
                                  <Accordion
                                    key={`${modIdx}-${subIdx}-${key}`}
                                    disableGutters
                                    sx={{ boxShadow: "none", "&:before": { display: "none" }, border: "1px solid", borderColor: "divider", borderRadius: 1, mb: 1, "&.Mui-expanded": { m: 0, mb: 1 } }}
                                  >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48 }}>
                                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", pr: 1 }}>
                                        <Typography variant="body2" fontWeight={500}>
                                          {sub.title}
                                        </Typography>
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                          <LinearProgress
                                            variant="determinate"
                                            value={subProg.pct}
                                            sx={{ width: 80, height: 6, borderRadius: 1 }}
                                          />
                                          <Typography variant="caption" color="text.secondary">
                                            {subProg.completed} / {subProg.total}
                                          </Typography>
                                          {subId != null && (
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              disabled={loadingSub}
                                              onClick={(e) => { e.stopPropagation(); handleRegenerateSubmodule(subId); }}
                                              startIcon={
                                                loadingSub ? (
                                                  <CircularProgress size={14} />
                                                ) : (
                                                  <IconWrapper icon="mdi:refresh" size={14} />
                                                )
                                              }
                                            >
                                              {t("adminAICourseBuilder.regenerateSubmodule")}
                                            </Button>
                                          )}
                                        </Box>
                                      </Box>
                                    </AccordionSummary>
                                    <AccordionDetails sx={{ pt: 0, pl: 2, borderTop: "1px solid", borderColor: "divider" }}>
                                      {subTasks.length > 0 ? (
                                        <Box component="ul" sx={{ m: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                                          {subTasks.map((task) => renderTaskRow(task))}
                                        </Box>
                                      ) : (
                                        <Typography variant="caption" color="text.secondary">
                                          {t("adminAICourseBuilder.noTasksForSubmodule")}
                                        </Typography>
                                      )}
                                    </AccordionDetails>
                                  </Accordion>
                                );
                              })}
                            </AccordionDetails>
                          </Accordion>
                        );
                      })}
                    </Box>
                  );
                }

                const bySubmodule = tasks.reduce<Record<number, ContentTask[]>>(
                  (acc, t) => {
                    const sid = t.submodule;
                    if (!acc[sid]) acc[sid] = [];
                    acc[sid].push(t);
                    return acc;
                  },
                  {}
                );
                return (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {Object.entries(bySubmodule).map(([subIdStr, subTasks]) => {
                      const subId = Number(subIdStr);
                      const title = subTasks[0]?.submodule_title ?? t("adminAICourseBuilder.submoduleFallback", { id: subId });
                      const loadingSub = regeneratingSubmoduleId === subId;
                      const prog = subProgress(subTasks);
                      return (
                        <Accordion
                          key={subId}
                          disableGutters
                          sx={{ "&:before": { display: "none" }, borderBottom: "1px solid", borderColor: "divider" }}
                        >
                          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 48 }}>
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", pr: 1 }}>
                              <Typography variant="body2" fontWeight={500}>
                                {title}
                              </Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <LinearProgress variant="determinate" value={prog.pct} sx={{ width: 80, height: 6, borderRadius: 1 }} />
                                <Typography variant="caption" color="text.secondary">
                                  {prog.completed} / {prog.total}
                                </Typography>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={loadingSub}
                                  onClick={(e) => { e.stopPropagation(); handleRegenerateSubmodule(subId); }}
                                  startIcon={
                                    loadingSub ? (
                                      <CircularProgress size={14} />
                                    ) : (
                                      <IconWrapper icon="mdi:refresh" size={14} />
                                    )
                                  }
                                >
                                  {t("adminAICourseBuilder.regenerateSubmodule")}
                                </Button>
                              </Box>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails sx={{ pt: 0, borderTop: "1px solid", borderColor: "divider" }}>
                            <Box component="ul" sx={{ m: 0, pl: 2.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                              {subTasks.map((task) => renderTaskRow(task))}
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}
                  </Box>
                );
              })() )}
            </Paper>
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
                bgcolor:
                  "color-mix(in srgb, var(--error-500) 12%, var(--surface) 88%)",
                border:
                  "1px solid color-mix(in srgb, var(--error-500) 35%, var(--border-default) 65%)",
              }}
            >
              <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                {t("adminAICourseBuilder.errorLogs")}
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
                  bgcolor:
                    "color-mix(in srgb, var(--font-primary) 5%, transparent)",
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
          <DialogTitle>{t("adminAICourseBuilder.approveOutlineDialogTitle")}</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label={t("adminAICourseBuilder.customSlugOptional")}
              value={approveSlug}
              onChange={(e) => setApproveSlug(e.target.value)}
              size="small"
              sx={{ mt: 1, mb: 2 }}
            />
            <TextField
              fullWidth
              label={t("adminAICourseBuilder.thumbnailUrlOptional")}
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
              label={t("adminAICourseBuilder.publishImmediately")}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setApproveOpen(false)}
              sx={{ color: "var(--font-secondary)" }}
            >
              {t("adminAICourseBuilder.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={handleApprove}
              disabled={approving}
              sx={{
                bgcolor: "var(--success-500)",
                color: "var(--font-light)",
                "&:hover": {
                  bgcolor:
                    "color-mix(in srgb, var(--success-500) 85%, black 15%)",
                },
                "&.Mui-disabled": {
                  color: "var(--font-secondary)",
                  backgroundColor:
                    "color-mix(in srgb, var(--success-500) 24%, var(--surface) 76%)",
                },
              }}
            >
              {approving ? t("adminAICourseBuilder.creating") : t("adminAICourseBuilder.createCourse")}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
