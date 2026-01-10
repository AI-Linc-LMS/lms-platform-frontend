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
import { DeleteConfirmationModal } from "@/components/admin/assessment/DeleteConfirmationModal";

export default function AssessmentPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingAssessment, setDeletingAssessment] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteClick = (assessmentId: number, title: string) => {
    setDeletingAssessment({ id: assessmentId, title });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAssessment) return;

    try {
      setDeleting(true);
      await adminAssessmentService.deleteAssessment(
        config.clientId,
        deletingAssessment.id
      );
      showToast("Assessment deleted successfully", "success");
      setDeleteModalOpen(false);
      setDeletingAssessment(null);
      loadAssessments();
    } catch (error: any) {
      showToast(error?.message || "Failed to delete assessment", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setDeletingAssessment(null);
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
              onDelete={handleDeleteClick}
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

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          open={deleteModalOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          title={deletingAssessment?.title || ""}
          loading={deleting}
        />
      </Box>
    </MainLayout>
  );
}
