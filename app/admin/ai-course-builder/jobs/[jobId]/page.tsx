"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [regeneratingTaskId, setRegeneratingTaskId] = useState<number | null>(null);
  const [regeneratingSubmoduleId, setRegeneratingSubmoduleId] = useState<number | null>(null);
  const [regeneratingContentId, setRegeneratingContentId] = useState<number | null>(null);

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

  useEffect(() => {
    if (!data?.job || data.job.status !== "generating_content") return;
    const id = setInterval(loadJob, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [data?.job?.status, loadJob]);

  const hasFailedTasks = (data?.failed_tasks ?? 0) > 0;
  const hasContentTasks = (data?.content_tasks?.length ?? 0) > 0;
  const isLive = data?.job?.status === "generating_content";
  const showRegenerateSection =
    !isLive &&
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
      await aiCourseBuilderService.generateAllContent(jobId);
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
              <Typography variant="body2" sx={{ color: "#6b7280", mb: 0.5 }}>
                {t("adminAICourseBuilder.status")} {status.replace(/_/g, " ")}
              </Typography>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
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
                  bgcolor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                }}
              >
                <CircularProgress size={14} sx={{ color: "#059669" }} />
                <Typography variant="caption" sx={{ color: "#047857", fontWeight: 500 }}>
                  {t("adminAICourseBuilder.live")}
                </Typography>
              </Box>
            )}
          </Box>
          
        </Box>

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
                bgcolor: "#10b981",
                "&:hover": { bgcolor: "#059669" },
              }}
            >
              {t("adminAICourseBuilder.approveOutlineCreateCourse")}
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
                {t("adminAICourseBuilder.progress")}
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
                  {t("adminAICourseBuilder.pendingLabel")} {data.pending_tasks ?? 0} • {t("adminAICourseBuilder.generatingLabel")}{" "}
                  {data.generating_tasks ?? 0} • {t("adminAICourseBuilder.completedLabel")} {data.completed_tasks}{" "}
                  • {t("adminAICourseBuilder.failedLabel")} {data.failed_tasks ?? 0}
                </Typography>
              )}
            </Paper>
          );
        })()}

        {job.generated_course_id != null && !isLive && (
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
                                          {subTasks.map((task) => {
                                            const loadingTask = regeneratingTaskId === task.id;
                                            const loadingContent = task.content != null && regeneratingContentId === task.content;
                                            const isPending = task.status === "pending";
                                            return (
                                              <Box
                                                component="li"
                                                key={task.id}
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  flexWrap: "wrap",
                                                  gap: 1,
                                                  ...(task.status === "failed" && {
                                                    bgcolor: "rgba(211, 47, 47, 0.08)",
                                                    borderLeft: "3px solid",
                                                    borderColor: "error.main",
                                                    pl: 0.75,
                                                    borderRadius: 0.5,
                                                  }),
                                                }}
                                              >
                                                <Typography variant="caption" sx={{ mr: 0.5 }} color={task.status === "failed" ? "error" : undefined}>
                                                  {task.content_type} — {task.status}
                                                </Typography>
                                                <Button
                                                  size="small"
                                                  variant="text"
                                                  disabled={loadingTask}
                                                  onClick={() => handleRegenerateTask(task.id)}
                                                  startIcon={
                                                    loadingTask ? (
                                                      <CircularProgress size={12} />
                                                    ) : (
                                                      <IconWrapper icon={isPending ? "mdi:play" : "mdi:refresh"} size={12} />
                                                    )
                                                  }
                                                >
                                                  {isPending ? t("adminAICourseBuilder.generateTask") : t("adminAICourseBuilder.regenerateTask")}
                                                </Button>
                                                {task.content != null && (
                                                  <Button
                                                    size="small"
                                                    variant="text"
                                                    disabled={loadingContent}
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
                                          })}
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
                              {subTasks.map((task) => {
                                const loadingTask = regeneratingTaskId === task.id;
                                const loadingContent = task.content != null && regeneratingContentId === task.content;
                                const isPending = task.status === "pending";
                                return (
                                  <Box
                                    component="li"
                                    key={task.id}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      flexWrap: "wrap",
                                      gap: 1,
                                      ...(task.status === "failed" && {
                                        bgcolor: "rgba(211, 47, 47, 0.08)",
                                        borderLeft: "3px solid",
                                        borderColor: "error.main",
                                        pl: 0.75,
                                        borderRadius: 0.5,
                                      }),
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ mr: 0.5 }} color={task.status === "failed" ? "error" : undefined}>
                                      {task.content_type} — {task.status}
                                    </Typography>
                                    <Button
                                      size="small"
                                      variant="text"
                                      disabled={loadingTask}
                                      onClick={() => handleRegenerateTask(task.id)}
                                      startIcon={
                                        loadingTask ? (
                                          <CircularProgress size={12} />
                                        ) : (
                                          <IconWrapper icon={isPending ? "mdi:play" : "mdi:refresh"} size={12} />
                                        )
                                      }
                                    >
                                      {isPending ? t("adminAICourseBuilder.generateTask") : t("adminAICourseBuilder.regenerateTask")}
                                    </Button>
                                    {task.content != null && (
                                      <Button
                                        size="small"
                                        variant="text"
                                        disabled={loadingContent}
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
                              })}
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
                bgcolor: "#fef2f2",
                border: "1px solid #fecaca",
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
            <Button onClick={() => setApproveOpen(false)}>{t("adminAICourseBuilder.cancel")}</Button>
            <Button
              variant="contained"
              onClick={handleApprove}
              disabled={approving}
              sx={{
                bgcolor: "#10b981",
                "&:hover": { bgcolor: "#059669" },
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
