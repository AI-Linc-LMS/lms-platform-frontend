"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Pagination,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Tooltip,
  TextField,
  LinearProgress,
  Stack,
} from "@mui/material";
import { PerPageSelect } from "@/components/common/PerPageSelect";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminAssessmentService,
  QuestionsExportResponse,
  SubmissionsExportResponse,
  SubmissionsExportSubmission,
  AssessmentDetail,
  CreateAssessmentPayload,
  isMCQQuestion,
  isCodingQuestion,
  QuestionsExportMCQQuestion,
  QuestionsExportCodingQuestion,
  type AssessmentAnalyticsResponse,
  clampAssessmentAnalyticsTopPerformers,
} from "@/lib/services/admin/admin-assessment.service";
import { adminCoursesService } from "@/lib/services/admin/admin-courses.service";
import { config } from "@/lib/config";
import { BasicInfoSection } from "@/components/admin/assessment/BasicInfoSection";
import { AssessmentSettingsSection } from "@/components/admin/assessment/AssessmentSettingsSection";
import { PaginationControls } from "@/components/admin/assessment/PaginationControls";
import { ProblemDescription } from "@/components/coding/ProblemDescription";
import { useAuth } from "@/lib/auth/auth-context";
import { isCourseManagerRole } from "@/lib/auth/auth-utils";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";
import { generateAssessmentResultPdfVector } from "@/lib/utils/assessment-result-pdf.utils";
import { generateAssessmentAnalyticsPdfVector } from "@/lib/utils/assessment-analytics-pdf.utils";
import { AssessmentAnalyticsCharts } from "@/components/admin/assessment/AssessmentAnalyticsCharts";
import {
  mapSubmissionsExportRowToAssessmentResult,
  safeAssessmentPdfFileName,
} from "@/lib/utils/admin-submission-export-to-assessment-result.utils";

type TabValue = "details" | "questions" | "submissions" | "analytics";
type QuestionsSubTab = "mcq" | "coding";

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

/** Convert HTML to plain text for CSV: preserve superscripts (10^5), decode entities, keep line breaks */
function htmlToPlainText(html: string): string {
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
}



