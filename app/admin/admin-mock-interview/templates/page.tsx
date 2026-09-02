"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import { adminAdaptiveCourseService } from "@/lib/services/admin/admin-adaptive-course.service";
import interviewService, {
  type InterviewParticipantsResponse,
  type InterviewReport,
} from "@/lib/services/interview.service";
import adminMockInterviewService, {
  type InterviewTemplate,
  type InterviewTemplateCreatePayload,
  type InterviewLifecycleStatus,
  type InterviewTemplateDifficulty,
  type InterviewResultReleaseMode,
  type AdminTemplateAttempt,
  type ReattemptScope,
} from "@/lib/services/admin/admin-mock-interview.service";
import {
  INTERVIEW_TOPICS,
  CUSTOM_TOPIC_VALUE,
} from "@/lib/constants/interview-topics";

/**
 * Admin: Create Interview page.
 *
 * Workflow:
 *   1. Admin fills in interview details (title, topic, subtopic, difficulty, duration).
 *   2. Picks one or more courses in the "Map to course(s)" section.
 *   3. Clicks Publish - the interview becomes visible to every enrolled student of those
 *      courses on the Courses tab in their interview section, and a notification fires.
 *
 * The right-hand panel is single-purpose (create OR edit, toggled by selectedTemplate).
 * The data model is still called "template" in the backend / service layer because each
 * interview here spawns N per-student attempts when claimed - but on the user-facing
 * surface we just call it "interview".
 */

const DIFFICULTIES: InterviewTemplateDifficulty[] = ["Easy", "Medium", "Hard"];
const RELEASE_MODES: { value: InterviewResultReleaseMode; label: string; help: string }[] = [
  {
    value: "manual",
    label: "Manual release (recommended for courses)",
    help: "Students get a 'submitted' notification. You release results from the Attempts list.",
  },
  {
    value: "scheduled",
    label: "Scheduled release at a fixed time",
    help: "Results auto-flip visible at the chosen date/time.",
  },
  {
    value: "immediate",
    label: "Immediate (legacy / practice templates only)",
    help: "Student sees the evaluation the moment they finish.",
  },
];

interface DraftTemplate {
  topicSelection: string;
  customTopic: string;
  difficulty: InterviewTemplateDifficulty;
  duration_minutes: number;
  description: string;
  is_active: boolean;
  course_ids: number[];
  adaptive_course_ids: number[];
  num_coding_questions: number;
  num_mcq_questions: number;
  result_release_mode: InterviewResultReleaseMode;
  result_release_at: string;
  resume_enabled: boolean;
  resume_window_minutes: number | "";
  status: InterviewLifecycleStatus;
  /** datetime-local strings ("" = unset), converted to ISO on submit. */
  opens_at: string;
  closes_at: string;
}

const EMPTY_DRAFT: DraftTemplate = {
  topicSelection: "",
  customTopic: "",
  difficulty: "Medium",
  duration_minutes: 7,
  description: "",
  is_active: true,
  course_ids: [],
  adaptive_course_ids: [],
  num_coding_questions: 2,
  num_mcq_questions: 1,
  result_release_mode: "manual",
  result_release_at: "",
  resume_enabled: true,
  resume_window_minutes: "",
  // New interviews are published, matching the model default and today's behaviour: an
  // interview an admin creates here is meant to go live. Draft is a deliberate choice they
  // make, not a state they land in by accident.
  status: "published",
  opens_at: "",
  closes_at: "",
};

function toDraft(t: InterviewTemplate): DraftTemplate {
  const known = INTERVIEW_TOPICS.includes(t.topic as (typeof INTERVIEW_TOPICS)[number]);
  return {
    topicSelection: known ? t.topic : t.topic ? CUSTOM_TOPIC_VALUE : "",
    customTopic: known ? "" : t.topic || "",
    difficulty: t.difficulty,
    duration_minutes: t.duration_minutes,
    description: t.description || "",
    is_active: t.is_active,
    course_ids: t.course_ids,
    adaptive_course_ids: t.adaptive_course_ids ?? [],
    num_coding_questions: t.num_coding_questions ?? 2,
    num_mcq_questions: t.num_mcq_questions ?? 1,
    result_release_mode: t.result_release_mode ?? "manual",
    result_release_at: t.result_release_at
      ? t.result_release_at.slice(0, 16)
      : "",
    resume_enabled: t.resume_enabled ?? true,
    resume_window_minutes:
      typeof t.resume_window_minutes === "number" ? t.resume_window_minutes : "",
    status: t.status ?? "published",
    opens_at: t.opens_at ? t.opens_at.slice(0, 16) : "",
    closes_at: t.closes_at ? t.closes_at.slice(0, 16) : "",
  };
}

const LIFECYCLE_LABEL: Record<InterviewLifecycleStatus, string> = {
  draft: "Draft",
  published: "Published",
  closed: "Closed",
  archived: "Archived",
};

