"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import { useAuth } from "@/lib/auth/auth-context";
import { isClientOrgAdminRole } from "@/lib/auth/role-utils";
import {
  adminStudentEnrollmentService,
  StudentEnrollmentJob,
  EnrollmentJobStatus as JobStatus,
} from "@/lib/services/admin/admin-student-enrollment.service";
import { EnrollmentJobStatus } from "./EnrollmentJobStatus";

function formatJobDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

interface EnrollmentJobHistoryProps {
  onJobSelect?: (taskId: string) => void;
  /** When true, omit the section title (e.g. parent panel already shows it). */
  embedded?: boolean;
}

export function EnrollmentJobHistory({
  onJobSelect,
  embedded = false,
}: EnrollmentJobHistoryProps) {
  const { showToast } = useToast();
  const { t } = useTranslation("common");
  const { user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<StudentEnrollmentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Backend allows enrollment jobs list only for admin/superadmin — skip for course_manager etc.
  const loadJobs = useCallback(async () => {
    if (!isClientOrgAdminRole(user?.role)) {
      setJobs([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const jobsData = await adminStudentEnrollmentService.listAllJobs();
      setJobs(jobsData);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : String(error ?? "");
      showToast(message || t("adminManageStudents.failedToLoadJobHistory"), "error");
    } finally {
      setLoading(false);
    }
  }, [t, showToast, user?.role]);

  useEffect(() => {
    if (authLoading) return;
    loadJobs();
  }, [authLoading, loadJobs]);

  const getStatusColor = (status: JobStatus): "default" | "primary" | "success" | "error" => {
    switch (status) {
      case "PENDING":
        return "default";
      case "IN_PROGRESS":
        return "primary";
      case "COMPLETED":
        return "success";
      case "FAILED":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: JobStatus): string => {
    switch (status) {
      case "PENDING":
        return t("adminManageStudents.pending");
      case "IN_PROGRESS":
        return t("adminManageStudents.inProgress");
      case "COMPLETED":
        return t("adminManageStudents.completed");
      case "FAILED":
        return t("adminManageStudents.failed");
      default:
        return status;
    }
  };

  const handleRowClick = (taskId: string) => {
    if (expandedJobId === taskId) {
      setExpandedJobId(null);
      setSelectedTaskId(null);
    } else {
      setExpandedJobId(taskId);
      setSelectedTaskId(taskId);
      if (onJobSelect) {
        onJobSelect(taskId);
      }
    }
  };

  const handleActionClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    handleRowClick(taskId);
  };

  // Memoize the onComplete callback to prevent unnecessary re-renders
  const handleJobComplete = useCallback(() => {
    // Only reload if not already loading to prevent rapid re-renders
    if (!loading) {
      loadJobs();
    }
  }, [loading, loadJobs]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 5, gap: 2 }}>
        <CircularProgress size={32} sx={{ color: "var(--accent-indigo)" }} />
        <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontWeight: 500 }}>
          {t("adminManageStudents.loadingJobHistory")}
        </Typography>
      </Box>
    );
  }

  if (jobs.length === 0) {
    return (
      <Alert
        severity="info"
        icon={<IconWrapper icon="mdi:clipboard-text-clock-outline" size={22} />}
        sx={{
          borderRadius: 2,
          alignItems: "flex-start",
          py: 1.5,
          backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, var(--surface) 92%)",
          border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, var(--border-default))",
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
            {t("adminManageStudents.noEnrollmentJobsFound")}
          </Typography>
          <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: "var(--font-secondary)" }}>
            {t("adminManageStudents.enrollmentJobEmptyHint")}
          </Typography>
        </Box>
      </Alert>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: embedded ? "flex-end" : "space-between",
          mb: embedded ? 1.5 : 2,
        }}
      >
        {!embedded && (
          <Typography variant="h6" fontWeight={600} sx={{ color: "var(--font-primary)" }}>
            {t("adminManageStudents.enrollmentJobHistory")}
          </Typography>
        )}
        <Tooltip title={t("adminManageStudents.refresh")}>
          <IconButton
            onClick={loadJobs}
            size="small"
            aria-label={t("adminManageStudents.refresh")}
            sx={{
              color: "var(--accent-indigo)",
              backgroundColor: "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
              "&:hover": {
                backgroundColor: "color-mix(in srgb, var(--accent-indigo) 18%, transparent)",
              },
            }}
          >
            <IconWrapper icon="mdi:refresh" size={20} />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 2,
          border: "1px solid var(--border-default)",
          overflow: "hidden",
          backgroundColor: "var(--card-bg)",
          boxShadow: "0 1px 3px color-mix(in srgb, var(--font-primary) 8%, transparent)",
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow
              sx={{
                "& .MuiTableCell-head": {
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--font-secondary)",
                  backgroundColor: "var(--surface)",
                  borderBottom: "2px solid var(--border-default)",
                  py: 1.5,
                },
              }}
            >
              <TableCell>{t("adminManageStudents.id")}</TableCell>
              <TableCell>{t("adminManageStudents.status")}</TableCell>
              <TableCell>{t("adminManageStudents.students")}</TableCell>
              <TableCell
                sx={{
                  display: { xs: "none", lg: "table-cell" },
                }}
              >
                {t("adminManageStudents.createdDate")}
              </TableCell>
              <TableCell
                sx={{
                  display: { xs: "none", lg: "table-cell" },
                }}
              >
                {t("adminManageStudents.completedDate")}
              </TableCell>
              <TableCell
                sx={{
                  display: { xs: "table-cell", lg: "none" },
                }}
              >
                {t("adminManageStudents.results")}
              </TableCell>
              <TableCell>{t("adminManageStudents.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <Fragment key={job.id}>
                <TableRow
                  hover
                  tabIndex={0}
                  role="button"
                  aria-expanded={expandedJobId === job.task_id}
                  aria-label={t("adminManageStudents.enrollmentJobRowLabel", {
                    id: job.id,
                    status: getStatusLabel(job.status),
                  })}
                  sx={{
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                    "&:hover": {
                      backgroundColor:
                        "color-mix(in srgb, var(--accent-indigo) 8%, var(--card-bg))",
                    },
                  }}
                  onClick={() => handleRowClick(job.task_id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRowClick(job.task_id);
                    }
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
                    #{job.id}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(job.status)}
                      color={getStatusColor(job.status)}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{job.students.length}</TableCell>
                  <TableCell
                    sx={{
                      display: { xs: "none", lg: "table-cell" },
                      color: "var(--font-secondary)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {formatJobDateTime(job.created_at)}
                  </TableCell>
                  <TableCell
                    sx={{
                      display: { xs: "none", lg: "table-cell" },
                      color: "var(--font-secondary)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {job.completed_at ? formatJobDateTime(job.completed_at) : "—"}
                  </TableCell>
                  <TableCell
                    sx={{
                      display: { xs: "table-cell", lg: "none" },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.5,
                        alignItems: "center",
                        maxWidth: 200,
                      }}
                    >
                      <Tooltip title={t("adminManageStudents.enrollmentResultCreated")}>
                        <Chip
                          size="small"
                          label={`C ${job.created_accounts.length}`}
                          color="success"
                          variant="outlined"
                          sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                        />
                      </Tooltip>
                      <Tooltip title={t("adminManageStudents.enrollmentResultEnrolled")}>
                        <Chip
                          size="small"
                          label={`E ${job.enrolled_students.length}`}
                          color="primary"
                          variant="outlined"
                          sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                        />
                      </Tooltip>
                      {(job.skipped_accounts.length > 0 ||
                        job.skipped_enrollments.length > 0) && (
                        <Tooltip title={t("adminManageStudents.enrollmentResultSkipped")}>
                          <Chip
                            size="small"
                            label={`S ${job.skipped_accounts.length + job.skipped_enrollments.length}`}
                            color="warning"
                            variant="outlined"
                            sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                          />
                        </Tooltip>
                      )}
                      {job.failed_students.length > 0 && (
                        <Tooltip title={t("adminManageStudents.enrollmentResultFailed")}>
                          <Chip
                            size="small"
                            label={`F ${job.failed_students.length}`}
                            color="error"
                            variant="outlined"
                            sx={{ height: 22, fontSize: "0.7rem", fontWeight: 600 }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip
                      title={
                        expandedJobId === job.task_id
                          ? t("adminManageStudents.collapseJobDetails")
                          : t("adminManageStudents.expandJobDetails")
                      }
                    >
                      <IconButton
                        size="small"
                        aria-expanded={expandedJobId === job.task_id}
                        aria-label={
                          expandedJobId === job.task_id
                            ? t("adminManageStudents.collapseJobDetails")
                            : t("adminManageStudents.expandJobDetails")
                        }
                        onClick={(e) => handleActionClick(e, job.task_id)}
                      >
                        <IconWrapper
                          icon={
                            expandedJobId === job.task_id
                              ? "mdi:chevron-up"
                              : "mdi:chevron-down"
                          }
                          size={20}
                        />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={7}
                  >
                    <Collapse
                      in={expandedJobId === job.task_id}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box sx={{ margin: 2 }}>
                        {selectedTaskId === job.task_id && (
                          <EnrollmentJobStatus
                            key={job.task_id}
                            taskId={job.task_id}
                            onComplete={handleJobComplete}
                          />
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography
        variant="caption"
        component="p"
        sx={{
          display: "block",
          mt: 1.5,
          px: 0.5,
          color: "var(--font-secondary)",
          lineHeight: 1.5,
        }}
      >
        {t("adminManageStudents.enrollmentJobHistoryHint")}
      </Typography>
    </Box>
  );
}
