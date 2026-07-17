"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { LoadingButton } from "@/components/common/LoadingButton";
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
import { EmailTemplatePreview } from "@/components/common/EmailTemplatePreview";
import { extractSavedEmailAttachment } from "@/lib/utils/assessment-email-attachment";
import { escapeCsvCell } from "@/lib/utils/csv-export";
import {
  AssessmentSectionHero,
  AssessmentFilterBar,
  AssessmentTableSkeleton,
  AssessmentSharedPagination,
  AssessmentEmptyState,
  StatStrip,
  type StatItem,
  SegmentedTabs,
  type SegmentedTab,
  AssessmentCard,
  deriveAssessmentStatus,
  AiPromptField,
} from "@/components/admin/assessment/shared";
import {
  startAssessmentComposer,
  getAssessmentCompanyCatalog,
  type ComposerPreset,
  type CompanyPrepEntry,
} from "@/lib/services/admin/admin-assessment-composer.service";

const COMPOSER_EXAMPLES = [
  "45-min proctored cybersecurity screening · 10 MCQ medium + 2 hard coding",
  "Week 1 final for Data Science, 30 fixed questions, non-adaptive",
  "Quick 15-min SQL diagnostic, auto-graded, no proctoring",
];

const COMPOSER_BLUEPRINTS: {
  preset: Exclude<ComposerPreset, "">;
  label: string;
  icon: string;
  starter: string;
}[] = [
  {
    preset: "proctored_screening",
    label: "Proctored screening",
    icon: "mdi:shield-check-outline",
    starter: "45-min proctored screening: 10 medium MCQs + 2 hard coding problems",
  },
  {
    preset: "final_exam",
    label: "Course final exam",
    icon: "mdi:target",
    starter: "Course final exam, 30 questions, comprehensive, non-adaptive, 90 minutes",
  },
  {
    preset: "coding_challenge",
    label: "Coding challenge",
    icon: "mdi:code-tags",
    starter: "Coding challenge: 3 DSA problems, 90 minutes, auto-graded",
  },
];

