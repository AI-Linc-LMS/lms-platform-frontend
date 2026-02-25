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
  CircularProgress,
  Button,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { AdminInterviewListItem } from "@/lib/services/admin/admin-mock-interview.service";
import { PaginationControls } from "@/components/admin/assessment/PaginationControls";

interface MockInterviewTableProps {
  interviews: AdminInterviewListItem[];
  loading: boolean;
  pagination: {
    current_page: number;
    total_pages: number;
    total_interviews: number;
    limit: number;
  };
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onExport?: () => void;
  exporting?: boolean;
}

const STATUS_COLORS: Record<string, "default" | "primary" | "success" | "warning" | "error"> = {
  completed: "success",
  in_progress: "primary",
  scheduled: "default",
  cancelled: "error",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: "#22c55e",
  Medium: "#f59e0b",
  Hard: "#ef4444",
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MockInterviewTable({
  interviews,
  loading,
  pagination,
  onPageChange,
  onLimitChange,
  onExport,
  exporting,
}: MockInterviewTableProps) {
  const router = useRouter();

  const handleRowClick = (id: number) => {
    router.push(`/admin/admin-mock-interview/interviews/${id}`);
  };

  if (loading) {
    return (
      <Paper
        sx={{
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        borderRadius: 2,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
          Interviews
        </Typography>
        {onExport && (
          <Button
            variant="outlined"
            size="small"
            startIcon={
              exporting ? (
                <CircularProgress size={16} />
              ) : (
                <IconWrapper icon="mdi:download" size={18} />
              )
            }
            onClick={onExport}
            disabled={exporting || interviews.length === 0}
            sx={{
              borderColor: "#6366f1",
              color: "#6366f1",
              "&:hover": {
                borderColor: "#4f46e5",
                backgroundColor: "#eef2ff",
              },
              "&.Mui-disabled": {
                borderColor: "#e5e7eb",
                color: "#9ca3af",
              },
            }}
          >
            Export CSV
          </Button>
        )}
      </Box>
      {interviews.length === 0 ? (
        <Box
          sx={{
            p: 6,
            textAlign: "center",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              backgroundColor: "#eef2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <IconWrapper
              icon="mdi:clipboard-text-outline"
              size={36}
              color="#6366f1"
            />
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 500, color: "#374151", mb: 0.5 }}>
            No interviews found
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Try adjusting your filters or date range
          </Typography>
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
                    Title
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    Student
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    Topic
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    Difficulty
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    Score
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb" }}>
                    Created
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "#f9fafb", width: 100 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {interviews.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
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
                        {row.subtopic ? `${row.topic} / ${row.subtopic}` : row.topic}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.difficulty}
                        size="small"
                        sx={{
                          backgroundColor: `${DIFFICULTY_COLORS[row.difficulty] || "#6b7280"}20`,
                          color: DIFFICULTY_COLORS[row.difficulty] || "#374151",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.status.replace("_", " ")}
                        size="small"
                        color={STATUS_COLORS[row.status] || "default"}
                        sx={{ textTransform: "capitalize", fontSize: "0.7rem" }}
                      />
                    </TableCell>
                    <TableCell>
                      {row.overall_score != null ? (
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color:
                              (row.overall_score ?? 0) >= 70
                                ? "#16a34a"
                                : (row.overall_score ?? 0) >= 50
                                ? "#d97706"
                                : "#dc2626",
                          }}
                        >
                          {row.overall_score}%
                        </Typography>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        {formatDate(row.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(row.id);
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
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <PaginationControls
            totalItems={pagination.total_interviews}
            page={Math.max(1, pagination.current_page)}
            limit={pagination.limit}
            onPageChange={onPageChange}
            onLimitChange={(v) => {
              onLimitChange(v);
              onPageChange(1);
            }}
            itemLabel="interviews"
          />
        </>
      )}
    </Paper>
  );
}
