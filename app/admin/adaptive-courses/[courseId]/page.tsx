"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { CoursePricingDialog } from "@/components/admin/adaptive-course/CoursePricingDialog";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";
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
import { AdminAdaptiveCourseDetailSkeleton } from "@/components/courses/CourseSkeletons";
import { useToast } from "@/components/common/Toast";
import { Reveal } from "@/components/scorecard/shared";
import { InstructorAssignPanel } from "@/components/instructor/InstructorAssignPanel";
import { AdaptiveSectionShell } from "@/components/adaptive-quiz/shared/AdaptiveSectionShell";
import { AdaptiveSectionHero } from "@/components/adaptive-quiz/shared/AdaptiveSectionHero";
import {
  adminAdaptiveCourseService,
  type AdminAdaptiveCourseContentHealth,
  type AdminAdaptiveCourseDetail,
  type AdminAdaptiveCourseModule,
  type AdminAdaptiveCourseSubModule,
} from "@/lib/services/admin/admin-adaptive-course.service";
import { CourseQuizEditor } from "@/components/admin/adaptive-course/CourseQuizEditor";
import { AdminArticleViewer } from "@/components/admin/adaptive-course/AdminArticleViewer";
import { AdminCodingViewer } from "@/components/admin/adaptive-course/AdminCodingViewer";
import { MatchedVideoReview } from "@/components/adaptive-video/admin/MatchedVideoReview";
import { CourseStudentsPanel } from "@/components/admin/adaptive-course/CourseStudentsPanel";
import { CourseCoverArtPanel } from "@/components/admin/adaptive-course/CourseCoverArtPanel";
import { CourseSettingsPanel } from "@/components/admin/adaptive-course/CourseSettingsPanel";
import { CalibrationAdminSection } from "@/components/admin/adaptive-course/CalibrationAdminSection";
import { CohortScheduleSection } from "@/components/admin/adaptive-course/CohortScheduleSection";
import { ModuleNavigator, MODULES_PER_PAGE } from "@/components/admin/adaptive-course/ModuleNavigator";
import { AddModuleRow, AddSubmoduleRow } from "@/components/admin/adaptive-course/ManualTreeControls";
import { InlineEditableTitle, RowDeleteButton } from "@/components/admin/adaptive-course/TreeRowControls";
import { AddContentDialog } from "@/components/admin/adaptive-course/AddContentDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { getAxiosErrorDetail } from "@/lib/utils/api-error";
import { CalibrationResultsSection } from "@/components/admin/adaptive-course/CalibrationResultsSection";
import { AssignToCohortsDialog } from "@/components/admin/adaptive-course/AssignToCohortsDialog";
import { MockInterviewAdminSection } from "@/components/admin/adaptive-course/MockInterviewAdminSection";
import { CertificateAdminSection } from "@/components/admin/adaptive-course/CertificateAdminSection";
import type { CourseImageTarget } from "@/lib/services/admin/admin-adaptive-course.service";
import { asStringList } from "@/lib/utils/as-list";
import { attachmentLook, formatFileSize } from "@/lib/utils/attachment-display";

type DialogState =
  | { kind: "module" }
  | { kind: "submodule"; moduleId: number; moduleTitle: string }
  | null;

type ContentKind = "article" | "quiz" | "coding" | "video" | "attachment";

/**
 * A staged tree deletion. The heading and message are built at click time, from the
 * tree already on screen, so the confirm can name the real counts (how many topics a
 * week takes with it, how many problems a coding set holds) before any request goes
 * out - the delete response reports those numbers far too late to warn anybody.
 */
type TreeDeleteTarget = { heading: string; message: string } & (
  | { kind: "module"; moduleId: number }
  | { kind: "submodule"; submoduleId: number }
  | { kind: "content"; contentKind: ContentKind; submoduleId: number; contentId: number }
);

type Difficulty = "Easy" | "Medium" | "Hard";
const ALL_DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
// The AI decides 2–4 sub-skills (key_concepts) per submodule; we use this for a
// best-effort estimate of how many questions a quiz will hold.
const EST_CONCEPTS_PER_SUBMODULE = 3;

const CONTENT_TYPE_LABEL: Record<"quiz" | "article" | "coding" | "video", string> = {
  quiz: "Quiz",
  article: "Article",
  coding: "Coding practice",
  video: "Video",
};

