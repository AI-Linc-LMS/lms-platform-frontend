"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { DRAWER_WIDTH } from "@/components/layout/Sidebar";
import { isRtl } from "@/lib/i18n";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { config } from "@/lib/config";
import {
  adminAssessmentService,
  type ManualEvaluationPayload,
  type SubmissionManualEvaluationResponse,
} from "@/lib/services/admin/admin-assessment.service";

type ScoreMap = Record<number, { awarded_marks: string; note: string }>;

function toScoreMap(
  rows: Array<{ id: number; awarded_marks?: number; note?: string }> | undefined
): ScoreMap {
  const out: ScoreMap = {};
  (rows || []).forEach((r) => {
    out[r.id] = {
      awarded_marks: r.awarded_marks != null ? String(r.awarded_marks) : "",
      note: r.note || "",
    };
  });
  return out;
}

function mergeScoreMaps(base: ScoreMap, overlay: ScoreMap): ScoreMap {
  const out: ScoreMap = { ...base };
  Object.entries(overlay).forEach(([id, row]) => {
    out[Number(id)] = { ...row };
  });
  return out;
}

function normalizeOptionLetter(value: unknown): string {
  if (value == null || value === "") return "";
  return String(value).trim().toUpperCase();
}

function looksLikeHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s);
}

function reviewStatusColor(
  status: string
): "default" | "primary" | "success" | "warning" | "error" {
  switch (status) {
    case "published":
      return "success";
    case "evaluated":
      return "primary";
    case "pending_evaluation":
      return "warning";
    default:
      return "default";
  }
}

function optionStateChipSx(kind: "selected" | "correct") {
  if (kind === "correct") {
    return {
      height: 24,
      borderRadius: 999,
      fontWeight: 700,
      color: "#065f46",
      bgcolor: "rgba(16, 185, 129, 0.16)",
      border: "1px solid rgba(16, 185, 129, 0.45)",
      "& .MuiChip-label": { px: 1 },
    };
  }
  return {
    height: 24,
    borderRadius: 999,
    fontWeight: 700,
    color: "#3730a3",
    bgcolor: "rgba(99, 102, 241, 0.16)",
    border: "1px solid rgba(99, 102, 241, 0.45)",
    "& .MuiChip-label": { px: 1 },
  };
}

