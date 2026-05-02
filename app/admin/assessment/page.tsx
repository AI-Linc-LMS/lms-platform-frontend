"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
  useTheme,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminAssessmentService,
  Assessment,
  isMCQQuestion,
  isCodingQuestion,
  isSubjectiveQuestion,
} from "@/lib/services/admin/admin-assessment.service";
import { useAuth } from "@/lib/auth/auth-context";
import { isCourseManagerRole } from "@/lib/auth/auth-utils";
import {
  adminAssessmentEmailJobsService,
  AssessmentEmailJob,
} from "@/lib/services/admin/admin-assessment-email-jobs.service";
import { config } from "@/lib/config";
import { AssessmentTable } from "@/components/admin/assessment/AssessmentTable";
import { AssessmentPagination } from "@/components/admin/assessment/AssessmentPagination";

export default function AssessmentPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const router = useRouter();
  const theme = useTheme();
  const rtl = theme.direction === "rtl";
  const { user } = useAuth();
  const isCourseManager = isCourseManagerRole(user?.role);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [exportingSubmissionsId, setExportingSubmissionsId] = useState<
    number | null
  >(null);
  const [exportingQuestionsId, setExportingQuestionsId] = useState<
    number | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [triggeringEmailJobId, setTriggeringEmailJobId] = useState<number | null>(null);
  const [emailTriggerDialogOpen, setEmailTriggerDialogOpen] = useState(false);
  const [assessmentToTriggerEmail, setAssessmentToTriggerEmail] = useState<Assessment | null>(null);
  const [assessmentEmailJobMap, setAssessmentEmailJobMap] = useState<
    Record<number, { task_id: string; status: string }>
  >({});
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [assessmentToDuplicate, setAssessmentToDuplicate] = useState<Assessment | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [draftFilter, setDraftFilter] = useState<"all" | "draft" | "live">("all");
  const [proctoringFilter, setProctoringFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [paidFilter, setPaidFilter] = useState<"all" | "paid" | "free">("all");
  const [evaluationFilter, setEvaluationFilter] = useState<"all" | "manual" | "auto">("all");

  useEffect(() => {
    loadAssessments();
  }, []);

  useEffect(() => {
    loadAssessmentEmailJobs();
  }, []);

  const loadAssessmentEmailJobs = async () => {
    try {
      const jobs = await adminAssessmentEmailJobsService.getAssessmentEmailJobs(
        config.clientId
      );
      const map: Record<number, { task_id: string; status: string }> = {};
      (jobs as AssessmentEmailJob[]).forEach((job) => {
        const aid = job.assessment_id;
        if (aid != null) {
          map[aid] = { task_id: job.task_id, status: job.status || "" };
        }
      });
      setAssessmentEmailJobMap(map);
    } catch {
      setAssessmentEmailJobMap({});
    }
  };

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const data = await adminAssessmentService.getAssessments(config.clientId);
      setAssessments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      showToast(error?.message || "Failed to load assessments", "error");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to escape CSV values
  const escapeCsv = (val: unknown): string => {
    if (val == null || val === undefined) return "";
    const s = String(typeof val === "object" ? JSON.stringify(val) : val);
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r"))
      return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  function formatDateForDisplay(dateTimeString: string | null | undefined): string {
    if (!dateTimeString?.trim()) return "";
    try {
      const d = new Date(dateTimeString.trim());
      if (isNaN(d.getTime())) return dateTimeString?.trim() ?? "";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hr = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      const sec = String(d.getSeconds()).padStart(2, "0");
      return `${day}/${month}/${year} ${hr}:${min}:${sec}`;
    } catch {
      return "";
    }
  }
  

  // Helper function to convert rows to CSV with specific columns
  const jsonToCsvRows = <T extends Record<string, unknown>>(
    rows: T[],
    columns: { key: keyof T; header: string }[]
  ): string => {
    if (!rows.length) return "";
    const header = columns.map((c) => escapeCsv(c.header)).join(",");
    const data = rows.map((row) =>
      columns.map((c) => escapeCsv(row[c.key])).join(",")
    );
    return [header, ...data].join("\n");
  };

  /** Convert HTML to plain text for CSV (match edit page) */
  const htmlToPlainText = (html: string): string => {
    if (!html || typeof html !== "string") return "";
    let s = html;
    s = s.replace(/<\/p>\s*<p>/gi, "\n");
    s = s.replace(/<br\s*\/?>/gi, "\n");
    s = s.replace(/<sup>(\d+)<\/sup>/gi, "^$1");
    s = s.replace(/<sub>(\d+)<\/sub>/gi, "_$1");
    s = s.replace(/&le;/g, "≤").replace(/&ge;/g, "≥");
    s = s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ");
    s = s.replace(/<[^>]*>/g, " ");
    s = s.replace(/[ \t]+/g, " ");
    s = s.replace(/^\s+|\s+$/gm, "");
    s = s.replace(/\n\s*\n/g, "\n").trim();
    return s;
  };

  const downloadCsv = (csv: string, filename: string) => {
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSubmissions = async (assessment: Assessment) => {
    try {
      setExportingSubmissionsId(assessment.id);
      const data = await adminAssessmentService.getSubmissionsExportJson(
        config.clientId,
        assessment.id
      );

      // Collect all unique section keys from section_wise_scores / section_wise_max_scores
      const sectionKeySet = new Set<string>();
      for (const s of data.submissions) {
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
        { key: "started_at", header: "Started At" },
        { key: "submitted_at", header: "Submitted At" },
        { key: "maximum_marks", header: "Maximum Marks" },
        { key: "overall_score", header: "Overall Score" },
        { key: "percentage", header: "Percentage" },
        { key: "total_questions", header: "Total Questions" },
        { key: "attempted_questions", header: "Attempted Questions" },
        { key: "tab_switches_count", header: "Tab Switches Count" },
        { key: "face_violations_count", header: "Face Violations Count" },
        { key: "fullscreen_exits_count", header: "Fullscreen Exits Count" },
        { key: "face_validation_failures_count", header: "Face Validation Failures Count" },
        { key: "multiple_face_detections_count", header: "Multiple Face Detections Count" },
        { key: "total_violation_count", header: "Total Violation Count" },
      ];
      const sectionColumns = sectionKeys.flatMap((k) => [
        { key: `section_wise_scores_${k}`, header: `Section-wise Scores-${k}` },
        {
          key: `section_wise_max_scores_${k}`,
          header: `Section-wise Max Scores-${k}`,
        },
      ]);
      const columns = [...baseColumns, ...sectionColumns];

      const rows: Record<string, unknown>[] = data.submissions.map((s) => {
        const pd = s.proctoring;
        const base: Record<string, unknown> = {
          name: s.name ?? "",
        email: s.email ?? "",
        phone: s.phone ?? "",
        started_at: formatDateForDisplay(s.started_at) || "",
        submitted_at: formatDateForDisplay(s.submitted_at) || "",
        maximum_marks: s.maximum_marks ?? "",
        overall_score: s.overall_score ?? "",
        percentage: s.percentage??"",
        total_questions: s.total_questions ?? "",
        attempted_questions: s.attempted_questions ?? "",
        tab_switches_count: pd?.tab_switches_count ?? 0,
        face_violations_count: pd?.face_violations_count ?? 0,
        fullscreen_exits_count: pd?.fullscreen_exits_count ?? 0,
        face_validation_failures_count: pd?.face_validation_failures_count ?? 0,
        multiple_face_detections_count: pd?.multiple_face_detections_count ?? 0,
        total_violation_count: pd?.total_violation_count ?? 0,
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
      a.download = `assessment-${data.assessment.slug || assessment.id}-submissions.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Submissions exported successfully", "success");
    } catch (error: any) {
      showToast(
        error?.message || "Failed to export submissions",
        "error"
      );
    } finally {
      setExportingSubmissionsId(null);
    }
  };

  const handleExportQuestions = async (assessment: Assessment) => {
    try {
      setExportingQuestionsId(assessment.id);
      const data = await adminAssessmentService.getQuestionsExportJson(
        config.clientId,
        assessment.id
      );

      const baseSlug = data.assessment.slug || String(assessment.id);

      // MCQ rows (same format as edit page)
      const mcqFlat: Record<string, unknown>[] = [];
      const codingFlat: Record<string, unknown>[] = [];
      const writtenFlat: Record<string, unknown>[] = [];
      for (const sec of data.sections) {
        for (const q of sec.questions) {
          if (isMCQQuestion(q)) {
            mcqFlat.push({
              section_id: sec.section_id,
              section_title: sec.section_title,
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
          } else if (isCodingQuestion(q)) {
            const ps = typeof q.problem_statement === "string" ? q.problem_statement : "";
            const inp = typeof q.input_format === "string" ? q.input_format : "";
            const out = typeof q.output_format === "string" ? q.output_format : "";
            const con = typeof q.constraints === "string" ? q.constraints : "";
            codingFlat.push({
              section_id: sec.section_id,
              section_title: sec.section_title,
              section_order: sec.order,
              id: q.id,
              title: q.title ?? "",
              problem_statement: htmlToPlainText(ps),
              input_format: htmlToPlainText(inp),
              output_format: htmlToPlainText(out),
              sample_input: q.sample_input ?? "",
              sample_output: q.sample_output ?? "",
              constraints: htmlToPlainText(con),
              difficulty_level: q.difficulty_level ?? "",
              tags: q.tags ?? "",
              time_limit: q.time_limit ?? "",
              memory_limit: q.memory_limit ?? "",
            });
          } else if (isSubjectiveQuestion(q)) {
            writtenFlat.push({
              section_id: sec.section_id,
              section_title: sec.section_title,
              section_order: sec.order,
              id: q.id,
              question_text: q.question_text,
              evaluation_prompt: q.evaluation_prompt,
              max_marks: q.max_marks,
              question_type: q.question_type ?? "",
              answer_mode: q.answer_mode ?? "text",
            });
          }
        }
      }

      const mcqColumns: { key: string; header: string }[] = [
        { key: "section_id", header: "Section ID" },
        { key: "section_title", header: "Section Title" },
        { key: "section_order", header: "Section Order" },
        { key: "id", header: "Question ID" },
        { key: "question_text", header: "Question Text" },
        { key: "option_a", header: "Option A" },
        { key: "option_b", header: "Option B" },
        { key: "option_c", header: "Option C" },
        { key: "option_d", header: "Option D" },
        { key: "correct_option", header: "Correct Option" },
        { key: "explanation", header: "Explanation" },
        { key: "difficulty_level", header: "Difficulty" },
        { key: "topic", header: "Topic" },
        { key: "skills", header: "Skills" },
      ];
      const codingColumns: { key: string; header: string }[] = [
        { key: "section_id", header: "Section ID" },
        { key: "section_title", header: "Section Title" },
        { key: "section_order", header: "Section Order" },
        { key: "id", header: "Question ID" },
        { key: "title", header: "Title" },
        { key: "problem_statement", header: "Problem Statement" },
        { key: "input_format", header: "Input Format" },
        { key: "output_format", header: "Output Format" },
        { key: "sample_input", header: "Sample Input" },
        { key: "sample_output", header: "Sample Output" },
        { key: "constraints", header: "Constraints" },
        { key: "difficulty_level", header: "Difficulty" },
        { key: "tags", header: "Tags" },
        { key: "time_limit", header: "Time Limit (sec)" },
        { key: "memory_limit", header: "Memory Limit (MB)" },
      ];
      const writtenColumns: { key: string; header: string }[] = [
        { key: "section_id", header: "Section ID" },
        { key: "section_title", header: "Section Title" },
        { key: "section_order", header: "Section Order" },
        { key: "id", header: "Question ID" },
        { key: "question_text", header: "Question Text" },
        { key: "evaluation_prompt", header: "Evaluation Prompt" },
        { key: "max_marks", header: "Max Marks" },
        { key: "question_type", header: "Question Type" },
        { key: "answer_mode", header: "Answer Mode" },
      ];

      const downloads: Array<() => void> = [];
      if (mcqFlat.length > 0) {
        downloads.push(() =>
          downloadCsv(
            jsonToCsvRows(mcqFlat, mcqColumns),
            `assessment-${baseSlug}-mcq-questions.csv`
          )
        );
      }
      if (codingFlat.length > 0) {
        downloads.push(() =>
          downloadCsv(
            jsonToCsvRows(codingFlat, codingColumns),
            `assessment-${baseSlug}-coding-questions.csv`
          )
        );
      }
      if (writtenFlat.length > 0) {
        downloads.push(() =>
          downloadCsv(
            jsonToCsvRows(writtenFlat, writtenColumns),
            `assessment-${baseSlug}-written-questions.csv`
          )
        );
      }
      downloads.forEach((fn, i) => {
        setTimeout(fn, i * 120);
      });

      const fileCount = downloads.length;
      const typeSummary =
        fileCount === 3
          ? "MCQ, coding, and written questions exported (3 files)"
          : fileCount === 2
            ? "Questions exported (2 files)"
            : fileCount === 1
              ? "Questions exported successfully"
              : "No questions to export";
      showToast(typeSummary, fileCount > 0 ? "success" : "info");
    } catch (error: any) {
      showToast(
        error?.message || t("admin.assessment.failedToExportQuestions"),
        "error"
      );
    } finally {
      setExportingQuestionsId(null);
    }
  };

  const buildEmailSubject = (assessment: Assessment) =>
    `Important Notification - ${assessment.title}`;

  const buildEmailBody = (assessment: Assessment) => {
    const baseUrl =
      typeof window !== "undefined" ? window.location.origin : "";
    const link = `${baseUrl}/assessments/${assessment.slug}`;
    const assessmentDetail = assessment as Assessment & {
      start_time?: string | null;
      end_time?: string | null;
    };
    const formatDateTime = (s: string | undefined | null) => {
      if (!s) return "";
      try {
        const d = new Date(s);
        return isNaN(d.getTime()) ? "" : d.toLocaleString();
      } catch {
        return "";
      }
    };
    const startTime = formatDateTime(assessmentDetail.start_time);
    const endTime = formatDateTime(assessmentDetail.end_time);
    const duration = assessment.duration_minutes
      ? `${assessment.duration_minutes} minutes`
      : "";

    const lines: string[] = [
      `<strong>Assessment:</strong> ${assessment.title}`,
      ...(duration ? [`<strong>Duration:</strong> ${duration}`] : []),
      ...(startTime ? [`<strong>Start time:</strong> ${startTime}`] : []),
      ...(endTime ? [`<strong>End time:</strong> ${endTime}`] : []),
    ];

    return `
      <p>Dear {name},</p>
      
      <p>All set! Your assessment details are below—good luck 👍.</p>
      
      <p>
        ${lines.join("<br>\n        ")}
      </p>
      
      <p>
        <a href="${link}"><strong>Click here to take the assessment</strong></a>
      </p>
      
      <p>Best regards,<br></p>
      `;
  };

  const handleOpenEmailTriggerDialog = (assessment: Assessment): Promise<void> => {
    setAssessmentToTriggerEmail(assessment);
    setEmailTriggerDialogOpen(true);
    return Promise.resolve();
  };

  const handleCloseEmailTriggerDialog = () => {
    if (!triggeringEmailJobId) {
      setEmailTriggerDialogOpen(false);
      setAssessmentToTriggerEmail(null);
    }
  };

  const handleConfirmTriggerEmailJob = async () => {
    if (!assessmentToTriggerEmail) return;
    try {
      setTriggeringEmailJobId(assessmentToTriggerEmail.id);
      const result = await adminAssessmentEmailJobsService.createAssessmentEmailJob(
        config.clientId,
        {
          assessment_id: assessmentToTriggerEmail.id,
          subject: buildEmailSubject(assessmentToTriggerEmail),
          email_body: buildEmailBody(assessmentToTriggerEmail),
        }
      );
      showToast("Email job triggered. Redirecting to status...", "success");
      setEmailTriggerDialogOpen(false);
      setAssessmentToTriggerEmail(null);
      loadAssessmentEmailJobs();
      if (result?.task_id) {
        router.push(`/admin/emails/assessment/${encodeURIComponent(result.task_id)}`);
      }
    } catch (error: unknown) {
      showToast((error as Error)?.message || "Failed to trigger email job", "error");
    } finally {
      setTriggeringEmailJobId(null);
    }
  };

  const handleDeleteClick = (assessment: Assessment) => {
    setAssessmentToDelete(assessment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    if (!deleting) {
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!assessmentToDelete || !config.clientId) return;
    try {
      setDeleting(true);
      await adminAssessmentService.deleteAssessment(config.clientId, assessmentToDelete.id);
      showToast("Assessment deleted successfully", "success");
      setDeleteDialogOpen(false);
      setAssessmentToDelete(null);
      loadAssessments();
    } catch (error: any) {
      showToast(error?.message || "Failed to delete assessment", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicateClick = async (assessment: Assessment): Promise<void> => {
    setAssessmentToDuplicate(assessment);
    setDuplicateDialogOpen(true);
  };

  const handleDuplicateDialogClose = () => {
    if (!duplicatingId) {
      setDuplicateDialogOpen(false);
      setAssessmentToDuplicate(null);
    }
  };

  const handleDuplicateConfirm = async () => {
    if (!assessmentToDuplicate || !config.clientId) return;
    try {
      setDuplicatingId(assessmentToDuplicate.id);
      const duplicatedAssessment = await adminAssessmentService.duplicateAssessment(
        config.clientId,
        assessmentToDuplicate.id
      );
      showToast(
        t("admin.assessment.duplicateSuccess", { title: duplicatedAssessment.title }),
        "success"
      );
      setDuplicateDialogOpen(false);
      setAssessmentToDuplicate(null);
      loadAssessments();
    } catch (error: any) {
      showToast(error?.message || t("admin.assessment.failedToDuplicate"), "error");
    } finally {
      setDuplicatingId(null);
    }
  };

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      // Search filter (title, courses)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle =
          assessment.title.toLowerCase().includes(query) ||
          assessment.slug.toLowerCase().includes(query) ||
          assessment.description?.toLowerCase().includes(query);
        
        const matchesCourses = assessment.courses?.some(
          (course) => course.title.toLowerCase().includes(query)
        ) || false;

        if (!matchesTitle && !matchesCourses) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !assessment.is_active) return false;
        if (statusFilter === "inactive" && assessment.is_active) return false;
      }

      if (draftFilter === "draft" && !assessment.is_draft) return false;
      if (draftFilter === "live" && assessment.is_draft) return false;

      // Proctoring filter
      if (proctoringFilter !== "all") {
        if (proctoringFilter === "enabled" && !assessment.proctoring_enabled) return false;
        if (proctoringFilter === "disabled" && assessment.proctoring_enabled) return false;
      }

      // Paid filter
      if (paidFilter !== "all") {
        if (paidFilter === "paid" && !assessment.is_paid) return false;
        if (paidFilter === "free" && assessment.is_paid) return false;
      }

      // Manual vs auto evaluation (API default is auto when omitted)
      if (evaluationFilter !== "all") {
        const mode = assessment.evaluation_mode ?? "auto";
        if (evaluationFilter === "manual" && mode !== "manual") return false;
        if (evaluationFilter === "auto" && mode !== "auto") return false;
      }

      return true;
    });
  }, [assessments, searchQuery, statusFilter, draftFilter, proctoringFilter, paidFilter, evaluationFilter]);

  // Client-side pagination
  const paginatedAssessments = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredAssessments.slice(startIndex, endIndex);
  }, [filteredAssessments, page, limit]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, draftFilter, proctoringFilter, paidFilter, evaluationFilter]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDraftFilter("all");
    setProctoringFilter("all");
    setPaidFilter("all");
    setEvaluationFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    draftFilter !== "all" ||
    proctoringFilter !== "all" ||
    paidFilter !== "all" ||
    evaluationFilter !== "all";

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 4,
            flexDirection: { xs: "column", sm: rtl ? "row-reverse" : "row" },
            gap: 3,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "var(--font-primary)",
                fontSize: { xs: "1.5rem", sm: "2rem" },
                mb: 0.5,
                background:
                  "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-purple) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("admin.assessment.title")}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "var(--font-secondary)",
                fontSize: "0.875rem",
                mt: 0.5,
              }}
            >
              {t("admin.assessment.subtitle")}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:plus" size={20} />}
            onClick={() => router.push("/admin/assessment/create")}
            disabled={
              isCourseManager ||
              (!!user &&
                typeof user.role === "string" &&
                ["content manager", "content_manager"].includes(
                  user.role.toLowerCase().replace(/\s+/g, " ")
                ))
            }
            fullWidth={false}
            sx={{
              bgcolor: "var(--accent-indigo)",
              color: "var(--font-light)",
              fontWeight: 600,
              px: { xs: 2, sm: 3 },
              py: 1.25,
              borderRadius: 2,
              width: { xs: "100%", sm: "auto" },
              boxShadow:
                "0 4px 6px -1px color-mix(in srgb, var(--accent-indigo) 30%, transparent)",
              "&:hover": {
                bgcolor: "var(--accent-indigo-dark)",
                boxShadow:
                  "0 10px 15px -3px color-mix(in srgb, var(--accent-indigo) 40%, transparent)",
                transform: { xs: "none", sm: "translateY(-1px)" },
              },
              transition: "all 0.2s ease",
            }}
          >
            {t("admin.assessment.createAssessment")}
          </Button>
        </Box>

        {/* Filters */}
        <Paper
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: 2,
            boxShadow:
              "0 1px 3px color-mix(in srgb, var(--font-primary) 12%, transparent)",
            border: "1px solid var(--border-default)",
            backgroundColor: "var(--card-bg)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "stretch",
              direction: rtl ? "rtl" : "ltr",
            }}
          >
            <TextField
              placeholder={t("admin.assessment.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconWrapper icon="mdi:magnify" size={20} color="var(--font-tertiary)" />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: "1 1 280px",
                minWidth: { xs: "100%", sm: 220 },
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "var(--card-bg)",
                },
              }}
              fullWidth
            />

            <FormControl sx={{ flex: "1 1 160px", minWidth: 140 }} fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | "active" | "inactive")
                }
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ flex: "1 1 160px", minWidth: 140 }} fullWidth>
              <InputLabel>Authoring</InputLabel>
              <Select
                value={draftFilter}
                label="Authoring"
                onChange={(e) =>
                  setDraftFilter(e.target.value as "all" | "draft" | "live")
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="draft">Draft only</MenuItem>
                <MenuItem value="live">Published only</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ flex: "1 1 160px", minWidth: 140 }} fullWidth>
              <InputLabel>Proctoring</InputLabel>
              <Select
                value={proctoringFilter}
                label="Proctoring"
                onChange={(e) =>
                  setProctoringFilter(
                    e.target.value as "all" | "enabled" | "disabled"
                  )
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="enabled">Enabled</MenuItem>
                <MenuItem value="disabled">Disabled</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ flex: "1 1 160px", minWidth: 140 }} fullWidth>
              <InputLabel>Payment</InputLabel>
              <Select
                value={paidFilter}
                label="Payment"
                onChange={(e) =>
                  setPaidFilter(e.target.value as "all" | "paid" | "free")
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="paid">Paid</MenuItem>
                <MenuItem value="free">Free</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ flex: "1 1 180px", minWidth: 160 }} fullWidth>
              <InputLabel id="admin-assessment-eval-filter-label">
                {t("admin.assessment.filterEvaluation")}
              </InputLabel>
              <Select
                labelId="admin-assessment-eval-filter-label"
                value={evaluationFilter}
                label={t("admin.assessment.filterEvaluation")}
                onChange={(e) =>
                  setEvaluationFilter(e.target.value as "all" | "manual" | "auto")
                }
              >
                <MenuItem value="all">{t("admin.assessment.filterEvaluationAll")}</MenuItem>
                <MenuItem value="manual">{t("admin.assessment.filterEvaluationManual")}</MenuItem>
                <MenuItem value="auto">{t("admin.assessment.filterEvaluationAuto")}</MenuItem>
              </Select>
            </FormControl>

            {hasActiveFilters && (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<IconWrapper icon="mdi:close" size={18} />}
                sx={{
                  flex: "0 0 auto",
                  alignSelf: "center",
                  borderColor: "var(--border-default)",
                  color: "var(--font-secondary)",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    borderColor:
                      "color-mix(in srgb, var(--font-secondary) 34%, var(--border-default) 66%)",
                    backgroundColor: "var(--surface)",
                  },
                }}
              >
                Clear
              </Button>
            )}
          </Box>

          {/* Active filters display */}
          {hasActiveFilters && (
            <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Typography variant="caption" sx={{ color: "var(--font-secondary)", mr: 1, alignSelf: "center" }}>
                Active filters:
              </Typography>
              {searchQuery && (
                <Chip
                  label={`Search: "${searchQuery}"`}
                  size="small"
                  onDelete={() => setSearchQuery("")}
                  sx={{
                    bgcolor:
                      "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
                    color: "var(--accent-indigo)",
                  }}
                />
              )}
              {statusFilter !== "all" && (
                <Chip
                  label={`Status: ${statusFilter}`}
                  size="small"
                  onDelete={() => setStatusFilter("all")}
                  sx={{
                    bgcolor:
                      "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
                    color: "var(--accent-indigo)",
                  }}
                />
              )}
              {draftFilter !== "all" && (
                <Chip
                  label={draftFilter === "draft" ? "Authoring: draft" : "Authoring: published"}
                  size="small"
                  onDelete={() => setDraftFilter("all")}
                  sx={{
                    bgcolor:
                      "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
                    color: "var(--accent-indigo)",
                  }}
                />
              )}
              {proctoringFilter !== "all" && (
                <Chip
                  label={`Proctoring: ${proctoringFilter}`}
                  size="small"
                  onDelete={() => setProctoringFilter("all")}
                  sx={{
                    bgcolor:
                      "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
                    color: "var(--accent-indigo)",
                  }}
                />
              )}
              {paidFilter !== "all" && (
                <Chip
                  label={`Payment: ${paidFilter}`}
                  size="small"
                  onDelete={() => setPaidFilter("all")}
                  sx={{
                    bgcolor:
                      "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
                    color: "var(--accent-indigo)",
                  }}
                />
              )}
              {evaluationFilter !== "all" && (
                <Chip
                  label={
                    evaluationFilter === "manual"
                      ? t("admin.assessment.filterEvaluationManual")
                      : t("admin.assessment.filterEvaluationAuto")
                  }
                  size="small"
                  onDelete={() => setEvaluationFilter("all")}
                  sx={{
                    bgcolor:
                      "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
                    color: "var(--accent-indigo)",
                  }}
                />
              )}
            </Box>
          )}

          {/* Results count */}
          {hasActiveFilters && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
                Showing {filteredAssessments.length} of {assessments.length} assessments
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Table */}
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: 400,
            }}
          >
            <CircularProgress size={48} sx={{ color: "var(--accent-indigo)" }} />
          </Box>
        ) : (
          <Paper
            sx={{
              borderRadius: 3,
              boxShadow:
                "0 1px 3px color-mix(in srgb, var(--font-primary) 12%, transparent), 0 1px 2px color-mix(in srgb, var(--font-primary) 10%, transparent)",
              overflow: "hidden",
              border: "1px solid var(--border-default)",
              backgroundColor: "var(--card-bg)",
            }}
          >
            <AssessmentTable
              assessments={paginatedAssessments}
              assessmentEmailJobMap={assessmentEmailJobMap}
              actionsReadOnly={isCourseManager}
              onEdit={(id) => {
                const row = paginatedAssessments.find((a) => a.id === id);
                if (!isCourseManager && row?.is_draft) {
                  router.push(`/admin/assessment/${id}/build`);
                  return;
                }
                router.push(
                  isCourseManager
                    ? `/admin/assessment/${id}/edit?readonly=1`
                    : `/admin/assessment/${id}/edit`
                );
              }}
              onDelete={isCourseManager ? undefined : handleDeleteClick}
              onTriggerEmailJob={
                isCourseManager ? undefined : handleOpenEmailTriggerDialog
              }
              onExportSubmissions={handleExportSubmissions}
              onExportQuestions={handleExportQuestions}
              onDuplicate={isCourseManager ? undefined : handleDuplicateClick}
              exportingSubmissionsId={exportingSubmissionsId}
              exportingQuestionsId={exportingQuestionsId}
              deletingId={deleting && assessmentToDelete ? assessmentToDelete.id : null}
              triggeringEmailJobId={triggeringEmailJobId}
              duplicatingId={duplicatingId}
            />
            {filteredAssessments.length > 0 && (
              <AssessmentPagination
                totalCount={filteredAssessments.length}
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={setLimit}
              />
            )}
          </Paper>
        )}

        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteDialogClose}
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 360,
            },
          }}
        >
          <DialogTitle id="delete-dialog-title" sx={{ fontWeight: 600 }}>
            Delete assessment?
          </DialogTitle>
          <DialogContent>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This action cannot be undone.
            </Alert>
            <DialogContentText id="delete-dialog-description">
              {assessmentToDelete ? (
                <>
                  Permanently delete &quot;{assessmentToDelete.title}&quot;? All
                  associated data will be removed.
                </>
              ) : null}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleDeleteDialogClose}
              disabled={deleting}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              variant="contained"
              color="error"
              autoFocus
              startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={emailTriggerDialogOpen}
          onClose={handleCloseEmailTriggerDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2, minWidth: 400 },
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            Trigger Email Job
          </DialogTitle>
          <DialogContent>
            {assessmentToTriggerEmail && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <DialogContentText>
                  Send notification emails to students for this assessment. Review the details below.
                </DialogContentText>
                <Box>
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 600 }}>
                    Subject
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, bgcolor: "var(--surface)", borderRadius: 1 }}>
                    {buildEmailSubject(assessmentToTriggerEmail)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 600 }}>
                    Email content preview
                  </Typography>
                  <Box
                    sx={{
                      mt: 0.5,
                      p: 2,
                      bgcolor: "var(--surface)",
                      borderRadius: 1,
                      maxHeight: 200,
                      overflow: "auto",
                      fontSize: "0.875rem",
                      "& a": { color: "var(--accent-indigo)" },
                    }}
                    dangerouslySetInnerHTML={{
                      __html: buildEmailBody(assessmentToTriggerEmail).replace(/\{name\}/g, "[Recipient Name]"),
                    }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Are you sure you want to send this notification?
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCloseEmailTriggerDialog}
              disabled={!!triggeringEmailJobId}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTriggerEmailJob}
              disabled={!!triggeringEmailJobId}
              variant="contained"
              startIcon={
                triggeringEmailJobId && assessmentToTriggerEmail && triggeringEmailJobId === assessmentToTriggerEmail.id ? (
                  <CircularProgress size={16} color="inherit" />
                ) : null
              }
              sx={{
                bgcolor: "var(--success-500)",
                "&:hover": {
                  bgcolor:
                    "color-mix(in srgb, var(--success-500) 86%, var(--accent-indigo-dark))",
                },
              }}
            >
              {triggeringEmailJobId && assessmentToTriggerEmail && triggeringEmailJobId === assessmentToTriggerEmail.id
                ? "Sending…"
                : "Confirm & Send"}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={duplicateDialogOpen}
          onClose={handleDuplicateDialogClose}
          aria-labelledby="duplicate-dialog-title"
          aria-describedby="duplicate-dialog-description"
          PaperProps={{
            sx: {
              borderRadius: 2,
              minWidth: 360,
            },
          }}
        >
          <DialogTitle id="duplicate-dialog-title" sx={{ fontWeight: 600 }}>
            Duplicate Assessment?
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="duplicate-dialog-description">
              {assessmentToDuplicate ? (
                <>
                  Create a duplicate of &quot;{assessmentToDuplicate.title}&quot;? The new assessment will be named &quot;{assessmentToDuplicate.title} - copy&quot; and will include all questions and settings.
                </>
              ) : null}
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleDuplicateDialogClose}
              disabled={!!duplicatingId}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDuplicateConfirm}
              disabled={!!duplicatingId}
              variant="contained"
              sx={{
                bgcolor: "var(--accent-purple)",
                "&:hover": {
                  bgcolor:
                    "color-mix(in srgb, var(--accent-purple) 86%, var(--accent-indigo-dark))",
                },
              }}
              autoFocus
              startIcon={duplicatingId ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {duplicatingId ? "Duplicating…" : "Duplicate"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
