"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Divider,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import {
  adminCourseBuilderService,
  BackendContentType,
  ContentIdType,
  contentTypeMap,
  backendToUiContentType,
  ContentData,
} from "@/lib/services/admin/admin-course-builder.service";
import { ContentPreviewDialog } from "./ContentPreviewDialog";
import {
  extractArticleBodyAndAttachments,
} from "@/lib/utils/articleAttachments";

interface ContentItem {
  id: number;
  title: string;
  content_type: BackendContentType | string;
  content_id?: number;
  video_content?: number | null;
  article_content?: number | null;
  quiz_content?: number | null;
  assignment_content?: number | null;
  coding_problem_content?: number | null;
  order: number;
  duration_in_minutes: number;
  marks?: number;
  [key: string]: unknown;
}

interface ContentListProps {
  courseId: number;
  submoduleId: number;
  readOnly?: boolean;
}

const CONTENT_TYPE_CONFIG: Record<
  ContentIdType,
  { label: string; icon: string; color: string; bg: string }
> = {
  video: { label: "Video", icon: "mdi:video", color: "#7c3aed", bg: "#f5f3ff" },
  article: { label: "Article", icon: "mdi:file-document", color: "#2563eb", bg: "#eff6ff" },
  quiz: { label: "Quiz", icon: "mdi:help-circle", color: "#d97706", bg: "#fffbeb" },
  assignment: { label: "Assignment", icon: "mdi:clipboard-text", color: "#059669", bg: "#ecfdf5" },
  coding_problem: { label: "Coding", icon: "mdi:code-tags", color: "#dc2626", bg: "#fef2f2" },
};

const PICKABLE_CONTENT_TYPES: ContentIdType[] = [
  "video",
  "article",
  "quiz",
  "coding_problem",
];

function normalizeContentType(value: string | undefined): ContentIdType {
  return backendToUiContentType(value);
}

interface ContentFormState {
  title: string;
  content_type: ContentIdType;
  order: number;
  duration_in_minutes: number;
  marks: number;
  difficulty_level: "Easy" | "Medium" | "Hard";
  video_url: string;
  video_description: string;
  transcript: string;
  article_content: string;
  assignment_question: string;
  coding_problem_statement: string;
  coding_input_format: string;
  coding_output_format: string;
  coding_sample_input: string;
  coding_sample_output: string;
  coding_constraints: string;
  coding_test_cases_json: string;
  coding_template_code_json: string;
  coding_solution_json: string;
  coding_questions: CodingDraft[];
  quiz_instructions: string;
  quiz_duration: number;
  quiz_mcqs: MCQDraft[];
}

interface MCQDraft {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  explanation: string;
}

interface CodingDraft {
  title: string;
  difficulty_level: "Easy" | "Medium" | "Hard";
  problem_statement: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  constraints: string;
  test_cases: unknown[];
  template_code: Record<string, unknown>;
  solution: Record<string, unknown>;
  duration_in_minutes: number;
  marks: number;
}

const emptyMcq = (): MCQDraft => ({
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
  explanation: "",
});

const resetCodingDraftFields = (prev: ContentFormState): ContentFormState => ({
  ...prev,
  title: "",
  coding_problem_statement: "",
  coding_input_format: "",
  coding_output_format: "",
  coding_sample_input: "",
  coding_sample_output: "",
  coding_constraints: "",
  coding_test_cases_json: "[]",
  coding_template_code_json: "{}",
  coding_solution_json: "{}",
});

const emptyForm = (): ContentFormState => ({
  title: "",
  content_type: "article",
  order: 1,
  duration_in_minutes: 0,
  marks: 10,
  difficulty_level: "Medium",
  video_url: "",
  video_description: "",
  transcript: "",
  article_content: "",
  assignment_question: "",
  coding_problem_statement: "",
  coding_input_format: "",
  coding_output_format: "",
  coding_sample_input: "",
  coding_sample_output: "",
  coding_constraints: "",
  coding_test_cases_json: "[]",
  coding_template_code_json: "{}",
  coding_solution_json: "{}",
  coding_questions: [],
  quiz_instructions: "",
  quiz_duration: 30,
  quiz_mcqs: [],
});

