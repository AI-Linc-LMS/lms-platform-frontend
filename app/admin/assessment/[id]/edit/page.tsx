"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  Divider,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminAssessmentService,
  QuestionsExportResponse,
  SubmissionsExportResponse,
  AssessmentDetail,
  CreateAssessmentPayload,
} from "@/lib/services/admin/admin-assessment.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import { config } from "@/lib/config";
import { BasicInfoSection } from "@/components/admin/assessment/BasicInfoSection";
import { AssessmentSettingsSection } from "@/components/admin/assessment/AssessmentSettingsSection";

type TabValue = "details" | "questions" | "submissions";

function escapeCsv(val: unknown): string {
  if (val == null || val === undefined) return "";
  const s = String(typeof val === "object" ? JSON.stringify(val) : val);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r"))
    return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function jsonToCsvRows<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T; header: string }[]
): string {
  if (!rows.length) return "";
  const header = columns.map((c) => escapeCsv(c.header)).join(",");
  const data = rows.map((row) =>
    columns.map((c) => escapeCsv(row[c.key])).join(",")
  );
  return [header, ...data].join("\n");
}

/** Convert ISO date string to datetime-local "YYYY-MM-DDTHH:mm" */
function isoToDatetimeLocal(iso: string | null | undefined): string {
  if (!iso || !iso.trim()) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${y}-${m}-${day}T${h}:${min}`;
  } catch {
    return "";
  }
}

/** Convert datetime-local to IST "YYYY-MM-DDTHH:mm:ss+05:30" */
function convertToIST(dateTimeString: string): string | undefined {
  if (!dateTimeString?.trim()) return undefined;
  try {
    let s = dateTimeString.trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) s = s + ":00";
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
    if (!m) return undefined;
    const [, y, mo, d, h, min, sec] = m;
    const date = new Date(`${y}-${mo}-${d}T${h}:${min}:${sec}`);
    if (isNaN(date.getTime())) return undefined;
    return `${y}-${mo}-${d}T${h}:${min}:${sec}+05:30`;
  } catch {
    return undefined;
  }
}

export default function AssessmentEditPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const assessmentId = Number(params.id);
  const [tab, setTab] = useState<TabValue>("details");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [questionsData, setQuestionsData] =
    useState<QuestionsExportResponse | null>(null);
  const [submissionsData, setSubmissionsData] =
    useState<SubmissionsExportResponse | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Form state (Details tab) – synced from GET
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState<string>("");
  const [currency, setCurrency] = useState<string>("INR");
  const [isActive, setIsActive] = useState(true);
  const [courseIds, setCourseIds] = useState<number[]>([]);
  const [colleges, setColleges] = useState<string[]>([]);
  const [proctoringEnabled, setProctoringEnabled] = useState(true);

  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsLimit, setQuestionsLimit] = useState(10);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsLimit, setSubmissionsLimit] = useState(10);

  const loadAssessment = useCallback(async () => {
    if (!assessmentId || !config.clientId) return;
    try {
      const data = await adminAssessmentService.getAssessmentById(
        config.clientId,
        assessmentId
      );
      setAssessment(data);
      setTitle(data.title ?? "");
      setInstructions(data.instructions ?? "");
      setDescription(data.description ?? "");
      setDurationMinutes(data.duration_minutes ?? 60);
      setStartTime(isoToDatetimeLocal(data.start_time ?? null));
      setEndTime(isoToDatetimeLocal(data.end_time ?? null));
      const anyData = data as any;
      setIsPaid(anyData.is_paid ?? false);
      setPrice(
        anyData.price != null && anyData.price !== ""
          ? String(anyData.price)
          : ""
      );
      setCurrency(anyData.currency ?? "INR");
      setIsActive(data.is_active ?? true);
      setCourseIds(Array.isArray((data as any).course_ids) ? (data as any).course_ids : []);
      setColleges(Array.isArray((data as any).colleges) ? (data as any).colleges : []);
      setProctoringEnabled((data as any).proctoring_enabled ?? true);
    } catch (e: any) {
      showToast(e?.message || "Failed to load assessment", "error");
      setAssessment(null);
    }
  }, [assessmentId, showToast]);

  const loadCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      const data = await adminCoursesService.getCourses({ limit: 1000 });
      const list = Array.isArray(data) ? data : (data.results || data.data || []);
      setCourses(list);
    } catch (e: any) {
      showToast(e?.message || "Failed to load courses", "error");
    } finally {
      setLoadingCourses(false);
    }
  }, [showToast]);

  const loadQuestions = useCallback(async () => {
    if (!assessmentId || !config.clientId) return;
    try {
      const data = await adminAssessmentService.getQuestionsExportJson(
        config.clientId,
        assessmentId
      );
      setQuestionsData(data);
    } catch (e: any) {
      showToast(e?.message || "Failed to load questions", "error");
      setQuestionsData(null);
    }
  }, [assessmentId, showToast]);

  const loadSubmissions = useCallback(async () => {
    if (!assessmentId || !config.clientId) return;
    try {
      const data = await adminAssessmentService.getSubmissionsExportJson(
        config.clientId,
        assessmentId
      );
      setSubmissionsData(data);
    } catch (e: any) {
      showToast(e?.message || "Failed to load submissions", "error");
      setSubmissionsData(null);
    }
  }, [assessmentId, showToast]);

  useEffect(() => {
    if (!assessmentId) return;
    setLoading(true);
    (async () => {
      await loadAssessment();
      await loadCourses();
      await Promise.all([loadQuestions(), loadSubmissions()]);
    })().finally(() => setLoading(false));
  }, [assessmentId, loadAssessment, loadCourses, loadQuestions, loadSubmissions]);

  const handleSave = async () => {
    if (!assessmentId || !config.clientId || !assessment) return;
    if (!title.trim() || !instructions.trim()) {
      showToast("Title and instructions are required", "error");
      return;
    }
    if (durationMinutes < 1) {
      showToast("Duration must be at least 1 minute", "error");
      return;
    }
    if (isPaid && (!price || Number(price) <= 0)) {
      showToast("Please enter a valid price for paid assessment", "error");
      return;
    }
    try {
      setSaving(true);
      const payload: Partial<CreateAssessmentPayload> = {
        title: title.trim(),
        instructions: instructions.trim(),
        description: description.trim() || undefined,
        duration_minutes: durationMinutes,
        start_time: convertToIST(startTime),
        end_time: convertToIST(endTime),
        is_paid: isPaid,
        price: isPaid ? (price ? Number(price) : null) : null,
        currency: isPaid ? currency : undefined,
        is_active: isActive,
        proctoring_enabled: proctoringEnabled,
        course_ids: courseIds.length ? courseIds : undefined,
        colleges: colleges.length ? colleges : undefined,
      };
      Object.keys(payload).forEach((k) => {
        if ((payload as any)[k] === undefined) delete (payload as any)[k];
      });
      await adminAssessmentService.updateAssessment(
        config.clientId,
        assessmentId,
        payload
      );
      showToast("Assessment updated successfully", "success");
      await loadAssessment();
    } catch (e: any) {
      showToast(e?.message || "Failed to update assessment", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadQuestions = () => {
    if (!questionsData) return;
    const flat: Record<string, unknown>[] = [];
    for (const sec of questionsData.sections) {
      for (const q of sec.questions) {
        flat.push({
          section_id: sec.section_id,
          section_title: sec.section_title,
          section_type: sec.section_type,
          section_order: sec.order,
          id: q.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_option: q.correct_option,
          explanation: q.explanation ?? "",
          difficulty_level: q.difficulty_level ?? "",
          topic: q.topic ?? "",
          skills: q.skills ?? "",
        });
      }
    }
    const columns = [
      { key: "section_id" as const, header: "Section ID" },
      { key: "section_title" as const, header: "Section Title" },
      { key: "section_type" as const, header: "Section Type" },
      { key: "section_order" as const, header: "Section Order" },
      { key: "id" as const, header: "Question ID" },
      { key: "question_text" as const, header: "Question Text" },
      { key: "option_a" as const, header: "Option A" },
      { key: "option_b" as const, header: "Option B" },
      { key: "option_c" as const, header: "Option C" },
      { key: "option_d" as const, header: "Option D" },
      { key: "correct_option" as const, header: "Correct Option" },
      { key: "explanation" as const, header: "Explanation" },
      { key: "difficulty_level" as const, header: "Difficulty" },
      { key: "topic" as const, header: "Topic" },
      { key: "skills" as const, header: "Skills" },
    ];
    const csv = jsonToCsvRows(flat, columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assessment-${questionsData.assessment.slug || assessmentId}-questions.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Questions exported", "success");
  };

  const handleDownloadSubmissions = () => {
    if (!submissionsData) return;
    const subs = submissionsData.submissions;

    const sectionKeySet = new Set<string>();
    for (const s of subs) {
      if (s.section_wise_scores) {
        Object.keys(s.section_wise_scores).forEach((k) => sectionKeySet.add(k));
      }
      if (s.section_wise_max_scores) {
        Object.keys(s.section_wise_max_scores).forEach((k) =>
          sectionKeySet.add(k)
        );
      }
    }
    const sectionKeys = Array.from(sectionKeySet).sort();

    const baseColumns: { key: string; header: string }[] = [
      { key: "name", header: "Name" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Phone" },
      { key: "maximum_marks", header: "Maximum Marks" },
      { key: "overall_score", header: "Overall Score" },
      { key: "percentage", header: "Percentage" },
      { key: "total_questions", header: "Total Questions" },
      { key: "attempted_questions", header: "Attempted Questions" },
    ];
    const sectionColumns = sectionKeys.flatMap((k) => [
      { key: `section_wise_scores_${k}`, header: `Section-wise Scores-${k}` },
      {
        key: `section_wise_max_scores_${k}`,
        header: `Section-wise Max Scores-${k}`,
      },
    ]);
    const columns = [...baseColumns, ...sectionColumns];

    const rows: Record<string, unknown>[] = subs.map((s) => {
      const base: Record<string, unknown> = {
        name: s.name,
        email: s.email,
        phone: s.phone ?? "",
        maximum_marks: s.maximum_marks ?? "",
        overall_score: s.overall_score ?? "",
        percentage: s.percentage ?? "",
        total_questions: s.total_questions ?? "",
        attempted_questions: s.attempted_questions ?? "",
      };
      const sectionCells: Record<string, unknown> = {};
      for (const k of sectionKeys) {
        sectionCells[`section_wise_scores_${k}`] =
          s.section_wise_scores?.[k] ?? "";
        sectionCells[`section_wise_max_scores_${k}`] =
          s.section_wise_max_scores?.[k] ?? "";
      }
      return { ...base, ...sectionCells };
    });

    const csv = jsonToCsvRows(rows, columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assessment-${submissionsData.assessment.slug || assessmentId}-submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Submissions exported", "success");
  };

  const paginatedQuestions = useMemo(() => {
    if (!questionsData?.sections) return [];
    const all = questionsData.sections.flatMap((sec) =>
      sec.questions.map((q) => ({ section: sec, question: q }))
    );
    const start = (questionsPage - 1) * questionsLimit;
    return all.slice(start, start + questionsLimit);
  }, [questionsData, questionsPage, questionsLimit]);

  const totalQuestions = useMemo(() => {
    if (!questionsData?.sections) return 0;
    return questionsData.sections.reduce(
      (sum, s) => sum + s.questions.length,
      0
    );
  }, [questionsData]);

  const paginatedSubmissions = useMemo(() => {
    if (!submissionsData?.submissions) return [];
    const start = (submissionsPage - 1) * submissionsLimit;
    return submissionsData.submissions.slice(start, start + submissionsLimit);
  }, [submissionsData, submissionsPage, submissionsLimit]);

  const totalSubmissions = submissionsData?.submissions?.length ?? 0;

  useEffect(() => {
    setQuestionsPage(1);
    setSubmissionsPage(1);
  }, [tab]);

  if (loading) {
    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  if (!assessment) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <Typography color="text.secondary">Assessment not found</Typography>
          <Button
            sx={{ mt: 2 }}
            startIcon={<IconWrapper icon="mdi:arrow-left" size={18} />}
            onClick={() => router.push("/admin/assessment")}
          >
            Back to Assessments
          </Button>
        </Box>
      </MainLayout>
    );
  }

  const displayTitle = assessment.title || "Edit Assessment";

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Button
          startIcon={<IconWrapper icon="mdi:arrow-left" size={20} />}
          onClick={() => router.push("/admin/assessment")}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: "#111827",
            fontSize: { xs: "1.5rem", sm: "2rem" },
            mb: 3,
          }}
        >
          {displayTitle}
        </Typography>

        <Paper sx={{ borderRadius: 2, overflow: "hidden", boxShadow: 1 }}>
          <Tabs
            value={tab}
            onChange={(_, v: TabValue) => setTab(v)}
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              px: 2,
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600 },
            }}
          >
            <Tab value="details" label="Details" />
            <Tab value="questions" label="Questions" />
            <Tab value="submissions" label="Submissions" />
          </Tabs>

          <Box sx={{ p: { xs: 2, sm: 3 } }}>
            {tab === "details" && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <BasicInfoSection
                  title={title}
                  instructions={instructions}
                  description={description}
                  onTitleChange={setTitle}
                  onInstructionsChange={setInstructions}
                  onDescriptionChange={setDescription}
                />
                <Divider />
                <AssessmentSettingsSection
                  durationMinutes={durationMinutes}
                  startTime={startTime}
                  endTime={endTime}
                  isPaid={isPaid}
                  price={price}
                  currency={currency}
                  isActive={isActive}
                  courseIds={courseIds}
                  courses={courses}
                  loadingCourses={loadingCourses}
                  colleges={colleges}
                  proctoringEnabled={proctoringEnabled}
                  onDurationChange={setDurationMinutes}
                  onStartTimeChange={setStartTime}
                  onEndTimeChange={setEndTime}
                  onPaidChange={setIsPaid}
                  onPriceChange={setPrice}
                  onCurrencyChange={setCurrency}
                  onActiveChange={setIsActive}
                  onCourseIdsChange={setCourseIds}
                  onCollegesChange={setColleges}
                  onProctoringEnabledChange={setProctoringEnabled}
                />
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={
                      saving ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <IconWrapper icon="mdi:content-save" size={18} />
                      )
                    }
                    sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
                  >
                    {saving ? "Saving…" : "Save"}
                  </Button>
                </Box>
              </Box>
            )}

            {tab === "questions" && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Export questions · View and download table
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<IconWrapper icon="mdi:download" size={18} />}
                    onClick={handleDownloadQuestions}
                    disabled={!questionsData?.sections?.length}
                    sx={{
                      bgcolor: "#6366f1",
                      "&:hover": { bgcolor: "#4f46e5" },
                    }}
                  >
                    Download table
                  </Button>
                </Box>
                {!questionsData?.sections?.length ? (
                  <Typography color="text.secondary">
                    No questions to display.
                  </Typography>
                ) : (
                  <>
                    <TableContainer sx={{ maxHeight: 480, overflow: "auto" }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#f9fafb" }}>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Section
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Order
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              ID
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Question
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              A
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              B
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              C
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              D
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Correct
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Difficulty
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedQuestions.map(({ section: sec, question: q }) => (
                            <TableRow key={q.id} hover>
                              <TableCell sx={{ py: 1.5 }}>
                                {sec.section_title}
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>{sec.order}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{q.id}</TableCell>
                              <TableCell sx={{ maxWidth: 200, py: 1.5 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: 200,
                                  }}
                                  title={q.question_text}
                                >
                                  {q.question_text}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>{q.option_a}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{q.option_b}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{q.option_c}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{q.option_d}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {q.correct_option}
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {q.difficulty_level ?? "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {totalQuestions > 0 && (
                      <Box
                        sx={{
                          pt: 2,
                          borderTop: "1px solid #e5e7eb",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Showing {(questionsPage - 1) * questionsLimit + 1} to{" "}
                            {Math.min(
                              totalQuestions,
                              questionsPage * questionsLimit
                            )}{" "}
                            of {totalQuestions}
                          </Typography>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={questionsLimit}
                              onChange={(e) => {
                                setQuestionsLimit(Number(e.target.value));
                                setQuestionsPage(1);
                              }}
                            >
                              <MenuItem value={10}>10 per page</MenuItem>
                              <MenuItem value={25}>25 per page</MenuItem>
                              <MenuItem value={50}>50 per page</MenuItem>
                              <MenuItem value={100}>100 per page</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <Pagination
                          count={Math.ceil(totalQuestions / questionsLimit)}
                          page={questionsPage}
                          onChange={(_, v) => setQuestionsPage(v)}
                          color="primary"
                          size="small"
                          showFirstButton={false}
                          showLastButton={false}
                          boundaryCount={1}
                          siblingCount={0}
                          disabled={
                            Math.ceil(totalQuestions / questionsLimit) <= 1
                          }
                        />
                      </Box>
                    )}
                  </>
                )}
              </>
            )}

            {tab === "submissions" && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                    mb: 2,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Export submissions · View and download table
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<IconWrapper icon="mdi:download" size={18} />}
                    onClick={handleDownloadSubmissions}
                    disabled={!submissionsData?.submissions?.length}
                    sx={{
                      bgcolor: "#6366f1",
                      "&:hover": { bgcolor: "#4f46e5" },
                    }}
                  >
                    Download table
                  </Button>
                </Box>
                {!submissionsData?.submissions?.length ? (
                  <Typography color="text.secondary">
                    No submissions to display.
                  </Typography>
                ) : (
                  <>
                    <TableContainer sx={{ maxHeight: 480, overflow: "auto" }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={{ bgcolor: "#f9fafb" }}>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Name
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Email
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Phone
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Max Marks
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Score
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              %
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Attempted
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedSubmissions.map((s, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ py: 1.5 }}>{s.name}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{s.email}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {s.phone ?? "—"}
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {s.maximum_marks ?? "—"}
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {s.overall_score ?? "—"}
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {s.percentage ?? "—"}
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {s.attempted_questions ?? "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {totalSubmissions > 0 && (
                      <Box
                        sx={{
                          pt: 2,
                          borderTop: "1px solid #e5e7eb",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 2,
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Showing{" "}
                            {(submissionsPage - 1) * submissionsLimit + 1} to{" "}
                            {Math.min(
                              totalSubmissions,
                              submissionsPage * submissionsLimit
                            )}{" "}
                            of {totalSubmissions}
                          </Typography>
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                              value={submissionsLimit}
                              onChange={(e) => {
                                setSubmissionsLimit(Number(e.target.value));
                                setSubmissionsPage(1);
                              }}
                            >
                              <MenuItem value={10}>10 per page</MenuItem>
                              <MenuItem value={25}>25 per page</MenuItem>
                              <MenuItem value={50}>50 per page</MenuItem>
                              <MenuItem value={100}>100 per page</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <Pagination
                          count={Math.ceil(totalSubmissions / submissionsLimit)}
                          page={submissionsPage}
                          onChange={(_, v) => setSubmissionsPage(v)}
                          color="primary"
                          size="small"
                          showFirstButton={false}
                          showLastButton={false}
                          boundaryCount={1}
                          siblingCount={0}
                          disabled={
                            Math.ceil(
                              totalSubmissions / submissionsLimit
                            ) <= 1
                          }
                        />
                      </Box>
                    )}
                  </>
                )}
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
}
