"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [proctoringFilter, setProctoringFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [paidFilter, setPaidFilter] = useState<"all" | "paid" | "free">("all");

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

  // Filter assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      // Search filter (title, courses, colleges)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle =
          assessment.title.toLowerCase().includes(query) ||
          assessment.slug.toLowerCase().includes(query) ||
          assessment.description?.toLowerCase().includes(query);
        
        const matchesCourses = assessment.courses?.some(
          (course) => course.title.toLowerCase().includes(query)
        ) || false;
        
        const matchesColleges = assessment.colleges?.some(
          (college) => college.toLowerCase().includes(query)
        ) || false;
        
        if (!matchesTitle && !matchesCourses && !matchesColleges) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "active" && !assessment.is_active) return false;
        if (statusFilter === "inactive" && assessment.is_active) return false;
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

      return true;
    });
  }, [assessments, searchQuery, statusFilter, proctoringFilter, paidFilter]);

  // Client-side pagination
  const paginatedAssessments = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredAssessments.slice(startIndex, endIndex);
  }, [filteredAssessments, page, limit]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, proctoringFilter, paidFilter]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setProctoringFilter("all");
    setPaidFilter("all");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    statusFilter !== "all" ||
    proctoringFilter !== "all" ||
    paidFilter !== "all";

  return (
    <MainLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            mb: 4,
            flexDirection: { xs: "column", sm: "row" },
            gap: 3,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#0f172a",
                fontSize: { xs: "1.5rem", sm: "2rem" },
                mb: 0.5,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Assessment Management
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#64748b",
                fontSize: "0.875rem",
                mt: 0.5,
              }}
            >
              Manage and monitor all your assessments in one place
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<IconWrapper icon="mdi:plus" size={20} />}
            onClick={() => router.push("/admin/assessment/create")}
            fullWidth={false}
            sx={{
              bgcolor: "#6366f1",
              color: "#ffffff",
              fontWeight: 600,
              px: { xs: 2, sm: 3 },
              py: 1.25,
              borderRadius: 2,
              width: { xs: "100%", sm: "auto" },
              boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.3)",
              "&:hover": {
                bgcolor: "#4f46e5",
                boxShadow: "0 10px 15px -3px rgba(99, 102, 241, 0.4)",
                transform: { xs: "none", sm: "translateY(-1px)" },
              },
              transition: "all 0.2s ease",
            }}
          >
            Create Assessment
          </Button>
        </Box>

        {/* Filters */}
        <Paper
          sx={{
            p: { xs: 2, sm: 2.5 },
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            border: "1px solid #e2e8f0",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "2fr 1fr 1fr 1fr auto",
              },
              gap: 2,
              alignItems: "center",
            }}
          >
            <TextField
              placeholder="Search by title, courses, or colleges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconWrapper icon="mdi:magnify" size={20} color="#9ca3af" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "#ffffff",
                },
              }}
              fullWidth
            />

            <FormControl fullWidth>
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

            <FormControl fullWidth>
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

            <FormControl fullWidth>
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

            {hasActiveFilters && (
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                startIcon={<IconWrapper icon="mdi:close" size={18} />}
                sx={{
                  borderColor: "#d1d5db",
                  color: "#6b7280",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    borderColor: "#9ca3af",
                    backgroundColor: "#f9fafb",
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
              <Typography variant="caption" sx={{ color: "#64748b", mr: 1, alignSelf: "center" }}>
                Active filters:
              </Typography>
              {searchQuery && (
                <Chip
                  label={`Search: "${searchQuery}"`}
                  size="small"
                  onDelete={() => setSearchQuery("")}
                  sx={{ bgcolor: "#eef2ff", color: "#6366f1" }}
                />
              )}
              {statusFilter !== "all" && (
                <Chip
                  label={`Status: ${statusFilter}`}
                  size="small"
                  onDelete={() => setStatusFilter("all")}
                  sx={{ bgcolor: "#eef2ff", color: "#6366f1" }}
                />
              )}
              {proctoringFilter !== "all" && (
                <Chip
                  label={`Proctoring: ${proctoringFilter}`}
                  size="small"
                  onDelete={() => setProctoringFilter("all")}
                  sx={{ bgcolor: "#eef2ff", color: "#6366f1" }}
                />
              )}
              {paidFilter !== "all" && (
                <Chip
                  label={`Payment: ${paidFilter}`}
                  size="small"
                  onDelete={() => setPaidFilter("all")}
                  sx={{ bgcolor: "#eef2ff", color: "#6366f1" }}
                />
              )}
            </Box>
          )}

          {/* Results count */}
          {hasActiveFilters && (
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" sx={{ color: "#64748b" }}>
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
            <CircularProgress size={48} sx={{ color: "#6366f1" }} />
          </Box>
        ) : (
          <Paper
            sx={{
              borderRadius: 3,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
            }}
          >
            <AssessmentTable
              assessments={paginatedAssessments}
              onEdit={(id) => router.push(`/admin/assessment/${id}/edit`)}
              onDelete={handleDeleteClick}
              onExportSubmissions={handleExportSubmissions}
              onExportQuestions={handleExportQuestions}
              exportingSubmissionsId={exportingSubmissionsId}
              exportingQuestionsId={exportingQuestionsId}
              deletingId={deleting && assessmentToDelete ? assessmentToDelete.id : null}
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
      </Box>
    </MainLayout>
  );
}
