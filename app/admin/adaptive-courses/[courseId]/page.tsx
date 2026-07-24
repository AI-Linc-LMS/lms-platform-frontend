"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useInstantNavigation } from "@/lib/hooks/useInstantNavigation";
import {
  Box,
  Button,
  ButtonBase,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Icon } from "@iconify/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { Reveal } from "@/components/scorecard/shared";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import {
  adminAdaptiveCourseService,
  type AdminAdaptiveCourseContentHealth,
  type AdminAdaptiveCourseDetail,
  type AdminAdaptiveCourseModule,
} from "@/lib/services/admin/admin-adaptive-course.service";
import { CourseQuizEditor } from "@/components/admin/adaptive-course/CourseQuizEditor";
import { AdminArticleViewer } from "@/components/admin/adaptive-course/AdminArticleViewer";
import { AdminCodingViewer } from "@/components/admin/adaptive-course/AdminCodingViewer";
import { MatchedVideoReview } from "@/components/adaptive-video/admin/MatchedVideoReview";
import { CourseStudentsPanel } from "@/components/admin/adaptive-course/CourseStudentsPanel";
import { CourseCoverArtPanel } from "@/components/admin/adaptive-course/CourseCoverArtPanel";
import { CalibrationAdminSection } from "@/components/admin/adaptive-course/CalibrationAdminSection";
import { CohortScheduleSection } from "@/components/admin/adaptive-course/CohortScheduleSection";
import { CalibrationResultsSection } from "@/components/admin/adaptive-course/CalibrationResultsSection";
import { MockInterviewAdminSection } from "@/components/admin/adaptive-course/MockInterviewAdminSection";
import { CertificateAdminSection } from "@/components/admin/adaptive-course/CertificateAdminSection";
import type { CourseImageTarget } from "@/lib/services/admin/admin-adaptive-course.service";

type DialogState =
  | { kind: "module" }
  | { kind: "submodule"; moduleId: number; moduleTitle: string }
  | null;

type Difficulty = "Easy" | "Medium" | "Hard";
const ALL_DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
// The AI decides 2–4 sub-skills (key_concepts) per submodule; we use this for a
// best-effort estimate of how many questions a quiz will hold.
const EST_CONCEPTS_PER_SUBMODULE = 3;

const CONTENT_TYPE_LABEL: Record<"quiz" | "article" | "coding" | "video", string> = {
  quiz: "Quiz",
  article: "Article",
  coding: "AI Coding Mentor",
  video: "Video Companion",
};