/** Format ISO date string for display (e.g. "12 Feb 2026, 12:43") */
function formatSubmissionDate(iso: string | null | undefined): string {
  if (!iso || !iso.trim()) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function humanizeAnalyticsStatus(raw: string | null | undefined): string {
  if (raw == null || !String(raw).trim()) return "—";
  return String(raw)
    .trim()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function analyticsStatusChipColor(
  raw: string | null | undefined,
): "default" | "success" | "warning" | "error" | "info" {
  const s = String(raw ?? "")
    .toLowerCase()
    .replace(/-/g, "_");
  if (
    s === "submitted" ||
    s === "completed" ||
    s === "graded" ||
    s === "passed"
  ) {
    return "success";
  }
  if (s === "in_progress" || s === "started" || s === "ongoing") {
    return "warning";
  }
  if (
    s === "failed" ||
    s === "expired" ||
    s === "abandoned" ||
    s === "cancelled"
  ) {
    return "error";
  }
  if (s === "pending" || s === "draft" || s === "scheduled") {
    return "info";
  }
  return "default";
}

function clampPercentDisplay(n: number | null | undefined): number {
  if (n == null || !Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function submissionHasProctoringPayload(
  p: SubmissionsExportSubmission["proctoring"],
): boolean {
  return !!p && typeof p === "object" && Object.keys(p).length > 0;
}

function formatProctoringSummaryForTable(
  p: SubmissionsExportSubmission["proctoring"],
): string {
  if (!submissionHasProctoringPayload(p)) return "";
  const parts: string[] = [];
  if (p!.total_violation_count != null) {
    parts.push(`Total violations: ${p!.total_violation_count}`);
  }
  if (p!.tab_switches_count != null) {
    parts.push(`Tab switches: ${p!.tab_switches_count}`);
  }
  if (p!.face_violations_count != null) {
    parts.push(`Face: ${p!.face_violations_count}`);
  }
  if (p!.fullscreen_exits_count != null) {
    parts.push(`Fullscreen exits: ${p!.fullscreen_exits_count}`);
  }
  if (p!.eye_movement_count != null) {
    parts.push(`Eye movement: ${p!.eye_movement_count}`);
  }
  if (p!.face_validation_failures_count != null) {
    parts.push(`Face validation: ${p!.face_validation_failures_count}`);
  }
  if (p!.multiple_face_detections_count != null) {
    parts.push(`Multi-face: ${p!.multiple_face_detections_count}`);
  }
  return parts.join(" · ");
}

function formatToDatetimeLocal(dateTimeString: string | null | undefined): string {
  if (!dateTimeString?.trim()) return "";
  try {
    const s = dateTimeString.trim();

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
      return s.slice(0, 16); 
    }
    const ddParts = s.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (ddParts) {
      const [, d, mo, y, h, min] = ddParts;
      return `${y}-${mo!.padStart(2, "0")}-${d!.padStart(2, "0")}T${h!.padStart(2, "0")}:${min}`;
    }
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:.*)?$/);
    if (isoMatch) {
      const [, y, mo, d, h, min] = isoMatch;
      return `${y}-${mo}-${d}T${h}:${min}`;
    }
    const d = new Date(s);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hr = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hr}:${min}`;
  } catch {
    return "";
  }
}

function safeAnalyticsPdfFileName(slug: string, id: number): string {
  const slugPart = (slug || "assessment").replace(/[^a-zA-Z0-9._-]+/g, "-");
  return `${slugPart}-${id}-analytics-report.pdf`;
}

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

/** Parse "dd mm yyyy hh:mm:ss" (or datetime-local) to IST "YYYY-MM-DDTHH:mm:ss+05:30" for API */
function toISTForAPI(dateTimeString: string | null | undefined): string | undefined {
  if (!dateTimeString?.trim()) return undefined;
  try {
    const s = dateTimeString.trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
      if (m) {
        const [, y, mo, d, h, min, sec] = m;
        return `${y}-${mo}-${d}T${h}:${min}:${sec ?? "00"}+05:30`;
      }
    }
    const parts = s.match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (parts) {
      const [, d, mo, y, h, min, sec] = parts;
      const dd = d!.padStart(2, "0");
      const mm = mo!.padStart(2, "0");
      const hh = h!.padStart(2, "0");
      const ss = (sec ?? "00").padStart(2, "0");
      return `${y}-${mm}-${dd}T${hh}:${min}:${ss}+05:30`;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export default function AssessmentEditPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { clientInfo } = useClientInfo();
  const canConfigureLiveStreaming =
    clientInfo?.live_proctoring_enabled === true;
  const hideAdminQuestions = isCourseManagerRole(user?.role);
  const readOnly =
    hideAdminQuestions || searchParams.get("readonly") === "1";
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
  const [liveStreaming, setLiveStreaming] = useState(false);
  const [sendCommunication, setSendCommunication] = useState(false);
  const [showResult, setShowResult] = useState(true);

  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsLimit, setQuestionsLimit] = useState(10);
  const [codingQuestionsPage, setCodingQuestionsPage] = useState(1);
  const [codingQuestionsLimit, setCodingQuestionsLimit] = useState(10);
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [submissionsLimit, setSubmissionsLimit] = useState(10);
  const [previewMCQ, setPreviewMCQ] = useState<{
    section: { section_title: string };
    question: QuestionsExportMCQQuestion;
  } | null>(null);
  const [previewCoding, setPreviewCoding] = useState<{
    section: { section_title: string };
    question: QuestionsExportCodingQuestion;
  } | null>(null);
  const [questionsSubTab, setQuestionsSubTab] = useState<QuestionsSubTab>("mcq");

  const [analyticsData, setAnalyticsData] =
    useState<AssessmentAnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsTopNApplied, setAnalyticsTopNApplied] = useState(10);
  const [analyticsTopNDraft, setAnalyticsTopNDraft] = useState("10");
  const [analyticsStudentsPage, setAnalyticsStudentsPage] = useState(1);
  const [analyticsStudentsLimit, setAnalyticsStudentsLimit] = useState(12);
  const [analyticsSectionPage, setAnalyticsSectionPage] = useState(1);
  const [analyticsSectionLimit, setAnalyticsSectionLimit] = useState(10);
  const [analyticsTopPerformersTablePage, setAnalyticsTopPerformersTablePage] =
    useState(1);
  const [analyticsTopPerformersTableLimit, setAnalyticsTopPerformersTableLimit] =
    useState(10);
  const analyticsTopNAppliedRef = useRef(analyticsTopNApplied);
  useEffect(() => {
    analyticsTopNAppliedRef.current = analyticsTopNApplied;
  }, [analyticsTopNApplied]);

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
      setStartTime(formatToDatetimeLocal(data.start_time ?? "") || "");
      setEndTime(formatToDatetimeLocal(data.end_time ?? "") || "");
      const anyData = data as any;
      setIsPaid(anyData.is_paid ?? false);
      setPrice(
        anyData.price != null && anyData.price !== ""
          ? String(anyData.price)
          : ""
      );
      setCurrency(anyData.currency ?? "INR");
      setIsActive(data.is_active ?? true);
      const anyDataCourses = (data as any);
      const loadedCourseIds = Array.isArray(anyDataCourses.course_ids)
        ? anyDataCourses.course_ids
        : Array.isArray(anyDataCourses.courses)
          ? (anyDataCourses.courses as { id: number }[]).map((c) => c.id)
          : [];
      setCourseIds(loadedCourseIds);
      setColleges(Array.isArray((data as any).colleges) ? (data as any).colleges : []);
      setProctoringEnabled((data as any).proctoring_enabled ?? true);
      setLiveStreaming((data as any).live_streaming ?? false);
      setSendCommunication((data as any).send_communication ?? false);
      setShowResult((data as any).show_result ?? true);
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

  
  const coursesWithAssessment = useMemo(() => {
    const byId = new Map<number, { id: number; title?: string; name?: string }>();
    const add = (c: any) => {
      if (c?.id == null) return;
      const id = Number(c.id);
      if (!byId.has(id)) byId.set(id, { id, title: c.title, name: c.name });
    };
    courses.forEach(add);
    (assessment as any)?.courses?.forEach(add);
    return Array.from(byId.values());
  }, [courses, assessment]);

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

  const loadAnalytics = useCallback(
    async (topOverride?: number) => {
      if (!assessmentId || !config.clientId) return;
      const top = clampAssessmentAnalyticsTopPerformers(
        topOverride ?? analyticsTopNAppliedRef.current,
      );
      setAnalyticsLoading(true);
      try {
        const data = await adminAssessmentService.getAssessmentAnalytics(
          config.clientId,
          assessmentId,
          { top_performers: top },
        );
        setAnalyticsData(data);
        setAnalyticsTopNApplied(top);
        setAnalyticsTopNDraft(String(top));
        setAnalyticsStudentsPage(1);
        setAnalyticsSectionPage(1);
        setAnalyticsTopPerformersTablePage(1);
      } catch (e: any) {
        showToast(e?.message || "Failed to load analytics", "error");
        setAnalyticsData(null);
      } finally {
        setAnalyticsLoading(false);
      }
    },
    [assessmentId, showToast],
  );

  useEffect(() => {
    if (tab !== "analytics" || !assessmentId || !config.clientId) return;
    void loadAnalytics();
  }, [tab, assessmentId, loadAnalytics]);

  useEffect(() => {
    if (!assessmentId || authLoading) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      await loadAssessment();
      if (cancelled) return;
      await loadCourses();
      if (cancelled) return;
      if (hideAdminQuestions) {
        setQuestionsData(null);
      } else {
        await loadQuestions();
      }
      if (cancelled) return;
      await loadSubmissions();
    })().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [
    assessmentId,
    authLoading,
    hideAdminQuestions,
    loadAssessment,
    loadCourses,
    loadQuestions,
    loadSubmissions,
  ]);

  useEffect(() => {
    if (hideAdminQuestions && tab === "questions") {
      setTab("details");
    }
  }, [hideAdminQuestions, tab]);

  const handleSave = async () => {
    if (readOnly) return;
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
        start_time: toISTForAPI(startTime),
        end_time: toISTForAPI(endTime),
        is_paid: isPaid,
        price: isPaid ? (price ? Number(price) : null) : null,
        currency: isPaid ? currency : undefined,
        is_active: isActive,
        proctoring_enabled: proctoringEnabled,
        live_streaming: canConfigureLiveStreaming ? liveStreaming : false,
        send_communication: sendCommunication,
        show_result: showResult,
        course_ids: courseIds,
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

  const handleDownloadMCQQuestions = () => {
    if (!questionsData) return;
    const flat: Record<string, unknown>[] = [];
    for (const sec of quizSections) {
      for (const q of sec.questions) {
        if (isMCQQuestion(q)) {
          flat.push({
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
        }
      }
    }
    const columns: { key: string; header: string }[] = [
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
    const csv = jsonToCsvRows(flat, columns);
    downloadCsv(csv, `assessment-${questionsData.assessment.slug || assessmentId}-mcq-questions.csv`);
    showToast("MCQ questions exported", "success");
  };

  const handleDownloadCodingQuestions = () => {
    if (!questionsData) return;
    const flat: Record<string, unknown>[] = [];
    for (const sec of codingSections) {
      for (const q of sec.questions) {
        if (isCodingQuestion(q)) {
          const ps = typeof q.problem_statement === "string" ? q.problem_statement : "";
          const inp = typeof q.input_format === "string" ? q.input_format : "";
          const out = typeof q.output_format === "string" ? q.output_format : "";
          const con = typeof q.constraints === "string" ? q.constraints : "";
          flat.push({
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
        }
      }
    }
    const columns: { key: string; header: string }[] = [
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
    const csv = jsonToCsvRows(flat, columns);
    downloadCsv(csv, `assessment-${questionsData.assessment.slug || assessmentId}-coding-questions.csv`);
    showToast("Coding questions exported", "success");
  };

  function downloadCsv(csv: string, filename: string) {
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

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

    const rows: Record<string, unknown>[] = subs.map((s) => {
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
    a.download = `assessment-${submissionsData.assessment.slug || assessmentId}-submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Submissions exported", "success");
  };

  const quizSections = useMemo(() => {
    if (!questionsData?.sections) return [];
    return questionsData.sections.filter(
      (s) => (s.section_type ?? "quiz").toLowerCase() === "quiz"
    );
  }, [questionsData]);

  const codingSections = useMemo(() => {
    if (!questionsData?.sections) return [];
    return questionsData.sections.filter(
      (s) => (s.section_type ?? "").toLowerCase() === "coding"
    );
  }, [questionsData]);

  const allQuizItems = useMemo(() => {
    return quizSections.flatMap((sec) =>
      sec.questions
        .filter((q): q is QuestionsExportMCQQuestion => isMCQQuestion(q))
        .map((q) => ({ section: sec, question: q }))
    );
  }, [quizSections]);

  const allCodingItems = useMemo(() => {
    return codingSections.flatMap((sec) =>
      sec.questions
        .filter((q): q is QuestionsExportCodingQuestion => isCodingQuestion(q))
        .map((q) => ({ section: sec, question: q }))
    );
  }, [codingSections]);

  const paginatedQuizQuestions = useMemo(() => {
    const start = (questionsPage - 1) * questionsLimit;
    return allQuizItems.slice(start, start + questionsLimit);
  }, [allQuizItems, questionsPage, questionsLimit]);

  const paginatedCodingQuestions = useMemo(() => {
    const start = (codingQuestionsPage - 1) * codingQuestionsLimit;
    return allCodingItems.slice(start, start + codingQuestionsLimit);
  }, [allCodingItems, codingQuestionsPage, codingQuestionsLimit]);

  const totalQuizQuestions = allQuizItems.length;
  const totalCodingQuestions = allCodingItems.length;
  const totalQuestions = totalQuizQuestions + totalCodingQuestions;

  const paginatedSubmissions = useMemo(() => {
    if (!submissionsData?.submissions) return [];
    const start = (submissionsPage - 1) * submissionsLimit;
    return submissionsData.submissions.slice(start, start + submissionsLimit);
  }, [submissionsData, submissionsPage, submissionsLimit]);

  const totalSubmissions = submissionsData?.submissions?.length ?? 0;

  const submissionsIncludeProctoring = useMemo(() => {
    if (!submissionsData?.submissions?.length) return false;
    return submissionsData.submissions.some((s) =>
      submissionHasProctoringPayload(s.proctoring),
    );
  }, [submissionsData]);

  const handleDownloadSubmissionPdf = useCallback(
    (submission: SubmissionsExportSubmission) => {
      if (!submissionsData) return;
      try {
        const result = mapSubmissionsExportRowToAssessmentResult(
          submissionsData,
          submission,
        );
        const fileName = safeAssessmentPdfFileName(
          submissionsData.assessment.title ||
            String(submissionsData.assessment.id),
          submission.name,
        );
        generateAssessmentResultPdfVector(result, fileName);
        showToast("PDF downloaded", "success");
      } catch (e: unknown) {
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message?: string }).message)
            : "Failed to generate PDF";
        showToast(msg, "error");
      }
    },
    [submissionsData, showToast],
  );

  const handleAnalyticsApplyTopPerformers = () => {
    const parsed = Number.parseInt(analyticsTopNDraft.trim(), 10);
    const top = clampAssessmentAnalyticsTopPerformers(
      Number.isFinite(parsed) ? parsed : 10,
    );
    setAnalyticsTopNDraft(String(top));
    void loadAnalytics(top);
  };

  /** Reload analytics using the last applied top-performers limit (ignores draft). */
  const handleAnalyticsReload = () => {
    void loadAnalytics(analyticsTopNAppliedRef.current);
  };

  const handleDownloadAnalyticsPdf = () => {
    if (!analyticsData) return;
    try {
      const slug =
        analyticsData.assessment.slug ||
        String(analyticsData.assessment.id);
      const fileName = safeAnalyticsPdfFileName(
        slug,
        analyticsData.assessment.id,
      );
      generateAssessmentAnalyticsPdfVector(analyticsData, fileName);
      showToast("Analytics PDF downloaded (print-ready vector report)", "success");
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Failed to generate analytics PDF";
      showToast(msg, "error");
    }
  };

  const paginatedAnalyticsStudents = useMemo(() => {
    const list = analyticsData?.students ?? [];
    const start = (analyticsStudentsPage - 1) * analyticsStudentsLimit;
    return list.slice(start, start + analyticsStudentsLimit);
  }, [analyticsData, analyticsStudentsPage, analyticsStudentsLimit]);

  const paginatedAnalyticsSectionAverages = useMemo(() => {
    const list = analyticsData?.section_averages ?? [];
    const start = (analyticsSectionPage - 1) * analyticsSectionLimit;
    return list.slice(start, start + analyticsSectionLimit);
  }, [
    analyticsData,
    analyticsSectionPage,
    analyticsSectionLimit,
  ]);

  const paginatedAnalyticsTopPerformers = useMemo(() => {
    const list = analyticsData?.top_performers ?? [];
    const start =
      (analyticsTopPerformersTablePage - 1) * analyticsTopPerformersTableLimit;
    return list.slice(start, start + analyticsTopPerformersTableLimit);
  }, [
    analyticsData,
    analyticsTopPerformersTablePage,
    analyticsTopPerformersTableLimit,
  ]);

  const totalAnalyticsStudents = analyticsData?.students?.length ?? 0;
  const totalAnalyticsSectionRows =
    analyticsData?.section_averages?.length ?? 0;
  const totalAnalyticsTopPerformersRows =
    analyticsData?.top_performers?.length ?? 0;

  useEffect(() => {
    setQuestionsPage(1);
    setCodingQuestionsPage(1);
    setSubmissionsPage(1);
    setAnalyticsStudentsPage(1);
    setAnalyticsSectionPage(1);
    setAnalyticsTopPerformersTablePage(1);
  }, [tab]);

  useEffect(() => {
    if (tab !== "questions" || !questionsData) return;
    if (questionsSubTab === "mcq" && totalQuizQuestions === 0 && totalCodingQuestions > 0) {
      setQuestionsSubTab("coding");
    } else if (questionsSubTab === "coding" && totalCodingQuestions === 0 && totalQuizQuestions > 0) {
      setQuestionsSubTab("mcq");
    }
  }, [tab, questionsData, questionsSubTab, totalQuizQuestions, totalCodingQuestions]);

  const codingProblemDataForPreview = (q: QuestionsExportCodingQuestion) => ({
    content_title: q.title,
    details: {
      title: q.title,
      name: q.title,
      problem_title: q.title,
      problem_statement: q.problem_statement ?? "",
      input_format: q.input_format,
      output_format: q.output_format,
      sample_input: q.sample_input,
      sample_output: q.sample_output,
      constraints: q.constraints,
      difficulty_level: q.difficulty_level,
      tags: q.tags,
      test_cases: q.test_cases,
    },
  });

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

  const displayTitle = assessment.title || (readOnly ? "View Assessment" : "Edit Assessment");

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
            mb: 1,
          }}
        >
          {displayTitle}
        </Typography>
        {readOnly && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {hideAdminQuestions
              ? "You can view assessment details and submissions. Question content is not available for your role."
              : "You can view this assessment but cannot change settings or content."}
          </Alert>
        )}

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
            {!hideAdminQuestions && (
              <Tab value="questions" label="Questions" />
            )}
            <Tab value="submissions" label="Submissions" />
            <Tab value="analytics" label="Analytics" />
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
                  readOnly={readOnly}
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
                  courses={coursesWithAssessment}
                  loadingCourses={loadingCourses}
                  colleges={colleges}
                  proctoringEnabled={proctoringEnabled}
                  liveStreaming={liveStreaming}
                  showLiveStreamingToggle={canConfigureLiveStreaming}
                  sendCommunication={sendCommunication}
                  showResult={showResult}
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
                  onLiveStreamingChange={setLiveStreaming}
                  onSendCommunicationChange={setSendCommunication}
                  onShowResultChange={setShowResult}
                  readOnly={readOnly}
                />
                {!readOnly && (
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
                )}
              </Box>
            )}

            {!hideAdminQuestions && tab === "questions" && (
              <>
                {!questionsData?.sections?.length ? (
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <Typography color="text.secondary" variant="body1">
                      No questions to display.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Tabs
                      value={questionsSubTab}
                      onChange={(_, v: QuestionsSubTab) => setQuestionsSubTab(v)}
                      sx={{
                        minHeight: 40,
                        "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 40, py: 0 },
                        "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
                      }}
                    >
                      <Tab
                        value="mcq"
                        label={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            MCQ / Quiz
                            {totalQuizQuestions > 0 && (
                              <Chip
                                label={totalQuizQuestions}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.75rem",
                                  bgcolor: questionsSubTab === "mcq" ? "primary.main" : "action.hover",
                                  color: questionsSubTab === "mcq" ? "primary.contrastText" : "text.secondary",
                                }}
                              />
                            )}
                          </Box>
                        }
                      />
                      <Tab
                        value="coding"
                        label={
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            Coding
                            {totalCodingQuestions > 0 && (
                              <Chip
                                label={totalCodingQuestions}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: "0.75rem",
                                  bgcolor: questionsSubTab === "coding" ? "primary.main" : "action.hover",
                                  color: questionsSubTab === "coding" ? "primary.contrastText" : "text.secondary",
                                }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </Tabs>

                    {questionsSubTab === "mcq" && (
                      <Paper
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          overflow: "hidden",
                          borderColor: "#e5e7eb",
                          bgcolor: "#fafafa",
                        }}
                      >
                        <Box
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderBottom: "1px solid #e5e7eb",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1,
                            bgcolor: "#fff",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {totalQuizQuestions} MCQ question{totalQuizQuestions !== 1 ? "s" : ""}
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<IconWrapper icon="mdi:download" size={18} />}
                            onClick={handleDownloadMCQQuestions}
                            disabled={readOnly || totalQuizQuestions === 0}
                            sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
                          >
                            Download MCQ CSV
                          </Button>
                        </Box>
                        {totalQuizQuestions === 0 ? (
                          <Box sx={{ py: 6, textAlign: "center" }}>
                            <Typography color="text.secondary">No MCQ questions.</Typography>
                          </Box>
                        ) : (
                          <>
                            <TableContainer sx={{ maxHeight: 440 }}>
                              <Table size="small" stickyHeader>
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "#f3f4f6" }}>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: "0.8rem" }}>Section</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: "0.8rem" }}>Order</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: "0.8rem" }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: "0.8rem", minWidth: 220 }}>Question</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: "0.8rem" }}>Correct</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: "0.8rem" }}>Difficulty</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, width: 56, textAlign: "center", fontSize: "0.8rem" }} />
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {paginatedQuizQuestions.map(({ section: sec, question: q }) => (
                                    <TableRow key={`mcq-${q.id}`} hover sx={{ "&:hover": { bgcolor: "#f9fafb" } }}>
                                      <TableCell sx={{ py: 1.5 }}>{sec.section_title}</TableCell>
                                      <TableCell sx={{ py: 1.5 }}>{sec.order}</TableCell>
                                      <TableCell sx={{ py: 1.5, fontFamily: "monospace" }}>{q.id}</TableCell>
                                      <TableCell sx={{ py: 1.5, maxWidth: 280 }}>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                          }}
                                          title={q.question_text}
                                        >
                                          {q.question_text}
                                        </Typography>
                                      </TableCell>
                                      <TableCell sx={{ py: 1.5, fontWeight: 600 }}>{q.correct_option}</TableCell>
                                      <TableCell sx={{ py: 1.5 }}>{q.difficulty_level ?? "—"}</TableCell>
                                      <TableCell sx={{ py: 1.5, textAlign: "center" }}>
                                        <IconButton
                                          size="small"
                                          onClick={() => setPreviewMCQ({ section: sec, question: q })}
                                          sx={{ color: "#6366f1" }}
                                          title="Preview"
                                        >
                                          <IconWrapper icon="mdi:eye-outline" size={18} />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                            <PaginationControls
                              totalItems={totalQuizQuestions}
                              page={questionsPage}
                              limit={questionsLimit}
                              onPageChange={setQuestionsPage}
                              onLimitChange={(l) => { setQuestionsLimit(l); setQuestionsPage(1); }}
                              itemLabel="questions"
                            />
                          </>
                        )}
                      </Paper>
                    )}

                    {questionsSubTab === "coding" && (
                      <Paper
                        variant="outlined"
                        sx={{
                          borderRadius: 2,
                          overflow: "hidden",
                          borderColor: "#e5e7eb",
                          bgcolor: "#fafafa",
                        }}
                      >
                        <Box
                          sx={{
                            px: 2,
                            py: 1.5,
                            borderBottom: "1px solid #e5e7eb",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1,
                            bgcolor: "#fff",
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            {totalCodingQuestions} coding question{totalCodingQuestions !== 1 ? "s" : ""}
                          </Typography>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<IconWrapper icon="mdi:download" size={18} />}
                            onClick={handleDownloadCodingQuestions}
                            disabled={readOnly || totalCodingQuestions === 0}
                            sx={{ bgcolor: "#6366f1", "&:hover": { bgcolor: "#4f46e5" } }}
                          >
                            Download Coding CSV
                          </Button>
                        </Box>
                        {totalCodingQuestions === 0 ? (
                          <Box sx={{ py: 6, textAlign: "center" }}>
                            <Typography color="text.secondary">No coding questions.</Typography>
                          </Box>
                        ) : (
                          <>
                            <TableContainer sx={{ maxHeight: 440 }}>
                              <Table size="small" stickyHeader>
                                <TableHead>
                                  <TableRow sx={{ bgcolor: "#f3f4f6" }}>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: "0.8rem" }}>Section</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: "0.8rem" }}>Order</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: "0.8rem" }}>ID</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: "0.8rem", minWidth: 260 }}>Title</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: "0.8rem" }}>Difficulty</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, fontSize: "0.8rem" }}>Tags</TableCell>
                                    <TableCell sx={{ fontWeight: 700, py: 1.5, width: 56, textAlign: "center", fontSize: "0.8rem" }} />
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {paginatedCodingQuestions.map(({ section: sec, question: q }) => (
                                    <TableRow key={`coding-${q.id}`} hover sx={{ "&:hover": { bgcolor: "#f9fafb" } }}>
                                      <TableCell sx={{ py: 1.5 }}>{sec.section_title}</TableCell>
                                      <TableCell sx={{ py: 1.5 }}>{sec.order}</TableCell>
                                      <TableCell sx={{ py: 1.5, fontFamily: "monospace" }}>{q.id}</TableCell>
                                      <TableCell sx={{ py: 1.5, maxWidth: 300 }}>
                                        <Typography variant="body2" fontWeight={500}>
                                          {q.title}
                                        </Typography>
                                        {q.problem_statement && (
                                          <Typography
                                            variant="caption"
                                            sx={{ color: "#6b7280", display: "block", mt: 0.25 }}
                                          >
                                            {(() => {
                                              const text = htmlToPlainText(String(q.problem_statement));
                                              return text.length > 90 ? text.slice(0, 90) + "…" : text;
                                            })()}
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell sx={{ py: 1.5 }}>
                                        {q.difficulty_level ? (
                                          <Chip
                                            label={q.difficulty_level}
                                            size="small"
                                            sx={{
                                              bgcolor:
                                                q.difficulty_level === "Easy"
                                                  ? "#d1fae5"
                                                  : q.difficulty_level === "Medium"
                                                  ? "#fde68a"
                                                  : "#fed7aa",
                                              color:
                                                q.difficulty_level === "Easy"
                                                  ? "#065f46"
                                                  : q.difficulty_level === "Medium"
                                                  ? "#92400e"
                                                  : "#7c2d12",
                                              fontWeight: 600,
                                              fontSize: "0.7rem",
                                            }}
                                          />
                                        ) : (
                                          "—"
                                        )}
                                      </TableCell>
                                      <TableCell sx={{ py: 1.5 }}>{q.tags ?? "—"}</TableCell>
                                      <TableCell sx={{ py: 1.5, textAlign: "center" }}>
                                        <IconButton
                                          size="small"
                                          onClick={() => setPreviewCoding({ section: sec, question: q })}
                                          sx={{ color: "#6366f1" }}
                                          title="Preview"
                                        >
                                          <IconWrapper icon="mdi:eye-outline" size={18} />
                                        </IconButton>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                            <PaginationControls
                              totalItems={totalCodingQuestions}
                              page={codingQuestionsPage}
                              limit={codingQuestionsLimit}
                              onPageChange={setCodingQuestionsPage}
                              onLimitChange={(l) => { setCodingQuestionsLimit(l); setCodingQuestionsPage(1); }}
                              itemLabel="questions"
                            />
                          </>
                        )}
                      </Paper>
                    )}
                  </Box>
                )}

                {/* MCQ Preview Dialog */}
                <Dialog
                  open={!!previewMCQ}
                  onClose={() => setPreviewMCQ(null)}
                  maxWidth="sm"
                  fullWidth
                  PaperProps={{ sx: { borderRadius: 2 } }}
                >
                  <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>MCQ Preview · {previewMCQ?.section.section_title}</span>
                    <IconButton size="small" onClick={() => setPreviewMCQ(null)} aria-label="Close">
                      <IconWrapper icon="mdi:close" size={20} />
                    </IconButton>
                  </DialogTitle>
                  <DialogContent dividers>
                    {previewMCQ && (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <Typography variant="body1">{previewMCQ.question.question_text}</Typography>
                        <Box sx={{ pl: 2 }}>
                          <Typography variant="body2"><strong>A:</strong> {previewMCQ.question.option_a}</Typography>
                          <Typography variant="body2"><strong>B:</strong> {previewMCQ.question.option_b}</Typography>
                          <Typography variant="body2"><strong>C:</strong> {previewMCQ.question.option_c}</Typography>
                          <Typography variant="body2"><strong>D:</strong> {previewMCQ.question.option_d}</Typography>
                        </Box>
                        <Typography variant="body2" color="primary"><strong>Correct:</strong> {previewMCQ.question.correct_option}</Typography>
                        {previewMCQ.question.explanation && (
                          <Typography variant="body2" color="text.secondary">{previewMCQ.question.explanation}</Typography>
                        )}
                        {previewMCQ.question.difficulty_level && (
                          <Chip label={previewMCQ.question.difficulty_level} size="small" />
                        )}
                      </Box>
                    )}
                  </DialogContent>
                </Dialog>

                {/* Coding Preview Dialog */}
                <Dialog
                  open={!!previewCoding}
                  onClose={() => setPreviewCoding(null)}
                  maxWidth="md"
                  fullWidth
                  PaperProps={{ sx: { maxHeight: "90vh", borderRadius: 2 } }}
                >
                  <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Coding Problem Preview · {previewCoding?.section.section_title}</span>
                    <IconButton size="small" onClick={() => setPreviewCoding(null)} aria-label="Close">
                      <IconWrapper icon="mdi:close" size={20} />
                    </IconButton>
                  </DialogTitle>
                  <DialogContent dividers sx={{ p: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    {previewCoding && (
                      <Box sx={{ overflow: "auto", flex: 1, minHeight: 0 }}>
                        <ProblemDescription problemData={codingProblemDataForPreview(previewCoding.question)} />
                      </Box>
                    )}
                  </DialogContent>
                </Dialog>
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
                    disabled={
                      !submissionsData?.submissions?.length ||
                      (readOnly && !hideAdminQuestions)
                    }
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
                              Started At
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Submitted At
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Max Marks
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Score
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Percentage
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                              Attempted
                            </TableCell>
                           
                            <TableCell sx={{ fontWeight: 600, py: 1.5, minWidth: 140 }}>
                              Report
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedSubmissions.map((s, idx) => (
                            <TableRow
                              key={`${s.email}-${s.submitted_at ?? idx}-${(submissionsPage - 1) * submissionsLimit + idx}`}
                              hover
                            >
                              <TableCell sx={{ py: 1.5 }}>{s.name}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>{s.email}</TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {s.phone ?? "—"}
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {formatSubmissionDate(s.started_at)}
                              </TableCell>
                              <TableCell sx={{ py: 1.5 }}>
                                {formatSubmissionDate(s.submitted_at)}
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
                           
                              <TableCell sx={{ py: 0.5, pr: 1, verticalAlign: "middle" }}>
                                <Tooltip title={`Download performance report (PDF) for ${s.name}`} placement="top">
                                  <span>
                                    <Button
                                      size="small"
                                      variant="text"
                                      aria-label={`Download PDF for ${s.name}`}
                                      onClick={() => handleDownloadSubmissionPdf(s)}
                                      disabled={readOnly && !hideAdminQuestions}
                                      startIcon={
                                        <IconWrapper
                                          icon="mdi:file-download-outline"
                                          size={18}
                                          color="#e11d48"
                                        />
                                      }
                                      sx={{
                                        color: "#e11d48",
                                        textTransform: "none",
                                        fontWeight: 400,
                                        fontSize: "0.7125rem",
                                        px: 0.45,
                                        minWidth: 0,
                                        "&:hover": {
                                          bgcolor: "rgba(225, 29, 72, 0.08)",
                                          color: "#be123c",
                                        },
                                        "& .MuiButton-startIcon": {
                                          marginRight: "6px",
                                        },
                                        "&:disabled .MuiButton-startIcon": {
                                          opacity: 0.5,
                                        },
                                      }}
                                    >
                                      Download PDF
                                    </Button>
                                  </span>
                                </Tooltip>
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
                          <PerPageSelect
                            value={submissionsLimit}
                            onChange={(v) => {
                              setSubmissionsLimit(v);
                              setSubmissionsPage(1);
                            }}
                          />
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

            {tab === "analytics" && (
              <>
                <Box
                  className="exclude-from-pdf"
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 2,
                    alignItems: "flex-start",
                    mb: 2,
                  }}
                >
                  <TextField
                    size="small"
                    label="Top performers limit"
                    type="number"
                    inputProps={{ min: 1, max: 100 }}
                    value={analyticsTopNDraft}
                    onChange={(e) => setAnalyticsTopNDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAnalyticsApplyTopPerformers();
                      }
                    }}
                    sx={{ width: 168 }}
                    helperText="1–100. Type a number, then Apply (or press Enter)."
                  />
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, pt: 0.5 }}>
                    <Button
                      variant="contained"
                      onClick={handleAnalyticsApplyTopPerformers}
                      disabled={analyticsLoading}
                      sx={{ textTransform: "none" }}
                    >
                      Apply
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleAnalyticsReload}
                      disabled={analyticsLoading}
                      sx={{ textTransform: "none" }}
                    >
                      Reload
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={
                        <IconWrapper icon="mdi:file-pdf-box" size={18} />
                      }
                      onClick={() => void handleDownloadAnalyticsPdf()}
                      disabled={!analyticsData || analyticsLoading}
                      sx={{
                        bgcolor: "#e11d48",
                        "&:hover": { bgcolor: "#be123c" },
                        textTransform: "none",
                      }}
                    >
                      Download PDF
                    </Button>
                  </Box>
                  {analyticsLoading && (
                    <CircularProgress size={22} sx={{ ml: 0.5, mt: 1 }} />
                  )}
                </Box>

                {analyticsLoading && !analyticsData ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      py: 6,
                    }}
                  >
                    <CircularProgress />
                  </Box>
                ) : !analyticsData ? (
                  <Typography color="text.secondary">
                    Analytics could not be loaded. Check permissions and click
                    Apply or Reload.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      bgcolor: "#ffffff",
                      overflow: "visible",
                      py: 1,
                      px: { xs: 0.5, sm: 1 },
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={800}
                      sx={{ color: "#111827", mb: 0.5 }}
                    >
                      {assessment.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 2 }}
                    >
                      Analytics report · Assessment ID {analyticsData.assessment.id}{" "}
                      · {analyticsData.assessment.slug} · Generated{" "}
                      {new Date().toLocaleString()}
                    </Typography>

                    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <AssessmentAnalyticsCharts data={analyticsData} />

                    {(analyticsData.section_averages ?? []).length > 0 && (
                      <Paper
                        elevation={0}
                        sx={{
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            px: 2,
                            py: 1.5,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            background:
                              "linear-gradient(135deg, rgba(37, 99, 235, 0.06) 0%, rgba(14, 165, 233, 0.04) 100%)",
                          }}
                        >
                          <Box
                            sx={{
                              width: 4,
                              height: 22,
                              borderRadius: 1,
                              bgcolor: "primary.main",
                            }}
                          />
                          <Typography variant="subtitle1" fontWeight={800}>
                            Section averages
                          </Typography>
                          <Chip
                            label={`${totalAnalyticsSectionRows} section${totalAnalyticsSectionRows === 1 ? "" : "s"}`}
                            size="small"
                            sx={{
                              ml: "auto",
                              fontWeight: 600,
                              bgcolor: "background.paper",
                            }}
                          />
                        </Box>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow
                                sx={{
                                  bgcolor: "grey.50",
                                  "& .MuiTableCell-head": {
                                    fontWeight: 700,
                                    fontSize: "0.7rem",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    color: "text.secondary",
                                    py: 1.25,
                                  },
                                }}
                              >
                                <TableCell>Section</TableCell>
                                <TableCell align="right">Avg score</TableCell>
                                <TableCell align="right">Max</TableCell>
                                <TableCell sx={{ minWidth: 160 }}>
                                  Avg performance
                                </TableCell>
                                <TableCell align="right">Submissions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {paginatedAnalyticsSectionAverages.map((sec) => {
                                const pct = clampPercentDisplay(
                                  sec.average_percentage,
                                );
                                const barColor =
                                  pct >= 70
                                    ? "success.main"
                                    : pct >= 40
                                      ? "warning.main"
                                      : "error.main";
                                return (
                                  <TableRow
                                    key={sec.section_title}
                                    hover
                                    sx={{
                                      "&:last-of-type td": { borderBottom: 0 },
                                    }}
                                  >
                                    <TableCell sx={{ fontWeight: 600, py: 1.5 }}>
                                      {sec.section_title}
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                      {sec.average_score?.toFixed(1) ?? "—"}
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                      {sec.max_score?.toFixed(1) ?? "—"}
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                      <Stack
                                        direction="row"
                                        alignItems="center"
                                        spacing={1.25}
                                      >
                                        <LinearProgress
                                          variant="determinate"
                                          value={pct}
                                          sx={{
                                            flex: 1,
                                            minWidth: 72,
                                            height: 8,
                                            borderRadius: 1,
                                            bgcolor: "grey.200",
                                            "& .MuiLinearProgress-bar": {
                                              borderRadius: 1,
                                              bgcolor: barColor,
                                            },
                                          }}
                                        />
                                        <Typography
                                          variant="body2"
                                          fontWeight={700}
                                          sx={{
                                            minWidth: 44,
                                            textAlign: "right",
                                            color: "text.primary",
                                          }}
                                        >
                                          {sec.average_percentage != null &&
                                          Number.isFinite(sec.average_percentage)
                                            ? `${sec.average_percentage.toFixed(1)}%`
                                            : "—"}
                                        </Typography>
                                      </Stack>
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                      <Chip
                                        label={sec.submissions_count}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontWeight: 600 }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {totalAnalyticsSectionRows > 0 && (
                          <Box
                            className="exclude-from-pdf"
                            sx={{
                              px: 2,
                              py: 1.5,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 2,
                              borderTop: "1px solid",
                              borderColor: "divider",
                              bgcolor: "grey.50",
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
                              <Typography variant="body2" color="text.secondary">
                                Showing{" "}
                                {(analyticsSectionPage - 1) *
                                  analyticsSectionLimit +
                                  1}{" "}
                                to{" "}
                                {Math.min(
                                  totalAnalyticsSectionRows,
                                  analyticsSectionPage * analyticsSectionLimit,
                                )}{" "}
                                of {totalAnalyticsSectionRows}
                              </Typography>
                              <PerPageSelect
                                value={analyticsSectionLimit}
                                onChange={(v) => {
                                  setAnalyticsSectionLimit(v);
                                  setAnalyticsSectionPage(1);
                                }}
                                options={[10, 12, 20, 25, 50, 100]}
                              />
                            </Box>
                            <Pagination
                              count={Math.ceil(
                                totalAnalyticsSectionRows / analyticsSectionLimit,
                              )}
                              page={analyticsSectionPage}
                              onChange={(_, v) => setAnalyticsSectionPage(v)}
                              color="primary"
                              size="small"
                              showFirstButton={false}
                              showLastButton={false}
                              boundaryCount={1}
                              siblingCount={0}
                              disabled={
                                Math.ceil(
                                  totalAnalyticsSectionRows /
                                    analyticsSectionLimit,
                                ) <= 1
                              }
                            />
                          </Box>
                        )}
                      </Paper>
                    )}

                    {(analyticsData.top_performers ?? []).length > 0 && (
                      <Paper
                        elevation={0}
                        sx={{
                          borderRadius: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            px: 2,
                            py: 1.5,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            background:
                              "linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(245, 158, 11, 0.06) 100%)",
                          }}
                        >
                          <Box
                            sx={{
                              width: 4,
                              height: 22,
                              borderRadius: 1,
                              bgcolor: "warning.main",
                            }}
                          />
                          <Typography variant="subtitle1" fontWeight={800}>
                            Top performers
                          </Typography>
                          <Chip
                            label={`${totalAnalyticsTopPerformersRows} ranked`}
                            size="small"
                            sx={{
                              ml: "auto",
                              fontWeight: 600,
                              bgcolor: "background.paper",
                            }}
                          />
                        </Box>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow
                                sx={{
                                  bgcolor: "grey.50",
                                  "& .MuiTableCell-head": {
                                    fontWeight: 700,
                                    fontSize: "0.7rem",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.06em",
                                    color: "text.secondary",
                                    py: 1.25,
                                  },
                                }}
                              >
                                <TableCell width={56}>Rank</TableCell>
                                <TableCell>Learner</TableCell>
                                <TableCell align="right">Score</TableCell>
                                <TableCell align="right">Result</TableCell>
                                <TableCell align="right">Time</TableCell>
                                <TableCell>Submitted</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {paginatedAnalyticsTopPerformers.map((row) => {
                                const rank = row.rank ?? 0;
                                const pct = row.percentage;
                                const pctChip =
                                  pct != null && Number.isFinite(pct)
                                    ? pct >= 80
                                      ? "success"
                                      : pct >= 50
                                        ? "warning"
                                        : "default"
                                    : "default";
                                return (
                                  <TableRow
                                    key={`${row.rank}-${row.user_profile_id}`}
                                    hover
                                    sx={{
                                      "&:last-of-type td": { borderBottom: 0 },
                                    }}
                                  >
                                    <TableCell sx={{ py: 1.5 }}>
                                      <Chip
                                        label={`#${rank}`}
                                        size="small"
                                        color={
                                          rank === 1
                                            ? "warning"
                                            : rank <= 3
                                              ? "primary"
                                              : "default"
                                        }
                                        variant={
                                          rank <= 3 ? "filled" : "outlined"
                                        }
                                        sx={{ fontWeight: 800, minWidth: 40 }}
                                      />
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                      <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        sx={{ lineHeight: 1.3 }}
                                      >
                                        {row.name || "—"}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                          display: "block",
                                          mt: 0.25,
                                          wordBreak: "break-word",
                                        }}
                                      >
                                        {row.email || ""}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                      <Typography variant="body2" fontWeight={700}>
                                        {row.score != null &&
                                        Number.isFinite(row.score)
                                          ? row.score.toFixed(1)
                                          : "—"}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                      {pct != null && Number.isFinite(pct) ? (
                                        <Chip
                                          label={`${pct.toFixed(1)}%`}
                                          size="small"
                                          color={pctChip}
                                          variant="outlined"
                                          sx={{ fontWeight: 700 }}
                                        />
                                      ) : (
                                        "—"
                                      )}
                                    </TableCell>
                                    <TableCell align="right" sx={{ py: 1.5 }}>
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        {row.time_taken_minutes != null
                                          ? `${row.time_taken_minutes} min`
                                          : "—"}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ py: 1.5 }}>
                                      <Typography variant="body2">
                                        {formatSubmissionDate(row.submitted_at)}
                                      </Typography>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {totalAnalyticsTopPerformersRows > 0 && (
                          <Box
                            className="exclude-from-pdf"
                            sx={{
                              px: 2,
                              py: 1.5,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: 2,
                              borderTop: "1px solid",
                              borderColor: "divider",
                              bgcolor: "grey.50",
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
                              <Typography variant="body2" color="text.secondary">
                                Showing{" "}
                                {(analyticsTopPerformersTablePage - 1) *
                                  analyticsTopPerformersTableLimit +
                                  1}{" "}
                                to{" "}
                                {Math.min(
                                  totalAnalyticsTopPerformersRows,
                                  analyticsTopPerformersTablePage *
                                    analyticsTopPerformersTableLimit,
                                )}{" "}
                                of {totalAnalyticsTopPerformersRows}
                              </Typography>
                              <PerPageSelect
                                value={analyticsTopPerformersTableLimit}
                                onChange={(v) => {
                                  setAnalyticsTopPerformersTableLimit(v);
                                  setAnalyticsTopPerformersTablePage(1);
                                }}
                                options={[10, 12, 20, 25, 50, 100]}
                              />
                            </Box>
                            <Pagination
                              count={Math.ceil(
                                totalAnalyticsTopPerformersRows /
                                  analyticsTopPerformersTableLimit,
                              )}
                              page={analyticsTopPerformersTablePage}
                              onChange={(_, v) =>
                                setAnalyticsTopPerformersTablePage(v)
                              }
                              color="primary"
                              size="small"
                              showFirstButton={false}
                              showLastButton={false}
                              boundaryCount={1}
                              siblingCount={0}
                              disabled={
                                Math.ceil(
                                  totalAnalyticsTopPerformersRows /
                                    analyticsTopPerformersTableLimit,
                                ) <= 1
                              }
                            />
                          </Box>
                        )}
                      </Paper>
                    )}

                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          px: 2,
                          py: 1.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                          background:
                            "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(14, 165, 233, 0.05) 100%)",
                        }}
                      >
                        <Box
                          sx={{
                            width: 4,
                            height: 22,
                            borderRadius: 1,
                            bgcolor: "secondary.main",
                          }}
                        />
                        <Typography variant="subtitle1" fontWeight={800}>
                          All submissions
                        </Typography>
                        <Chip
                          label={`${totalAnalyticsStudents} total`}
                          size="small"
                          sx={{
                            ml: "auto",
                            fontWeight: 600,
                            bgcolor: "background.paper",
                          }}
                        />
                      </Box>
                      {totalAnalyticsStudents === 0 ? (
                        <Box sx={{ px: 2, py: 4 }}>
                          <Typography color="text.secondary" variant="body2">
                            No rows returned.
                          </Typography>
                        </Box>
                      ) : (
                        <>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow
                                  sx={{
                                    bgcolor: "grey.50",
                                    "& .MuiTableCell-head": {
                                      fontWeight: 700,
                                      fontSize: "0.7rem",
                                      textTransform: "uppercase",
                                      letterSpacing: "0.06em",
                                      color: "text.secondary",
                                      py: 1.25,
                                    },
                                  }}
                                >
                                  <TableCell>Learner</TableCell>
                                  <TableCell>Status</TableCell>
                                  <TableCell align="right">Score</TableCell>
                                  <TableCell align="right">%</TableCell>
                                  <TableCell align="right">Time</TableCell>
                                  <TableCell align="right">Progress</TableCell>
                                  <TableCell>Submitted</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {paginatedAnalyticsStudents.map((row) => {
                                  const stColor = analyticsStatusChipColor(
                                    row.status,
                                  );
                                  return (
                                    <TableRow
                                      key={row.submission_id ?? row.user_profile_id}
                                      hover
                                      sx={{
                                        "&:last-of-type td": { borderBottom: 0 },
                                      }}
                                    >
                                      <TableCell sx={{ py: 1.5, maxWidth: 220 }}>
                                        <Typography
                                          variant="body2"
                                          fontWeight={700}
                                          sx={{ lineHeight: 1.3 }}
                                        >
                                          {row.name || "—"}
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                          sx={{
                                            display: "block",
                                            mt: 0.25,
                                            wordBreak: "break-word",
                                          }}
                                        >
                                          {row.email || ""}
                                        </Typography>
                                      </TableCell>
                                      <TableCell sx={{ py: 1.5 }}>
                                        <Chip
                                          label={humanizeAnalyticsStatus(
                                            row.status,
                                          )}
                                          size="small"
                                          color={stColor}
                                          variant={
                                            stColor === "default"
                                              ? "outlined"
                                              : "filled"
                                          }
                                          sx={{ fontWeight: 600 }}
                                        />
                                      </TableCell>
                                      <TableCell align="right" sx={{ py: 1.5 }}>
                                        <Typography variant="body2" fontWeight={600}>
                                          {row.score != null
                                            ? row.score.toFixed(1)
                                            : "—"}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right" sx={{ py: 1.5 }}>
                                        {row.percentage != null ? (
                                          <Chip
                                            label={`${row.percentage.toFixed(1)}%`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontWeight: 600 }}
                                          />
                                        ) : (
                                          <Typography
                                            variant="body2"
                                            color="text.disabled"
                                          >
                                            —
                                          </Typography>
                                        )}
                                      </TableCell>
                                      <TableCell align="right" sx={{ py: 1.5 }}>
                                        <Typography
                                          variant="body2"
                                          color="text.secondary"
                                        >
                                          {row.time_taken_minutes != null
                                            ? `${row.time_taken_minutes} min`
                                            : "—"}
                                        </Typography>
                                      </TableCell>
                                      <TableCell align="right" sx={{ py: 1.5 }}>
                                        {row.attempted_questions != null &&
                                        row.total_questions != null ? (
                                          <Typography
                                            variant="body2"
                                            fontWeight={600}
                                            sx={{
                                              fontVariantNumeric: "tabular-nums",
                                            }}
                                          >
                                            {row.attempted_questions}/
                                            {row.total_questions}
                                          </Typography>
                                        ) : (
                                          "—"
                                        )}
                                      </TableCell>
                                      <TableCell sx={{ py: 1.5 }}>
                                        <Typography variant="body2">
                                          {formatSubmissionDate(row.submitted_at)}
                                        </Typography>
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          {totalAnalyticsStudents > 0 && (
                            <Box
                              className="exclude-from-pdf"
                              sx={{
                                px: 2,
                                py: 1.5,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                flexWrap: "wrap",
                                gap: 2,
                                borderTop: "1px solid",
                                borderColor: "divider",
                                bgcolor: "grey.50",
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
                                <Typography variant="body2" color="text.secondary">
                                  Showing{" "}
                                  {(analyticsStudentsPage - 1) *
                                    analyticsStudentsLimit +
                                    1}{" "}
                                  to{" "}
                                  {Math.min(
                                    totalAnalyticsStudents,
                                    analyticsStudentsPage *
                                      analyticsStudentsLimit,
                                  )}{" "}
                                  of {totalAnalyticsStudents}
                                </Typography>
                                <PerPageSelect
                                  value={analyticsStudentsLimit}
                                  onChange={(v) => {
                                    setAnalyticsStudentsLimit(v);
                                    setAnalyticsStudentsPage(1);
                                  }}
                                  options={[10, 12, 20, 25, 50, 100]}
                                />
                              </Box>
                              <Pagination
                                count={Math.ceil(
                                  totalAnalyticsStudents /
                                    analyticsStudentsLimit,
                                )}
                                page={analyticsStudentsPage}
                                onChange={(_, v) => setAnalyticsStudentsPage(v)}
                                color="primary"
                                size="small"
                                showFirstButton={false}
                                showLastButton={false}
                                boundaryCount={1}
                                siblingCount={0}
                                disabled={
                                  Math.ceil(
                                    totalAnalyticsStudents /
                                      analyticsStudentsLimit,
                                  ) <= 1
                                }
                              />
                            </Box>
                          )}
                        </>
                      )}
                    </Paper>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
}