export default function AdminAdaptiveCourseDetailPage() {
  const { push } = useInstantNavigation();
  const params = useParams();
  const courseId = Number(params.courseId);
  const { showToast } = useToast();
  const [course, setCourse] = useState<AdminAdaptiveCourseDetail | null>(null);
  /** Which setting is mid-flight, so its own control disables rather than firing twice. */
  const [pendingSetting, setPendingSetting] = useState<string | null>(null);
  /** Content tab paging. A finished course is thousands of pixels of scroll unpaged. */
  const [modulePage, setModulePage] = useState(0);
  const [addContentFor, setAddContentFor] = useState<{ id: number; title: string } | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  /** Staged delete for any tree row (week / topic / one piece of content). */
  const [pendingDelete, setPendingDelete] = useState<TreeDeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
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
    "content" | "calibration" | "mock" | "certificate" | "students" | "settings"
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
  const [assignCohortsOpen, setAssignCohortsOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const { user } = useAuth();
  const { clientInfo } = useClientInfo();
  const canSetPricing = isClientOrgAdminRole(user?.role);
  // Reviewing an instructor's course is an admin act — the same predicate the server uses.
  // An instructor approving their own course is not a review.
  const isReviewer = isClientOrgAdminRole(user?.role);

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
      showToast(getAxiosErrorDetail(e, "Couldn't suggest a topic."), "error");
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
      setError(getAxiosErrorDetail(e, "Failed to load course."));
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

  /**
   * Apply one settings change.
   *
   * Replaces three hand-rolled copies of `setCourse({ ...course, X: res.X })`, which had two
   * bugs in common. It discarded the rest of the response even though the endpoint returns the
   * full course detail — so a server-side coupled write (turning paid off also clears the
   * price) was thrown away and the stale value re-rendered. And it read `course` from the
   * render closure, so two toggles in flight at once each wrote their own stale snapshot and
   * reverted each other.
   *
   * `pendingSetting` disables the control while its own request is in flight. Without it a
   * double-click fired twice, and because `next` was computed from the same closure both
   * requests sent the SAME value — so a user double-clicking to undo ended up toggled on.
   */
  async function applySetting<K extends keyof AdminAdaptiveCourseDetail>(
    key: K,
    value: AdminAdaptiveCourseDetail[K],
    describe: (updated: AdminAdaptiveCourseDetail) => string,
  ) {
    if (!course || pendingSetting) return;
    setPendingSetting(key as string);
    try {
      const updated = await adminAdaptiveCourseService.updateCourse(course.id, { [key]: value });
      // Whole payload, not one field. The server is the authority on everything it just wrote.
      setCourse(updated);
      showToast(describe(updated), "success");
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't save that setting"), "error");
    } finally {
      setPendingSetting(null);
    }
  }

  /** Jump to a module, changing page first so the target is mounted before we scroll to it. */
  const jumpToModule = useCallback((moduleId: number, targetPage: number) => {
    setModulePage(targetPage);
    setActiveModuleId(moduleId);
    // Two frames: one for the page state to commit, one for the newly mounted rows to lay out.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document.getElementById(`module-${moduleId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }),
    );
  }, []);

  async function handleToggleContentLock() {
    if (!course) return;
    await applySetting("content_locked", !course.content_locked, (c) =>
      c.content_locked
        ? "Content locked: weeks unlock on the cohort schedule and late work loses points."
        : "Content unlocked: students can open any week now and always earn full XP.",
    );
  }

  /** The instructor says their course is finished and hands it to an admin. */
  async function handleSubmitForReview() {
    if (!course || submittingReview) return;
    setSubmittingReview(true);
    try {
      const res = await adminAdaptiveCourseService.submitCourseForReview(course.id);
      setCourse((c) => (c ? { ...c, instructor_review_status: res.instructor_review_status as never } : c));
      showToast("Sent for review. An admin will take a look — students can't see it yet.", "success");
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't send that for review."), "error");
    } finally {
      setSubmittingReview(false);
    }
  }

  /** The admin's decision on an instructor-built course. */
  async function handleReview(decision: "approve" | "reject") {
    if (!course || submittingReview) return;
    let note = "";
    if (decision === "reject") {
      // Required, and asked for BEFORE the call so the instructor is never sent a bare "no" —
      // they built a whole course, and "no" with nothing attached just produces the same one
      // again tomorrow.
      note = window.prompt("What needs to change? The instructor sees this.")?.trim() ?? "";
      if (!note) return;
    }
    setSubmittingReview(true);
    try {
      const res = await adminAdaptiveCourseService.reviewCourse(course.id, decision, note);
      setCourse((c) =>
        c ? { ...c, instructor_review_status: res.instructor_review_status as never,
              instructor_review_note: res.instructor_review_note } : c);
      showToast(
        decision === "approve"
          ? "Approved. Assign students to make it live."
          : "Sent back to the instructor with your note.",
        "success",
      );
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't record that decision."), "error");
    } finally {
      setSubmittingReview(false);
    }
  }

  async function handleToggleClipboard() {
    if (!course) return;
    await applySetting("allow_clipboard", !course.allow_clipboard, (c) =>
      c.allow_clipboard
        ? "Copy-paste allowed in the code editor for every coding set in this course."
        : "Copy-paste blocked in the code editor for every coding set in this course.",
    );
  }

  async function handleToggleAutoEnroll() {
    if (!course) return;
    await applySetting("auto_enroll", !course.auto_enroll, (c) =>
      c.auto_enroll
        ? `Auto-enroll on: enrolling every student of this tenant${c.is_published ? " now — this runs in the background." : " once you publish."}`
        : "Auto-enroll off: no new students are added. Anyone already enrolled stays enrolled.",
    );
  }

  async function handleToggleSelfEnroll() {
    if (!course) return;
    await applySetting("self_enroll_enabled", !course.self_enroll_enabled, (c) =>
      c.self_enroll_enabled
        ? `Listed in the catalog: students can find and join this themselves${c.is_published ? "." : " once you publish."}`
        : "Removed from the catalog: students can no longer find and join this themselves.",
    );
  }

  async function handlePublish() {
    if (!course) return;
    try {
      const res = await adminAdaptiveCourseService.publishCourse(course.id);
      setCourse({ ...course, is_published: res.is_published });
      showToast(res.is_published ? "Course published." : "Course unpublished.", "success");
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't update."), "error");
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
      showToast(getAxiosErrorDetail(e, "Couldn't generate a description."), "error");
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
      showToast(getAxiosErrorDetail(e, "Couldn't save."), "error");
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
      // It has NOT started — a super admin reviews the brief first. Saying "started" and then
      // showing a job that never moves is how an admin concludes the builder is broken.
      showToast("Sent for approval — nothing is generated until it's reviewed.", "success");
      push(`/admin/adaptive-courses/jobs/${job.job_id}`);
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't send that for approval."), "error");
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
      showToast(getAxiosErrorDetail(e, "Couldn't start regeneration."), "error");
      setRegenerating(false);
    }
  }

  /**
   * Rename handlers for the inline title editors.
   *
   * Both rethrow: `InlineEditableTitle` reads the rejection as "keep the field open
   * with what was typed", so a rejected rename is retryable instead of silently
   * snapping back to the old title.
   */
  async function handleRenameModule(moduleId: number, title: string) {
    if (!course) return;
    try {
      await adminAdaptiveCourseService.updateModule(course.id, moduleId, { title });
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't rename this week."), "error");
      throw e;
    }
    showToast("Week renamed.", "success");
    await load();
  }

  async function handleRenameSubmodule(submoduleId: number, title: string) {
    try {
      await adminAdaptiveCourseService.updateSubmodule(submoduleId, { title });
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't rename this topic."), "error");
      throw e;
    }
    showToast("Topic renamed.", "success");
    await load();
  }

  async function handleConfirmDelete() {
    const target = pendingDelete;
    if (!target || !course || deleting) return;
    setDeleting(true);
    try {
      let done: string;
      if (target.kind === "module") {
        const res = await adminAdaptiveCourseService.deleteModule(course.id, target.moduleId);
        done =
          res.submodules_removed > 0
            ? `Week deleted, along with ${res.submodules_removed} topic${res.submodules_removed === 1 ? "" : "s"}.`
            : "Week deleted.";
        if (activeModuleId === target.moduleId) setActiveModuleId(null);
        // Deleting the only week on the last page would otherwise leave the admin
        // parked on a page that no longer exists, i.e. an empty tree.
        const lastPage = Math.max(0, Math.ceil((course.modules.length - 1) / MODULES_PER_PAGE) - 1);
        setModulePage((p) => Math.min(p, lastPage));
      } else if (target.kind === "submodule") {
        await adminAdaptiveCourseService.deleteSubmodule(target.submoduleId);
        done = "Topic deleted.";
      } else {
        const res = await adminAdaptiveCourseService.deleteContent(
          target.submoduleId,
          target.contentKind,
          target.contentId,
        );
        done = res.soft
          ? "Removed from the course. Work students already submitted is untouched."
          : "Removed from the course.";
        // An expanded panel pointing at content that no longer exists would keep its
        // editor mounted and refetching a dead id after the tree reloads.
        if (target.contentKind === "article") setExpandedArticle(null);
        if (target.contentKind === "quiz") setExpandedQuiz(null);
        if (target.contentKind === "coding") setExpandedCoding(null);
      }
      setPendingDelete(null);
      showToast(done, "success");
      await load();
    } catch (e) {
      showToast(getAxiosErrorDetail(e, "Couldn't delete that."), "error");
    } finally {
      setDeleting(false);
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
          {loading && <AdminAdaptiveCourseDetailSkeleton />}
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
              />

              {/* The review banner. Shown only for an instructor-built course, and it is the one
                  place either side learns where the course stands — the tree below looks
                  identical whatever the state. */}
              <ReviewBanner
                course={course}
                busy={submittingReview}
                isReviewer={isReviewer}
                onSubmit={() => void handleSubmitForReview()}
                onDecide={(d) => void handleReview(d)}
              />

              {/* One content action. Everything else — edit details, cover art, publish,
                  content health, and every setting — lives in the Settings tab, so there is
                  exactly one place to look for "configure this course" and the header stops
                  being a bag of unrelated pills. */}
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                  alignItems: "center",
                  mt: { xs: -1.5, md: -2 },
                  mb: 2.5,
                }}
              >
                {/* Named for what it does, not as the default way in. "Add module (AI)" read as
                    "the add-module button, which happens to use AI", so an admin building by
                    hand clicked it and landed in a generation form. The plain path is the
                    dashed row at the end of the list, where the module actually appears. */}
                <ButtonBase
                  onClick={() => openDialog({ kind: "module" })}
                  sx={pillBtnSx("outline")}
                >
                  <Icon icon="mdi:auto-fix" width={16} />
                  Generate a week with AI
                </ButtonBase>
              </Box>

              <Box sx={{ display: "flex", gap: 1, mb: 2.5, flexWrap: "wrap" }}>
                {([
                  ["content", "Content", "mdi:book-cog-outline"],
                  ["calibration", "Calibration", "mdi:shield-half-full"],
                  ["mock", "Mock interviews", "mdi:account-voice"],
                  ["certificate", "Certificate", "mdi:certificate"],
                  ["students", "Students", "mdi:account-school-outline"],
                  ["settings", "Settings", "mdi:cog-outline"],
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

              {tab === "settings" && (
                <CourseSettingsPanel
                  course={course}
                  tenantName={clientInfo?.name || "this institution"}
                  pendingSetting={pendingSetting}
                  canSetPricing={canSetPricing}
                  onToggleAutoEnroll={() => void handleToggleAutoEnroll()}
                  onToggleSelfEnroll={() => void handleToggleSelfEnroll()}
                  onToggleContentLock={() => void handleToggleContentLock()}
                  onToggleClipboard={() => void handleToggleClipboard()}
                  onOpenPricing={() => setPricingOpen(true)}
                  onAssignCohorts={() => setAssignCohortsOpen(true)}
                  onEditDetails={openEditDetails}
                  onPublish={() => void handlePublish()}
                  healthSlot={
                    health ? (
                      <ContentHealthPill
                        health={health}
                        regenerating={regenerating}
                        onRegenerate={() => setRegenConfirmOpen(true)}
                      />
                    ) : undefined
                  }
                  scheduleSlot={<CohortScheduleSection courseId={course.id} />}
                  coverSlot={
                    <CourseCoverArtPanel
                      courseId={course.id}
                      headerUrl={course.header_image_url}
                      headerHidden={course.header_image_hidden}
                      cardUrl={course.card_image_url}
                      cardHidden={course.card_image_hidden}
                      onChange={handleCoverChange}
                    />
                  }
                />
              )}


              {tab === "students" && (
                <Stack spacing={2}>
                  {/* Deciding who teaches a course is the institution's call, not a teacher's.
                      The endpoints behind this panel are admin-only, so rendering it to an
                      instructor offered them a staff list they could not change. */}
                  {isReviewer && <InstructorAssignPanel scope="course" id={course.id} />}
                  <CourseStudentsPanel courseId={course.id} courseTitle={course.title} />
                </Stack>
              )}

              {tab === "calibration" && (
                <>
                  <CalibrationAdminSection courseId={course.id} />
                  <CalibrationResultsSection courseId={course.id} />
                </>
              )}

              {tab === "mock" && <MockInterviewAdminSection courseId={course.id} />}

              {tab === "certificate" && <CertificateAdminSection courseId={course.id} />}


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
              <ModuleNavigator
                modules={course.modules}
                page={modulePage}
                onPageChange={(p) => {
                  setModulePage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onJumpToModule={jumpToModule}
                activeModuleId={activeModuleId}
              />
              )}

              {tab === "content" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {course.modules.length === 0 && (
                  <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
                    No weeks yet. Use <strong>Add week</strong> below to build this course
                    yourself, or <strong>Generate a week with AI</strong> to have one written
                    for you.
                  </Typography>
                )}
                {course.modules
                  .slice(modulePage * MODULES_PER_PAGE, (modulePage + 1) * MODULES_PER_PAGE)
                  .map((mod, mIdx) => (
                  <Reveal key={mod.id} delay={Math.min(mIdx, 8) * 0.05}>
                    <Box
                      id={`module-${mod.id}`}
                      sx={{
                        borderRadius: 4,
                        p: { xs: 2, md: 2.5 },
                        bgcolor: "var(--card-bg, #fff)",
                        border: "1px solid var(--border-default, #ececf1)",
                        boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 10px 26px -22px rgba(16,24,40,0.18)",
                        // Clears the sticky app header AND the sticky module index above it,
                        // or a jumped-to module lands underneath both.
                        scrollMarginTop: 150,
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
                        {/* flex:1 so the title column claims the row. Without it the group
                            is shrink-to-fit and a week with no summary line under it squeezes
                            its own title into a one-word column. */}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flex: 1 }}>
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
                          {/* flex:1 rather than max-content sizing. The title sits in an
                              inline-flex button whose `maxWidth: 100%` contributes nothing to
                              this column's max-content, so without flex the column collapses
                              to the width of the "WEEK n" eyebrow above it and a four-letter
                              week title wraps mid-word. */}
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a855f7" }}>
                              Week {mod.weekno}
                            </Typography>
                            <InlineEditableTitle
                              value={mod.title}
                              label="Rename this week"
                              fontSize="1.05rem"
                              fontWeight={800}
                              onSave={(title) => handleRenameModule(mod.id, title)}
                            />
                            <ModuleSummary mod={mod} />
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                          <ButtonBase
                            onClick={() =>
                              openDialog({ kind: "submodule", moduleId: mod.id, moduleTitle: mod.title })
                            }
                            sx={{ ...pillBtnSx("outline"), py: 0.7, fontSize: "0.78rem" }}
                          >
                            <Icon icon="mdi:auto-fix" width={14} />
                            Generate topics with AI
                          </ButtonBase>
                          <RowDeleteButton
                            label="Delete this week"
                            width={18}
                            onClick={() => setPendingDelete(moduleDeleteTarget(mod))}
                          />
                        </Box>
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
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>
                                <InlineEditableTitle
                                  value={sub.title}
                                  label="Rename this topic"
                                  onSave={(title) => handleRenameSubmodule(sub.id, title)}
                                />
                              </Box>
                              <ButtonBase
                                onClick={() => setAddContentFor({ id: sub.id, title: sub.title })}
                                sx={{ ...pillBtnSx("outline"), py: 0.5, px: 1.4, fontSize: "0.74rem" }}
                              >
                                <Icon icon="mdi:plus" width={13} />
                                Add content
                              </ButtonBase>
                              <RowDeleteButton
                                label="Delete this topic"
                                onClick={() => setPendingDelete(submoduleDeleteTarget(sub, mod.weekno))}
                              />
                            </Box>
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
                                    {/* The remove control is a sibling of the expand button, not a
                                        child: a <button> inside a <button> is invalid markup and
                                        swallows one of the two clicks. */}
                                    <Box sx={{ display: "flex", alignItems: "center", pr: 0.75 }}>
                                      <ButtonBase
                                        onClick={() => setExpandedArticle(open ? null : a.article_id)}
                                        sx={{ flex: 1, minWidth: 0, textAlign: "left", display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", p: 1.25 }}
                                      >
                                        <Icon icon="mdi:book-open-variant" width={15} style={{ color: "#a855f7" }} />
                                        <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{a.title}</Typography>
                                        <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                                          adaptive article · {a.default_tier} · ~{a.reading_time_minutes} min · {a.available_tiers.length} tier
                                          {a.available_tiers.length === 1 ? "" : "s"} ready
                                          {a.is_active ? "" : " · inactive"}
                                        </Typography>
                                        <Box sx={{ flex: 1 }} />
                                        {/* The whole row is the button, so a "View article"
                                            label restates what the click already does. The
                                            chevron alone carries the affordance. */}
                                        <Icon
                                          icon={open ? "mdi:chevron-up" : "mdi:chevron-down"}
                                          width={18}
                                          style={{ color: "#a855f7", flexShrink: 0 }}
                                        />
                                      </ButtonBase>
                                      <RowDeleteButton
                                        label="Remove this article"
                                        width={15}
                                        onClick={() =>
                                          setPendingDelete({
                                            kind: "content",
                                            contentKind: "article",
                                            submoduleId: sub.id,
                                            contentId: a.article_id,
                                            heading: "Remove this article",
                                            message: `"${a.title}" and its ${a.available_tiers.length} reading tier${a.available_tiers.length === 1 ? "" : "s"} come out of "${sub.title}". Students stop seeing it; anyone who already read it keeps that progress.`,
                                          })
                                        }
                                      />
                                    </Box>
                                    {open && (
                                      <Box sx={{ px: 1.25, pb: 1.5 }}>
                                        <AdminArticleViewer
                                          courseId={course.id}
                                          articleId={a.article_id}
                                          submoduleId={sub.id}
                                          onSaved={load}
                                        />
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
                                    <Box sx={{ display: "flex", alignItems: "center", pr: 0.75 }}>
                                      <ButtonBase
                                        onClick={() => setExpandedQuiz(open ? null : q.config_id)}
                                        sx={{
                                          flex: 1,
                                          minWidth: 0,
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
                                        <Icon
                                          icon={open ? "mdi:chevron-up" : "mdi:chevron-down"}
                                          width={18}
                                          style={{ color: "#6366f1", flexShrink: 0 }}
                                        />
                                      </ButtonBase>
                                      <RowDeleteButton
                                        label="Remove this quiz"
                                        width={15}
                                        onClick={() =>
                                          setPendingDelete({
                                            kind: "content",
                                            contentKind: "quiz",
                                            submoduleId: sub.id,
                                            contentId: q.config_id,
                                            heading: "Remove this quiz",
                                            message: `"${q.title}" and its ${q.mcq_count}-question bank come out of "${sub.title}". The quiz stops being served; attempts students have already submitted stay in their records.`,
                                          })
                                        }
                                      />
                                    </Box>
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
                                  {/* Copy-paste used to be a pill here, per coding set. Nobody makes
                                      that call topic by topic — it is one decision about a cohort —
                                      so it now lives once in Settings and applies course-wide. */}
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 0.5 }}>
                                    <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                      Coding practice set
                                    </Typography>
                                    <Box sx={{ flex: 1 }} />
                                    <RowDeleteButton
                                      label="Remove this coding set"
                                      width={15}
                                      onClick={() =>
                                        setPendingDelete({
                                          kind: "content",
                                          contentKind: "coding",
                                          submoduleId: sub.id,
                                          contentId: set.config_id,
                                          heading: "Remove this coding set",
                                          message: `"${set.title}" and all ${set.problems.length} problem${set.problems.length === 1 ? "" : "s"} in it come out of "${sub.title}". Students stop seeing the set; code they have already submitted stays in their records.`,
                                        })
                                      }
                                    />
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
                                            {asStringList(p.target_skills).length
                                              ? ` · ${asStringList(p.target_skills).slice(0, 2).join(", ")}`
                                              : ""}
                                            {p.is_active === false ? " · inactive" : ""}
                                          </Typography>
                                          <Box sx={{ flex: 1 }} />
                                          <Icon
                                            icon={open ? "mdi:chevron-up" : "mdi:chevron-down"}
                                            width={18}
                                            style={{ color: "#ec4899", flexShrink: 0 }}
                                          />
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
                                <MatchedVideoReview
                                  key={vc.id}
                                  companion={vc}
                                  onChanged={() => void load()}
                                  onRemove={() =>
                                    setPendingDelete({
                                      kind: "content",
                                      contentKind: "video",
                                      submoduleId: sub.id,
                                      contentId: vc.id,
                                      heading: "Remove this video companion",
                                      message: `"${vc.title}" comes out of "${sub.title}", taking its ${vc.check_in_count} check-in${vc.check_in_count === 1 ? "" : "s"} with it. The video itself stays in your Vimeo catalog and can be attached again.`,
                                    })
                                  }
                                />
                              ))}
                              {(sub.attachments ?? []).map((att) => {
                                const look = attachmentLook(att);
                                return (
                                  <Box
                                    key={`att-${att.id}`}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      p: 1.25,
                                      borderRadius: 2.5,
                                      border: "1px solid color-mix(in srgb, var(--border-default) 65%, transparent)",
                                      opacity: att.is_active ? 1 : 0.55,
                                    }}
                                  >
                                    <Icon icon={look.icon} width={20} style={{ color: look.accent, flexShrink: 0 }} />
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }} noWrap>
                                        {att.title}
                                      </Typography>
                                      <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }} noWrap>
                                        {look.label}
                                        {formatFileSize(att.size_bytes) ? ` · ${formatFileSize(att.size_bytes)}` : ""}
                                        {att.is_active ? "" : " · hidden from students"}
                                      </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1 }} />
                                    {/* Opening it is the only way to confirm the right file went up.
                                        A signed URL leaves the app, so it gets noopener. */}
                                    {att.url && (
                                      <ButtonBase
                                        component="a"
                                        href={att.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Open this handout"
                                        sx={{ p: 0.5, borderRadius: 1.5, color: "text.secondary", flexShrink: 0 }}
                                      >
                                        <Icon icon="mdi:open-in-new" width={15} />
                                      </ButtonBase>
                                    )}
                                    <RowDeleteButton
                                      label="Remove this handout"
                                      width={15}
                                      onClick={() =>
                                        setPendingDelete({
                                          kind: "content",
                                          contentKind: "attachment",
                                          submoduleId: sub.id,
                                          contentId: att.id,
                                          heading: "Remove this handout",
                                          message: `"${att.title}" comes off "${sub.title}" and students stop seeing it. The file itself stays in your storage.`,
                                        })
                                      }
                                    />
                                  </Box>
                                );
                              })}
                              {sub.quizzes.length === 0 &&
                                sub.articles.length === 0 &&
                                (sub.coding_sets?.length ?? 0) === 0 &&
                                (sub.video_companions?.length ?? 0) === 0 &&
                                (sub.attachments?.length ?? 0) === 0 && (
                                  <Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
                                    Nothing here yet. Use <strong>Add content</strong> to write an
                                    article, pull questions from the verified bank, attach a video or
                                    upload a handout.
                                  </Typography>
                                )}
                            </Box>
                          </Box>
                        ))}
                        {mod.submodules.length === 0 && (
                          <Typography sx={{ fontSize: "0.8rem", color: "text.secondary", px: 0.25 }}>
                            No topics in this week yet. Add one by hand below, or use{" "}
                            <strong>Generate topics with AI</strong> above.
                          </Typography>
                        )}
                        {/* Belongs to the MODULE, so it sits after the submodule list rather
                            than inside it. Nested one level deeper it renders once per topic
                            and — the way this shipped — not at all for a week with no topics
                            yet, which is exactly the week you need it on. */}
                        <AddSubmoduleRow
                          courseId={course.id}
                          moduleId={mod.id}
                          onAdded={() => void load()}
                        />
                      </Box>
                    </Box>
                  </Reveal>
                ))}
                  <AddModuleRow courseId={course.id} onAdded={() => void load()} />
              </Box>
              )}
            </>
          )}
        </AdaptiveSectionShell>
      </Box>

      {course && (
        <AssignToCohortsDialog
          open={assignCohortsOpen}
          onClose={() => setAssignCohortsOpen(false)}
          courseId={course.id}
          courseTitle={course.title}
        />
      )}

      {course && canSetPricing && (
        <CoursePricingDialog
          open={pricingOpen}
          course={course}
          onClose={() => setPricingOpen(false)}
          onSaved={(patch) => setCourse({ ...course, ...patch })}
        />
      )}

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
              <> Video AI-matches a transcribed Vimeo video from your catalog (review &amp; swap after).</>
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
              label="Topics to generate"
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
                ["coding", "Coding practice", "mdi:robot-happy-outline"],
                ["video", "Video", "mdi:play-circle-outline"],
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
                label="Articles per topic"
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
                  (Video needs a synced Vimeo catalog with transcribed videos.)
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
    
      <AddContentDialog
        open={addContentFor !== null}
        submoduleId={addContentFor?.id ?? null}
        submoduleTitle={addContentFor?.title ?? ""}
        onClose={() => setAddContentFor(null)}
        onAdded={() => void load()}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.heading ?? ""}
        message={pendingDelete?.message ?? ""}
        confirmText={deleting ? "Deleting…" : "Delete"}
        cancelText="Keep it"
        confirmColor="error"
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => {
          if (!deleting) setPendingDelete(null);
        }}
      />
    </MainLayout>
  );
}