export default function AdminAdaptiveCourseDetailPage() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);
  const { showToast } = useToast();
  const [course, setCourse] = useState<AdminAdaptiveCourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [topic, setTopic] = useState("");
  const [rationale, setRationale] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState<number | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [expandedCoding, setExpandedCoding] = useState<number | null>(null);
  const [tab, setTab] = useState<
    "content" | "calibration" | "mock" | "certificate" | "students" | "cover"
  >("content");
  // Recovery: regenerate ONLY the submodules still missing content (the banner
  // surfaces the gap; this kicks off a fresh fill-in job).
  const [regenConfirmOpen, setRegenConfirmOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  // Edit course title + description (with AI-drafted description).
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [genDesc, setGenDesc] = useState(false);

  function handleQuizSaved(configId: number, mcqCount: number) {
    setCourse((prev) =>
      prev
        ? {
            ...prev,
            modules: prev.modules.map((m) => ({
              ...m,
              submodules: m.submodules.map((s) => ({
                ...s,
                quizzes: s.quizzes.map((q) =>
                  q.config_id === configId ? { ...q, mcq_count: mcqCount } : q,
                ),
              })),
            })),
          }
        : prev,
    );
  }
  // Generation controls for the add dialog (so the admin sees/controls what gets added).
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["Easy", "Medium", "Hard"]);
  const [perCell, setPerCell] = useState(2);
  const [subCount, setSubCount] = useState(3);
  const [articlesPerSub, setArticlesPerSub] = useState(1);
  const [contentTypes, setContentTypes] = useState<Array<"quiz" | "article" | "coding" | "video">>(["quiz", "article", "coding", "video"]);
  const [codingClipboard, setCodingClipboard] = useState(false);

  function openDialog(state: DialogState) {
    // Reset controls to sane defaults each time the dialog opens.
    setTopic("");
    setRationale("");
    setDifficulties(["Easy", "Medium", "Hard"]);
    setPerCell(2);
    setSubCount(3);
    setArticlesPerSub(1);
    setContentTypes(["quiz", "article", "coding", "video"]);
    setCodingClipboard(false);
    setDialog(state);
  }

  function toggleContentType(t: "quiz" | "article" | "coding" | "video") {
    setContentTypes((prev) => {
      const next = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
      return (["quiz", "article", "coding", "video"] as const).filter((x) => next.includes(x));
    });
  }

  async function handleSuggest() {
    if (!dialog || !course || suggesting) return;
    setSuggesting(true);
    try {
      const res = await adminAdaptiveCourseService.suggestTopic(course.id, {
        scope: dialog.kind,
        module_id: dialog.kind === "submodule" ? dialog.moduleId : undefined,
      });
      setTopic(res.topic);
      setRationale(res.rationale);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't suggest a topic.", "error");
    } finally {
      setSuggesting(false);
    }
  }

  function toggleDifficulty(d: Difficulty) {
    setDifficulties((prev) => {
      const next = prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d];
      return ALL_DIFFICULTIES.filter((x) => next.includes(x));
    });
  }

  const submodulesToAdd = dialog?.kind === "module" ? subCount : 1;
  const perSubmodule = EST_CONCEPTS_PER_SUBMODULE * Math.max(difficulties.length, 1) * perCell;
  const estTotalQuestions = submodulesToAdd * perSubmodule;

  const load = useCallback(async () => {
    try {
      const data = await adminAdaptiveCourseService.getCourse(courseId);
      setCourse(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load course.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!Number.isFinite(courseId)) return;
    void load();
  }, [courseId, load]);

  function handleCoverChange(target: CourseImageTarget, patch: { url?: string | null; hidden?: boolean }) {
    setCourse((prev) => {
      if (!prev) return prev;
      const urlKey = target === "header" ? "header_image_url" : "card_image_url";
      const hiddenKey = target === "header" ? "header_image_hidden" : "card_image_hidden";
      return {
        ...prev,
        ...(patch.url !== undefined ? { [urlKey]: patch.url } : {}),
        ...(patch.hidden !== undefined ? { [hiddenKey]: patch.hidden } : {}),
      };
    });
  }

  async function handleToggleContentLock() {
    if (!course) return;
    const next = !course.content_locked;
    try {
      const res = await adminAdaptiveCourseService.updateCourse(course.id, { content_locked: next });
      setCourse({ ...course, content_locked: res.content_locked });
      showToast(
        res.content_locked
          ? "Content locked: weeks unlock on the cohort schedule and late work loses points."
          : "Content unlocked: students can open any week now and always earn full XP.",
        "success"
      );
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't update the content lock", "error");
    }
  }

  async function handlePublish() {
    if (!course) return;
    try {
      const res = await adminAdaptiveCourseService.publishCourse(course.id);
      setCourse({ ...course, is_published: res.is_published });
      showToast(res.is_published ? "Course published." : "Course unpublished.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't update.", "error");
    }
  }

  function openEditDetails() {
    if (!course) return;
    setEditTitle(course.title);
    setEditDescription(course.description ?? "");
    setEditOpen(true);
  }

  async function handleGenerateDescription() {
    if (!course || genDesc) return;
    setGenDesc(true);
    try {
      const description = await adminAdaptiveCourseService.generateCourseDescription(course.id);
      if (description) setEditDescription(description);
      showToast("Description drafted - review and save.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't generate a description.", "error");
    } finally {
      setGenDesc(false);
    }
  }

  async function handleSaveDetails() {
    if (!course || savingDetails) return;
    const title = editTitle.trim();
    if (!title) {
      showToast("Title can't be empty.", "error");
      return;
    }
    setSavingDetails(true);
    try {
      const updated = await adminAdaptiveCourseService.updateCourse(course.id, {
        title,
        description: editDescription.trim(),
      });
      setCourse(updated);
      setEditOpen(false);
      showToast("Course details saved.", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't save.", "error");
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleDialogSubmit() {
    if (!dialog || !course || topic.trim().length < 2 || difficulties.length === 0 || contentTypes.length === 0 || submitting) return;
    setSubmitting(true);
    const config = {
      difficulty_levels: difficulties,
      questions_per_cell: perCell,
      articles_per_submodule: articlesPerSub,
      content_types: contentTypes,
      ...(contentTypes.includes("coding")
        ? { coding_problems_per_submodule: 2, coding_language: "Python", coding_allow_clipboard: codingClipboard }
        : {}),
    };
    try {
      const job =
        dialog.kind === "module"
          ? await adminAdaptiveCourseService.addModule(course.id, {
              topic: topic.trim(),
              submodules_count: subCount,
              config,
            })
          : await adminAdaptiveCourseService.addSubmodule(course.id, dialog.moduleId, {
              topic: topic.trim(),
              config,
            });
      showToast("AI generation started.", "success");
      push(`/admin/adaptive-courses/jobs/${job.job_id}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't start generation.", "error");
      setSubmitting(false);
    }
  }

  async function handleRegenerate() {
    if (!course || regenerating) return;
    setRegenerating(true);
    try {
      const job = await adminAdaptiveCourseService.regenerateMissingContent(course.id);
      setRegenConfirmOpen(false);
      showToast("Filling in the missing content…", "success");
      // Same flow as the generate/add actions: hand off to the live job view.
      push(`/admin/adaptive-courses/jobs/${job.job_id}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't start regeneration.", "error");
      setRegenerating(false);
    }
  }

  const health = course?.content_health ?? null;
  const showHealthBanner =
    !!health && (health.needs_regeneration || health.total_missing > 0);

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ maxWidth: 1760, mx: "auto", px: { xs: 2, md: 3 }, py: { xs: 3, md: 5 } }}>
        <ButtonBase
          onClick={() => push("/admin/adaptive-courses")}
          sx={{ mb: 2, color: "#6366f1", fontWeight: 700, gap: 0.5, fontSize: "0.9rem" }}
        >
          <Icon icon="mdi:arrow-left" width={18} />
          Back to Adaptive Course Builder
        </ButtonBase>

        <AdaptiveSectionShell>
          {loading && (
            <Typography sx={{ color: "text.secondary", textAlign: "center", py: 6 }}>
              Loading course…
            </Typography>
          )}
          {error && (
            <Typography sx={{ color: "#ef4444", fontWeight: 700, textAlign: "center", py: 4 }}>
              {error}
            </Typography>
          )}

          {course && (
            <>
              <AdaptiveSectionHero
                chapter={course.is_published ? "Published · Adaptive Course" : "Draft · Adaptive Course"}
                title={course.title}
                subtitle={course.description}
                icon="mdi:book-cog-outline"
                accent="indigo"
                rightSlot={
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                    {showHealthBanner && health && (
                      <ContentHealthPill
                        health={health}
                        regenerating={regenerating}
                        onRegenerate={() => setRegenConfirmOpen(true)}
                      />
                    )}
                    <ButtonBase onClick={openEditDetails} sx={pillBtnSx("outline")}>
                      <Icon icon="mdi:pencil-outline" width={16} />
                      Edit details
                    </ButtonBase>
                    <ButtonBase
                      onClick={() => openDialog({ kind: "module" })}
                      sx={pillBtnSx("outline")}
                    >
                      <Icon icon="mdi:plus" width={16} />
                      Add module (AI)
                    </ButtonBase>
                    <ButtonBase
                      onClick={() => void handleToggleContentLock()}
                      sx={pillBtnSx("outline")}
                      title={
                        course.content_locked
                          ? "Weeks unlock on the cohort schedule; late completions lose points. Click to unlock everything."
                          : "All weeks are open and every completion earns full XP. Click to restore the weekly lock."
                      }
                    >
                      <Icon icon={course.content_locked ? "mdi:lock-outline" : "mdi:lock-open-variant-outline"} width={16} />
                      {course.content_locked ? "Content locked" : "Content unlocked"}
                    </ButtonBase>
                    <ButtonBase onClick={() => void handlePublish()} sx={pillBtnSx(course.is_published ? "outline" : "solid")}>
                      <Icon icon={course.is_published ? "mdi:eye-off-outline" : "mdi:earth"} width={16} />
                      {course.is_published ? "Unpublish" : "Publish"}
                    </ButtonBase>
                  </Box>
                }
              />

              <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap" }}>
                {([
                  ["content", "Content", "mdi:book-cog-outline"],
                  ["calibration", "Calibration", "mdi:shield-half-full"],
                  ["mock", "Mock interviews", "mdi:account-voice"],
                  ["certificate", "Certificate", "mdi:certificate"],
                  ["students", "Students", "mdi:account-school-outline"],
                  ["cover", "Cover art", "mdi:image-outline"],
                ] as const).map(([key, label, icon]) => {
                  const active = tab === key;
                  return (
                    <ButtonBase
                      key={key}
                      onClick={() => setTab(key)}
                      sx={{
                        px: 2.25, py: 0.9, borderRadius: 999, fontWeight: 800, fontSize: "0.85rem", gap: 0.6,
                        display: "inline-flex", alignItems: "center",
                        color: active ? "white" : "text.primary",
                        background: active
                          ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)"
                          : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                        border: active ? "1px solid transparent" : "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
                      }}
                    >
                      <Icon icon={icon} width={16} />
                      {label}
                    </ButtonBase>
                  );
                })}
              </Box>

              {tab === "cover" && (
                <CourseCoverArtPanel
                  courseId={course.id}
                  headerUrl={course.header_image_url}
                  headerHidden={course.header_image_hidden}
                  cardUrl={course.card_image_url}
                  cardHidden={course.card_image_hidden}
                  onChange={handleCoverChange}
                />
              )}

              {tab === "students" && (
                <CourseStudentsPanel courseId={course.id} courseTitle={course.title} />
              )}

              {tab === "calibration" && (
                <>
                  <CalibrationAdminSection courseId={course.id} />
                  <CalibrationResultsSection courseId={course.id} />
                </>
              )}

              {tab === "mock" && <MockInterviewAdminSection courseId={course.id} />}

              {tab === "certificate" && <CertificateAdminSection courseId={course.id} />}

              {tab === "content" && <CohortScheduleSection courseId={course.id} />}

              {tab === "content" && course.skills.length > 0 && (
                <Box sx={{
                  mb: 2.5, p: { xs: 2, md: 2.5 }, borderRadius: 4,
                  bgcolor: "color-mix(in srgb, #a855f7 6%, var(--card-bg))",
                  border: "1px solid color-mix(in srgb, #a855f7 25%, transparent)",
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25, flexWrap: "wrap" }}>
                    <Icon icon="mdi:brain" width={18} style={{ color: "#a855f7" }} />
                    <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "#a855f7" }}>
                      Skills this course builds
                    </Typography>
                    <Typography sx={{ fontSize: "0.74rem", color: "text.secondary", fontWeight: 700 }}>
                      · {course.skills.length} skill{course.skills.length === 1 ? "" : "s"} · measured by quizzes, built by articles
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {course.skills.map((s) => (
                      <Box key={s.skill} sx={{
                        display: "inline-flex", alignItems: "center", gap: 0.5, pl: 1.25, pr: 0.5, py: 0.5, borderRadius: 999,
                        color: "white", fontWeight: 800, fontSize: "0.78rem",
                        background: "linear-gradient(135deg, #6366f1 0%, #a855f7 70%, #ec4899 100%)",
                      }}>
                        {prettySkill(s.skill)}
                        {s.question_count > 0 && (
                          <Box component="span" title={`${s.question_count} quiz questions`} sx={{ display: "inline-flex", alignItems: "center", gap: 0.2, px: 0.6, py: 0.1, borderRadius: 999, fontSize: "0.68rem", fontWeight: 900, bgcolor: "rgba(255,255,255,0.25)" }}>
                            <Icon icon="mdi:help-circle-outline" width={11} />{s.question_count}
                          </Box>
                        )}
                        {s.article_count > 0 && (
                          <Box component="span" title={`${s.article_count} articles`} sx={{ display: "inline-flex", alignItems: "center", gap: 0.2, px: 0.6, py: 0.1, borderRadius: 999, fontSize: "0.68rem", fontWeight: 900, bgcolor: "rgba(255,255,255,0.25)" }}>
                            <Icon icon="mdi:book-open-variant" width={11} />{s.article_count}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {tab === "content" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {course.modules.length === 0 && (
                  <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
                    No modules yet. Use <strong>Add module (AI)</strong> to generate one.
                  </Typography>
                )}
                {course.modules.map((mod, mIdx) => (
                  <Reveal key={mod.id} delay={Math.min(mIdx, 8) * 0.05}>
                    <Box
                      sx={{
                        borderRadius: 4,
                        p: { xs: 2, md: 2.5 },
                        bgcolor: "var(--card-bg, #fff)",
                        border: "1px solid var(--border-default, #ececf1)",
                        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 10px 26px -22px rgba(16,24,40,0.18)",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 1.5,
                          mb: 1.75,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2.5,
                              display: "grid",
                              placeItems: "center",
                              color: "white",
                              flexShrink: 0,
                              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                              boxShadow: "0 12px 24px -14px rgba(168,85,247,0.6)",
                            }}
                          >
                            <Icon icon="mdi:calendar-week-outline" width={22} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a855f7" }}>
                              Week {mod.weekno}
                            </Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.25 }}>{mod.title}</Typography>
                            <ModuleSummary mod={mod} />
                          </Box>
                        </Box>
                        <ButtonBase
                          onClick={() =>
                            openDialog({ kind: "submodule", moduleId: mod.id, moduleTitle: mod.title })
                          }
                          sx={{ ...pillBtnSx("outline"), py: 0.7, fontSize: "0.78rem" }}
                        >
                          <Icon icon="mdi:plus" width={14} />
                          Add submodule (AI)
                        </ButtonBase>
                      </Box>

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {mod.submodules.map((sub) => (
                          <Box
                            key={sub.id}
                            sx={{
                              borderRadius: 3,
                              p: 1.75,
                              bgcolor: "color-mix(in srgb, var(--card-bg) 55%, transparent)",
                              border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                            }}
                          >
                            <Typography sx={{ fontWeight: 700, fontSize: "0.95rem" }}>{sub.title}</Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75, mt: 1 }}>
                              {sub.articles.map((a) => {
                                const open = expandedArticle === a.article_id;
                                return (
                                  <Box
                                    key={a.article_id}
                                    sx={{
                                      borderRadius: 2.5,
                                      border: "1px solid color-mix(in srgb, var(--border-default) 65%, transparent)",
                                      bgcolor: open ? "color-mix(in srgb, #a855f7 6%, transparent)" : "transparent",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <ButtonBase
                                      onClick={() => setExpandedArticle(open ? null : a.article_id)}
                                      sx={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", p: 1.25 }}
                                    >
                                      <Icon icon="mdi:book-open-variant" width={15} style={{ color: "#a855f7" }} />
                                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{a.title}</Typography>
                                      <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                                        adaptive article · {a.default_tier} · ~{a.reading_time_minutes} min · {a.available_tiers.length} tier
                                        {a.available_tiers.length === 1 ? "" : "s"} ready
                                        {a.is_active ? "" : " · inactive"}
                                      </Typography>
                                      <Box sx={{ flex: 1 }} />
                                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, color: "#a855f7", fontSize: "0.75rem", fontWeight: 800 }}>
                                        <Icon icon="mdi:book-open-page-variant-outline" width={14} />
                                        {open ? "Hide article" : "View article"}
                                        <Icon icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} width={16} />
                                      </Box>
                                    </ButtonBase>
                                    {open && (
                                      <Box sx={{ px: 1.25, pb: 1.5 }}>
                                        <AdminArticleViewer courseId={course.id} articleId={a.article_id} />
                                      </Box>
                                    )}
                                  </Box>
                                );
                              })}
                              {sub.quizzes.map((q) => {
                                const open = expandedQuiz === q.config_id;
                                return (
                                  <Box
                                    key={q.config_id}
                                    sx={{
                                      borderRadius: 2.5,
                                      border: "1px solid color-mix(in srgb, var(--border-default) 65%, transparent)",
                                      bgcolor: open ? "color-mix(in srgb, #6366f1 5%, transparent)" : "transparent",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <ButtonBase
                                      onClick={() => setExpandedQuiz(open ? null : q.config_id)}
                                      sx={{
                                        width: "100%",
                                        textAlign: "left",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        flexWrap: "wrap",
                                        p: 1.25,
                                      }}
                                    >
                                      <Icon icon="mdi:tune-vertical" width={15} style={{ color: "#6366f1" }} />
                                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{q.title}</Typography>
                                      <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                                        {q.mcq_count}-item bank · serves {q.min_questions}–{q.max_questions}
                                        {q.is_active ? "" : " · inactive"}
                                      </Typography>
                                      <Box sx={{ flex: 1 }} />
                                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, color: "#6366f1", fontSize: "0.75rem", fontWeight: 800 }}>
                                        <Icon icon="mdi:pencil-outline" width={14} />
                                        {open ? "Hide questions" : "View / edit questions"}
                                        <Icon icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} width={16} />
                                      </Box>
                                    </ButtonBase>
                                    {open && (
                                      <Box sx={{ px: 1.25, pb: 1.5 }}>
                                        <CourseQuizEditor
                                          configId={q.config_id}
                                          topic={sub.title}
                                          onSaved={handleQuizSaved}
                                        />
                                      </Box>
                                    )}
                                  </Box>
                                );
                              })}
                              {(sub.coding_sets ?? []).map((set) => (
                                <Box key={`set-${set.config_id}`} sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                                  {/* Set-level controls: copy-paste policy for this coding set's editor */}
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 0.5 }}>
                                    <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                      AI Coding Mentor set
                                    </Typography>
                                    <Box sx={{ flex: 1 }} />
                                    <ButtonBase
                                      onClick={async () => {
                                        try {
                                          const res = await adminAdaptiveCourseService.toggleCodingConfigClipboard(set.config_id);
                                          showToast(res.allow_clipboard ? "Copy-paste enabled for this set." : "Copy-paste disabled for this set.", "success");
                                          void load();
                                        } catch (e) {
                                          showToast(e instanceof Error ? e.message : "Couldn't update.", "error");
                                        }
                                      }}
                                      sx={{
                                        display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.25, py: 0.5, borderRadius: 999,
                                        fontSize: "0.74rem", fontWeight: 800,
                                        color: set.allow_clipboard ? "#10b981" : "#f59e0b",
                                        border: `1px solid color-mix(in srgb, ${set.allow_clipboard ? "#10b981" : "#f59e0b"} 35%, transparent)`,
                                        background: `color-mix(in srgb, ${set.allow_clipboard ? "#10b981" : "#f59e0b"} 10%, transparent)`,
                                      }}
                                    >
                                      <Icon icon={set.allow_clipboard ? "mdi:content-copy" : "mdi:content-copy-off-outline"} width={14} />
                                      Copy-paste: {set.allow_clipboard ? "On" : "Off"}
                                    </ButtonBase>
                                  </Box>
                                  {set.problems.map((p) => {
                                    const open = expandedCoding === p.problem_id;
                                    return (
                                      <Box
                                        key={`c-${p.problem_id}`}
                                        sx={{
                                          borderRadius: 2.5,
                                          border: "1px solid color-mix(in srgb, var(--border-default) 65%, transparent)",
                                          bgcolor: open ? "color-mix(in srgb, #ec4899 5%, transparent)" : "transparent",
                                          overflow: "hidden",
                                        }}
                                      >
                                        <ButtonBase
                                          onClick={() => setExpandedCoding(open ? null : p.problem_id)}
                                          sx={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", p: 1.25 }}
                                        >
                                          <Icon icon="mdi:robot-happy-outline" width={15} style={{ color: "#ec4899" }} />
                                          <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{p.title}</Typography>
                                          <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                                            AI coding mentor · {p.difficulty_level}
                                            {p.target_skills.length ? ` · ${p.target_skills.slice(0, 2).join(", ")}` : ""}
                                            {p.is_active === false ? " · inactive" : ""}
                                          </Typography>
                                          <Box sx={{ flex: 1 }} />
                                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, color: "#ec4899", fontSize: "0.75rem", fontWeight: 800 }}>
                                            <Icon icon="mdi:eye-outline" width={14} />
                                            {open ? "Hide" : "View / edit"}
                                            <Icon icon={open ? "mdi:chevron-up" : "mdi:chevron-down"} width={16} />
                                          </Box>
                                        </ButtonBase>
                                        {open && (
                                          <Box sx={{ px: 1.25, pb: 1.5 }}>
                                            <AdminCodingViewer
                                              problemId={p.problem_id}
                                              onChanged={load}
                                              onDeleted={() => {
                                                setExpandedCoding(null);
                                                void load();
                                              }}
                                            />
                                          </Box>
                                        )}
                                      </Box>
                                    );
                                  })}
                                </Box>
                              ))}
                              {(sub.video_companions ?? []).map((vc) => (
                                <MatchedVideoReview key={vc.id} companion={vc} onChanged={() => void load()} />
                              ))}
                              {sub.quizzes.length === 0 &&
                                sub.articles.length === 0 &&
                                (sub.coding_sets?.length ?? 0) === 0 &&
                                (sub.video_companions?.length ?? 0) === 0 && (
                                  <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                                    No content generated for this submodule.
                                  </Typography>
                                )}
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  </Reveal>
                ))}
              </Box>
              )}
            </>
          )}
        </AdaptiveSectionShell>
      </Box>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Edit course details</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Course title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              fullWidth
            />
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "text.secondary" }}>
                  Description <span style={{ fontWeight: 500 }}>· shown in the course header</span>
                </Typography>
                <Button
                  onClick={handleGenerateDescription}
                  disabled={genDesc}
                  size="small"
                  startIcon={genDesc ? <CircularProgress size={14} /> : <Icon icon="mdi:auto-fix" width={16} />}
                  sx={{ textTransform: "none", fontWeight: 700, color: "#6366f1" }}
                >
                  {genDesc ? "Generating…" : "Generate with AI"}
                </Button>
              </Stack>
              <TextField
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                fullWidth
                multiline
                minRows={3}
                placeholder="A short, compelling summary of what this course covers."
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveDetails}
            variant="contained"
            disabled={savingDetails}
            sx={{ textTransform: "none", fontWeight: 700, background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
          >
            {savingDetails ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={regenConfirmOpen}
        onClose={() => !regenerating && setRegenConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Regenerate missing content?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.9rem" }}>
            This fills in only the submodules that are still missing content. It calls the AI
            and will <strong>use OpenAI credits</strong>. If the gap was caused by a quota or
            billing limit, restore it first - otherwise this run will fail the same way.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRegenConfirmOpen(false)} disabled={regenerating} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={() => void handleRegenerate()}
            variant="contained"
            disabled={regenerating}
            startIcon={regenerating ? <CircularProgress size={16} color="inherit" /> : <Icon icon="mdi:refresh" width={16} />}
            sx={{ textTransform: "none", fontWeight: 700, background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" }}
          >
            {regenerating ? "Starting…" : "Regenerate"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dialog !== null} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          {dialog?.kind === "module"
            ? "Add a module with AI"
            : `Add a submodule to "${dialog?.kind === "submodule" ? dialog.moduleTitle : ""}"`}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary", fontSize: "0.85rem", mb: 2 }}>
            Describe the topic / focus. The engine designs the {dialog?.kind === "module" ? "module's submodules" : "submodule"} and
            generates the selected content types ({contentTypes.length ? contentTypes.map((t) => CONTENT_TYPE_LABEL[t]).join(" · ") : "none selected"}) for each new submodule.
            {contentTypes.includes("video") && (
              <> Video Companion AI-matches a transcribed Vimeo video from your catalog (review &amp; swap after).</>
            )}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Topic / focus"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1, flexWrap: "wrap" }}>
            <ButtonBase
              onClick={() => void handleSuggest()}
              disabled={suggesting}
              sx={{
                display: "inline-flex", alignItems: "center", gap: 0.5, px: 1.75, py: 0.7, borderRadius: 999,
                fontWeight: 800, fontSize: "0.8rem", color: "white",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 70%, #ec4899 100%)",
                "&:disabled": { opacity: 0.6, cursor: "not-allowed" },
              }}
            >
              <Icon icon={suggesting ? "mdi:loading" : "mdi:lightbulb-on-outline"} width={15} className={suggesting ? "acb-spin" : ""} />
              {suggesting ? "Thinking…" : topic ? "Suggest another (AI)" : "Suggest with AI"}
            </ButtonBase>
            {rationale && (
              <Typography sx={{ fontSize: "0.78rem", color: "text.secondary", flex: 1, minWidth: 160 }}>
                {rationale}
              </Typography>
            )}
          </Box>

          {dialog?.kind === "module" && (
            <TextField
              type="number"
              label="Submodules to generate"
              value={subCount}
              onChange={(e) => setSubCount(clamp(Number(e.target.value), 1, 8))}
              sx={{ mt: 2, width: 220 }}
              helperText="AI may adjust slightly to fit the topic"
            />
          )}

          <Box sx={{ mt: 2.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", mb: 1 }}>Content types</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {([
                ["article", "Article", "mdi:book-open-variant"],
                ["quiz", "Quiz", "mdi:tune-vertical"],
                ["coding", "AI Coding Mentor", "mdi:robot-happy-outline"],
                ["video", "Video Companion", "mdi:play-circle-outline"],
              ] as const).map(([key, label, icon]) => {
                const active = contentTypes.includes(key);
                return (
                  <ButtonBase
                    key={key}
                    onClick={() => toggleContentType(key)}
                    sx={{
                      px: 2, py: 0.7, borderRadius: 999, fontWeight: 800, fontSize: "0.8rem", gap: 0.5,
                      color: active ? "white" : "text.primary",
                      background: active ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                      border: active ? "1px solid transparent" : "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
                    }}
                  >
                    <Icon icon={icon} width={14} />
                    {label}
                  </ButtonBase>
                );
              })}
            </Box>
            {contentTypes.includes("coding") && (
              <Box
                component="button"
                onClick={() => setCodingClipboard((v) => !v)}
                sx={{
                  all: "unset", cursor: "pointer", mt: 1.25, display: "inline-flex", alignItems: "center", gap: 0.75,
                  fontSize: "0.8rem", fontWeight: 700, color: "text.secondary",
                }}
              >
                <Icon icon={codingClipboard ? "mdi:checkbox-marked" : "mdi:checkbox-blank-outline"} width={18} style={{ color: codingClipboard ? "#6366f1" : undefined }} />
                Allow copy-paste in the coding editor
                <Typography component="span" sx={{ fontSize: "0.72rem", color: "text.disabled" }}>
                  (off = anti-paste hardening; you can change this per set later)
                </Typography>
              </Box>
            )}
          </Box>

          {(contentTypes.includes("quiz") || contentTypes.includes("coding")) && (
          <Box sx={{ mt: 2.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", mb: 1 }}>Difficulty tiers</Typography>
            <Box sx={{ display: "flex", gap: 1 }}>
              {ALL_DIFFICULTIES.map((d) => {
                const active = difficulties.includes(d);
                return (
                  <ButtonBase
                    key={d}
                    onClick={() => toggleDifficulty(d)}
                    sx={{
                      px: 2, py: 0.7, borderRadius: 999, fontWeight: 800, fontSize: "0.8rem",
                      color: active ? "white" : "text.primary",
                      background: active ? "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)" : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
                      border: active ? "1px solid transparent" : "1px solid color-mix(in srgb, var(--border-default) 75%, transparent)",
                    }}
                  >
                    {d}
                  </ButtonBase>
                );
              })}
            </Box>
          </Box>
          )}

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 2.5 }}>
            {contentTypes.includes("quiz") && (
              <TextField
                type="number"
                label="Questions per skill cell"
                value={perCell}
                onChange={(e) => setPerCell(clamp(Number(e.target.value), 1, 10))}
                sx={{ width: 220 }}
              />
            )}
            {contentTypes.includes("article") && (
              <TextField
                type="number"
                label="Articles per submodule"
                value={articlesPerSub}
                onChange={(e) => setArticlesPerSub(clamp(Number(e.target.value), 1, 5))}
                helperText="Default 1 · up to 5"
                sx={{ width: 220 }}
              />
            )}
          </Box>

          <Box
            sx={{
              mt: 2.5, p: 2, borderRadius: 3,
              bgcolor: "color-mix(in srgb, #6366f1 8%, var(--card-bg))",
              border: "1px solid color-mix(in srgb, #6366f1 25%, transparent)",
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "0.82rem", mb: 0.5 }}>
              Estimated to add
            </Typography>
            <Typography sx={{ fontSize: "0.82rem", color: "text.secondary", lineHeight: 1.6 }}>
              {submodulesToAdd} submodule{submodulesToAdd === 1 ? "" : "s"}
              {contentTypes.includes("quiz") && (
                <>
                  {" "}· ~{perSubmodule} questions each · <strong>~{estTotalQuestions} questions total</strong>
                </>
              )}
              {contentTypes.includes("coding") && (
                <>
                  {" "}· <strong>~{submodulesToAdd * difficulties.length * 2} coding problems</strong>
                </>
              )}
              {contentTypes.includes("article") && (
                <>
                  {" "}· <strong>{submodulesToAdd} article{submodulesToAdd === 1 ? "" : "s"}</strong>
                </>
              )}
              {contentTypes.includes("video") && (
                <>
                  {" "}· <strong>{submodulesToAdd} video companion{submodulesToAdd === 1 ? "" : "s"}</strong>
                </>
              )}
              {(contentTypes.includes("quiz") || contentTypes.includes("coding")) && (
                <>
                  <br />
                  ({EST_CONCEPTS_PER_SUBMODULE} concepts × {difficulties.length} difficulty tier
                  {difficulties.length === 1 ? "" : "s"} × {perCell}/cell - the AI sets 2–4 concepts per submodule,
                  so the real count varies a little.)
                </>
              )}
              {contentTypes.includes("video") && (
                <>
                  <br />
                  (Video Companion needs a synced Vimeo catalog with transcribed videos.)
                </>
              )}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog(null)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleDialogSubmit()}
            disabled={topic.trim().length < 2 || difficulties.length === 0 || submitting}
          >
            {submitting ? "Starting…" : "Generate with AI"}
          </Button>
        </DialogActions>
      </Dialog>
      <style jsx global>{`
        @keyframes acb-spin { to { transform: rotate(360deg); } }
        .acb-spin { animation: acb-spin 0.9s linear infinite; display: inline-flex; }
      `}</style>
    </MainLayout>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** Compact per-module content summary: submodule count + totals by content type. */
function ModuleSummary({ mod }: { mod: AdminAdaptiveCourseModule }) {
  const subs = mod.submodules;
  const sum = (fn: (s: (typeof subs)[number]) => number) => subs.reduce((n, s) => n + fn(s), 0);
  const articles = sum((s) => s.articles.length);
  const quizzes = sum((s) => s.quizzes.length);
  const coding = sum((s) => (s.coding_sets ?? []).reduce((n, c) => n + c.problems.length, 0));
  const videos = sum((s) => s.video_companions?.length ?? 0);

  const items: { icon: string; n: number; label: string; accent: string }[] = [
    { icon: "mdi:file-tree-outline", n: subs.length, label: `submodule${subs.length === 1 ? "" : "s"}`, accent: "#6366f1" },
    { icon: "mdi:book-open-variant", n: articles, label: "articles", accent: "#a855f7" },
    { icon: "mdi:tune-vertical", n: quizzes, label: "quizzes", accent: "#6366f1" },
    { icon: "mdi:robot-happy-outline", n: coding, label: "coding", accent: "#ec4899" },
    { icon: "mdi:play-circle-outline", n: videos, label: "videos", accent: "#0ea5e9" },
  ].filter((x) => x.n > 0);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mt: 0.6, flexWrap: "wrap" }}>
      {items.map((x) => (
        <Box key={x.label} component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.4, fontSize: "0.74rem", fontWeight: 700, color: "text.secondary" }}>
          <Icon icon={x.icon} width={13} style={{ color: x.accent }} />
          {x.n} {x.label}
        </Box>
      ))}
    </Box>
  );
}

