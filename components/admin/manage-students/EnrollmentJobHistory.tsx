"use client";

import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
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
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminStudentEnrollmentService,
  StudentEnrollmentJob,
  EnrollmentJobStatus as JobStatus,
} from "@/lib/services/admin/admin-student-enrollment.service";
import { EnrollmentJobStatus } from "./EnrollmentJobStatus";

interface EnrollmentJobHistoryProps {
  onJobSelect?: (taskId: string) => void;
}

export function EnrollmentJobHistory({ onJobSelect }: EnrollmentJobHistoryProps) {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<StudentEnrollmentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Load jobs function - can be called from multiple places
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const jobsData = await adminStudentEnrollmentService.listAllJobs();
      setJobs(jobsData);
    } catch (error: any) {
      showToast(error.message || "Failed to load job history", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // showToast is stable, no need to include it

  // Load jobs on mount only - using loadJobs ref to avoid dependency issues
  useEffect(() => {
    loadJobs();
  }, [loadJobs]); // Include loadJobs since it's memoized with useCallback

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
        return "Pending";
      case "IN_PROGRESS":
        return "In Progress";
      case "COMPLETED":
        return "Completed";
      case "FAILED":
        return "Failed";
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
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (jobs.length === 0) {
    return (
      <Alert severity="info">
        <Typography variant="body2">No enrollment jobs found</Typography>
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Enrollment Job History
        </Typography>
        <IconButton onClick={loadJobs} size="small" title="Refresh">
          <IconWrapper icon="mdi:refresh" size={20} />
        </IconButton>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Students</TableCell>
              <TableCell
                sx={{
                  display: { xs: "none", lg: "table-cell" },
                }}
              >
                Created Date
              </TableCell>
              <TableCell
                sx={{
                  display: { xs: "none", lg: "table-cell" },
                }}
              >
                Completed Date
              </TableCell>
              <TableCell
                sx={{
                  display: { xs: "table-cell", md: "none" },
                }}
              >
                Results
              </TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <Fragment key={job.id}>
                <TableRow
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleRowClick(job.task_id)}
                >
                  <TableCell>#{job.id}</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(job.status)}
                      color={getStatusColor(job.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{job.students.length}</TableCell>
                  <TableCell
                    sx={{
                      display: { xs: "none", lg: "table-cell" },
                    }}
                  >
                    {new Date(job.created_at).toLocaleDateString()}{" "}
                    {new Date(job.created_at).toLocaleTimeString()}
                  </TableCell>
                  <TableCell
                    sx={{
                      display: { xs: "none", lg: "table-cell" },
                    }}
                  >
                    {job.completed_at
                      ? `${new Date(job.completed_at).toLocaleDateString()} ${new Date(
                          job.completed_at
                        ).toLocaleTimeString()}`
                      : "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      display: { xs: "table-cell", md: "none" },
                    }}
                  >
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                      <Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
                        <Box
                          component="span"
                          sx={{
                            color: "success.main",
                            fontWeight: 600,
                            mr: 0.5,
                          }}
                        >
                          C: {job.created_accounts.length}
                        </Box>
                        <Box
                          component="span"
                          sx={{
                            color: "primary.main",
                            fontWeight: 600,
                            mr: 0.5,
                          }}
                        >
                          E: {job.enrolled_students.length}
                        </Box>
                        {(job.skipped_accounts.length > 0 ||
                          job.skipped_enrollments.length > 0) && (
                          <Box
                            component="span"
                            sx={{
                              color: "warning.main",
                              fontWeight: 600,
                              mr: 0.5,
                            }}
                          >
                            S: {job.skipped_accounts.length + job.skipped_enrollments.length}
                          </Box>
                        )}
                        {job.failed_students.length > 0 && (
                          <Box
                            component="span"
                            sx={{
                              color: "error.main",
                              fontWeight: 600,
                            }}
                          >
                            F: {job.failed_students.length}
                          </Box>
                        )}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
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
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={6}
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
    </Box>
  );
}