/** Plain-language inventory of one topic, e.g. "2 articles, 1 quiz and 1 video". */
function describeSubmoduleContents(sub: AdminAdaptiveCourseSubModule): string {
  const codingProblems = (sub.coding_sets ?? []).reduce((n, s) => n + s.problems.length, 0);
  const parts = [
    [sub.articles.length, "article", "articles"],
    [sub.quizzes.length, "quiz", "quizzes"],
    [codingProblems, "coding problem", "coding problems"],
    [sub.video_companions?.length ?? 0, "video", "videos"],
    [sub.attachments?.length ?? 0, "handout", "handouts"],
  ] as const;
  const said = parts.filter(([n]) => n > 0).map(([n, one, many]) => `${n} ${n === 1 ? one : many}`);
  if (said.length === 0) return "";
  if (said.length === 1) return said[0];
  return `${said.slice(0, -1).join(", ")} and ${said[said.length - 1]}`;
}

function moduleDeleteTarget(mod: AdminAdaptiveCourseModule): TreeDeleteTarget {
  const n = mod.submodules.length;
  return {
    kind: "module",
    moduleId: mod.id,
    heading: "Delete this week",
    message:
      n === 0
        ? `Week ${mod.weekno}, "${mod.title}", has no topics yet - deleting it just removes the week from the course.`
        : `Week ${mod.weekno}, "${mod.title}", goes away with ${n === 1 ? "its 1 topic" : `all ${n} topics`} inside it and every article, quiz, coding set and video those topics hold. Students stop seeing this content; work they have already submitted stays in their records.`,
  };
}