export function ContentList({
  courseId,
  submoduleId,
  readOnly = false,
}: ContentListProps) {
  const { showToast } = useToast();

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ContentFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [mcqDraft, setMcqDraft] = useState<MCQDraft>(emptyMcq());
  const [deleteTarget, setDeleteTarget] = useState<ContentItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [previewContentId, setPreviewContentId] = useState<number | null>(null);

  const loadContents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminCourseBuilderService.getSubmoduleContent(courseId, submoduleId);
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setContents(list);
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to load contents",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [courseId, submoduleId, showToast]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  const openAdd = () => {
    setEditingId(null);
    setMcqDraft(emptyMcq());
    setFormData({ ...emptyForm(), order: contents.length + 1 });
    setDialogOpen(true);
  };

  const resolveLinkedId = (item: ContentItem): number | null =>
    item.video_content ??
    item.article_content ??
    item.quiz_content ??
    item.assignment_content ??
    item.coding_problem_content ??
    item.content_id ??
    null;

  const openEdit = async (item: ContentItem) => {
    setEditingId(item.id);
    const base = {
      ...emptyForm(),
      title: item.title ?? "",
      content_type: normalizeContentType(item.content_type),
      order: Number(item.order) || 1,
      duration_in_minutes: Number(item.duration_in_minutes) || 0,
      marks: Number(item.marks) || 10,
    };
    setFormData(base);
    setDialogOpen(true);

    try {
      const linkedId = resolveLinkedId(item);
      if (!linkedId) return;
      const uiType = normalizeContentType(item.content_type);
      if (uiType === "video") {
        const video = await adminCourseBuilderService.getVideoTutorial(linkedId);
        setFormData((prev) => ({
          ...prev,
          title: video.title ?? prev.title,
          difficulty_level: video.difficulty_level ?? prev.difficulty_level,
          video_url: video.video_url ?? "",
          video_description: video.description ?? "",
          transcript: video.transcript ?? "",
        }));
      } else if (uiType === "article") {
        const article = await adminCourseBuilderService.getArticle(linkedId);
        const parsed = extractArticleBodyAndAttachments(article.content ?? "");
        setFormData((prev) => ({
          ...prev,
          title: article.title ?? prev.title,
          difficulty_level: article.difficulty_level ?? prev.difficulty_level,
          article_content: parsed.body,
        }));
      } else if (uiType === "assignment") {
        const assignment = await adminCourseBuilderService.getAssignment(linkedId);
        setFormData((prev) => ({
          ...prev,
          title: assignment.title ?? prev.title,
          difficulty_level: assignment.difficulty_level ?? prev.difficulty_level,
          assignment_question: assignment.question ?? "",
        }));
      } else if (uiType === "coding_problem") {
        const coding = await adminCourseBuilderService.getCodingProblem(linkedId);
        setFormData((prev) => ({
          ...prev,
          title: coding.title ?? prev.title,
          difficulty_level: coding.difficulty_level ?? prev.difficulty_level,
          coding_problem_statement: coding.problem_statement ?? "",
          coding_input_format: coding.input_format ?? "",
          coding_output_format: coding.output_format ?? "",
          coding_sample_input: coding.sample_input ?? "",
          coding_sample_output: coding.sample_output ?? "",
          coding_constraints: coding.constraints ?? "",
          coding_test_cases_json: JSON.stringify(coding.test_cases ?? [], null, 2),
          coding_template_code_json: JSON.stringify(
            coding.template_code ?? {},
            null,
            2
          ),
          coding_solution_json: JSON.stringify(coding.solution ?? {}, null, 2),
        }));
      } else if (uiType === "quiz") {
        const quiz = await adminCourseBuilderService.getQuiz(linkedId);
        setFormData((prev) => ({
          ...prev,
          title: quiz.title ?? prev.title,
          difficulty_level: quiz.difficulty_level ?? prev.difficulty_level,
          quiz_instructions: quiz.instructions ?? "",
          quiz_duration: Number(quiz.durating_in_minutes) || prev.quiz_duration,
        }));
      }
    } catch (error: unknown) {
      showToast(
        error instanceof Error
          ? error.message
          : "Loaded link but failed to fetch details",
        "info"
      );
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setMcqDraft(emptyMcq());
    setFormData(emptyForm());
  };

  const parseJson = <T,>(raw: string, fallback: T): T => {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const buildLinkPayload = (
    backendType: BackendContentType,
    linkedId: number,
    overrides?: {
      title?: string;
      order?: number;
      duration_in_minutes?: number;
      marks?: number;
    }
  ): ContentData => ({
    title: overrides?.title ?? formData.title.trim(),
    content_type: backendType,
    content_id: linkedId,
    video_content: backendType === "VideoTutorial" ? linkedId : null,
    article_content: backendType === "Article" ? linkedId : null,
    quiz_content: backendType === "Quiz" ? linkedId : null,
    assignment_content: backendType === "Assignment" ? linkedId : null,
    coding_problem_content: backendType === "CodingProblem" ? linkedId : null,
    order: overrides?.order ?? (Number(formData.order) || 1),
    duration_in_minutes:
      overrides?.duration_in_minutes ?? (Number(formData.duration_in_minutes) || 0),
    marks: overrides?.marks ?? (Number(formData.marks) || 10),
  });

  const createOrUpdateLinkedContent = async (existing?: ContentItem) => {
    const type = formData.content_type;
    const backendType = contentTypeMap[type];
    const linkedId = existing ? resolveLinkedId(existing) : null;

    if (type === "video") {
      const payload = {
        title: formData.title.trim(),
        difficulty_level: formData.difficulty_level,
        video_url: formData.video_url.trim(),
        description: formData.video_description.trim(),
        transcript: formData.transcript.trim(),
      };
      if (!payload.video_url) throw new Error("Video URL is required");
      const data = linkedId
        ? await adminCourseBuilderService.updateVideoTutorial(linkedId, payload)
        : await adminCourseBuilderService.createVideoTutorial(payload);
      return { backendType, linkedId: Number(data.id) };
    }

    if (type === "article") {
      const persisted = formData.article_content.trim();
      if (!persisted.trim()) {
        throw new Error("Article content is required");
      }
      const payload = {
        title: formData.title.trim(),
        difficulty_level: formData.difficulty_level,
        content: persisted,
      };
      const data = linkedId
        ? await adminCourseBuilderService.updateArticle(linkedId, payload)
        : await adminCourseBuilderService.createArticle(payload);
      return { backendType, linkedId: Number(data.id) };
    }

    if (type === "assignment") {
      const payload = {
        title: formData.title.trim(),
        difficulty_level: formData.difficulty_level,
        question: formData.assignment_question.trim(),
      };
      if (!payload.question) throw new Error("Assignment question is required");
      const data = linkedId
        ? await adminCourseBuilderService.updateAssignment(linkedId, payload)
        : await adminCourseBuilderService.createAssignment(payload);
      return { backendType, linkedId: Number(data.id) };
    }

    if (type === "coding_problem") {
      const payload = {
        title: formData.title.trim(),
        difficulty_level: formData.difficulty_level,
        problem_statement: formData.coding_problem_statement.trim(),
        input_format: formData.coding_input_format.trim(),
        output_format: formData.coding_output_format.trim(),
        sample_input: formData.coding_sample_input.trim(),
        sample_output: formData.coding_sample_output.trim(),
        constraints: formData.coding_constraints.trim(),
        test_cases: parseJson<unknown[]>(formData.coding_test_cases_json, []),
        template_code: parseJson<Record<string, unknown>>(
          formData.coding_template_code_json,
          {}
        ),
        solution: parseJson<Record<string, unknown>>(formData.coding_solution_json, {}),
      };
      if (!payload.problem_statement) {
        throw new Error("Problem statement is required");
      }
      const data = linkedId
        ? await adminCourseBuilderService.updateCodingProblem(linkedId, payload)
        : await adminCourseBuilderService.createCodingProblem(payload);
      return { backendType, linkedId: Number(data.id) };
    }

    const createdMcqIds: number[] = [];
    for (const mcq of formData.quiz_mcqs) {
      const mcqData = await adminCourseBuilderService.createMCQ({
        question_text: mcq.question_text.trim(),
        difficulty_level: formData.difficulty_level,
        option_a: mcq.option_a.trim(),
        option_b: mcq.option_b.trim(),
        option_c: mcq.option_c.trim(),
        option_d: mcq.option_d.trim(),
        correct_option: mcq.correct_option,
        explanation: mcq.explanation.trim(),
      });
      createdMcqIds.push(Number(mcqData.id));
    }
    const quizPayload = {
      title: formData.title.trim(),
      difficulty_level: formData.difficulty_level,
      instructions: formData.quiz_instructions.trim(),
      durating_in_minutes: Number(formData.quiz_duration) || 30,
      ...(createdMcqIds.length > 0 ? { mcqs: createdMcqIds } : {}),
    };
    const quiz = linkedId
      ? await adminCourseBuilderService.updateQuiz(linkedId, quizPayload)
      : await adminCourseBuilderService.createQuiz(quizPayload);
    return { backendType, linkedId: Number(quiz.id) };
  };

  const handleSave = async () => {
    const isBatchCodingCreate =
      editingId === null &&
      formData.content_type === "coding_problem" &&
      formData.coding_questions.length > 0;
    if (!formData.title.trim() && !isBatchCodingCreate) {
      showToast("Title is required", "error");
      return;
    }
    try {
      setSaving(true);
      const existing = contents.find((c) => c.id === editingId) ?? undefined;

      if (
        editingId === null &&
        formData.content_type === "coding_problem" &&
        formData.coding_questions.length > 0
      ) {
        const startOrder = Number(formData.order) || 1;
        for (let i = 0; i < formData.coding_questions.length; i++) {
          const q = formData.coding_questions[i];
          const coding = await adminCourseBuilderService.createCodingProblem({
            title: q.title.trim(),
            difficulty_level: q.difficulty_level,
            problem_statement: q.problem_statement.trim(),
            input_format: q.input_format.trim(),
            output_format: q.output_format.trim(),
            sample_input: q.sample_input.trim(),
            sample_output: q.sample_output.trim(),
            constraints: q.constraints.trim(),
            test_cases: q.test_cases,
            template_code: q.template_code,
            solution: q.solution,
          });
          const linkPayload = buildLinkPayload("CodingProblem", Number(coding.id), {
            title: q.title.trim(),
            order: startOrder + i,
            duration_in_minutes: q.duration_in_minutes,
            marks: q.marks,
          });
          await adminCourseBuilderService.addSubmoduleContent(
            courseId,
            submoduleId,
            linkPayload
          );
        }
        showToast(`${formData.coding_questions.length} coding content items added`, "success");
        closeDialog();
        loadContents();
        return;
      }

      const { backendType, linkedId } = await createOrUpdateLinkedContent(existing);
      const linkPayload = buildLinkPayload(backendType, linkedId);

      if (editingId !== null) {
        await adminCourseBuilderService.updateSubmoduleContent(
          courseId,
          submoduleId,
          editingId,
          linkPayload
        );
        showToast("Content updated", "success");
      } else {
        await adminCourseBuilderService.addSubmoduleContent(
          courseId,
          submoduleId,
          linkPayload
        );
        showToast("Content added", "success");
      }
      closeDialog();
      loadContents();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to save content",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddCodingQuestion = () => {
    if (!formData.title.trim() || !formData.coding_problem_statement.trim()) {
      showToast("Fill title and problem statement before adding", "error");
      return;
    }
    setFormData((prev) =>
      resetCodingDraftFields({
        ...prev,
        coding_questions: [
          ...prev.coding_questions,
          {
            title: prev.title.trim(),
            difficulty_level: prev.difficulty_level,
            problem_statement: prev.coding_problem_statement,
            input_format: prev.coding_input_format,
            output_format: prev.coding_output_format,
            sample_input: prev.coding_sample_input,
            sample_output: prev.coding_sample_output,
            constraints: prev.coding_constraints,
            test_cases: parseJson<unknown[]>(prev.coding_test_cases_json, []),
            template_code: parseJson<Record<string, unknown>>(
              prev.coding_template_code_json,
              {}
            ),
            solution: parseJson<Record<string, unknown>>(prev.coding_solution_json, {}),
            duration_in_minutes: Number(prev.duration_in_minutes) || 0,
            marks: Number(prev.marks) || 10,
          },
        ],
      })
    );
  };

  const handleAddQuizMcq = () => {
    if (
      !mcqDraft.question_text.trim() ||
      !mcqDraft.option_a.trim() ||
      !mcqDraft.option_b.trim() ||
      !mcqDraft.option_c.trim() ||
      !mcqDraft.option_d.trim()
    ) {
      showToast("Fill question and all options before adding MCQ", "error");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      quiz_mcqs: [...prev.quiz_mcqs, { ...mcqDraft }],
    }));
    setMcqDraft(emptyMcq());
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await adminCourseBuilderService.deleteSubmoduleContent(
        courseId,
        submoduleId,
        deleteTarget.id
      );
      showToast("Content deleted", "success");
      setDeleteTarget(null);
      loadContents();
    } catch (error: unknown) {
      showToast(
        error instanceof Error ? error.message : "Failed to delete content",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LinearProgress sx={{ my: 1, height: 2, borderRadius: 1 }} />;
  }

  return (
    <Box sx={{ mt: 1 }}>
      {contents.length === 0 ? (
        <Typography variant="caption" sx={{ color: "#9ca3af" }}>
          No content items yet
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {contents.map((item) => {
            const cfg = CONTENT_TYPE_CONFIG[normalizeContentType(item.content_type)];
            return (
              <Box
                key={item.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: "#fafafa",
                  border: "1px solid #f3f4f6",
                  "&:hover": { bgcolor: "#f3f4f6" },
                  transition: "background 0.15s",
                }}
              >
                <Tooltip title={cfg.label}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: 1,
                      bgcolor: cfg.bg,
                      flexShrink: 0,
                    }}
                  >
                    <IconWrapper icon={cfg.icon} size={16} color={cfg.color} />
                  </Box>
                </Tooltip>
                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    ...(!readOnly
                      ? {
                          cursor: "pointer",
                        }
                      : {}),
                  }}
                  onClick={
                    readOnly
                      ? undefined
                      : () => setPreviewContentId(item.id)
                  }
                  role={readOnly ? undefined : "button"}
                  tabIndex={readOnly ? undefined : 0}
                  onKeyDown={
                    readOnly
                      ? undefined
                      : (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setPreviewContentId(item.id);
                          }
                        }
                  }
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, color: "#111827", fontSize: "0.8rem", lineHeight: 1.3 }}
                  >
                    {item.title}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center", mt: 0.25 }}>
                    <Chip
                      label={cfg.label}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        bgcolor: cfg.bg,
                        color: cfg.color,
                      }}
                    />
                    {Number(item.duration_in_minutes) > 0 && (
                      <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.65rem" }}>
                        {item.duration_in_minutes} min
                      </Typography>
                    )}
                  </Box>
                </Box>
                {!readOnly ? (
                  <Box sx={{ display: "flex", gap: 0.25, flexShrink: 0 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        void openEdit(item);
                      }}
                      sx={{ color: "#6366f1", p: 0.5 }}
                    >
                      <IconWrapper icon="mdi:pencil" size={14} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(item);
                      }}
                      sx={{ color: "#ef4444", p: 0.5 }}
                    >
                      <IconWrapper icon="mdi:delete" size={14} />
                    </IconButton>
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Box>
      )}

      {!readOnly ? (
        <Button
          size="small"
          startIcon={<IconWrapper icon="mdi:plus" size={14} />}
          onClick={openAdd}
          sx={{ mt: 0.75, color: "#6366f1", textTransform: "none", fontWeight: 600, fontSize: "0.75rem" }}
        >
          Add Content
        </Button>
      ) : null}

      {/* Add / Edit Content Dialog */}
      <Dialog open={dialogOpen} onClose={saving ? undefined : closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingId !== null ? "Edit Content" : "Add Content"}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
          <TextField
            label="Title"
            value={formData.title ?? ""}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            fullWidth
            required
            autoFocus
          />
          <FormControl fullWidth>
            <InputLabel>Content Type</InputLabel>
            <Select
              value={formData.content_type ?? "article"}
              onChange={(e) => setFormData({ ...formData, content_type: (e.target.value as ContentIdType) || "article" })}
              label="Content Type"
            >
              {PICKABLE_CONTENT_TYPES.map((key) => {
                const cfg = CONTENT_TYPE_CONFIG[key];
                return (
                <MenuItem key={key} value={key}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconWrapper icon={cfg.icon} size={16} color={cfg.color} />
                    {cfg.label}
                  </Box>
                </MenuItem>
              );
              })}
              {formData.content_type === "assignment" && (
                <MenuItem value="assignment" disabled>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconWrapper icon={CONTENT_TYPE_CONFIG.assignment.icon} size={16} color={CONTENT_TYPE_CONFIG.assignment.color} />
                    {CONTENT_TYPE_CONFIG.assignment.label}
                  </Box>
                </MenuItem>
              )}
            </Select>
          </FormControl>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2 }}>
            <TextField
              label="Order"
              type="number"
              value={formData.order ?? 1}
              onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 1 })}
              fullWidth
              slotProps={{ htmlInput: { min: 1 } }}
            />
            <TextField
              label="Duration (min)"
              type="number"
              value={formData.duration_in_minutes ?? 0}
              onChange={(e) => setFormData({ ...formData, duration_in_minutes: Number(e.target.value) || 0 })}
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <TextField
              label="Marks"
              type="number"
              value={formData.marks ?? 10}
              onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) || 10 })}
              fullWidth
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Box>
          <FormControl fullWidth>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={formData.difficulty_level}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  difficulty_level: e.target.value as "Easy" | "Medium" | "Hard",
                })
              }
              label="Difficulty"
            >
              <MenuItem value="Easy">Easy</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Hard">Hard</MenuItem>
            </Select>
          </FormControl>
          <Divider />
          {formData.content_type === "video" && (
            <>
              <TextField
                label="Video URL"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Video Description"
                value={formData.video_description}
                onChange={(e) =>
                  setFormData({ ...formData, video_description: e.target.value })
                }
                multiline
                rows={3}
                fullWidth
              />
              <TextField
                label="Transcript (Optional)"
                value={formData.transcript}
                onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            </>
          )}
          {formData.content_type === "article" && (
            <>
              <TextField
                label="Editorial / Article Content"
                value={formData.article_content}
                onChange={(e) =>
                  setFormData({ ...formData, article_content: e.target.value })
                }
                multiline
                rows={6}
                fullWidth
                required
              />
            </>
          )}
          {formData.content_type === "assignment" && (
            <TextField
              label="Assignment Question / Instructions"
              value={formData.assignment_question}
              onChange={(e) =>
                setFormData({ ...formData, assignment_question: e.target.value })
              }
              multiline
              rows={6}
              fullWidth
              required
            />
          )}
          {formData.content_type === "coding_problem" && (
            <>
              <TextField
                label="Problem Statement"
                value={formData.coding_problem_statement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    coding_problem_statement: e.target.value,
                  })
                }
                multiline
                rows={5}
                fullWidth
                required
              />
              <TextField
                label="Input Format"
                value={formData.coding_input_format}
                onChange={(e) =>
                  setFormData({ ...formData, coding_input_format: e.target.value })
                }
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="Output Format"
                value={formData.coding_output_format}
                onChange={(e) =>
                  setFormData({ ...formData, coding_output_format: e.target.value })
                }
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="Sample Input"
                value={formData.coding_sample_input}
                onChange={(e) =>
                  setFormData({ ...formData, coding_sample_input: e.target.value })
                }
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="Sample Output"
                value={formData.coding_sample_output}
                onChange={(e) =>
                  setFormData({ ...formData, coding_sample_output: e.target.value })
                }
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="Constraints"
                value={formData.coding_constraints}
                onChange={(e) =>
                  setFormData({ ...formData, coding_constraints: e.target.value })
                }
                multiline
                rows={2}
                fullWidth
              />
              <TextField
                label="Test Cases JSON"
                value={formData.coding_test_cases_json}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    coding_test_cases_json: e.target.value,
                  })
                }
                multiline
                rows={4}
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={handleAddCodingQuestion}
                sx={{ alignSelf: "flex-start", textTransform: "none" }}
              >
                Add Coding Question
              </Button>
              {formData.coding_questions.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  {formData.coding_questions.map((q, index) => (
                    <Box
                      key={`${q.title}-${index}`}
                      sx={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 1,
                        p: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "#374151" }}>
                        Q{index + 1}: {q.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            coding_questions: prev.coding_questions.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <IconWrapper icon="mdi:delete" size={14} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}
          {formData.content_type === "quiz" && (
            <>
              <TextField
                label="Quiz Instructions"
                value={formData.quiz_instructions}
                onChange={(e) =>
                  setFormData({ ...formData, quiz_instructions: e.target.value })
                }
                multiline
                rows={4}
                fullWidth
              />
              <TextField
                label="Quiz Duration (minutes)"
                type="number"
                value={formData.quiz_duration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quiz_duration: Number(e.target.value) || 30,
                  })
                }
                fullWidth
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <Divider />
              <Typography variant="subtitle2">Add MCQ (optional)</Typography>
              <TextField
                label="Question"
                value={mcqDraft.question_text}
                onChange={(e) =>
                  setMcqDraft({ ...mcqDraft, question_text: e.target.value })
                }
                multiline
                rows={2}
                fullWidth
              />
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <TextField
                  label="Option A"
                  value={mcqDraft.option_a}
                  onChange={(e) =>
                    setMcqDraft({ ...mcqDraft, option_a: e.target.value })
                  }
                />
                <TextField
                  label="Option B"
                  value={mcqDraft.option_b}
                  onChange={(e) =>
                    setMcqDraft({ ...mcqDraft, option_b: e.target.value })
                  }
                />
                <TextField
                  label="Option C"
                  value={mcqDraft.option_c}
                  onChange={(e) =>
                    setMcqDraft({ ...mcqDraft, option_c: e.target.value })
                  }
                />
                <TextField
                  label="Option D"
                  value={mcqDraft.option_d}
                  onChange={(e) =>
                    setMcqDraft({ ...mcqDraft, option_d: e.target.value })
                  }
                />
              </Box>
              <FormControl fullWidth>
                <InputLabel>Correct Option</InputLabel>
                <Select
                  value={mcqDraft.correct_option}
                  onChange={(e) =>
                    setMcqDraft({
                      ...mcqDraft,
                      correct_option: e.target.value as "A" | "B" | "C" | "D",
                    })
                  }
                  label="Correct Option"
                >
                  <MenuItem value="A">A</MenuItem>
                  <MenuItem value="B">B</MenuItem>
                  <MenuItem value="C">C</MenuItem>
                  <MenuItem value="D">D</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Explanation (optional)"
                value={mcqDraft.explanation}
                onChange={(e) =>
                  setMcqDraft({ ...mcqDraft, explanation: e.target.value })
                }
                multiline
                rows={2}
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={handleAddQuizMcq}
                sx={{ alignSelf: "flex-start", textTransform: "none" }}
              >
                Add MCQ to Quiz
              </Button>
              {formData.quiz_mcqs.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  {formData.quiz_mcqs.map((mcq, index) => (
                    <Box
                      key={`${mcq.question_text}-${index}`}
                      sx={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 1,
                        p: 1,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "#374151" }}>
                        Q{index + 1}: {mcq.question_text}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            quiz_mcqs: prev.quiz_mcqs.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        <IconWrapper icon="mdi:delete" size={14} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closeDialog} disabled={saving} sx={{ color: "#6b7280" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              saving ||
              (!formData.title.trim() &&
                !(editingId === null &&
                  formData.content_type === "coding_problem" &&
                  formData.coding_questions.length > 0))
            }
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ bgcolor: "#6366f1" }}
          >
            {saving ? "Saving..." : editingId !== null ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDeleteDialog
        open={!!deleteTarget}
        title="Delete Content"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />

      <ContentPreviewDialog
        open={previewContentId !== null}
        contentId={previewContentId}
        onClose={() => setPreviewContentId(null)}
      />
    </Box>
  );
}
