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
import { useTranslation } from "react-i18next";
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
  Easy: "var(--success-500)",
  Medium: "var(--warning-500)",
  Hard: "var(--error-500)",
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
  const { t } = useTranslation("common");
  const router = useRouter();

  const handleRowClick = (id: number) => {
    router.push(`/admin/admin-mock-interview/interviews/${id}`);
  };

  if (loading) {
    return (
      <Paper
        sx={{
          borderRadius: 2,
          boxShadow:
            "0 1px 3px color-mix(in srgb, var(--font-primary) 12%, transparent)",
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
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 12%, transparent)",
        overflow: "hidden",
        backgroundColor: "var(--card-bg)",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-default)",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
          {t("adminMockInterview.tabInterviews")}
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
              borderColor: "var(--accent-indigo)",
              color: "var(--accent-indigo)",
              "&:hover": {
                borderColor: "var(--accent-indigo-dark)",
                backgroundColor:
                  "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
              },
              "&.Mui-disabled": {
                borderColor: "var(--border-default)",
                color: "var(--font-secondary)",
              },
            }}
          >
            {t("adminMockInterview.exportCSV")}
          </Button>
        )}
      </Box>
      {interviews.length === 0 ? (
        <Box
          sx={{
            p: 6,
            textAlign: "center",
            borderTop: "1px solid var(--border-default)",
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              backgroundColor:
                "color-mix(in srgb, var(--accent-indigo) 12%, var(--surface) 88%)",
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
              color="var(--accent-indigo)"
            />
          </Box>
          <Typography variant="body1" sx={{ fontWeight: 500, color: "var(--font-primary)", mb: 0.5 }}>
            {t("adminMockInterview.noInterviewsFound")}
          </Typography>
          <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
            {t("adminMockInterview.tryAdjustingFilters")}
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
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--surface)" }}>
                    {t("adminMockInterview.titleColumn")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--surface)" }}>
                    {t("adminMockInterview.student")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--surface)" }}>
                    {t("adminMockInterview.topic")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--surface)" }}>
                    {t("adminMockInterview.difficulty")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--surface)" }}>
                    {t("adminMockInterview.status")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--surface)" }}>
                    {t("adminMockInterview.score")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--surface)" }}>
                    {t("adminMockInterview.created")}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, backgroundColor: "var(--surface)", width: 100 }}>
                    {t("adminMockInterview.actions")}
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
                          sx={{ color: "var(--font-secondary)", fontSize: "0.7rem" }}
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
                          backgroundColor:
                            row.difficulty === "Easy"
                              ? "color-mix(in srgb, var(--success-500) 16%, transparent)"
                              : row.difficulty === "Medium"
                                ? "color-mix(in srgb, var(--warning-500) 16%, transparent)"
                                : row.difficulty === "Hard"
                                  ? "color-mix(in srgb, var(--error-500) 16%, transparent)"
                                  : "color-mix(in srgb, var(--font-secondary) 14%, transparent)",
                          color: DIFFICULTY_COLORS[row.difficulty] || "var(--font-primary)",
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
                                ? "var(--success-500)"
                                : (row.overall_score ?? 0) >= 50
                                ? "var(--warning-500)"
                                : "var(--error-500)",
                          }}
                        >
                          {row.overall_score}%
                        </Typography>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
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
                          borderColor: "var(--accent-indigo)",
                          color: "var(--accent-indigo)",
                          textTransform: "none",
                          fontWeight: 600,
                          "&:hover": {
                            borderColor: "var(--accent-indigo-dark)",
                            backgroundColor:
                              "color-mix(in srgb, var(--accent-indigo) 10%, var(--surface) 90%)",
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
            totalItems={pagination.total_interviews}
            page={Math.max(1, pagination.current_page)}
            limit={pagination.limit}
            onPageChange={onPageChange}
            onLimitChange={(v) => {
              onLimitChange(v);
              onPageChange(1);
            }}
            itemLabel={t("adminMockInterview.itemLabelInterviews")}
          />
        </>
      )}
    </Paper>
  );
}
