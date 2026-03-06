"use client";

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { AdminStudentListItem } from "@/lib/services/admin/admin-mock-interview.service";
import { PaginationControls } from "@/components/admin/assessment/PaginationControls";

interface MockInterviewStudentTableProps {
  students: AdminStudentListItem[];
  loading: boolean;
  pagination: {
    current_page: number;
    total_pages: number;
    total_students: number;
    limit: number;
  };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function MockInterviewStudentTable({
  students,
  loading,
  pagination,
  onPageChange,
  onLimitChange,
}: MockInterviewStudentTableProps) {
  const { t } = useTranslation("common");
  const router = useRouter();

  const handleRowClick = (studentId: number) => {
    router.push(`/admin/admin-mock-interview/students/${studentId}`);
  };

  if (loading) {
    return (
      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "1px solid #e5e7eb",
        }}
      >
        <Box sx={{ p: 3, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 120, height: 24, borderRadius: 1, bgcolor: "#f3f4f6" }} />
          <Box sx={{ width: 80, height: 24, borderRadius: 1, bgcolor: "#f3f4f6" }} />
        </Box>
        <Box sx={{ p: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Box sx={{ width: 64, height: 64, borderRadius: "50%", bgcolor: "#f3f4f6" }} />
          <Box sx={{ width: 200, height: 20, borderRadius: 1, bgcolor: "#f3f4f6" }} />
          <Box sx={{ width: 160, height: 16, borderRadius: 1, bgcolor: "#f9fafb" }} />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        overflow: "hidden",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        },
      }}
    >
      <Box
        sx={{
          p: 2.5,
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          gap: 2,
          backgroundColor: "#fafafa",
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            backgroundColor: "#eef2ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:account-group" size={22} color="#6366f1" />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
            {t("adminMockInterview.studentsSection")}
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280" }}>
            {t("adminMockInterview.clickRowForReport")}
          </Typography>
        </Box>
        {pagination.total_students > 0 && (
          <Box
            sx={{
              ml: "auto",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              backgroundColor: "#eef2ff",
              color: "#6366f1",
              fontWeight: 600,
              fontSize: "0.8125rem",
            }}
          >
            {pagination.total_students} {t("adminMockInterview.total")}
          </Box>
        )}
      </Box>
      {students.length === 0 ? (
        <Box
          sx={{
            p: 6,
            textAlign: "center",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
              border: "2px solid #c7d2fe",
            }}
          >
            <IconWrapper icon="mdi:account-group-outline" size={48} color="#6366f1" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", mb: 0.5 }}>
            {t("adminMockInterview.noStudentsFound")}
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", maxWidth: 360, mx: "auto", mb: 2 }}>
            {t("adminMockInterview.studentsAppearWhenComplete")}
          </Typography>
          <Box
            sx={{
              display: "inline-flex",
              gap: 1,
              p: 1.5,
              borderRadius: 2,
              backgroundColor: "#f9fafb",
              border: "1px dashed #e5e7eb",
            }}
          >
            <Typography variant="caption" sx={{ color: "#6b7280" }}>
              {t("adminMockInterview.tipSearchNameOrEmail")}
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          <TableContainer
            sx={{
              maxHeight: { xs: "60vh", sm: "none" },
              overflowX: "auto",
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    {t("adminMockInterview.student")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    {t("adminMockInterview.completedColumn")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    {t("adminMockInterview.avgScore")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    {t("adminMockInterview.highestColumn")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    {t("adminMockInterview.completion")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    {t("adminMockInterview.topics")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    {t("adminMockInterview.lastInterview")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb", width: 100 }}>
                    {t("adminMockInterview.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {students.map((row) => (
                  <TableRow key={row.student_id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.student_name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "#6b7280", fontSize: "0.7rem" }}
                        >
                          {row.student_email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {row.completed_interviews}/{row.total_interviews}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color:
                            row.average_score >= 70
                              ? "#16a34a"
                              : row.average_score >= 50
                              ? "#d97706"
                              : "#dc2626",
                        }}
                      >
                        {row.average_score?.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: "#16a34a" }}>
                        {row.highest_score}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${row.completion_rate?.toFixed(0) ?? 0}%`}
                        size="small"
                        sx={{
                          backgroundColor: "#dcfce7",
                          color: "#16a34a",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 120 }}>
                        {row.topics_attempted?.slice(0, 2).join(", ") ?? "-"}
                        {(row.topics_attempted?.length ?? 0) > 2 ? "..." : ""}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        {formatDate(row.last_interview_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(row.student_id);
                        }}
                        sx={{
                          borderColor: "#6366f1",
                          color: "#6366f1",
                          textTransform: "none",
                          fontWeight: 600,
                          "&:hover": {
                            borderColor: "#4f46e5",
                            backgroundColor: "#eef2ff",
                          },
                        }}
                      >
                        {t("adminMockInterview.view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <PaginationControls
            totalItems={pagination.total_students}
            page={Math.max(1, pagination.current_page)}
            limit={pagination.limit}
            onPageChange={onPageChange}
            onLimitChange={(v) => {
              onLimitChange(v);
              onPageChange(1);
            }}
            itemLabel={t("adminMockInterview.itemLabelStudents")}
          />
        </>
      )}
    </Paper>
  );
}
