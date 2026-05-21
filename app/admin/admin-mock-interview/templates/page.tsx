"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import adminMockInterviewService, {
  type InterviewTemplate,
  type InterviewTemplateCreatePayload,
  type InterviewTemplateDifficulty,
  type InterviewResultReleaseMode,
  type AdminTemplateAttempt,
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
 *   3. Clicks Publish — the interview becomes visible to every enrolled student of those
 *      courses on the Courses tab in their interview section, and a notification fires.
 *
 * The right-hand panel is single-purpose (create OR edit, toggled by selectedTemplate).
 * The data model is still called "template" in the backend / service layer because each
 * interview here spawns N per-student attempts when claimed — but on the user-facing
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
  num_coding_questions: number;
  num_mcq_questions: number;
  result_release_mode: InterviewResultReleaseMode;
  result_release_at: string;
}

const EMPTY_DRAFT: DraftTemplate = {
  topicSelection: "",
  customTopic: "",
  difficulty: "Medium",
  duration_minutes: 7,
  description: "",
  is_active: true,
  course_ids: [],
  num_coding_questions: 2,
  num_mcq_questions: 1,
  result_release_mode: "manual",
  result_release_at: "",
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
    num_coding_questions: t.num_coding_questions ?? 2,
    num_mcq_questions: t.num_mcq_questions ?? 1,
    result_release_mode: t.result_release_mode ?? "manual",
    result_release_at: t.result_release_at
      ? t.result_release_at.slice(0, 16)
      : "",
  };
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
  const [releasingAttemptId, setReleasingAttemptId] = useState<number | null>(null);
  const [bulkReleasing, setBulkReleasing] = useState(false);

  const isEditing = selectedTemplate !== null;

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tmpls, coursesData] = await Promise.all([
        adminMockInterviewService.listTemplates(),
        adminCoursesService.getCourses().catch(() => []),
      ]);
      setTemplates(tmpls);
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

  // Quick course lookup so the list view can render attached-course chips without a join.
  const courseById = useMemo(() => {
    const m = new Map<number, string>();
    courses.forEach((c) => m.set(c.id, c.title));
    return m;
  }, [courses]);

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
        num_coding_questions: draft.num_coding_questions,
        num_mcq_questions: draft.num_mcq_questions,
        result_release_mode: draft.result_release_mode,
        result_release_at:
          draft.result_release_mode === "scheduled" && draft.result_release_at
            ? new Date(draft.result_release_at).toISOString()
            : null,
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
    setAttemptsLoading(true);
    setAttemptsList([]);
    try {
      const list = await adminMockInterviewService.listTemplateAttempts(t.id);
      setAttemptsList(list);
    } catch (err) {
      showToast("Failed to load attempts", "error");
    } finally {
      setAttemptsLoading(false);
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
              {/* Course mapping — visually separated as its own step so admins clearly
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
              </Box>
              {/* Active/inactive toggle removed — whether an interview is visible to
                  students is determined purely by whether it's mapped to a course they're
                  enrolled in. New interviews default to is_active=true via the model so
                  the publish-by-mapping flow Just Works. If you need to soft-disable a
                  published interview later, do it from the backend or extend the API. */}
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
                  disabled={saving}
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
            {attemptsLoading ? (
              <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                Loading attempts…
              </Typography>
            ) : attemptsList.length === 0 ? (
              <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                No students have attempted this interview yet.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {attemptsList.map((a) => {
                  const submittedText = a.submitted_at
                    ? new Date(a.submitted_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Not submitted";
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
                          label={a.status}
                          size="small"
                          sx={{
                            backgroundColor: "var(--surface)",
                            color: "var(--font-tertiary)",
                          }}
                        />
                      )}
                    </Box>
                  );
                })}
              </Stack>
            )}
          </DialogContent>
          <DialogActions sx={{ justifyContent: "space-between", px: 3, py: 2 }}>
            <Button
              variant="outlined"
              disabled={bulkReleasing || attemptsList.every((a) => a.result_visible_to_student)}
              onClick={handleBulkReleaseTemplate}
              sx={{ textTransform: "none" }}
            >
              {bulkReleasing ? "Releasing all…" : "Release all pending"}
            </Button>
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
