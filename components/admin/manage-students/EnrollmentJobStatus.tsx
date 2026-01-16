"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { useToast } from "@/components/common/Toast";
import {
  adminStudentEnrollmentService,
  StudentEnrollmentJob,
  EnrollmentJobStatus as JobStatus,
} from "@/lib/services/admin/admin-student-enrollment.service";
import { coursesService, Course } from "@/lib/services/courses.service";

interface EnrollmentJobStatusProps {
  taskId: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export function EnrollmentJobStatus({
  taskId,
  onComplete,
  onClose,
}: EnrollmentJobStatusProps) {
  const { showToast } = useToast();
  const [job, setJob] = useState<StudentEnrollmentJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    skippedAccounts: false,
    skippedEnrollments: false,
    enrolledStudents: false,
    createdAccounts: false,
  });
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  // Load courses for name mapping
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const coursesData = await coursesService.getCourses();
        setCourses(coursesData);
      } catch (error) {
        // Silently fail - course names are nice to have but not critical
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialFetch = async () => {
      try {
        const jobData = await adminStudentEnrollmentService.getJobStatus(taskId);
        if (!isMounted) return;

        setJob(jobData);
        setLoading(false);
        setError(null);

        // If job is already completed or failed, don't start polling
        if (jobData.status === "COMPLETED" || jobData.status === "FAILED") {
          hasCompletedRef.current = true;
          return; // Don't start polling for already-completed jobs
        }

        // Start polling only for jobs that are still in progress
        pollingIntervalRef.current = setInterval(() => {
          fetchJobStatus();
        }, 3000);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message || "Failed to fetch job status");
        setLoading(false);
      }
    };

    initialFetch();

    return () => {
      isMounted = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [taskId]);

  const fetchJobStatus = async () => {
    try {
      const jobData = await adminStudentEnrollmentService.getJobStatus(taskId);
      const wasAlreadyCompleted = job?.status === "COMPLETED" || job?.status === "FAILED";
      setJob(jobData);
      setLoading(false);
      setError(null);

      // Stop polling if job is completed or failed
      if (
        (jobData.status === "COMPLETED" || jobData.status === "FAILED") &&
        !hasCompletedRef.current
      ) {
        hasCompletedRef.current = true;
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }

        // Only call onComplete if the job just completed (wasn't already completed)
        // This prevents infinite loops when viewing already-completed jobs
        if (jobData.status === "COMPLETED" && onComplete && !wasAlreadyCompleted) {
          // Small delay before calling onComplete to show final status
          setTimeout(() => {
            onComplete();
          }, 2000);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch job status");
      setLoading(false);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    }
  };

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

  // Parse error_details to extract user-friendly messages
  const parseErrorDetails = (errorDetails: Record<string, any>): string => {
    if (!errorDetails || Object.keys(errorDetails).length === 0) {
      return "";
    }

    // Handle duplicate constraint errors
    const errorString = JSON.stringify(errorDetails);
    if (errorString.includes("duplicate key") || errorString.includes("unique constraint")) {
      const match = errorString.match(/user_id[,\s]*client_id[\)\s]*=\((\d+),\s*(\d+)\)/);
      if (match) {
        const userId = match[1];
        const clientId = match[2];
        return `Some students already have accounts for this client (User ID: ${userId}, Client ID: ${clientId}). The backend should handle this gracefully, but encountered an error. Please contact support if this persists.`;
      }
      return "Some students already have accounts for this client. The backend should handle this gracefully, but encountered an error. Please contact support if this persists.";
    }

    // Handle other error formats
    if (errorDetails.error) {
      return String(errorDetails.error);
    }

    if (errorDetails.message) {
      return String(errorDetails.message);
    }

    // If it's a simple string
    if (typeof errorDetails === "string") {
      return errorDetails;
    }

    // Format object as readable text
    const formatted = Object.entries(errorDetails)
      .map(([key, value]) => {
        if (typeof value === "object") {
          return `${key}: ${JSON.stringify(value)}`;
        }
        return `${key}: ${value}`;
      })
      .join("\n");

    return formatted || "An unknown error occurred";
  };

  // Get success message based on results
  const getSuccessMessage = (): string => {
    if (!job) return "";

    const hasSkipped = job.skipped_accounts.length > 0 || job.skipped_enrollments.length > 0;
    const hasFailed = job.failed_students.length > 0;
    const hasCreated = job.created_accounts.length > 0;
    const hasEnrolled = job.enrolled_students.length > 0;

    if (!hasSkipped && !hasFailed && hasCreated && hasEnrolled) {
      return "All students enrolled successfully!";
    }

    if (hasSkipped && !hasFailed) {
      return "Enrollment completed with some skipped items (see details below)";
    }

    if (hasFailed && !hasSkipped) {
      return "Enrollment completed with some failures (see details below)";
    }

    if (hasSkipped && hasFailed) {
      return "Enrollment completed with mixed results (see details below)";
    }

    return "Enrollment job completed successfully!";
  };

  // Helper to get course name by ID
  const getCourseName = (courseId: number): string => {
    const course = courses.find((c) => c.id === courseId);
    return course?.title || `Course ID: ${courseId}`;
  };

  // Helper to get student name by user ID
  // Note: We can't directly match user_id to the original student name/email
  // without additional API calls to fetch user details by user_id
  // For now, we show the user ID - in production, you might want to fetch user details
  const getStudentName = (userId: number): string => {
    return `User ID: ${userId}`;
  };


  if (loading && !job) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !job) {
    return (
      <Alert severity="error">
        <Typography variant="body2">{error}</Typography>
      </Alert>
    );
  }

  if (!job) {
    return null;
  }

  const isInProgress = job.status === "PENDING" || job.status === "IN_PROGRESS";
  const isCompleted = job.status === "COMPLETED";
  const isFailed = job.status === "FAILED";

  return (
    <Box>
      {/* Header with Icon */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          backgroundColor: "#ffffff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor:
                  job.status === "COMPLETED"
                    ? "#d1fae5"
                    : job.status === "FAILED"
                    ? "#fee2e2"
                    : job.status === "IN_PROGRESS"
                    ? "#dbeafe"
                    : "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconWrapper
                icon={
                  job.status === "COMPLETED"
                    ? "mdi:check-circle"
                    : job.status === "FAILED"
                    ? "mdi:alert-circle"
                    : job.status === "IN_PROGRESS"
                    ? "mdi:clock-outline"
                    : "mdi:clock-time-four-outline"
                }
                size={24}
                color={
                  job.status === "COMPLETED"
                    ? "#10b981"
                    : job.status === "FAILED"
                    ? "#ef4444"
                    : job.status === "IN_PROGRESS"
                    ? "#3b82f6"
                    : "#6b7280"
                }
              />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#111827",
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                }}
              >
                Enrollment Job Status
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.5 }}>
                Task ID: {job.task_id.slice(0, 8)}...
              </Typography>
            </Box>
          </Box>
          <Chip
            label={getStatusLabel(job.status)}
            color={getStatusColor(job.status)}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          />
        </Box>
      </Paper>

      {isInProgress && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <CircularProgress size={24} sx={{ color: "#3b82f6" }} />
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#1e40af" }}
            >
              Processing enrollment job...
            </Typography>
          </Box>
          <LinearProgress
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: "#dbeafe",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "#3b82f6",
              },
            }}
          />
        </Paper>
      )}

      {isCompleted && (
        <Alert
          severity="success"
          sx={{
            mb: 3,
            borderRadius: 2,
            backgroundColor: "#d1fae5",
            border: "1px solid #10b981",
            "& .MuiAlert-icon": {
              color: "#10b981",
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "#065f46" }}
          >
            {getSuccessMessage()}
          </Typography>
        </Alert>
      )}

      {isFailed && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            backgroundColor: "#fee2e2",
            border: "1px solid #ef4444",
            "& .MuiAlert-icon": {
              color: "#ef4444",
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "#991b1b", mb: job.error_details && Object.keys(job.error_details).length > 0 ? 1 : 0 }}
          >
            Enrollment job failed
          </Typography>
          {job.error_details && Object.keys(job.error_details).length > 0 && (
            <Box
              sx={{
                mt: 1,
                p: 1.5,
                borderRadius: 1,
                backgroundColor: "#ffffff",
                border: "1px solid #fecaca",
              }}
            >
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: "pre-wrap",
                  fontFamily: "inherit",
                  color: "#991b1b",
                  fontSize: "0.875rem",
                  margin: 0,
                }}
              >
                {parseErrorDetails(job.error_details)}
              </Typography>
            </Box>
          )}
        </Alert>
      )}

      {/* Summary Statistics */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "#eef2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:account-group" size={24} color="#6366f1" />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#6b7280", fontSize: "0.75rem" }}
            >
              Total Students
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#111827", mt: 0.5 }}
            >
              {job.students.length}
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:account-plus" size={24} color="#10b981" />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#6b7280", fontSize: "0.75rem" }}
            >
              Created Accounts
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#10b981", mt: 0.5 }}
            >
              {job.created_accounts.length}
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "#dbeafe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:school" size={24} color="#3b82f6" />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#6b7280", fontSize: "0.75rem" }}
            >
              Enrolled Students
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#3b82f6", mt: 0.5 }}
            >
              {job.enrolled_students.length}
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:account-remove" size={24} color="#f59e0b" />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#6b7280", fontSize: "0.75rem" }}
            >
              Skipped Accounts
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#f59e0b", mt: 0.5 }}
            >
              {job.skipped_accounts.length}
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:book-remove" size={24} color="#f59e0b" />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#6b7280", fontSize: "0.75rem" }}
            >
              Skipped Enrollments
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#f59e0b", mt: 0.5 }}
            >
              {job.skipped_enrollments.length}
            </Typography>
          </Box>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:alert-circle" size={24} color="#ef4444" />
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "#6b7280", fontSize: "0.75rem" }}
            >
              Failed Students
            </Typography>
            <Typography
              variant="h5"
              sx={{ fontWeight: 700, color: "#ef4444", mt: 0.5 }}
            >
              {job.failed_students.length}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Notes */}
      {job.notes && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <IconWrapper icon="mdi:information" size={20} color="#6366f1" />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#111827" }}
            >
              Job Details
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-line",
              color: "#374151",
              lineHeight: 1.6,
            }}
          >
            {job.notes}
          </Typography>
        </Paper>
      )}

      {/* Skipped Accounts Section */}
      {job.skipped_accounts.length > 0 && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            backgroundColor: "#ffffff",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: expandedSections.skippedAccounts ? 2 : 0,
              cursor: "pointer",
            }}
            onClick={() =>
              setExpandedSections((prev) => ({
                ...prev,
                skippedAccounts: !prev.skippedAccounts,
              }))
            }
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconWrapper icon="mdi:account-remove" size={20} color="#f59e0b" />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: "#111827" }}
              >
                Skipped Accounts ({job.skipped_accounts.length})
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedSections((prev) => ({
                  ...prev,
                  skippedAccounts: !prev.skippedAccounts,
                }));
              }}
            >
              <IconWrapper
                icon={
                  expandedSections.skippedAccounts
                    ? "mdi:chevron-up"
                    : "mdi:chevron-down"
                }
                size={20}
                color="#6b7280"
              />
            </IconButton>
          </Box>
          <Collapse in={expandedSections.skippedAccounts}>
            <Alert
              severity="info"
              sx={{
                mb: 2,
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                "& .MuiAlert-icon": {
                  color: "#3b82f6",
                },
              }}
            >
              <Typography variant="body2" sx={{ color: "#1e40af" }}>
                Some students already had accounts and were skipped, but were still enrolled in the selected courses.
              </Typography>
            </Alert>
            <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "#f9fafb",
                    "& .MuiTableCell-head": {
                      borderBottom: "2px solid #e5e7eb",
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "0.875rem",
                    },
                  }}
                >
                  <TableCell>Student</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {job.skipped_accounts.map((userId, index) => {
                  // Try to find if this user was enrolled in any courses
                  const enrolledCourses = job.enrolled_students.filter((e) => e.user_id === userId);
                  const courseNames = enrolledCourses
                    .map((e) => getCourseName(e.course_id))
                    .slice(0, 3)
                    .join(", ");
                  const remainingCount = enrolledCourses.length - 3;
                  
                  return (
                    <TableRow
                      key={index}
                      sx={{
                        "&:hover": {
                          backgroundColor: "#f9fafb",
                        },
                        "& .MuiTableCell-root": {
                          borderBottom: "1px solid #e5e7eb",
                          py: 1.5,
                        },
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: "#111827" }}
                        >
                          {getStudentName(userId)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "#6b7280" }}>
                          {enrolledCourses.length > 0 ? (
                            <>
                              Account already existed, enrolled in {enrolledCourses.length} course(s)
                              {courseNames && (
                                <Box
                                  component="span"
                                  sx={{
                                    display: "block",
                                    mt: 0.5,
                                    fontSize: "0.75rem",
                                    color: "#9ca3af",
                                  }}
                                >
                                  {courseNames}
                                  {remainingCount > 0 && ` and ${remainingCount} more`}
                                </Box>
                              )}
                            </>
                          ) : (
                            "Account already existed"
                          )}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          </Collapse>
        </Paper>
      )}

      {/* Skipped Enrollments Section */}
      {job.skipped_enrollments.length > 0 && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            backgroundColor: "#ffffff",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: expandedSections.skippedEnrollments ? 2 : 0,
              cursor: "pointer",
            }}
            onClick={() =>
              setExpandedSections((prev) => ({
                ...prev,
                skippedEnrollments: !prev.skippedEnrollments,
              }))
            }
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconWrapper icon="mdi:book-remove" size={20} color="#f59e0b" />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: "#111827" }}
              >
                Skipped Enrollments ({job.skipped_enrollments.length})
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedSections((prev) => ({
                  ...prev,
                  skippedEnrollments: !prev.skippedEnrollments,
                }));
              }}
            >
              <IconWrapper
                icon={
                  expandedSections.skippedEnrollments
                    ? "mdi:chevron-up"
                    : "mdi:chevron-down"
                }
                size={20}
                color="#6b7280"
              />
            </IconButton>
          </Box>
          <Collapse in={expandedSections.skippedEnrollments}>
            <Alert
              severity="info"
              sx={{
                mb: 2,
                backgroundColor: "#eff6ff",
                border: "1px solid #bfdbfe",
                "& .MuiAlert-icon": {
                  color: "#3b82f6",
                },
              }}
            >
              <Typography variant="body2" sx={{ color: "#1e40af" }}>
                Some students were already enrolled in some courses and were skipped.
              </Typography>
            </Alert>
            <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "#f9fafb",
                    "& .MuiTableCell-head": {
                      borderBottom: "2px solid #e5e7eb",
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "0.875rem",
                    },
                  }}
                >
                  <TableCell>Student</TableCell>
                  <TableCell>Course</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {job.skipped_enrollments.map((skipped, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      "&:hover": {
                        backgroundColor: "#f9fafb",
                      },
                      "& .MuiTableCell-root": {
                        borderBottom: "1px solid #e5e7eb",
                        py: 1.5,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#111827" }}
                      >
                        {getStudentName(skipped.user_id)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#111827" }}
                      >
                        {getCourseName(skipped.course_id)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label="Already enrolled"
                        size="small"
                        sx={{
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          fontSize: "0.75rem",
                          height: 24,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Collapse>
        </Paper>
      )}

      {/* Created Accounts Details */}
      {job.created_accounts.length > 0 && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            backgroundColor: "#ffffff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <IconWrapper icon="mdi:account-plus" size={20} color="#10b981" />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#111827" }}
            >
              Created Accounts ({job.created_accounts.length})
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {job.created_accounts.map((userId, index) => (
              <Chip
                key={index}
                label={getStudentName(userId)}
                size="small"
                sx={{
                  backgroundColor: "#d1fae5",
                  color: "#065f46",
                  border: "1px solid #10b981",
                  fontWeight: 500,
                  "&:hover": {
                    backgroundColor: "#a7f3d0",
                  },
                }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Enrolled Students Details */}
      {job.enrolled_students.length > 0 && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            backgroundColor: "#ffffff",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: expandedSections.enrolledStudents ? 2 : 0,
              cursor: "pointer",
            }}
            onClick={() =>
              setExpandedSections((prev) => ({
                ...prev,
                enrolledStudents: !prev.enrolledStudents,
              }))
            }
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconWrapper icon="mdi:school" size={20} color="#3b82f6" />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: "#111827" }}
              >
                Enrolled Students ({job.enrolled_students.length})
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpandedSections((prev) => ({
                  ...prev,
                  enrolledStudents: !prev.enrolledStudents,
                }));
              }}
            >
              <IconWrapper
                icon={
                  expandedSections.enrolledStudents
                    ? "mdi:chevron-up"
                    : "mdi:chevron-down"
                }
                size={20}
                color="#6b7280"
              />
            </IconButton>
          </Box>
          <Collapse in={expandedSections.enrolledStudents}>
            <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "#f9fafb",
                    "& .MuiTableCell-head": {
                      borderBottom: "2px solid #e5e7eb",
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "0.875rem",
                    },
                  }}
                >
                  <TableCell>Student</TableCell>
                  <TableCell>Course</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {job.enrolled_students.map((enrolled, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      "&:hover": {
                        backgroundColor: "#f0f9ff",
                      },
                      "& .MuiTableCell-root": {
                        borderBottom: "1px solid #e5e7eb",
                        py: 1.5,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#111827" }}
                      >
                        {getStudentName(enrolled.user_id)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconWrapper
                          icon="mdi:book-open-variant"
                          size={16}
                          color="#3b82f6"
                        />
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, color: "#111827" }}
                        >
                          {getCourseName(enrolled.course_id)}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Collapse>
        </Paper>
      )}

      {/* Failed Students */}
      {job.failed_students.length > 0 && (
        <Paper
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            backgroundColor: "#ffffff",
            border: "1px solid #fee2e2",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <IconWrapper icon="mdi:alert-circle" size={20} color="#ef4444" />
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#111827" }}
            >
              Failed Students ({job.failed_students.length})
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: "#fef2f2",
                    "& .MuiTableCell-head": {
                      borderBottom: "2px solid #fee2e2",
                      fontWeight: 600,
                      color: "#374151",
                      fontSize: "0.875rem",
                    },
                  }}
                >
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {job.failed_students.map((failed, index) => (
                  <TableRow
                    key={index}
                    sx={{
                      "&:hover": {
                        backgroundColor: "#fef2f2",
                      },
                      "& .MuiTableCell-root": {
                        borderBottom: "1px solid #fee2e2",
                        py: 1.5,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, color: "#111827" }}
                      >
                        {failed.student.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "#6b7280" }}>
                        {failed.student.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: "#fee2e2",
                        }}
                      >
                        <IconWrapper icon="mdi:alert" size={14} color="#ef4444" />
                        <Typography
                          variant="body2"
                          sx={{ color: "#991b1b", fontSize: "0.75rem" }}
                        >
                          {failed.error}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Timestamps */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconWrapper icon="mdi:clock-outline" size={16} color="#6b7280" />
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              Created: {new Date(job.created_at).toLocaleString()}
            </Typography>
          </Box>
          {job.completed_at && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconWrapper icon="mdi:check-circle" size={16} color="#10b981" />
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                Completed: {new Date(job.completed_at).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Actions */}
      {isCompleted && onClose && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 3 }}>
          <Button
            onClick={() => {
              if (onClose) {
                onClose();
              }
            }}
            variant="contained"
            startIcon={<IconWrapper icon="mdi:check" size={18} />}
            sx={{
              backgroundColor: "#6366f1",
              color: "#ffffff",
              fontWeight: 600,
              textTransform: "none",
              px: 3,
              py: 1,
              borderRadius: 2,
              "&:hover": {
                backgroundColor: "#4f46e5",
              },
            }}
          >
            Close
          </Button>
        </Box>
      )}
    </Box>
  );
}
