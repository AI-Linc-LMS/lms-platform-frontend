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
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminAssessmentService,
  QuestionsExportResponse,
  SubmissionsExportResponse,
} from "@/lib/services/admin/admin-assessment.service";
import { config } from "@/lib/config";

type TabValue = "questions" | "submissions";

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

export default function AssessmentEditPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const assessmentId = Number(params.id);
  const [tab, setTab] = useState<TabValue>("questions");
  const [loading, setLoading] = useState(true);
  const [questionsData, setQuestionsData] =
    useState<QuestionsExportResponse | null>(null);
  const [submissionsData, setSubmissionsData] =
    useState<SubmissionsExportResponse | null>(null);
  
  // Pagination state for questions
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsLimit, setQuestionsLimit] = useState(10);
  
  // Pagination state for submissions
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsLimit, setSubmissionsLimit] = useState(10);

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
    const run = async () => {
      await Promise.all([loadQuestions(), loadSubmissions()]);
    };
    run().finally(() => setLoading(false));
  }, [assessmentId, loadQuestions, loadSubmissions]);

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
    const rows = submissionsData.submissions.map((s) => ({
      name: s.name,
      email: s.email,
      phone: s.phone ?? "",
      maximum_marks: s.maximum_marks ?? "",
      overall_score: s.overall_score ?? "",
      percentage: s.percentage ?? "",
      total_questions: s.total_questions ?? "",
      attempted_questions: s.attempted_questions ?? "",
      section_wise_scores:
        s.section_wise_scores != null
          ? JSON.stringify(s.section_wise_scores)
          : "",
      section_wise_max_scores:
        s.section_wise_max_scores != null
          ? JSON.stringify(s.section_wise_max_scores)
          : "",
    })) as Record<string, unknown>[];
    const columns = [
      { key: "name" as const, header: "Name" },
      { key: "email" as const, header: "Email" },
      { key: "phone" as const, header: "Phone" },
      { key: "maximum_marks" as const, header: "Maximum Marks" },
      { key: "overall_score" as const, header: "Overall Score" },
      { key: "percentage" as const, header: "Percentage" },
      { key: "total_questions" as const, header: "Total Questions" },
      { key: "attempted_questions" as const, header: "Attempted Questions" },
      { key: "section_wise_scores" as const, header: "Section-wise Scores" },
      { key: "section_wise_max_scores" as const, header: "Section-wise Max Scores" },
    ];
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

  // Calculate paginated questions data
  const paginatedQuestions = useMemo(() => {
    if (!questionsData?.sections) return [];
    const allQuestions = questionsData.sections.flatMap((sec) =>
      sec.questions.map((q) => ({ section: sec, question: q }))
    );
    const startIndex = (questionsPage - 1) * questionsLimit;
    const endIndex = startIndex + questionsLimit;
    return allQuestions.slice(startIndex, endIndex);
  }, [questionsData, questionsPage, questionsLimit]);

  const totalQuestions = useMemo(() => {
    if (!questionsData?.sections) return 0;
    return questionsData.sections.reduce((sum, sec) => sum + sec.questions.length, 0);
  }, [questionsData]);

  // Calculate paginated submissions data
  const paginatedSubmissions = useMemo(() => {
    if (!submissionsData?.submissions) return [];
    const startIndex = (submissionsPage - 1) * submissionsLimit;
    const endIndex = startIndex + submissionsLimit;
    return submissionsData.submissions.slice(startIndex, endIndex);
  }, [submissionsData, submissionsPage, submissionsLimit]);

  const totalSubmissions = useMemo(() => {
    return submissionsData?.submissions?.length ?? 0;
  }, [submissionsData]);

  // Reset pagination when switching tabs
  useEffect(() => {
    setQuestionsPage(1);
    setSubmissionsPage(1);
  }, [tab]);

  const title =
    questionsData?.assessment?.title ??
    submissionsData?.assessment?.title ??
    "Assessment";

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
          {title}
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
            <Tab value="questions" label="Questions" />
            <Tab value="submissions" label="Submissions" />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {tab === "questions" && (
              <>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    mb: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<IconWrapper icon="mdi:download" size={18} />}
                    onClick={handleDownloadQuestions}
                    disabled={!questionsData?.sections?.length}
                    sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
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
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Section</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Order</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>ID</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Question</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>A</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>B</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>C</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>D</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Correct</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Difficulty</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedQuestions.map(({ section: sec, question: q }) => (
                            <TableRow key={q.id} hover>
                              <TableCell sx={{ py: 1.5 }}>{sec.section_title}</TableCell>
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
                              <TableCell sx={{ py: 1.5 }}>{q.correct_option}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{q.difficulty_level ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {totalQuestions > 0 && (
                      <Box
                        sx={{
                          p: 2,
                          borderTop: "1px solid #e5e7eb",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexDirection: { xs: "column", sm: "row" },
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>
                            Showing {(questionsPage - 1) * questionsLimit + 1} to{" "}
                            {Math.min(totalQuestions, questionsPage * questionsLimit)} of{" "}
                            {totalQuestions} questions
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
                          onChange={(_, value) => setQuestionsPage(value)}
                          color="primary"
                          size="small"
                          showFirstButton={false}
                          showLastButton={false}
                          boundaryCount={1}
                          siblingCount={0}
                          disabled={Math.ceil(totalQuestions / questionsLimit) <= 1}
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
                    justifyContent: "flex-end",
                    mb: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<IconWrapper icon="mdi:download" size={18} />}
                    onClick={handleDownloadSubmissions}
                    disabled={!submissionsData?.submissions?.length}
                    sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
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
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Email</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Phone</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Max Marks</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Score</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>%</TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>Attempted</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedSubmissions.map((s, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ py: 1.5 }}>{s.name}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{s.email}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{s.phone ?? "—"}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{s.maximum_marks ?? "—"}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{s.overall_score ?? "—"}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{s.percentage ?? "—"}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{s.attempted_questions ?? "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    {totalSubmissions > 0 && (
                      <Box
                        sx={{
                          p: 2,
                          borderTop: "1px solid #e5e7eb",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexDirection: { xs: "column", sm: "row" },
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography variant="body2" sx={{ color: "#6b7280" }}>
                            Showing {(submissionsPage - 1) * submissionsLimit + 1} to{" "}
                            {Math.min(totalSubmissions, submissionsPage * submissionsLimit)} of{" "}
                            {totalSubmissions} submissions
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
                          onChange={(_, value) => setSubmissionsPage(value)}
                          color="primary"
                          size="small"
                          showFirstButton={false}
                          showLastButton={false}
                          boundaryCount={1}
                          siblingCount={0}
                          disabled={Math.ceil(totalSubmissions / submissionsLimit) <= 1}
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