export default function AdminSubmissionEvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const { i18n } = useTranslation("common");
  const { showToast } = useToast();
  const rtl = isRtl(i18n.language || "en");

  const assessmentId = Number(params.id);
  const submissionId = Number(params.submissionId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [data, setData] = useState<SubmissionManualEvaluationResponse | null>(null);
  const [quizScores, setQuizScores] = useState<ScoreMap>({});
  const [codingScores, setCodingScores] = useState<ScoreMap>({});
  const [subjectiveScores, setSubjectiveScores] = useState<ScoreMap>({});
  const [adminNotes, setAdminNotes] = useState("");

  const quizMaxById = useMemo(() => {
    const map = new Map<number, number>();
    (data?.responses.quiz_responses || []).forEach((q: any) => {
      map.set(Number(q.question_id), Number(q.max_marks) || 0);
    });
    return map;
  }, [data]);

  const codingMaxById = useMemo(() => {
    const map = new Map<number, number>();
    (data?.responses.coding_problem_responses || []).forEach((q: any) => {
      map.set(Number(q.problem_id), Number(q.max_marks) || 0);
    });
    return map;
  }, [data]);

  const subjectiveMaxById = useMemo(() => {
    const map = new Map<number, number>();
    (data?.responses.subjective_responses || []).forEach((q: any) => {
      map.set(Number(q.question_id), Number(q.max_marks) || 0);
    });
    return map;
  }, [data]);

  const loadData = async () => {
    if (!assessmentId || !submissionId || !config.clientId) return;
    try {
      setLoading(true);
      const res = await adminAssessmentService.getSubmissionManualEvaluation(
        config.clientId,
        assessmentId,
        submissionId
      );
      setData(res);

      const payload = (res.submission.manual_evaluation_payload || {}) as ManualEvaluationPayload;
      const quizFromResponses: ScoreMap = {};
      (res.responses.quiz_responses || []).forEach((q: any) => {
        quizFromResponses[Number(q.question_id)] = { awarded_marks: "", note: "" };
      });
      const codingFromResponses: ScoreMap = {};
      (res.responses.coding_problem_responses || []).forEach((q: any) => {
        codingFromResponses[Number(q.problem_id)] = { awarded_marks: "", note: "" };
      });
      const subjectiveFromResponses: ScoreMap = {};
      (res.responses.subjective_responses || []).forEach((q: any) => {
        subjectiveFromResponses[Number(q.question_id)] = { awarded_marks: "", note: "" };
      });

      setQuizScores(mergeScoreMaps(quizFromResponses, toScoreMap(payload.quiz_scores)));
      setCodingScores(mergeScoreMaps(codingFromResponses, toScoreMap(payload.coding_scores)));
      setSubjectiveScores(mergeScoreMaps(subjectiveFromResponses, toScoreMap(payload.subjective_scores)));
      setAdminNotes(payload.admin_notes || "");
    } catch (e: any) {
      showToast(e?.message || "Failed to load submission evaluation", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [assessmentId, submissionId]);

  const totalScore = useMemo(() => {
    const sumBucket = (bucket: ScoreMap) =>
      Object.values(bucket).reduce((acc, row) => acc + (Number(row.awarded_marks) || 0), 0);
    return sumBucket(quizScores) + sumBucket(codingScores) + sumBucket(subjectiveScores);
  }, [quizScores, codingScores, subjectiveScores]);

  const invalidEntriesCount = useMemo(() => {
    const countInvalid = (bucket: ScoreMap, maxById: Map<number, number>) =>
      Object.entries(bucket).reduce((acc, [id, row]) => {
        const raw = row.awarded_marks.trim();
        if (!raw) return acc;
        const marks = Number(raw);
        const max = maxById.get(Number(id)) ?? 0;
        if (!Number.isFinite(marks) || marks < 0 || marks > max) return acc + 1;
        return acc;
      }, 0);

    return (
      countInvalid(quizScores, quizMaxById) +
      countInvalid(codingScores, codingMaxById) +
      countInvalid(subjectiveScores, subjectiveMaxById)
    );
  }, [quizScores, codingScores, subjectiveScores, quizMaxById, codingMaxById, subjectiveMaxById]);

  const updateScore = (
    setter: Dispatch<SetStateAction<ScoreMap>>,
    id: number,
    patch: Partial<{ awarded_marks: string; note: string }>
  ) => {
    setter((prev) => ({
      ...prev,
      [id]: {
        awarded_marks: prev[id]?.awarded_marks ?? "",
        note: prev[id]?.note ?? "",
        ...patch,
      },
    }));
  };

  const buildPayload = (): ManualEvaluationPayload => {
    const bucketRows = (bucket: ScoreMap) =>
      Object.entries(bucket).reduce<
        Array<{ id: number; awarded_marks: number; note?: string }>
      >((acc, [id, row]) => {
        const marksRaw = row.awarded_marks.trim();
        const noteRaw = row.note.trim();
        if (!marksRaw && !noteRaw) return acc;
        acc.push({
          id: Number(id),
          awarded_marks: marksRaw ? Number(marksRaw) || 0 : 0,
          note: noteRaw || undefined,
        });
        return acc;
      }, []);

    return {
      quiz_scores: bucketRows(quizScores),
      coding_scores: bucketRows(codingScores),
      subjective_scores: bucketRows(subjectiveScores),
      admin_notes: adminNotes.trim() || undefined,
    };
  };

  const handleSaveDraft = async () => {
    if (!assessmentId || !submissionId || !config.clientId) return;
    if (invalidEntriesCount > 0) {
      showToast("Fix invalid marks first. Marks must be between 0 and each question's max.", "error");
      return;
    }
    try {
      setSaving(true);
      await adminAssessmentService.saveManualEvaluation(config.clientId, assessmentId, submissionId, {
        manual_evaluation_payload: buildPayload(),
      });
      showToast("Evaluation draft saved", "success");
      await loadData();
    } catch (e: any) {
      showToast(e?.message || "Failed to save evaluation", "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!assessmentId || !submissionId || !config.clientId) return;
    if (invalidEntriesCount > 0) {
      showToast("Fix invalid marks first. Marks must be between 0 and each question's max.", "error");
      return;
    }
    try {
      setPublishing(true);
      await adminAssessmentService.publishSubmissionResult(config.clientId, assessmentId, submissionId);
      showToast("Result published to student", "success");
      await loadData();
    } catch (e: any) {
      showToast(e?.message || "Failed to publish result", "error");
    } finally {
      setPublishing(false);
    }
  };

  const isPublished = data?.submission.review_status === "published";
  const scorePercent =
    data && data.maximum_marks > 0
      ? Math.min(100, Math.round((totalScore / data.maximum_marks) * 100))
      : 0;

  const submissionsHubHref = `/admin/assessment/${assessmentId}/edit?tab=submissions`;

  const goToSubmissions = () => {
    router.push(submissionsHubHref);
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <Box sx={{ p: 4 }}>
          <Alert severity="error">Submission evaluation data not found.</Alert>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box
        sx={{
          maxWidth: 1100,
          mx: "auto",
          p: { xs: 2, sm: 3 },
          pb: isPublished ? 3 : { xs: 18, md: 12 },
        }}
      >
        <Breadcrumbs
          separator={<IconWrapper icon="mdi:chevron-right" size={16} />}
          sx={{ mb: 2, "& .MuiBreadcrumbs-separator": { mx: 0.5, opacity: 0.55 } }}
        >
          <MuiLink
            component={Link}
            href="/admin/assessment"
            underline="hover"
            color="inherit"
            sx={{ fontWeight: 600, fontSize: 14 }}
          >
            Assessments
          </MuiLink>
          <MuiLink
            component={Link}
            href={submissionsHubHref}
            underline="hover"
            color="inherit"
            sx={{ fontWeight: 600, fontSize: 14, maxWidth: 280, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
            title={data.assessment.title}
          >
            {data.assessment.title}
          </MuiLink>
          <Typography color="text.primary" sx={{ fontWeight: 700, fontSize: 14 }}>
            Evaluate submission
          </Typography>
        </Breadcrumbs>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 2.5,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.06) 0%, rgba(255,255,255,1) 48%)",
          }}
        >
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: "text.secondary", letterSpacing: 0.08 }}>
                Manual evaluation
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: "#0f172a", lineHeight: 1.25 }}>
                {data.assessment.title}
              </Typography>
              <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ mt: 1 }}>
                <Chip
                  icon={<IconWrapper icon="mdi:account-outline" size={16} />}
                  size="small"
                  variant="outlined"
                  label={data.student.name}
                />
                <Chip size="small" variant="outlined" label={data.student.email} />
                {data.student.phone ? (
                  <Chip size="small" variant="outlined" label={data.student.phone} />
                ) : null}
              </Stack>
            </Box>
            <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }} spacing={1}>
              <Chip
                size="small"
                color={reviewStatusColor(data.submission.review_status)}
                label={`Status: ${data.submission.review_status}`}
              />
              <Stack direction="row" spacing={0.75} flexWrap="wrap" justifyContent={{ sm: "flex-end" }}>
                <Chip size="small" label={`Quiz ${(data.responses.quiz_responses || []).length}`} />
                <Chip size="small" label={`Coding ${(data.responses.coding_problem_responses || []).length}`} />
                <Chip size="small" label={`Written ${(data.responses.subjective_responses || []).length}`} />
              </Stack>
            </Stack>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2} flexWrap="wrap">
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#334155" }}>
                Running total (draft)
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#4f46e5" }}>
                {totalScore} / {data.maximum_marks}
              </Typography>
            </Stack>
            {data.maximum_marks > 0 ? (
              <LinearProgress
                variant="determinate"
                value={scorePercent}
                sx={{
                  height: 10,
                  borderRadius: 999,
                  bgcolor: "rgba(15, 23, 42, 0.06)",
                  "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: "#6366f1" },
                }}
              />
            ) : null}
          </Stack>
        </Paper>

        {isPublished ? (
          <Alert severity="info" sx={{ mb: 2.5 }}>
            This submission is published. Grading fields are read-only; students can see results per your publish rules.
          </Alert>
        ) : null}

        {invalidEntriesCount > 0 && (
          <Alert severity="error" sx={{ mb: 2.5 }}>
            {invalidEntriesCount} mark entry(ies) are invalid. Marks must be between 0 and max marks for each question.
          </Alert>
        )}

        {!isPublished ? (
          <Paper sx={{ p: 2.5, mb: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
              <IconWrapper icon="mdi:note-text-outline" size={20} color="#6366f1" />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Overall notes
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Optional notes for this submission (visible in the saved evaluation payload).
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Notes for this submission"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
            />
          </Paper>
        ) : null}

        <Stack spacing={2.5}>
          <Accordion defaultExpanded disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" size={22} />}>
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ py: 0.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "rgba(99, 102, 241, 0.12)",
                    border: "1px solid rgba(99, 102, 241, 0.22)",
                  }}
                >
                  <IconWrapper icon="mdi:help-circle-outline" size={22} color="#4f46e5" />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>Quiz</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Review options, learner selection, and award marks per question.
                  </Typography>
                </Box>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
              <Stack spacing={2}>
                {(data.responses.quiz_responses || []).map((q: any) => {
                  const opts = (q.options || {}) as Record<string, string>;
                  const letters = ["A", "B", "C", "D"].filter((k) => opts[k] != null && String(opts[k]).trim() !== "");
                  const selected = normalizeOptionLetter(q.selected_answer);
                  const correct = normalizeOptionLetter(q.correct_option);
                  const marksInvalid = (() => {
                    const raw = quizScores[q.question_id]?.awarded_marks ?? "";
                    if (!raw.trim()) return false;
                    const n = Number(raw);
                    const max = Number(q.max_marks) || 0;
                    return !Number.isFinite(n) || n < 0 || n > max;
                  })();

                  return (
                    <Card key={`quiz-${q.question_id}`} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: { xs: 2, sm: 2.25 }, "&:last-child": { pb: { xs: 2, sm: 2.25 } } }}>
                        <Stack spacing={1.25}>
                          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap">
                            <Typography sx={{ fontWeight: 800, color: "#0f172a", whiteSpace: "pre-wrap" }}>
                              {q.question_text}
                            </Typography>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" justifyContent="flex-end">
                              {q.difficulty_level ? (
                                <Chip size="small" label={String(q.difficulty_level)} variant="outlined" />
                              ) : null}
                              <Chip size="small" color={q.is_correct ? "success" : "warning"} variant="outlined" label={q.is_correct ? "Auto: correct" : "Auto: incorrect"} />
                              <Chip size="small" variant="outlined" label={`Max ${Number(q.max_marks) || 0}`} />
                            </Stack>
                          </Stack>

                          <Stack spacing={1}>
                            {letters.map((letter) => {
                              const isSelected = selected === letter;
                              const isCorrect = correct === letter;
                              const border = isCorrect
                                ? "1px solid rgba(16, 185, 129, 0.55)"
                                : isSelected
                                  ? "1px solid rgba(99, 102, 241, 0.55)"
                                  : "1px solid rgba(15, 23, 42, 0.10)";
                              const bg = isCorrect
                                ? "rgba(16, 185, 129, 0.08)"
                                : isSelected
                                  ? "rgba(99, 102, 241, 0.08)"
                                  : "rgba(248, 250, 252, 0.9)";

                              return (
                                <Box
                                  key={`${q.question_id}-${letter}`}
                                  sx={{
                                    border,
                                    bgcolor: bg,
                                    borderRadius: 2,
                                    p: 1.25,
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "92px 1fr" },
                                    gap: 1,
                                    alignItems: "start",
                                  }}
                                >
                                  <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                                    <Chip size="small" label={letter} sx={{ fontWeight: 800 }} />
                                    {isSelected ? (
                                      <Chip
                                        size="small"
                                        label="Selected"
                                        icon={<IconWrapper icon="mdi:account-check-outline" size={14} color="#3730a3" />}
                                        sx={optionStateChipSx("selected")}
                                      />
                                    ) : null}
                                    {isCorrect ? (
                                      <Chip
                                        size="small"
                                        label="Correct"
                                        icon={<IconWrapper icon="mdi:check-circle-outline" size={14} color="#065f46" />}
                                        sx={optionStateChipSx("correct")}
                                      />
                                    ) : null}
                                  </Stack>
                                  <Typography variant="body2" sx={{ color: "#0f172a", whiteSpace: "pre-wrap" }}>
                                    {opts[letter]}
                                  </Typography>
                                </Box>
                              );
                            })}
                          </Stack>

                          <Divider />

                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "flex-start" }}>
                            <TextField
                              size="small"
                              label="Awarded marks"
                              value={quizScores[q.question_id]?.awarded_marks ?? ""}
                              onChange={(e) =>
                                updateScore(setQuizScores, q.question_id, { awarded_marks: e.target.value })
                              }
                              disabled={isPublished}
                              error={marksInvalid}
                              helperText={`0 to ${Number(q.max_marks) || 0}`}
                              inputProps={{ min: 0, max: Number(q.max_marks) || 0, step: 0.01 }}
                              sx={{ width: { xs: "100%", sm: 160 } }}
                            />
                            <TextField
                              size="small"
                              fullWidth
                              label="Evaluator note (optional)"
                              value={quizScores[q.question_id]?.note ?? ""}
                              onChange={(e) => updateScore(setQuizScores, q.question_id, { note: e.target.value })}
                              disabled={isPublished}
                            />
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" size={22} />}>
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ py: 0.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.22)",
                  }}
                >
                  <IconWrapper icon="mdi:code-tags" size={22} color="#047857" />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>Coding</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Review attempt signal + submitted code, then award marks.
                  </Typography>
                </Box>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
              <Stack spacing={2}>
                {(data.responses.coding_problem_responses || []).map((q: any) => {
                  const totalTc = Number(q.total_test_cases) || 0;
                  const passed = Number(q.passed_test_cases) || 0;
                  const pct = totalTc > 0 ? Math.round((passed / totalTc) * 100) : 0;
                  const stmt = String(q.problem_statement || "");
                  const marksInvalid = (() => {
                    const raw = codingScores[q.problem_id]?.awarded_marks ?? "";
                    if (!raw.trim()) return false;
                    const n = Number(raw);
                    const max = Number(q.max_marks) || 0;
                    return !Number.isFinite(n) || n < 0 || n > max;
                  })();

                  return (
                    <Card key={`coding-${q.problem_id}`} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: { xs: 2, sm: 2.25 }, "&:last-child": { pb: { xs: 2, sm: 2.25 } } }}>
                        <Stack spacing={1.25}>
                          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap">
                            <Typography sx={{ fontWeight: 800, color: "#0f172a" }}>{q.title}</Typography>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" justifyContent="flex-end">
                              {q.difficulty_level ? <Chip size="small" label={String(q.difficulty_level)} variant="outlined" /> : null}
                              <Chip size="small" variant="outlined" label={`Max ${Number(q.max_marks) || 0}`} />
                              <Chip size="small" color={q.all_test_cases_passed ? "success" : "warning"} variant="outlined" label={q.all_test_cases_passed ? "All tests passed" : "Partial / failed"} />
                            </Stack>
                          </Stack>

                          <Stack spacing={0.75}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                                Automated signal
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: "#334155" }}>
                                {passed}/{totalTc} tests
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              sx={{
                                height: 8,
                                borderRadius: 999,
                                bgcolor: "rgba(15, 23, 42, 0.06)",
                                "& .MuiLinearProgress-bar": { borderRadius: 999, bgcolor: q.all_test_cases_passed ? "#10b981" : "#f59e0b" },
                              }}
                            />
                          </Stack>

                          {stmt ? (
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(248, 250, 252, 0.9)" }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: "block", mb: 0.75 }}>
                                Problem statement
                              </Typography>
                              {looksLikeHtml(stmt) ? (
                                <Box
                                  className="assessment-admin-html"
                                  sx={{ color: "#0f172a", "& p": { m: 0 }, "& img": { maxWidth: "100%" } }}
                                  dangerouslySetInnerHTML={{ __html: stmt }}
                                />
                              ) : (
                                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "#0f172a" }}>
                                  {stmt}
                                </Typography>
                              )}
                            </Paper>
                          ) : null}

                          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#0b1220" }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: "rgba(255,255,255,0.75)", display: "block", mb: 0.75 }}>
                              Submitted code
                            </Typography>
                            <Typography
                              component="pre"
                              sx={{
                                m: 0,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                                fontSize: 12.5,
                                lineHeight: 1.55,
                                color: "rgba(255,255,255,0.92)",
                              }}
                            >
                              {q.submitted_code?.trim() ? String(q.submitted_code) : "—"}
                            </Typography>
                          </Paper>

                          <Divider />

                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "flex-start" }}>
                            <TextField
                              size="small"
                              label="Awarded marks"
                              value={codingScores[q.problem_id]?.awarded_marks ?? ""}
                              onChange={(e) =>
                                updateScore(setCodingScores, q.problem_id, { awarded_marks: e.target.value })
                              }
                              disabled={isPublished}
                              error={marksInvalid}
                              helperText={`0 to ${Number(q.max_marks) || 0}`}
                              inputProps={{ min: 0, max: Number(q.max_marks) || 0, step: 0.01 }}
                              sx={{ width: { xs: "100%", sm: 160 } }}
                            />
                            <TextField
                              size="small"
                              fullWidth
                              label="Evaluator note (optional)"
                              value={codingScores[q.problem_id]?.note ?? ""}
                              onChange={(e) => updateScore(setCodingScores, q.problem_id, { note: e.target.value })}
                              disabled={isPublished}
                            />
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>

          <Accordion defaultExpanded disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, overflow: "hidden", "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<IconWrapper icon="mdi:chevron-down" size={22} />}>
              <Stack direction="row" alignItems="center" spacing={1.25} sx={{ py: 0.5 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "rgba(245, 158, 11, 0.14)",
                    border: "1px solid rgba(245, 158, 11, 0.28)",
                  }}
                >
                  <IconWrapper icon="mdi:text-box-outline" size={22} color="#b45309" />
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>Written</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Read the learner response and award marks with optional feedback.
                  </Typography>
                </Box>
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2, pb: 2, pt: 0 }}>
              <Stack spacing={2}>
                {(data.responses.subjective_responses || []).map((q: any) => {
                  const answer = String(q.answer || "");
                  const marksInvalid = (() => {
                    const raw = subjectiveScores[q.question_id]?.awarded_marks ?? "";
                    if (!raw.trim()) return false;
                    const n = Number(raw);
                    const max = Number(q.max_marks) || 0;
                    return !Number.isFinite(n) || n < 0 || n > max;
                  })();

                  return (
                    <Card key={`subj-${q.question_id}`} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: { xs: 2, sm: 2.25 }, "&:last-child": { pb: { xs: 2, sm: 2.25 } } }}>
                        <Stack spacing={1.25}>
                          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2} flexWrap="wrap">
                            <Typography sx={{ fontWeight: 800, color: "#0f172a", whiteSpace: "pre-wrap" }}>
                              {q.question_text}
                            </Typography>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" justifyContent="flex-end">
                              {q.question_type ? <Chip size="small" label={String(q.question_type)} variant="outlined" /> : null}
                              <Chip size="small" variant="outlined" label={`Max ${Number(q.max_marks) || 0}`} />
                            </Stack>
                          </Stack>

                          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(248, 250, 252, 0.95)" }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800, display: "block", mb: 0.75 }}>
                              Learner response
                            </Typography>
                            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", color: "#0f172a" }}>
                              {answer.trim() ? answer : "—"}
                            </Typography>
                          </Paper>

                          <Divider />

                          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} alignItems={{ sm: "flex-start" }}>
                            <TextField
                              size="small"
                              label="Awarded marks"
                              value={subjectiveScores[q.question_id]?.awarded_marks ?? ""}
                              onChange={(e) =>
                                updateScore(setSubjectiveScores, q.question_id, { awarded_marks: e.target.value })
                              }
                              disabled={isPublished}
                              error={marksInvalid}
                              helperText={`0 to ${Number(q.max_marks) || 0}`}
                              inputProps={{ min: 0, max: Number(q.max_marks) || 0, step: 0.01 }}
                              sx={{ width: { xs: "100%", sm: 160 } }}
                            />
                            <TextField
                              size="small"
                              fullWidth
                              label="Evaluator note (optional)"
                              value={subjectiveScores[q.question_id]?.note ?? ""}
                              onChange={(e) =>
                                updateScore(setSubjectiveScores, q.question_id, { note: e.target.value })
                              }
                              disabled={isPublished}
                            />
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            </AccordionDetails>
          </Accordion>
        </Stack>

        {!isPublished ? (
          <Paper
            elevation={12}
            sx={{
              position: "fixed",
              zIndex: 980,
              bottom: {
                xs: `calc(64px + env(safe-area-inset-bottom, 0px))`,
                md: 0,
              },
              ...(rtl
                ? { left: 0, right: { xs: 0, md: `${DRAWER_WIDTH}px` } }
                : { left: { xs: 0, md: `${DRAWER_WIDTH}px` }, right: 0 }),
              borderTop: "1px solid",
              borderColor: "divider",
              borderBottom: "none",
              borderRadius: 0,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              px: { xs: 2, sm: 3 },
              py: 1.5,
              bgcolor:
                theme.palette.mode === "dark"
                  ? "rgba(15, 23, 42, 0.92)"
                  : "rgba(255, 255, 255, 0.94)",
              backdropFilter: "blur(12px)",
              boxShadow: theme.palette.mode === "dark" ? "0 -8px 32px rgba(0,0,0,0.45)" : "0 -8px 32px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Box sx={{ maxWidth: 1100, mx: "auto", display: "flex", gap: 1.25, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ minWidth: 220 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                  Draft total
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "text.primary" }}>
                  {totalScore} / {data.maximum_marks}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
                <Button variant="outlined" onClick={goToSubmissions}>
                  Back to submissions
                </Button>
                <Button
                  variant="contained"
                  onClick={() => void handleSaveDraft()}
                  disabled={saving || invalidEntriesCount > 0}
                  startIcon={<IconWrapper icon="mdi:content-save-outline" size={18} />}
                  sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
                >
                  {saving ? "Saving..." : "Save evaluation"}
                </Button>
                <Button
                  color="success"
                  variant="contained"
                  onClick={() => void handlePublish()}
                  disabled={publishing || invalidEntriesCount > 0}
                  startIcon={<IconWrapper icon="mdi:publish" size={18} />}
                >
                  {publishing ? "Publishing..." : "Publish result"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        ) : (
          <Paper sx={{ p: 2.5, mt: 2.5, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Summary
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="Overall notes (read-only)"
              value={adminNotes}
              InputProps={{ readOnly: true }}
              sx={{ mb: 2 }}
            />
            <Typography variant="body1" sx={{ fontWeight: 900, mb: 2 }}>
              Final score on record: {data.submission.score ?? "—"} / {data.maximum_marks}
            </Typography>
            <Button variant="outlined" onClick={goToSubmissions}>
              Back to submissions
            </Button>
          </Paper>
        )}
      </Box>
    </MainLayout>
  );
}