function submoduleDeleteTarget(sub: AdminAdaptiveCourseSubModule, weekno: number): TreeDeleteTarget {
  const inventory = describeSubmoduleContents(sub);
  return {
    kind: "submodule",
    submoduleId: sub.id,
    heading: "Delete this topic",
    message: inventory
      ? `"${sub.title}" goes away with its ${inventory}. Students stop seeing this content; work they have already submitted stays in their records.`
      : `"${sub.title}" is empty - deleting it just removes the topic from week ${weekno}.`,
  };
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
  const handouts = sum((s) => s.attachments?.length ?? 0);

  const items: { icon: string; n: number; label: string; accent: string }[] = [
    { icon: "mdi:file-tree-outline", n: subs.length, label: `submodule${subs.length === 1 ? "" : "s"}`, accent: "#6366f1" },
    { icon: "mdi:book-open-variant", n: articles, label: "articles", accent: "#a855f7" },
    { icon: "mdi:tune-vertical", n: quizzes, label: "quizzes", accent: "#6366f1" },
    { icon: "mdi:robot-happy-outline", n: coding, label: "coding", accent: "#ec4899" },
    { icon: "mdi:play-circle-outline", n: videos, label: "videos", accent: "#0ea5e9" },
    { icon: "mdi:paperclip", n: handouts, label: "handouts", accent: "#14b8a6" },
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
    px: { xs: 1.5, sm: 2 },
    py: { xs: 0.75, sm: 1 },
    borderRadius: 999,
    fontWeight: 800,
    fontSize: { xs: "0.75rem", sm: "0.82rem" },
    gap: 0.5,
    display: "inline-flex",
    alignItems: "center",
    whiteSpace: "nowrap",
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

/**
 * Where an instructor-built course stands, and the one action available on it.
 *
 * Renders nothing for an ordinary admin- or AI-built course: `instructor_review_status` is
 * blank for those, and a banner explaining a workflow they are not in would be noise.
 */
function ReviewBanner({
  course,
  busy,
  isReviewer,
  onSubmit,
  onDecide,
}: {
  course: AdminAdaptiveCourseDetail;
  busy: boolean;
  /** Whether THIS viewer may decide the review. The banner renders on course state, which is the
   *  same for everyone looking at it — so without this the author sees Approve and Send back on
   *  their own submission, clicks Approve, and gets a 403 they can do nothing about. */
  isReviewer: boolean;
  onSubmit: () => void;
  onDecide: (decision: "approve" | "reject") => void;
}) {
  const state = course.instructor_review_status ?? "";
  if (!state) return null;

  const author = course.authored_by?.name || "an instructor";
  const tone =
    state === "approved" ? "#10b981" : state === "rejected" ? "#ef4444" : state === "pending_review" ? "#f59e0b" : "#6366f1";

  const copy: Record<string, { title: string; body: string }> = {
    draft: {
      title: `Draft — built by ${author}`,
      body: "Students can't see this yet. Send it for review when it's ready; an admin checks it before anyone is assigned.",
    },
    pending_review: {
      title: `Waiting for review — built by ${author}`,
      body: "An admin is checking this. Nothing reaches students until they approve it.",
    },
    approved: {
      title: `Approved — built by ${author}`,
      body: "It can be published now. Assign students from Settings to make it live.",
    },
    rejected: {
      title: `Sent back — built by ${author}`,
      body: course.instructor_review_note || "An admin asked for changes.",
    },
  };
  const text = copy[state];
  if (!text) return null;

  return (
    <Box
      sx={{
        mt: { xs: -1, md: -1.5 },
        mb: 2.5,
        p: 2.25,
        borderRadius: 3.5,
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        flexWrap: "wrap",
        bgcolor: `color-mix(in srgb, ${tone} 7%, var(--card-bg))`,
        border: `1px solid color-mix(in srgb, ${tone} 32%, transparent)`,
      }}
    >
      <Icon
        icon={
          state === "approved" ? "mdi:check-circle-outline"
            : state === "rejected" ? "mdi:close-circle-outline"
            : state === "pending_review" ? "mdi:clock-outline"
            : "mdi:pencil-ruler"
        }
        width={22}
        style={{ color: tone, flexShrink: 0, marginTop: 2 }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: "0.95rem" }}>{text.title}</Typography>
        <Typography sx={{ fontSize: "0.84rem", color: "text.secondary", lineHeight: 1.5 }}>
          {text.body}
        </Typography>
      </Box>

      {/* The author's action. Hidden from the reviewer, who has nothing to submit. */}
      {(state === "draft" || state === "rejected") && !isReviewer && (
        <ButtonBase
          onClick={onSubmit}
          disabled={busy}
          sx={{
            px: 2.4, py: 1, borderRadius: 999, fontWeight: 800, fontSize: "0.84rem", gap: 0.6,
            color: "white", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
            "&:disabled": { opacity: 0.6 },
          }}
        >
          <Icon icon="mdi:send-outline" width={16} />
          {state === "rejected" ? "Send again" : "Send for review"}
        </ButtonBase>
      )}

      {/* The admin's decision, and only theirs. */}
      {state === "pending_review" && isReviewer && (
        <Box sx={{ display: "flex", gap: 1 }}>
          <ButtonBase
            onClick={() => onDecide("reject")}
            disabled={busy}
            sx={{
              px: 2, py: 1, borderRadius: 999, fontWeight: 800, fontSize: "0.84rem",
              color: "text.secondary", bgcolor: "var(--card-bg)",
              border: "1px solid var(--border-default)", "&:disabled": { opacity: 0.6 },
            }}
          >
            Send back
          </ButtonBase>
          <ButtonBase
            onClick={() => onDecide("approve")}
            disabled={busy}
            sx={{
              px: 2.4, py: 1, borderRadius: 999, fontWeight: 800, fontSize: "0.84rem", gap: 0.6,
              color: "white", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              "&:disabled": { opacity: 0.6 },
            }}
          >
            <Icon icon="mdi:check" width={16} />
            Approve
          </ButtonBase>
        </Box>
      )}
    </Box>
  );
}