export default function AssessmentPage() {
  const { t } = useTranslation("common");
  const { showToast } = useToast();
  const router = useRouter();
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
  const [aiFilter, setAiFilter] = useState<"all" | "ai" | "manual">("all");
  const [evaluationFilter, setEvaluationFilter] = useState<"all" | "manual" | "auto">("all");

  // Inline AI Composer hero (mockup): one brief → whole draft, right from the hub.
  const [composerBrief, setComposerBrief] = useState("");
  const [composerPreset, setComposerPreset] = useState<ComposerPreset>("");
  const [composerSubmitting, setComposerSubmitting] = useState(false);
  const composerBlocked =
    isCourseManager ||
    (!!user &&
      typeof user.role === "string" &&
      ["content manager", "content_manager"].includes(
        user.role.toLowerCase().replace(/\s+/g, " ")
      ));
  // Company-prep picker: curated real hiring-round blueprints (BE catalog).
  const [companyCatalog, setCompanyCatalog] = useState<CompanyPrepEntry[]>([]);
  const [companyOpen, setCompanyOpen] = useState<string>("");
  const [companyStarting, setCompanyStarting] = useState<string>("");
  useEffect(() => {
    if (composerBlocked) return;
    let cancelled = false;
    getAssessmentCompanyCatalog(config.clientId)
      .then((c) => { if (!cancelled) setCompanyCatalog(c); })
      .catch(() => { /* picker simply stays hidden */ });
    return () => { cancelled = true; };
  }, [composerBlocked]);

  const handleCompanyGenerate = async (companyId: string, roundKey: string) => {
    if (companyStarting) return;
    try {
      setCompanyStarting(`${companyId}:${roundKey}`);
      const job = await startAssessmentComposer(config.clientId, {
        company: companyId,
        round_key: roundKey,
      });
      router.push(`/admin/assessment/compose/${job.job_id}`);
    } catch (e: unknown) {
      showToast((e as { message?: string })?.message || "Couldn't start the company prep", "error");
      setCompanyStarting("");
    }
  };

  const handleComposerGenerate = async () => {
    if (!composerBrief.trim() || composerSubmitting) return;
    try {
      setComposerSubmitting(true);
      const job = await startAssessmentComposer(config.clientId, {
        brief: composerBrief.trim(),
        preset: composerPreset || undefined,
      });
      router.push(`/admin/assessment/compose/${job.job_id}`);
    } catch (e: unknown) {
      showToast((e as { message?: string })?.message || "Failed to start the composer", "error");
      setComposerSubmitting(false);
    }
  };

  // Hub redesign: primary status filter is a segmented tab bar (derived status), and the
  // list can render as a card grid (default) or the classic table.
  type StatusTab = "all" | "active" | "scheduled" | "draft" | "closed";
  const [statusTab, setStatusTab] = useState<StatusTab>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  // Per-card overflow menu (preserves every row action the table exposed).
  const [cardMenuAnchor, setCardMenuAnchor] = useState<null | HTMLElement>(null);
  const [cardMenuTarget, setCardMenuTarget] = useState<Assessment | null>(null);

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

  // Helper function to escape CSV values. Delegates to the shared hardened helper,
  // which neutralizes formula injection (leading = + - @) — a learner name/email like
  // `=HYPERLINK(...)` must never execute in Excel/Sheets.
  const escapeCsv = (val: unknown): string =>
    escapeCsvCell(typeof val === "object" && val !== null ? JSON.stringify(val) : val);

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
      // Route through downloadCsv so the UTF-8 BOM is prepended (raw Blob dropped it,
      // corrupting non-ASCII names and ₹ in Excel).
      downloadCsv(csv, `assessment-${data.assessment.slug || assessment.id}-submissions.csv`);
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

  // The admin authors the subject + body during create/edit — prefer those
  // saved values. Fall back to a static template only when the assessment
  // doesn't have them (legacy records).
  const buildEmailSubject = (assessment: Assessment) => {
    const saved = (assessment as Assessment & { email_subject?: string })
      .email_subject;
    if (saved && saved.trim()) return saved;
    return `Important Notification - ${assessment.title}`;
  };

  const buildEmailBody = (assessment: Assessment) => {
    const assessmentDetail = assessment as Assessment & {
      email_body?: string;
      start_time?: string | null;
      end_time?: string | null;
    };
    if (assessmentDetail.email_body && assessmentDetail.email_body.trim()) {
      return assessmentDetail.email_body;
    }

    // Fallback template for assessments saved before the editable email body
    // feature shipped.
    const baseUrl =
      typeof window !== "undefined" ? window.location.origin : "";
    const link = `${baseUrl}/assessments/${assessment.slug}`;
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

      <p>All set! Your assessment details are below. Good luck 👍.</p>

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
      // Pull any saved attachment URL off the assessment so the job carries
      // it to the backend. Same fallback chain the editor uses.
      const att = extractSavedEmailAttachment(
        assessmentToTriggerEmail as unknown as Record<string, unknown>
      );
      const result = await adminAssessmentEmailJobsService.createAssessmentEmailJob(
        config.clientId,
        {
          assessment_id: assessmentToTriggerEmail.id,
          subject: buildEmailSubject(assessmentToTriggerEmail),
          // WYSIWYG: send exactly what the dialog previewed (buildEmailBody) rather than
          // the separate email_html field, which could differ or be blank.
          email_body: buildEmailBody(assessmentToTriggerEmail),
          ...(att.url ? { attachment_url: att.url } : {}),
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

      // Status filter (legacy select — kept as a no-op unless set; the tabs below are primary)
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !assessment.is_active) return false;
        if (statusFilter === "inactive" && assessment.is_active) return false;
      }

      if (draftFilter === "draft" && !assessment.is_draft) return false;
      if (draftFilter === "live" && assessment.is_draft) return false;

      // Primary status filter — segmented tabs over the derived display status.
      if (statusTab !== "all" && deriveAssessmentStatus(assessment).key !== statusTab) {
        return false;
      }

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

      // AI-authored filter
      if (aiFilter !== "all") {
        if (aiFilter === "ai" && !assessment.is_ai_generated) return false;
        if (aiFilter === "manual" && assessment.is_ai_generated) return false;
      }

      // Manual vs auto evaluation (API default is auto when omitted)
      if (evaluationFilter !== "all") {
        const mode = assessment.evaluation_mode ?? "auto";
        if (evaluationFilter === "manual" && mode !== "manual") return false;
        if (evaluationFilter === "auto" && mode !== "auto") return false;
      }

      return true;
    });
  }, [assessments, searchQuery, statusFilter, draftFilter, proctoringFilter, paidFilter, aiFilter, evaluationFilter, statusTab]);

  // Hub metric strip (6 tiles) + per-tab counts, computed over the full (unpaginated) list.
  const hubStats = useMemo<StatItem[]>(() => {
    let active = 0, scheduled = 0, drafts = 0, closed = 0, submissions = 0;
    for (const a of assessments) {
      const key = deriveAssessmentStatus(a).key;
      if (key === "active") active++;
      else if (key === "scheduled") scheduled++;
      else if (key === "draft") drafts++;
      else if (key === "closed") closed++;
      submissions += a.submissions_count ?? 0;
    }
    return [
      { label: "Total", value: assessments.length, icon: "mdi:clipboard-text-outline", tone: "var(--accent-indigo)" },
      { label: "Active", value: active, icon: "mdi:play-circle-outline", tone: "var(--success-500)" },
      { label: "Scheduled", value: scheduled, icon: "mdi:calendar-clock", tone: "var(--accent-indigo)" },
      { label: "Drafts", value: drafts, icon: "mdi:file-document-edit-outline", tone: "var(--warning-500)" },
      { label: "Closed", value: closed, icon: "mdi:lock-outline", tone: "var(--font-tertiary)" },
      { label: "Submissions", value: submissions, icon: "mdi:account-check-outline", tone: "var(--ai-violet)" },
    ];
  }, [assessments]);

  const statusTabCounts = useMemo(() => {
    const c = { all: assessments.length, active: 0, scheduled: 0, draft: 0, closed: 0 };
    for (const a of assessments) {
      const key = deriveAssessmentStatus(a).key;
      if (key === "active") c.active++;
      else if (key === "scheduled") c.scheduled++;
      else if (key === "draft") c.draft++;
      else if (key === "closed") c.closed++;
    }
    return c;
  }, [assessments]);

  // Client-side pagination
  const paginatedAssessments = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredAssessments.slice(startIndex, endIndex);
  }, [filteredAssessments, page, limit]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, draftFilter, proctoringFilter, paidFilter, aiFilter, evaluationFilter, statusTab]);

  // Clamp the page into range after the list shrinks (delete/duplicate/refetch) —
  // otherwise deleting the last row on the last page leaves an empty view.
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredAssessments.length / limit));
    if (page > totalPages) setPage(totalPages);
  }, [filteredAssessments.length, limit, page]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDraftFilter("all");
    setProctoringFilter("all");
    setPaidFilter("all");
    setAiFilter("all");
    setEvaluationFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    draftFilter !== "all" ||
    proctoringFilter !== "all" ||
    paidFilter !== "all" ||
    aiFilter !== "all" ||
    evaluationFilter !== "all" ||
    statusTab !== "all";

  // Card click → same routing the table's onEdit used (draft → builder, published → editor).
  const handleCardOpen = (a: Assessment) => {
    if (!isCourseManager && a.is_draft) {
      router.push(`/admin/assessment/${a.id}/build`);
      return;
    }
    router.push(
      isCourseManager
        ? `/admin/assessment/${a.id}/edit?readonly=1`
        : `/admin/assessment/${a.id}/edit`
    );
  };
  const openCardMenu = (e: React.MouseEvent<HTMLElement>, a: Assessment) => {
    setCardMenuAnchor(e.currentTarget);
    setCardMenuTarget(a);
  };
  const closeCardMenu = () => {
    setCardMenuAnchor(null);
    setCardMenuTarget(null);
  };

  const statusTabs: SegmentedTab<StatusTab>[] = [
    { value: "all", label: "All", count: statusTabCounts.all },
    { value: "active", label: "Active", icon: "mdi:play-circle-outline", count: statusTabCounts.active },
    { value: "scheduled", label: "Scheduled", icon: "mdi:calendar-clock", count: statusTabCounts.scheduled },
    { value: "draft", label: "Drafts", icon: "mdi:file-document-edit-outline", count: statusTabCounts.draft },
    { value: "closed", label: "Closed", icon: "mdi:lock-outline", count: statusTabCounts.closed },
  ];

  return (
    <MainLayout fullWidthContent>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header — adaptive-course design language (Phase 1 revamp) */}
        <Box sx={{ mb: 4 }}>
          <AssessmentSectionHero
            chapter="ASSESSMENT MANAGEMENT"
            title="Assessments"
            subtitle="Create, schedule, and monitor every assessment in one place."
            accent="violet"
            icon=""
            rightSlot={
              /* Mockup: the ONLY header action is "Build manually" — the AI composer
                 lives inline in the hero band below. */
              <Button
                startIcon={<IconWrapper icon="mdi:pencil-outline" size={18} />}
                onClick={() => router.push("/admin/assessment/create")}
                disabled={composerBlocked}
                sx={{
                  color: "var(--font-primary)",
                  fontWeight: 700,
                  px: 2.5,
                  py: 1,
                  borderRadius: 2.5,
                  whiteSpace: "nowrap",
                  textTransform: "none",
                  bgcolor: "var(--card-bg)",
                  border: "1px solid var(--border-default)",
                  "&:hover": { borderColor: "var(--accent-indigo)", bgcolor: "var(--card-bg)" },
                  "&.Mui-disabled": { color: "var(--font-tertiary)" },
                }}
              >
                Build manually
              </Button>
            }
          />
        </Box>

        {/* AI Composer hero — inline on the hub (mockup): brief + Generate + blueprints */}
        {!composerBlocked && (
          <Box
            sx={{
              mb: 3,
              position: "relative",
              overflow: "hidden",
              borderRadius: "22px",
              p: { xs: 3, md: 4 },
              color: "#fff",
              // Deep eggplant → dark magenta, per the mockup band
              background: "linear-gradient(115deg, #2b1244 0%, #3d1663 45%, #6b1a52 82%, #7d2058 100%)",
              boxShadow: "0 28px 56px -28px rgba(61, 22, 99, 0.55)",
            }}
          >
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 340px" }, gap: 3, alignItems: "start" }}>
              {/* Left: pill + copy + prompt */}
              <Box sx={{ minWidth: 0 }}>
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    px: 1.25,
                    py: 0.5,
                    borderRadius: 999,
                    background: "var(--gradient-ai)",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.1em",
                    mb: 1.5,
                  }}
                >
                  <IconWrapper icon="mdi:auto-fix" size={14} /> AI ASSESSMENT COMPOSER
                </Box>
                <Typography
                  sx={{
                    fontFamily: "var(--font-jakarta)",
                    fontWeight: 800,
                    fontSize: { xs: "1.5rem", md: "2rem" },
                    lineHeight: 1.15,
                    mb: 1,
                  }}
                >
                  Describe it. We&apos;ll build the whole thing.
                </Typography>
                <Typography sx={{ opacity: 0.9, maxWidth: 620, mb: 2.5 }}>
                  Type a plain-English brief. AI drafts sections, questions, difficulty balance,
                  timing, and proctoring. You just review and publish. No forms to fight.
                </Typography>
                <Box sx={{ maxWidth: 860 }}>
                  <AiPromptField
                    value={composerBrief}
                    onChange={setComposerBrief}
                    onSubmit={handleComposerGenerate}
                    submitting={composerSubmitting}
                    examples={COMPOSER_EXAMPLES}
                  />
                </Box>
              </Box>

              {/* Right: blueprints inside the band (mockup) */}
              <Box>
                <Typography
                  sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em", opacity: 0.75, mb: 1.25 }}
                >
                  OR START FROM A BLUEPRINT
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                  {COMPOSER_BLUEPRINTS.map((bp) => {
                    const active = composerPreset === bp.preset;
                    return (
                      <Box
                        key={bp.preset}
                        onClick={() => {
                          setComposerPreset(bp.preset);
                          setComposerBrief(bp.starter);
                        }}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          p: 1.75,
                          borderRadius: 2.5,
                          cursor: "pointer",
                          bgcolor: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
                          border: active ? "1px solid rgba(255,255,255,0.55)" : "1px solid rgba(255,255,255,0.16)",
                          transition: "background-color 0.15s ease, border-color 0.15s ease",
                          "&:hover": { bgcolor: "rgba(255,255,255,0.16)" },
                        }}
                      >
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 2,
                            flexShrink: 0,
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "rgba(255,255,255,0.14)",
                          }}
                        >
                          <IconWrapper icon={bp.icon} size={19} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, flexGrow: 1, fontSize: "0.95rem" }}>
                          {bp.label}
                        </Typography>
                        <IconWrapper icon="mdi:chevron-right" size={20} />
                      </Box>
                    );
                  })}
                </Box>

                {/* Company prep: curated real hiring-round blueprints (TCS, Infosys, …) */}
                {companyCatalog.length > 0 ? (
                  <>
                    <Typography
                      sx={{ fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.1em", opacity: 0.75, mt: 2.5, mb: 1.25 }}
                    >
                      PREP FOR A COMPANY
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                      {companyCatalog.map((co) => {
                        const active = companyOpen === co.id;
                        return (
                          <Box
                            key={co.id}
                            onClick={() => setCompanyOpen(active ? "" : co.id)}
                            sx={{
                              px: 1.5,
                              py: 0.6,
                              borderRadius: 999,
                              cursor: "pointer",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              userSelect: "none",
                              bgcolor: active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
                              border: active ? "1px solid rgba(255,255,255,0.6)" : "1px solid rgba(255,255,255,0.18)",
                              transition: "background-color 0.15s ease, border-color 0.15s ease",
                              "&:hover": { bgcolor: "rgba(255,255,255,0.18)" },
                            }}
                          >
                            {co.name}
                          </Box>
                        );
                      })}
                    </Box>
                    {companyOpen
                      ? (() => {
                          const co = companyCatalog.find((c) => c.id === companyOpen);
                          if (!co) return null;
                          return (
                            <Box sx={{ mt: 1.25, display: "flex", flexDirection: "column", gap: 0.75 }}>
                              {co.rounds.map((r) => {
                                const starting = companyStarting === `${co.id}:${r.key}`;
                                return (
                                  <Box
                                    key={r.key}
                                    onClick={() => void handleCompanyGenerate(co.id, r.key)}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      px: 1.5,
                                      py: 1.1,
                                      borderRadius: 2,
                                      cursor: "pointer",
                                      bgcolor: "rgba(255,255,255,0.07)",
                                      border: "1px solid rgba(255,255,255,0.16)",
                                      opacity: companyStarting && !starting ? 0.55 : 1,
                                      transition: "background-color 0.15s ease",
                                      "&:hover": { bgcolor: "rgba(255,255,255,0.15)" },
                                    }}
                                  >
                                    {starting ? (
                                      <CircularProgress size={15} sx={{ color: "#fff", flexShrink: 0 }} />
                                    ) : (
                                      <IconWrapper
                                        icon={r.has_coding ? "mdi:code-tags" : "mdi:format-list-checks"}
                                        size={16}
                                      />
                                    )}
                                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.25 }}>
                                        {r.title}
                                      </Typography>
                                      <Typography sx={{ fontSize: "0.72rem", opacity: 0.75 }}>
                                        {r.question_count} questions · {r.duration_minutes}m
                                        {r.has_coding ? " · coding" : ""}
                                      </Typography>
                                    </Box>
                                    <IconWrapper icon="mdi:arrow-right" size={16} />
                                  </Box>
                                );
                              })}
                            </Box>
                          );
                        })()
                      : null}
                  </>
                ) : null}
              </Box>
            </Box>
          </Box>
        )}

        {/* Hub metric strip (Phase 3 redesign) */}
        {!loading && assessments.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <StatStrip items={hubStats} />
          </Box>
        )}

        {/* Primary status tabs + view toggle (Phase 3 redesign) */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            mb: 2,
            flexWrap: "wrap",
          }}
        >
          <SegmentedTabs<StatusTab> tabs={statusTabs} value={statusTab} onChange={setStatusTab} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            {/* Quick-toggle filter pills (mockup) */}
            {([
              { key: "proctored", icon: "mdi:shield-check-outline", label: "Proctored", active: proctoringFilter === "enabled", toggle: () => setProctoringFilter((p) => (p === "enabled" ? "all" : "enabled")) },
              { key: "ai", icon: "mdi:auto-fix", label: "AI-authored", active: aiFilter === "ai", toggle: () => setAiFilter((p) => (p === "ai" ? "all" : "ai")) },
              { key: "paid", icon: "mdi:lightning-bolt-outline", label: "Paid", active: paidFilter === "paid", toggle: () => setPaidFilter((p) => (p === "paid" ? "all" : "paid")) },
            ]).map((pill) => (
              <Box
                key={pill.key}
                onClick={pill.toggle}
                role="button"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.6,
                  px: 1.5,
                  height: 36,
                  borderRadius: 999,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  userSelect: "none",
                  color: pill.active ? "var(--accent-indigo)" : "var(--font-secondary)",
                  bgcolor: pill.active ? "color-mix(in srgb, var(--accent-indigo) 12%, var(--card-bg) 88%)" : "var(--card-bg)",
                  border: pill.active ? "1px solid var(--accent-indigo)" : "1px solid var(--border-default)",
                  transition: "border-color 0.15s ease, background-color 0.15s ease",
                  "&:hover": { borderColor: "var(--accent-indigo)" },
                }}
              >
                <IconWrapper icon={pill.icon} size={16} />
                {pill.label}
              </Box>
            ))}
          <Box sx={{ display: "flex", gap: 0.5, p: 0.5, borderRadius: 999, border: "1px solid var(--border-default)", bgcolor: "var(--surface)" }}>
            {([
              { mode: "cards" as const, icon: "mdi:view-grid-outline", label: "Card view" },
              { mode: "table" as const, icon: "mdi:table", label: "Table view" },
            ]).map((v) => {
              const active = viewMode === v.mode;
              return (
                <Tooltip key={v.mode} title={v.label}>
                  <IconButton
                    size="small"
                    aria-label={v.label}
                    onClick={() => setViewMode(v.mode)}
                    sx={{
                      borderRadius: 999,
                      color: active ? "#fff" : "var(--font-tertiary)",
                      bgcolor: active ? "var(--accent-indigo)" : "transparent",
                      "&:hover": { bgcolor: active ? "var(--accent-indigo-dark)" : "var(--hover-bg)" },
                    }}
                  >
                    <IconWrapper icon={v.icon} size={18} />
                  </IconButton>
                </Tooltip>
              );
            })}
          </Box>
          </Box>
        </Box>

        {/* Filters — AssessmentFilterBar (Phase 1 revamp) */}
        <Box sx={{ mb: 3 }}>
          <AssessmentFilterBar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder={t("admin.assessment.searchPlaceholder")}
            selects={[
              {
                key: "proctoring",
                label: "Proctoring",
                value: proctoringFilter === "all" ? "" : proctoringFilter,
                options: [
                  { value: "enabled", label: "Enabled" },
                  { value: "disabled", label: "Disabled" },
                ],
                onChange: (v) => setProctoringFilter((v || "all") as "all" | "enabled" | "disabled"),
              },
              {
                key: "paid",
                label: "Payment",
                value: paidFilter === "all" ? "" : paidFilter,
                options: [
                  { value: "paid", label: "Paid" },
                  { value: "free", label: "Free" },
                ],
                onChange: (v) => setPaidFilter((v || "all") as "all" | "paid" | "free"),
              },
              {
                key: "evaluation",
                label: t("admin.assessment.filterEvaluation"),
                value: evaluationFilter === "all" ? "" : evaluationFilter,
                options: [
                  { value: "manual", label: t("admin.assessment.filterEvaluationManual") },
                  { value: "auto", label: t("admin.assessment.filterEvaluationAuto") },
                ],
                onChange: (v) => setEvaluationFilter((v || "all") as "all" | "manual" | "auto"),
              },
            ]}
            activeChips={[
              ...(searchQuery ? [{ key: "search", label: `Search: "${searchQuery}"`, onClear: () => setSearchQuery("") }] : []),
              ...(proctoringFilter !== "all" ? [{ key: "proctoring", label: `Proctoring: ${proctoringFilter}`, onClear: () => setProctoringFilter("all") }] : []),
              ...(paidFilter !== "all" ? [{ key: "paid", label: `Payment: ${paidFilter}`, onClear: () => setPaidFilter("all") }] : []),
              ...(evaluationFilter !== "all" ? [{ key: "evaluation", label: evaluationFilter === "manual" ? t("admin.assessment.filterEvaluationManual") : t("admin.assessment.filterEvaluationAuto"), onClear: () => setEvaluationFilter("all") }] : []),
            ]}
            onClearAll={handleClearFilters}
            rightSlot={
              hasActiveFilters ? (
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", whiteSpace: "nowrap" }}>
                  Showing {filteredAssessments.length} of {assessments.length}
                </Typography>
              ) : undefined
            }
          />
        </Box>


        {/* List — card grid (default) or the classic table (Phase 3 redesign) */}
        {loading ? (
          viewMode === "cards" ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Box key={i} sx={{ height: 236, borderRadius: "var(--radius-card)", bgcolor: "var(--surface)", border: "1px solid var(--border-default)" }} />
              ))}
            </Box>
          ) : (
            <AssessmentTableSkeleton rows={8} columns={7} />
          )
        ) : filteredAssessments.length === 0 ? (
          <AssessmentEmptyState
            icon="mdi:clipboard-text-outline"
            title={hasActiveFilters ? "No assessments match your filters" : "No assessments yet"}
            description={
              hasActiveFilters
                ? "Try a different status tab, or clear your search and filters."
                : "Create your first assessment, or describe one and let AI build it."
            }
            action={
              hasActiveFilters ? (
                <Button onClick={handleClearFilters} sx={{ textTransform: "none", color: "var(--accent-indigo)", fontWeight: 600 }}>
                  Clear filters
                </Button>
              ) : !isCourseManager ? (
                <Button
                  variant="contained"
                  startIcon={<IconWrapper icon="mdi:pencil-outline" size={18} />}
                  onClick={() => router.push("/admin/assessment/create")}
                  sx={{ textTransform: "none", bgcolor: "var(--accent-indigo)", color: "#fff", fontWeight: 700, borderRadius: 2, "&:hover": { bgcolor: "var(--accent-indigo-dark)" } }}
                >
                  Build manually
                </Button>
              ) : undefined
            }
          />
        ) : viewMode === "cards" ? (
          <>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2 }}>
              {paginatedAssessments.map((a) => (
                <AssessmentCard
                  key={a.id}
                  assessment={a}
                  onClick={handleCardOpen}
                  actionSlot={
                    <IconButton
                      size="small"
                      aria-label="More actions"
                      onClick={(e) => openCardMenu(e, a)}
                      sx={{ color: "var(--font-tertiary)", "&:hover": { color: "var(--font-secondary)" } }}
                    >
                      <IconWrapper icon="mdi:dots-vertical" size={18} />
                    </IconButton>
                  }
                />
              ))}
            </Box>
            <Box sx={{ mt: 2 }}>
              <AssessmentSharedPagination
                total={filteredAssessments.length}
                page={page}
                pageSize={limit}
                onPageChange={setPage}
                onPageSizeChange={setLimit}
              />
            </Box>
          </>
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
              <AssessmentSharedPagination
                total={filteredAssessments.length}
                page={page}
                pageSize={limit}
                onPageChange={setPage}
                onPageSizeChange={setLimit}
              />
            )}
          </Paper>
        )}

        {/* Per-card overflow menu — every row action the table exposed */}
        <Menu
          anchorEl={cardMenuAnchor}
          open={Boolean(cardMenuAnchor)}
          onClose={closeCardMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 210, boxShadow: "0 12px 32px -12px color-mix(in srgb, var(--font-primary) 40%, transparent)" } }}
        >
          {cardMenuTarget && [
            <MenuItem
              key="open"
              onClick={() => { const a = cardMenuTarget; closeCardMenu(); handleCardOpen(a); }}
            >
              <ListItemIcon><IconWrapper icon={!isCourseManager && cardMenuTarget.is_draft ? "mdi:pencil-ruler" : "mdi:pencil-outline"} size={18} /></ListItemIcon>
              <ListItemText>{isCourseManager ? "View" : cardMenuTarget.is_draft ? "Continue building" : "Edit"}</ListItemText>
            </MenuItem>,
            ...(!isCourseManager ? [
              <MenuItem key="dup" onClick={() => { const a = cardMenuTarget; closeCardMenu(); handleDuplicateClick(a); }}>
                <ListItemIcon><IconWrapper icon="mdi:content-copy" size={18} /></ListItemIcon>
                <ListItemText>Duplicate</ListItemText>
              </MenuItem>,
            ] : []),
            <Divider key="d1" />,
            <MenuItem key="exs" onClick={() => { const a = cardMenuTarget; closeCardMenu(); handleExportSubmissions(a); }}>
              <ListItemIcon><IconWrapper icon="mdi:download-outline" size={18} /></ListItemIcon>
              <ListItemText>Export submissions</ListItemText>
            </MenuItem>,
            <MenuItem key="exq" onClick={() => { const a = cardMenuTarget; closeCardMenu(); handleExportQuestions(a); }}>
              <ListItemIcon><IconWrapper icon="mdi:file-export-outline" size={18} /></ListItemIcon>
              <ListItemText>Export questions</ListItemText>
            </MenuItem>,
            ...(!isCourseManager ? [
              <Divider key="d2" />,
              <MenuItem key="del" onClick={() => { const a = cardMenuTarget; closeCardMenu(); handleDeleteClick(a); }} sx={{ color: "var(--error-500)" }}>
                <ListItemIcon><IconWrapper icon="mdi:trash-can-outline" size={18} color="var(--error-500)" /></ListItemIcon>
                <ListItemText>Delete</ListItemText>
              </MenuItem>,
            ] : []),
          ]}
        </Menu>

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
            <LoadingButton
              onClick={handleDeleteConfirm}
              loading={deleting}
              loadingText={t("common.deleting")}
              variant="contained"
              color="error"
              autoFocus
            >
              Delete
            </LoadingButton>
          </DialogActions>
        </Dialog>

        <Dialog
          open={emailTriggerDialogOpen}
          onClose={handleCloseEmailTriggerDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2 },
          }}
        >
          <DialogTitle sx={{ fontWeight: 600 }}>
            Trigger Email Job
          </DialogTitle>
          <DialogContent>
            {assessmentToTriggerEmail && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <DialogContentText>
                  Send notification emails to students for this assessment. Review the full template below. This is what each recipient will receive.
                </DialogContentText>
                <Box>
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontWeight: 600 }}>
                    Subject
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, bgcolor: "var(--surface)", borderRadius: 1 }}>
                    {buildEmailSubject(assessmentToTriggerEmail)}
                  </Typography>
                </Box>
                {(() => {
                  const att = extractSavedEmailAttachment(
                    assessmentToTriggerEmail as unknown as Record<string, unknown>
                  );
                  const detail = assessmentToTriggerEmail as typeof assessmentToTriggerEmail & {
                    start_time?: string | null;
                    end_time?: string | null;
                  };
                  return (
                    <EmailTemplatePreview
                      subject={buildEmailSubject(assessmentToTriggerEmail)}
                      showPreviewChip={false}
                      attachmentUrl={att.url}
                      attachmentName={att.name}
                      schedule={{
                        startTime: detail.start_time ?? null,
                        endTime: detail.end_time ?? null,
                        durationMinutes:
                          assessmentToTriggerEmail.duration_minutes ?? null,
                      }}
                    >
                      <Box
                        sx={{ "& a": { color: "var(--accent-indigo)" } }}
                        dangerouslySetInnerHTML={{
                          __html: buildEmailBody(
                            assessmentToTriggerEmail
                          ).replace(/\{name\}/g, "[Recipient Name]"),
                        }}
                      />
                    </EmailTemplatePreview>
                  );
                })()}
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
            <LoadingButton
              onClick={handleConfirmTriggerEmailJob}
              loading={!!(triggeringEmailJobId && assessmentToTriggerEmail && triggeringEmailJobId === assessmentToTriggerEmail.id)}
              loadingText={t("common.submitting")}
              disabled={!!triggeringEmailJobId}
              variant="contained"
              sx={{
                bgcolor: "var(--success-500)",
                "&:hover": {
                  bgcolor:
                    "color-mix(in srgb, var(--success-500) 86%, var(--accent-indigo-dark))",
                },
              }}
            >
              Confirm & Send
            </LoadingButton>
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
            <LoadingButton
              onClick={handleDuplicateConfirm}
              loading={!!duplicatingId}
              loadingText={t("common.loading")}
              variant="contained"
              sx={{
                bgcolor: "var(--accent-purple)",
                "&:hover": {
                  bgcolor:
                    "color-mix(in srgb, var(--accent-purple) 86%, var(--accent-indigo-dark))",
                },
              }}
              autoFocus
            >
              Duplicate
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