/** Short, unambiguous date for a chip: "5 Sep, 10:00". */
function formatWindow(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveTopic(draft: DraftTemplate): string {
  if (draft.topicSelection === CUSTOM_TOPIC_VALUE) {
    return draft.customTopic.trim();
  }
  return draft.topicSelection.trim();
}

export default function AdminInterviewTemplatesPage() {
  const { showToast } = useToast();
  const router = useRouter();

  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [courses, setCourses] = useState<Array<{ id: number; title: string }>>([]);
  const [adaptiveCourses, setAdaptiveCourses] = useState<Array<{ id: number; title: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<InterviewTemplate | null>(
    null
  );
  const [draft, setDraft] = useState<DraftTemplate>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InterviewTemplate | null>(null);
  const [attemptsDialogTemplate, setAttemptsDialogTemplate] = useState<InterviewTemplate | null>(null);
  const [attemptsList, setAttemptsList] = useState<AdminTemplateAttempt[]>([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  // The roster, which is a different question from the attempts list: an attempt only exists
  // once someone starts, so the people who have NOT started can only come from here.
  const [participants, setParticipants] = useState<InterviewParticipantsResponse | null>(null);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [releasingAttemptId, setReleasingAttemptId] = useState<number | null>(null);
  const [bulkReleasing, setBulkReleasing] = useState(false);
  const [evaluatingTemplateId, setEvaluatingTemplateId] = useState<number | null>(null);
  const [reattemptScope, setReattemptScope] = useState<ReattemptScope>("all");
  const [reattemptingId, setReattemptingId] = useState<number | null>(null);
  const [bulkReattempting, setBulkReattempting] = useState(false);
  // Mirrors the currently-open attempts dialog so a delayed refresh can check whether it's
  // still open without capturing a stale value in a setTimeout closure.
  const attemptsDialogTemplateRef = useRef<InterviewTemplate | null>(null);

  const isEditing = selectedTemplate !== null;

  /**
   * A window that shuts before it opens makes the interview unsittable by everyone, forever.
   * The server refuses it too - this just says so before the round trip, next to the field
   * that is wrong rather than in a toast.
   */
  const windowError =
    draft.opens_at && draft.closes_at && new Date(draft.closes_at) <= new Date(draft.opens_at)
      ? "Must be after it opens."
      : "";

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tmpls, coursesData, adaptiveData] = await Promise.all([
        adminMockInterviewService.listTemplates(),
        adminCoursesService.getCourses().catch(() => []),
        adminAdaptiveCourseService.listCourses().catch(() => []),
      ]);
      setTemplates(tmpls);
      setAdaptiveCourses(
        (adaptiveData ?? [])
          .filter((c) => c.is_published)
          .map((c) => ({ id: c.id, title: c.title }))
      );
      const rawList = Array.isArray(coursesData)
        ? coursesData
        : Array.isArray((coursesData as { results?: unknown[] })?.results)
          ? ((coursesData as { results: unknown[] }).results as unknown[])
          : [];
      setCourses(
        rawList
          .map((c) => {
            const v = c as { id?: number; title?: string };
            if (typeof v.id !== "number" || !v.title) return null;
            return { id: v.id, title: v.title };
          })
          .filter(Boolean) as Array<{ id: number; title: string }>
      );
    } catch (err) {
      showToast("Failed to load interview templates", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    attemptsDialogTemplateRef.current = attemptsDialogTemplate;
  }, [attemptsDialogTemplate]);

  // Quick course lookup so the list view can render attached-course chips without a join.
  const courseById = useMemo(() => {
    const m = new Map<number, string>();
    courses.forEach((c) => m.set(c.id, c.title));
    return m;
  }, [courses]);

  const adaptiveCourseById = useMemo(() => {
    const m = new Map<number, string>();
    adaptiveCourses.forEach((c) => m.set(c.id, c.title));
    return m;
  }, [adaptiveCourses]);

  const resetForm = () => {
    setSelectedTemplate(null);
    setDraft(EMPTY_DRAFT);
  };

  const handleEdit = (t: InterviewTemplate) => {
    setSelectedTemplate(t);
    setDraft(toDraft(t));
  };

  const validateDraft = (): string | null => {
    if (!draft.topicSelection) return "Pick a topic.";
    if (draft.topicSelection === CUSTOM_TOPIC_VALUE && !draft.customTopic.trim()) {
      return "Enter the custom topic name.";
    }
    if (!DIFFICULTIES.includes(draft.difficulty)) return "Pick a difficulty.";
    if (draft.duration_minutes < 5 || draft.duration_minutes > 20) {
      return "Duration must be between 5 and 20 minutes.";
    }
    if (draft.num_coding_questions < 0 || draft.num_coding_questions > 6) {
      return "Coding questions must be 0-6.";
    }
    if (draft.num_mcq_questions < 0 || draft.num_mcq_questions > 6) {
      return "Quiz questions must be 0-6.";
    }
    if (draft.result_release_mode === "scheduled" && !draft.result_release_at) {
      return "Pick a scheduled release date/time.";
    }
    if (
      draft.resume_enabled &&
      draft.resume_window_minutes !== "" &&
      (Number(draft.resume_window_minutes) < 5 || Number(draft.resume_window_minutes) > 1440)
    ) {
      return "Resume window must be 5-1440 minutes (or leave blank for the default).";
    }
    return null;
  };

  const handleSave = async () => {
    const err = validateDraft();
    if (err) {
      showToast(err, "error");
      return;
    }
    setSaving(true);
    try {
      const finalTopic = resolveTopic(draft);
      const payload: InterviewTemplateCreatePayload = {
        title: `${finalTopic} Interview`,
        topic: finalTopic,
        subtopic: finalTopic,
        difficulty: draft.difficulty,
        duration_minutes: draft.duration_minutes,
        description: draft.description.trim(),
        is_active: draft.is_active,
        course_ids: draft.course_ids,
        adaptive_course_ids: draft.adaptive_course_ids,
        num_coding_questions: draft.num_coding_questions,
        num_mcq_questions: draft.num_mcq_questions,
        result_release_mode: draft.result_release_mode,
        result_release_at:
          draft.result_release_mode === "scheduled" && draft.result_release_at
            ? new Date(draft.result_release_at).toISOString()
            : null,
        resume_enabled: draft.resume_enabled,
        resume_window_minutes:
          draft.resume_window_minutes === "" ? null : Number(draft.resume_window_minutes),
        status: draft.status,
        // An empty field means "no bound", which is not the same as "now" - send null.
        opens_at: draft.opens_at ? new Date(draft.opens_at).toISOString() : null,
        closes_at: draft.closes_at ? new Date(draft.closes_at).toISOString() : null,
      };
      if (isEditing && selectedTemplate) {
        await adminMockInterviewService.updateTemplate(
          selectedTemplate.id,
          payload
        );
        showToast("Interview updated", "success");
      } else {
        await adminMockInterviewService.createTemplate(payload);
        showToast(
          payload.course_ids && payload.course_ids.length > 0
            ? "Interview published. Enrolled students have been notified."
            : "Interview created. Map it to a course to publish it to students.",
          "success"
        );
      }
      resetForm();
      await loadAll();
    } catch (err) {
      const detail =
        (err as { response?: { data?: { detail?: string; error?: string } } })
          ?.response?.data?.detail ||
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        "Save failed.";
      showToast(detail, "error");
    } finally {
      setSaving(false);
    }
  };

  const openAttemptsDialog = async (t: InterviewTemplate) => {
    setAttemptsDialogTemplate(t);
    setReattemptScope("all");
    setAttemptsLoading(true);
    setAttemptsList([]);
    setParticipants(null);
    setReport(null);
    try {
      const [list, roster, stats] = await Promise.all([
        adminMockInterviewService.listTemplateAttempts(t.id),
        // The roster and the report are additive: if either fails the attempts list is still
        // the useful half, so neither may take the dialog down with it.
        interviewService.adminParticipants(t.id).catch(() => null),
        interviewService.adminReport(t.id).catch(() => null),
      ]);
      setAttemptsList(list);
      setParticipants(roster);
      setReport(stats);
    } catch (err) {
      showToast("Failed to load attempts", "error");
    } finally {
      setAttemptsLoading(false);
    }
  };

  /** Save the roster as a file. The chase list is the one people actually want. */
  const handleDownloadRoster = async (onlyNotStarted: boolean) => {
    const template = attemptsDialogTemplate;
    if (!template || downloading) return;
    setDownloading(true);
    try {
      const blob = await interviewService.adminParticipantsCsv(
        template.id,
        onlyNotStarted ? "not_started" : undefined,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `interview-${template.id}-${onlyNotStarted ? "not-started" : "participants"}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Revoking immediately can cancel the download in some browsers; a tick is enough.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      showToast("Couldn't download the roster.", "error");
    } finally {
      setDownloading(false);
    }
  };

  const handleReleaseSingleAttempt = async (interviewId: number) => {
    setReleasingAttemptId(interviewId);
    try {
      await adminMockInterviewService.releaseSingleInterviewResult(interviewId);
      showToast("Result released to student", "success");
      setAttemptsList((prev) =>
        prev.map((a) =>
          a.id === interviewId
            ? {
                ...a,
                result_visible_to_student: true,
                result_released_at: new Date().toISOString(),
              }
            : a,
        ),
      );
    } catch (err) {
      showToast("Could not release result", "error");
    } finally {
      setReleasingAttemptId(null);
    }
  };

  const handleBulkReleaseTemplate = async () => {
    if (!attemptsDialogTemplate) return;
    setBulkReleasing(true);
    try {
      const res = await adminMockInterviewService.releaseTemplateResults(
        attemptsDialogTemplate.id,
      );
      showToast(res.message, "success");
      if (attemptsDialogTemplate) {
        await openAttemptsDialog(attemptsDialogTemplate);
      }
    } catch (err) {
      showToast("Bulk release failed", "error");
    } finally {
      setBulkReleasing(false);
    }
  };

  const handleEvaluatePending = async (templateId: number) => {
    setEvaluatingTemplateId(templateId);
    try {
      const res =
        await adminMockInterviewService.evaluatePendingTemplateResults(templateId);
      showToast(res.message, res.queued > 0 ? "success" : "info");
      // If the attempts dialog is still open for this template, refresh it after a short
      // beat so the admin sees has_evaluation flip and can release. The backend evaluates in
      // the background, so we give it a moment before re-fetching. The ref check avoids
      // re-opening a dialog the admin closed in the meantime.
      if (res.queued > 0) {
        setTimeout(() => {
          const open = attemptsDialogTemplateRef.current;
          if (open && open.id === templateId) {
            void openAttemptsDialog(open);
          }
        }, 8000);
      }
    } catch (err) {
      showToast("Could not start AI evaluation", "error");
    } finally {
      setEvaluatingTemplateId(null);
    }
  };

  const handleReattemptSingle = async (interviewId: number) => {
    setReattemptingId(interviewId);
    try {
      await adminMockInterviewService.reattemptSingleInterview(interviewId);
      showToast("Reattempt granted - the student can take it again.", "success");
      setAttemptsList((prev) =>
        prev.map((a) => (a.id === interviewId ? { ...a, superseded: true } : a)),
      );
    } catch {
      showToast("Could not grant reattempt", "error");
    } finally {
      setReattemptingId(null);
    }
  };

  const handleBulkReattempt = async () => {
    if (!attemptsDialogTemplate) return;
    setBulkReattempting(true);
    try {
      const res = await adminMockInterviewService.reattemptTemplateAttempts(
        attemptsDialogTemplate.id,
        reattemptScope,
      );
      showToast(res.message, res.granted > 0 ? "success" : "info");
      if (attemptsDialogTemplate) {
        await openAttemptsDialog(attemptsDialogTemplate);
      }
    } catch {
      showToast("Bulk reattempt failed", "error");
    } finally {
      setBulkReattempting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setDeletingId(pendingDelete.id);
    try {
      await adminMockInterviewService.deleteTemplate(pendingDelete.id);
      showToast("Interview deleted", "success");
      if (selectedTemplate?.id === pendingDelete.id) resetForm();
      setPendingDelete(null);
      await loadAll();
    } catch (err) {
      showToast("Could not delete interview", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header + back link */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Button
              startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
              onClick={() => router.push("/admin/admin-mock-interview")}
              sx={{
                textTransform: "none",
                color: "var(--font-secondary)",
                mb: 1,
                "&:hover": { backgroundColor: "var(--surface)" },
              }}
            >
              Back to Interview admin
            </Button>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Create Interview
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
              Define an interview and map it to one or more courses. Every enrolled student
              of those courses gets a notification and sees it on their Courses tab.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<IconWrapper icon="mdi:plus" size={18} />}
            onClick={resetForm}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderColor: "var(--accent-indigo)",
              color: "var(--accent-indigo)",
              "&:hover": {
                borderColor: "var(--accent-indigo-dark)",
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
              },
            }}
          >
            New interview
          </Button>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.4fr 1fr" },
            gap: 3,
          }}
        >
          {/* List */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid var(--border-default)",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Published interviews
            </Typography>
            {loading ? (
              <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                Loading…
              </Typography>
            ) : templates.length === 0 ? (
              <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                No interviews yet. Fill in the form on the right and map it to a course
                to publish it.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {templates.map((t) => {
                  const isSelected = selectedTemplate?.id === t.id;
                  return (
                    <Box
                      key={t.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: isSelected
                          ? "var(--accent-indigo)"
                          : "var(--border-default)",
                        backgroundColor: isSelected
                          ? "color-mix(in srgb, var(--accent-indigo) 6%, var(--card-bg) 94%)"
                          : "var(--card-bg)",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {t.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "var(--font-secondary)" }}
                          >
                            {t.topic} • {t.subtopic} • {t.duration_minutes} min
                          </Typography>
                        </Box>
                        <Chip
                          label={t.difficulty}
                          size="small"
                          sx={{
                            backgroundColor:
                              t.difficulty === "Easy"
                                ? "var(--surface-green-light)"
                                : t.difficulty === "Hard"
                                  ? "var(--error-100)"
                                  : "var(--warning-100)",
                            color:
                              t.difficulty === "Easy"
                                ? "var(--ats-success-muted)"
                                : t.difficulty === "Hard"
                                  ? "var(--error-600)"
                                  : "var(--ats-warning-muted)",
                            fontWeight: 600,
                          }}
                        />
                        {!t.is_active && (
                          <Chip
                            label="Inactive"
                            size="small"
                            sx={{
                              backgroundColor: "var(--surface)",
                              color: "var(--font-tertiary)",
                              fontWeight: 600,
                            }}
                          />
                        )}
                        {t.status && t.status !== "published" && (
                          <Chip
                            label={LIFECYCLE_LABEL[t.status]}
                            size="small"
                            sx={{
                              backgroundColor: "var(--surface)",
                              color: "var(--font-tertiary)",
                              fontWeight: 700,
                              textTransform: "capitalize",
                            }}
                          />
                        )}
                        {t.status === "published" && t.window_state === "pending" && (
                          <Chip
                            label={t.opens_at ? `Opens ${formatWindow(t.opens_at)}` : "Scheduled"}
                            size="small"
                            sx={{
                              backgroundColor: "var(--ats-warning-muted)",
                              fontWeight: 700,
                            }}
                          />
                        )}
                        {t.status === "published" && t.window_state === "closed" && (
                          <Chip
                            label={t.closes_at ? `Closed ${formatWindow(t.closes_at)}` : "Window closed"}
                            size="small"
                            sx={{
                              backgroundColor: "var(--surface)",
                              color: "var(--font-tertiary)",
                              fontWeight: 700,
                            }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 1 }}>
                        {t.courses.length === 0 ? (
                          <Typography
                            variant="caption"
                            sx={{ color: "var(--font-tertiary)", fontStyle: "italic" }}
                          >
                            Not mapped to any course yet
                          </Typography>
                        ) : (
                          t.courses.map((c) => (
                            <Chip
                              key={c.id}
                              icon={<IconWrapper icon="mdi:book-open-variant" size={14} />}
                              label={c.title || courseById.get(c.id) || `#${c.id}`}
                              size="small"
                              sx={{
                                backgroundColor: "var(--surface)",
                                color: "var(--font-secondary)",
                              }}
                            />
                          ))
                        )}
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: "var(--font-tertiary)" }}
                        >
                          {t.attempt_count} attempt{t.attempt_count === 1 ? "" : "s"}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => openAttemptsDialog(t)}
                            sx={{
                              textTransform: "none",
                              color: "var(--font-secondary)",
                            }}
                          >
                            Attempts
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            disabled={evaluatingTemplateId === t.id}
                            startIcon={
                              <IconWrapper icon="mdi:robot-outline" size={16} />
                            }
                            onClick={() => handleEvaluatePending(t.id)}
                            sx={{
                              textTransform: "none",
                              color: "var(--accent-indigo)",
                            }}
                          >
                            {evaluatingTemplateId === t.id
                              ? "Evaluating…"
                              : "AI Evaluation"}
                          </Button>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleEdit(t)}
                            sx={{
                              textTransform: "none",
                              color: "var(--accent-indigo)",
                            }}
                          >
                            Edit
                          </Button>
                          <IconButton
                            size="small"
                            disabled={deletingId === t.id}
                            onClick={() => setPendingDelete(t)}
                            sx={{ color: "var(--font-tertiary)" }}
                            aria-label="Delete template"
                          >
                            <IconWrapper icon="mdi:trash-can-outline" size={18} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>

          {/* Form */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid var(--border-default)",
              position: { lg: "sticky" },
              top: { lg: 80 },
              alignSelf: { lg: "flex-start" },
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {isEditing
                ? `Edit "${selectedTemplate?.title || ""}"`
                : "New interview"}
            </Typography>
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Topic</InputLabel>
                <Select
                  label="Topic"
                  value={draft.topicSelection}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      topicSelection: e.target.value as string,
                      customTopic:
                        e.target.value === CUSTOM_TOPIC_VALUE ? d.customTopic : "",
                    }))
                  }
                >
                  {INTERVIEW_TOPICS.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                  <MenuItem value={CUSTOM_TOPIC_VALUE}>Custom…</MenuItem>
                </Select>
              </FormControl>
              {draft.topicSelection === CUSTOM_TOPIC_VALUE && (
                <TextField
                  label="Custom topic"
                  value={draft.customTopic}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, customTopic: e.target.value }))
                  }
                  fullWidth
                  size="small"
                  placeholder="e.g. GraphQL Federation"
                  autoFocus
                />
              )}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Difficulty</InputLabel>
                  <Select
                    label="Difficulty"
                    value={draft.difficulty}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        difficulty: e.target.value as InterviewTemplateDifficulty,
                      }))
                    }
                  >
                    {DIFFICULTIES.map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Duration (min)"
                  type="number"
                  inputProps={{ min: 5, max: 20, step: 1 }}
                  // We use `0` as the in-progress "empty" sentinel so backspace actually
                  // clears the field. `Number("") || 7` (the previous code) snapped back
                  // to 7 as soon as you tried to type a new number. On blur we clamp into
                  // the valid 5..20 range (defaulting to 7 if left empty).
                  value={draft.duration_minutes === 0 ? "" : draft.duration_minutes}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setDraft((d) => ({ ...d, duration_minutes: 0 }));
                      return;
                    }
                    const n = parseInt(raw, 10);
                    if (!Number.isNaN(n)) {
                      setDraft((d) => ({ ...d, duration_minutes: n }));
                    }
                  }}
                  onBlur={() => {
                    setDraft((d) => ({
                      ...d,
                      duration_minutes: d.duration_minutes
                        ? Math.min(20, Math.max(5, d.duration_minutes))
                        : 7,
                    }));
                  }}
                  fullWidth
                  size="small"
                />
              </Stack>
              <TextField
                label="Description (optional, shown to students)"
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
                fullWidth
                size="small"
                multiline
                rows={2}
              />
              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--surface)",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                  Structured questions floor
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ display: "block", color: "var(--font-secondary)", mb: 1.5 }}
                >
                  Minimum coding turns and quiz turns the AI must produce. The interviewer
                  still drives the conversation between them.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    label="Coding questions"
                    type="number"
                    inputProps={{ min: 0, max: 6, step: 1 }}
                    value={
                      draft.num_coding_questions === 0 ? "0" : draft.num_coding_questions
                    }
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setDraft((d) => ({
                        ...d,
                        num_coding_questions: Number.isNaN(n) ? 0 : Math.max(0, Math.min(6, n)),
                      }));
                    }}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Quiz (MCQ) questions"
                    type="number"
                    inputProps={{ min: 0, max: 6, step: 1 }}
                    value={
                      draft.num_mcq_questions === 0 ? "0" : draft.num_mcq_questions
                    }
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setDraft((d) => ({
                        ...d,
                        num_mcq_questions: Number.isNaN(n) ? 0 : Math.max(0, Math.min(6, n)),
                      }));
                    }}
                    fullWidth
                    size="small"
                  />
                </Stack>
              </Box>

              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--surface)",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                  Resume on disconnect
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ display: "block", color: "var(--font-secondary)", mb: 1 }}
                >
                  If a student drops mid-interview (refresh, network, crash) they can rejoin
                  the same attempt within this window. After it lapses, their answers so far
                  are auto-submitted for evaluation.
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={draft.resume_enabled}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, resume_enabled: e.target.checked }))
                      }
                    />
                  }
                  label="Allow resume"
                  sx={{ mb: 1 }}
                />
                {draft.resume_enabled && (
                  <TextField
                    label="Resume window (minutes)"
                    type="number"
                    inputProps={{ min: 5, max: 1440, step: 5 }}
                    placeholder="Default: max(duration, 30)"
                    value={draft.resume_window_minutes}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setDraft((d) => ({
                        ...d,
                        resume_window_minutes: raw === "" ? "" : parseInt(raw, 10) || "",
                      }));
                    }}
                    fullWidth
                    size="small"
                    helperText="Leave blank to use the default."
                  />
                )}
              </Box>

              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid var(--border-default)",
                  backgroundColor: "var(--surface)",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                  Result release
                </Typography>
                <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                  <InputLabel>Release mode</InputLabel>
                  <Select
                    label="Release mode"
                    value={draft.result_release_mode}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        result_release_mode: e.target.value as InterviewResultReleaseMode,
                      }))
                    }
                  >
                    {RELEASE_MODES.map((m) => (
                      <MenuItem key={m.value} value={m.value}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography
                  variant="caption"
                  sx={{ display: "block", color: "var(--font-secondary)", mb: 1 }}
                >
                  {RELEASE_MODES.find((m) => m.value === draft.result_release_mode)?.help}
                </Typography>
                {draft.result_release_mode === "scheduled" && (
                  <TextField
                    label="Release at"
                    type="datetime-local"
                    InputLabelProps={{ shrink: true }}
                    value={draft.result_release_at}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, result_release_at: e.target.value }))
                    }
                    fullWidth
                    size="small"
                  />
                )}
              </Box>
              {/* Course mapping - visually separated as its own step so admins clearly
                  understand this is the action that makes the interview reachable for
                  students. Without a course, the interview stays "drafted" and nobody
                  sees it. */}
              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid var(--accent-indigo)",
                  backgroundColor:
                    "color-mix(in srgb, var(--accent-indigo) 5%, var(--card-bg) 95%)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 1,
                  }}
                >
                  <IconWrapper
                    icon="mdi:book-open-variant"
                    size={18}
                    color="var(--accent-indigo)"
                  />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Map to course(s)
                  </Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    color: "var(--font-secondary)",
                    mb: 1.5,
                  }}
                >
                  Pick the courses where enrolled students should see this interview.
                  Newly-added students get an `interview_assigned` notification.
                </Typography>
                <FormControl fullWidth size="small">
                  <InputLabel>Courses</InputLabel>
                  <Select
                    multiple
                    label="Courses"
                    value={draft.course_ids}
                    input={<OutlinedInput label="Courses" />}
                    onChange={(e) => {
                      const value = e.target.value;
                      const ids = Array.isArray(value)
                        ? (value as number[])
                        : [Number(value)];
                      setDraft((d) => ({ ...d, course_ids: ids }));
                    }}
                    renderValue={(selected) => {
                      const ids = selected as number[];
                      if (ids.length === 0) {
                        return (
                          <Typography
                            variant="body2"
                            sx={{
                              color: "var(--font-tertiary)",
                              fontStyle: "italic",
                            }}
                          >
                            Not mapped yet
                          </Typography>
                        );
                      }
                      return (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {ids.map((id) => (
                            <Chip
                              key={id}
                              label={courseById.get(id) || `#${id}`}
                              size="small"
                            />
                          ))}
                        </Box>
                      );
                    }}
                  >
                    {courses.length === 0 ? (
                      <MenuItem disabled>No courses available</MenuItem>
                    ) : (
                      courses.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.title}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={{ mt: 1.5 }}>
                  <InputLabel>Adaptive courses</InputLabel>
                  <Select
                    multiple
                    label="Adaptive courses"
                    value={draft.adaptive_course_ids}
                    input={<OutlinedInput label="Adaptive courses" />}
                    onChange={(e) => {
                      const value = e.target.value;
                      const ids = Array.isArray(value) ? (value as number[]) : [Number(value)];
                      setDraft((d) => ({ ...d, adaptive_course_ids: ids }));
                    }}
                    renderValue={(selected) => {
                      const ids = selected as number[];
                      if (ids.length === 0) {
                        return (
                          <Typography variant="body2" sx={{ color: "var(--font-tertiary)", fontStyle: "italic" }}>
                            Not mapped yet
                          </Typography>
                        );
                      }
                      return (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                          {ids.map((id) => (
                            <Chip key={id} label={adaptiveCourseById.get(id) || `#${id}`} size="small" />
                          ))}
                        </Box>
                      );
                    }}
                  >
                    {adaptiveCourses.length === 0 ? (
                      <MenuItem disabled>No adaptive courses available</MenuItem>
                    ) : (
                      adaptiveCourses.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.title}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Box>
              {/* The lifecycle control this file's previous comment asked for ("do it from
                  the backend or extend the API"). Mapping an interview to a course still
                  decides WHO sees it; this decides WHETHER it is offered at all, and when. */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="interview-status-label">Status</InputLabel>
                  <Select
                    labelId="interview-status-label"
                    label="Status"
                    value={draft.status}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        status: e.target.value as InterviewLifecycleStatus,
                      }))
                    }
                  >
                    <MenuItem value="draft">Draft &mdash; not offered to anyone</MenuItem>
                    <MenuItem value="published">Published &mdash; can be sat</MenuItem>
                    <MenuItem value="closed">Closed &mdash; no longer offered</MenuItem>
                    <MenuItem value="archived">Archived &mdash; hidden everywhere</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  type="datetime-local"
                  label="Opens at"
                  InputLabelProps={{ shrink: true }}
                  value={draft.opens_at}
                  onChange={(e) => setDraft((d) => ({ ...d, opens_at: e.target.value }))}
                  helperText="Leave empty to open as soon as it is published"
                />
                <TextField
                  size="small"
                  type="datetime-local"
                  label="Closes at"
                  InputLabelProps={{ shrink: true }}
                  value={draft.closes_at}
                  onChange={(e) => setDraft((d) => ({ ...d, closes_at: e.target.value }))}
                  error={Boolean(windowError)}
                  helperText={windowError || "Leave empty to stay open until closed by hand"}
                />
              </Box>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                {isEditing && (
                  <Button
                    onClick={resetForm}
                    sx={{ textTransform: "none", color: "var(--font-secondary)" }}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={saving || Boolean(windowError)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    backgroundColor: "var(--accent-indigo)",
                    "&:hover": { backgroundColor: "var(--accent-indigo-dark)" },
                  }}
                >
                  {saving
                    ? "Publishing…"
                    : isEditing
                      ? "Save changes"
                      : draft.course_ids.length > 0
                        ? "Publish interview"
                        : "Create interview"}
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>

        {/* Delete confirm dialog */}
        <Dialog
          open={pendingDelete !== null}
          onClose={() => setPendingDelete(null)}
        >
          <DialogTitle>Delete this interview?</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              Delete <strong>{pendingDelete?.title}</strong>? Past attempts students made
              with it stay in their interview history (just unlinked). Enrolled students
              who haven't started yet will no longer see this interview on their Courses
              tab.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setPendingDelete(null)}
              sx={{ textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleConfirmDelete}
              disabled={deletingId !== null}
              sx={{
                textTransform: "none",
                backgroundColor: "var(--ats-error-muted)",
                "&:hover": { backgroundColor: "var(--error-600)" },
              }}
            >
              {deletingId !== null ? "Deleting…" : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={attemptsDialogTemplate !== null}
          onClose={() => setAttemptsDialogTemplate(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Attempts · {attemptsDialogTemplate?.title}
          </DialogTitle>
          <DialogContent dividers>
            {/* The roster, above the attempts. An admin opening this dialog before a deadline
                is asking "who still has not done it", and the attempts list structurally
                cannot answer that - an attempt does not exist until someone starts. */}
            {participants && (
              <Box sx={{ mb: 2.5 }}>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
                  {(
                    [
                      ["Assigned", participants.summary.assigned, "var(--surface)"],
                      ["Not started", participants.summary.not_started, "var(--ats-warning-muted)"],
                      ["In progress", participants.summary.in_progress, "var(--surface)"],
                      ["Completed", participants.summary.completed, "var(--ats-success-muted)"],
                    ] as const
                  ).map(([label, value, bg]) => (
                    <Box
                      key={label}
                      sx={{
                        px: 1.5, py: 0.75, borderRadius: 2, backgroundColor: bg,
                        border: "1px solid var(--border-default)", minWidth: 96,
                      }}
                    >
                      <Typography sx={{ fontSize: "1.1rem", fontWeight: 800, lineHeight: 1.2 }}>
                        {value}
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", color: "var(--font-secondary)", fontWeight: 600 }}>
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {participants.summary.not_started > 0 && (
                  <Box
                    sx={{
                      p: 1.5, borderRadius: 2, border: "1px solid var(--border-default)",
                      backgroundColor: "var(--surface)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", mb: 0.75 }}>
                      Yet to start
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {participants.participants
                        .filter((p) => p.state === "not_started")
                        .map((p) => (
                          <Chip
                            key={p.profile_id}
                            size="small"
                            label={p.name || p.email}
                            title={p.email}
                            sx={{ fontWeight: 600, backgroundColor: "var(--card-bg)" }}
                          />
                        ))}
                    </Box>
                  </Box>
                )}

                {report && report.summary.graded > 0 && (
                  <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, border: "1px solid var(--border-default)" }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", mb: 0.75 }}>
                      How they did
                    </Typography>

                    <Stack direction="row" spacing={2} sx={{ mb: 1, flexWrap: "wrap" }}>
                      <Typography sx={{ fontSize: "0.82rem" }}>
                        Average{" "}
                        <strong>
                          {report.summary.average_percentage === null
                            ? "n/a"
                            : `${report.summary.average_percentage}%`}
                        </strong>
                      </Typography>
                      {Object.entries(report.summary.score_bands).map(([band, n]) => (
                        <Typography key={band} sx={{ fontSize: "0.82rem", color: "var(--font-secondary)" }}>
                          {band}%: <strong>{n}</strong>
                        </Typography>
                      ))}
                    </Stack>

                    {report.by_kind.length > 0 && (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                        {report.by_kind.map((row) => (
                          <Chip
                            key={row.kind}
                            size="small"
                            label={`${row.kind}: ${row.avg_percentage === null ? "n/a" : `${row.avg_percentage}%`}`}
                            title={`${row.answered} answered of ${row.asked} asked`}
                            sx={{
                              fontWeight: 600,
                              textTransform: "capitalize",
                              // The weakest kind is first from the server; colour only the
                              // genuinely poor ones so the chip row is not a traffic jam.
                              backgroundColor:
                                row.avg_percentage !== null && row.avg_percentage < 50
                                  ? "var(--ats-warning-muted)"
                                  : "var(--card-bg)",
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={downloading || participants.summary.assigned === 0}
                    onClick={() => void handleDownloadRoster(false)}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Download roster
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={downloading || participants.summary.not_started === 0}
                    onClick={() => void handleDownloadRoster(true)}
                    sx={{ textTransform: "none", fontWeight: 600 }}
                  >
                    Download chase list
                  </Button>
                </Stack>

                {participants.summary.assigned === 0 && (
                  // Not the same as "nobody has done it": nobody can. Saying so points at the
                  // actual fix, which is mapping the interview to a course or a batch.
                  <Typography sx={{ fontSize: "0.82rem", color: "var(--font-secondary)" }}>
                    This interview is not assigned to anyone yet - map it to a course or a batch
                    and its candidates will appear here.
                  </Typography>
                )}
              </Box>
            )}

            {/* Filter - choosing a scope both narrows the list AND scopes the bulk
                "Reattempt" action in the footer. */}
            <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
              {(["all", "completed", "failed"] as ReattemptScope[]).map((s) => {
                const active = reattemptScope === s;
                return (
                  <Chip
                    key={s}
                    label={s === "all" ? "All" : s === "completed" ? "Completed" : "Failed"}
                    size="small"
                    onClick={() => setReattemptScope(s)}
                    sx={{
                      cursor: "pointer",
                      fontWeight: 600,
                      backgroundColor: active ? "var(--accent-indigo)" : "var(--surface)",
                      color: active ? "var(--font-light)" : "var(--font-secondary)",
                      border: "1px solid",
                      borderColor: active ? "var(--accent-indigo)" : "var(--border-default)",
                    }}
                  />
                );
              })}
            </Box>
            {attemptsLoading ? (
              <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                Loading attempts…
              </Typography>
            ) : (() => {
              const shown = attemptsList.filter((a) =>
                reattemptScope === "all" ? true : a.status === reattemptScope,
              );
              if (attemptsList.length === 0) {
                return (
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    No students have attempted this interview yet.
                  </Typography>
                );
              }
              if (shown.length === 0) {
                return (
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    No {reattemptScope} attempts.
                  </Typography>
                );
              }
              return (
              <Stack spacing={1}>
                {shown.map((a) => {
                  const submittedText = a.submitted_at
                    ? new Date(a.submitted_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Not submitted";
                  const canReattempt =
                    !a.superseded && (a.status === "completed" || a.status === "failed");
                  return (
                    <Box
                      key={a.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid var(--border-default)",
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {a.student_name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            color: "var(--font-tertiary)",
                            wordBreak: "break-all",
                          }}
                        >
                          {a.student_email || `Student #${a.student_id}`} · {a.status} · {submittedText}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                        {a.result_visible_to_student ? (
                          <Chip
                            label="Released"
                            size="small"
                            sx={{
                              backgroundColor: "var(--surface-green-light)",
                              color: "var(--ats-success-muted)",
                              fontWeight: 600,
                            }}
                          />
                        ) : a.status === "completed" ? (
                          a.has_evaluation ? (
                            <Button
                              size="small"
                              variant="contained"
                              disabled={releasingAttemptId === a.id}
                              onClick={() => handleReleaseSingleAttempt(a.id)}
                              sx={{
                                textTransform: "none",
                                backgroundColor: "var(--accent-indigo)",
                                "&:hover": {
                                  backgroundColor: "var(--accent-indigo-dark)",
                                },
                              }}
                            >
                              {releasingAttemptId === a.id ? "Releasing…" : "Release"}
                            </Button>
                          ) : (
                            <Chip
                              label="Evaluation pending"
                              size="small"
                              sx={{
                                backgroundColor: "var(--warning-100)",
                                color: "var(--ats-warning-muted)",
                                fontWeight: 600,
                              }}
                            />
                          )
                        ) : a.status === "failed" ? (
                          <Chip
                            label="Failed"
                            size="small"
                            sx={{
                              backgroundColor: "var(--error-100)",
                              color: "var(--error-600)",
                              fontWeight: 600,
                            }}
                          />
                        ) : (
                          <Chip
                            label={a.status}
                            size="small"
                            sx={{
                              backgroundColor: "var(--surface)",
                              color: "var(--font-tertiary)",
                            }}
                          />
                        )}
                        {a.superseded ? (
                          <Chip
                            label="Retake granted"
                            size="small"
                            sx={{
                              backgroundColor: "var(--surface-indigo-light)",
                              color: "var(--accent-indigo)",
                              fontWeight: 600,
                            }}
                          />
                        ) : canReattempt ? (
                          <Button
                            size="small"
                            variant="text"
                            disabled={reattemptingId === a.id}
                            startIcon={<IconWrapper icon="mdi:restart" size={16} />}
                            onClick={() => handleReattemptSingle(a.id)}
                            sx={{ textTransform: "none", color: "var(--accent-indigo)" }}
                          >
                            {reattemptingId === a.id ? "…" : "Reattempt"}
                          </Button>
                        ) : null}
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
              );
            })()}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<IconWrapper icon="mdi:robot-outline" size={16} />}
                disabled={
                  attemptsDialogTemplate === null ||
                  evaluatingTemplateId === attemptsDialogTemplate?.id ||
                  !attemptsList.some(
                    (a) => a.status === "completed" && !a.has_evaluation,
                  )
                }
                onClick={() =>
                  attemptsDialogTemplate &&
                  handleEvaluatePending(attemptsDialogTemplate.id)
                }
                sx={{ textTransform: "none" }}
              >
                {evaluatingTemplateId === attemptsDialogTemplate?.id
                  ? "Starting AI evaluation…"
                  : "AI evaluate pending"}
              </Button>
              <Button
                variant="outlined"
                disabled={bulkReleasing || attemptsList.every((a) => a.result_visible_to_student)}
                onClick={handleBulkReleaseTemplate}
                sx={{ textTransform: "none" }}
              >
                {bulkReleasing ? "Releasing all…" : "Release all pending"}
              </Button>
              <Button
                variant="outlined"
                startIcon={<IconWrapper icon="mdi:restart" size={16} />}
                disabled={
                  bulkReattempting ||
                  !attemptsList.some(
                    (a) =>
                      !a.superseded &&
                      (reattemptScope === "all"
                        ? a.status === "completed" || a.status === "failed"
                        : a.status === reattemptScope),
                  )
                }
                onClick={handleBulkReattempt}
                sx={{ textTransform: "none" }}
              >
                {bulkReattempting
                  ? "Granting…"
                  : `Reattempt ${reattemptScope === "all" ? "all" : reattemptScope}`}
              </Button>
            </Box>
            <Button
              onClick={() => setAttemptsDialogTemplate(null)}
              sx={{ textTransform: "none" }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
