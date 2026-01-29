"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
} from "@mui/material";
import { MainLayout } from "@/components/layout/MainLayout";
import { useToast } from "@/components/common/Toast";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  adminAssessmentService,
  Assessment,
} from "@/lib/services/admin/admin-assessment.service";
import { config } from "@/lib/config";
import { AssessmentTable } from "@/components/admin/assessment/AssessmentTable";
import { AssessmentPagination } from "@/components/admin/assessment/AssessmentPagination";

export default function AssessmentPage() {
  const { showToast } = useToast();
  const router = useRouter();
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

  useEffect(() => {
    loadAssessments();
  }, []);

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

      const rows: Record<string, unknown>[] = data.submissions.map((s) => {
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

      // Flatten sections/questions into table rows (same format as edit page)
      const flat: Record<string, unknown>[] = [];
      for (const sec of data.sections) {
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
      a.download = `assessment-${data.assessment.slug || assessment.id}-questions.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Questions exported successfully", "success");
    } catch (error: any) {
      showToast(
        error?.message || "Failed to export questions",
        "error"
      );
    } finally {
      setExportingQuestionsId(null);
    }
  };

  // Client-side pagination
  const paginatedAssessments = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return assessments.slice(startIndex, endIndex);
  }, [assessments, page, limit]);

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#111827",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            Assessments
          </Typography>
          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:plus" size={20} />}
            onClick={() => router.push("/admin/assessment/create")}
            sx={{
              bgcolor: "#6366f1",
              "&:hover": { bgcolor: "#4f46e5" },
            }}
          >
            Create Assessment
          </Button>
        </Box>

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
            <CircularProgress />
          </Box>
        ) : (
          <Paper
            sx={{
              borderRadius: 2,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            <AssessmentTable
              assessments={paginatedAssessments}
              onEdit={(id) => router.push(`/admin/assessment/${id}/edit`)}
              onExportSubmissions={handleExportSubmissions}
              onExportQuestions={handleExportQuestions}
              exportingSubmissionsId={exportingSubmissionsId}
              exportingQuestionsId={exportingQuestionsId}
            />
            {assessments.length > 0 && (
              <AssessmentPagination
                totalCount={assessments.length}
                page={page}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={setLimit}
              />
            )}
          </Paper>
        )}

      </Box>
    </MainLayout>
  );
}
