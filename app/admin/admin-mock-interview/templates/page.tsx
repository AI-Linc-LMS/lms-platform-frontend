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
} from "@/lib/services/admin/admin-mock-interview.service";

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

interface DraftTemplate {
  title: string;
  topic: string;
  subtopic: string;
  difficulty: InterviewTemplateDifficulty;
  duration_minutes: number;
  description: string;
  is_active: boolean;
  course_ids: number[];
}

const EMPTY_DRAFT: DraftTemplate = {
  title: "",
  topic: "",
  subtopic: "",
  difficulty: "Medium",
  duration_minutes: 7,
  description: "",
  is_active: true,
  course_ids: [],
};

function toDraft(t: InterviewTemplate): DraftTemplate {
  return {
    title: t.title,
    topic: t.topic,
    subtopic: t.subtopic,
    difficulty: t.difficulty,
    duration_minutes: t.duration_minutes,
    description: t.description || "",
    is_active: t.is_active,
    course_ids: t.course_ids,
  };
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
    if (!draft.title.trim()) return "Title is required.";
    if (!draft.topic.trim()) return "Topic is required.";
    if (!draft.subtopic.trim()) return "Subtopic is required.";
    if (!DIFFICULTIES.includes(draft.difficulty)) return "Pick a difficulty.";
    if (draft.duration_minutes < 5 || draft.duration_minutes > 20) {
      return "Duration must be between 5 and 20 minutes.";
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
      const payload: InterviewTemplateCreatePayload = {
        title: draft.title.trim(),
        topic: draft.topic.trim(),
        subtopic: draft.subtopic.trim(),
        difficulty: draft.difficulty,
        duration_minutes: draft.duration_minutes,
        description: draft.description.trim(),
        is_active: draft.is_active,
        course_ids: draft.course_ids,
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
              <TextField
                label="Title"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                fullWidth
                size="small"
                placeholder="e.g. Mid-level Python screen"
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Topic"
                  value={draft.topic}
                  onChange={(e) => setDraft((d) => ({ ...d, topic: e.target.value }))}
                  fullWidth
                  size="small"
                  placeholder="e.g. Python"
                />
                <TextField
                  label="Subtopic"
                  value={draft.subtopic}
                  onChange={(e) => setDraft((d) => ({ ...d, subtopic: e.target.value }))}
                  fullWidth
                  size="small"
                  placeholder="e.g. Decorators and metaclasses"
                />
              </Stack>
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
      </Box>
    </MainLayout>
  );
}