function prettySkill(s: string): string {
  return s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
}

/**
 * Compact "content is missing" status pill for the course header. The builder can
 * finish a job while individual content calls fail (usually OpenAI quota/429
 * mid-run), leaving submodules empty. Rather than a full-width highlighted banner,
 * this sits quietly among the header actions; hovering reveals the exact breakdown
 * and clicking opens the regenerate flow. Video gaps are noted separately in the
 * tooltip because they need a catalog video, not an LLM regeneration.
 */
function ContentHealthPill({
  health,
  regenerating,
  onRegenerate,
}: {
  health: AdminAdaptiveCourseContentHealth;
  regenerating: boolean;
  onRegenerate: () => void;
}) {
  const lastJob = health.last_job;
  const isQuota = (lastJob?.quota_failures ?? 0) > 0;
  const parts = (["quiz", "article", "coding"] as const)
    .map((t) => ({ t, n: health.missing[t] ?? 0 }))
    .filter((x) => x.n > 0);
  const videoMissing = health.missing.video ?? 0;
  const total = parts.reduce((s, x) => s + x.n, 0) + videoMissing;
  if (total <= 0) return null;

  const canRegen = health.needs_regeneration;
  const tone = isQuota
    ? { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" }
    : { color: "#b45309", bg: "#fffbeb", border: "#fde68a" };

  const detail = (
    <Box sx={{ py: 0.5 }}>
      <Typography sx={{ fontSize: "0.8rem", fontWeight: 800, mb: 0.5 }}>Some content is missing</Typography>
      {parts.length > 0 && (
        <Typography sx={{ fontSize: "0.78rem", mb: lastJob?.dominant_error || videoMissing > 0 ? 0.5 : 0 }}>
          Missing: {parts.map((x) => `${x.n} ${CONTENT_TYPE_LABEL[x.t].toLowerCase()}`).join(", ")}.
        </Typography>
      )}
      {lastJob?.dominant_error && (
        <Typography sx={{ fontSize: "0.76rem", fontWeight: 600, mb: videoMissing > 0 ? 0.5 : 0 }}>
          {lastJob.dominant_error}
        </Typography>
      )}
      {videoMissing > 0 && (
        <Typography sx={{ fontSize: "0.74rem", opacity: 0.9 }}>
          {videoMissing} submodule{videoMissing === 1 ? "" : "s"} have no matching catalog video - upload/transcribe one
          (not fixed by regeneration).
        </Typography>
      )}
      {canRegen && (
        <Typography sx={{ fontSize: "0.74rem", fontStyle: "italic", opacity: 0.85, mt: 0.5 }}>
          Click to regenerate the missing content.
        </Typography>
      )}
    </Box>
  );

  return (
    <Tooltip arrow placement="bottom" title={detail}>
      <ButtonBase
        onClick={canRegen && !regenerating ? onRegenerate : undefined}
        sx={{
          px: 1.75,
          py: 1,
          borderRadius: 999,
          fontWeight: 800,
          fontSize: "0.82rem",
          gap: 0.5,
          display: "inline-flex",
          alignItems: "center",
          color: tone.color,
          background: tone.bg,
          border: `1px solid ${tone.border}`,
          cursor: canRegen && !regenerating ? "pointer" : "default",
        }}
      >
        {regenerating ? (
          <CircularProgress size={14} color="inherit" />
        ) : (
          <Icon icon={isQuota ? "mdi:credit-card-off-outline" : "mdi:alert-outline"} width={16} />
        )}
        {regenerating ? "Regenerating…" : `${total} item${total === 1 ? "" : "s"} missing`}
      </ButtonBase>
    </Tooltip>
  );
}

function pillBtnSx(variant: "solid" | "outline") {
  return {
    px: 2,
    py: 1,
    borderRadius: 999,
    fontWeight: 800,
    fontSize: "0.82rem",
    gap: 0.5,
    display: "inline-flex",
    alignItems: "center",
    color: variant === "solid" ? "white" : "#6366f1",
    background:
      variant === "solid"
        ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
        : "color-mix(in srgb, var(--card-bg) 60%, transparent)",
    border:
      variant === "solid"
        ? "1px solid transparent"
        : "1px solid color-mix(in srgb, #6366f1 40%, transparent)",
  } as const;
}
