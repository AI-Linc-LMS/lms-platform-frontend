"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
  Tooltip,
  Button,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { MockInterview } from "@/lib/services/mock-interview.service";
import { memo, useCallback } from "react";
import { useRouter } from "next/navigation";

interface InterviewTableProps {
  interviews: MockInterview[];
  onViewDetails: (id: number) => void;
  onDelete?: (id: number) => void;
}

const InterviewTableComponent = ({
  interviews,
  onViewDetails,
  onDelete,
}: InterviewTableProps) => {
  const router = useRouter();

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case "completed":
        return { bg: "#d1fae5", color: "#065f46", border: "#10b981" };
      case "in_progress":
        return { bg: "#dbeafe", color: "#1e40af", border: "#3b82f6" };
      case "scheduled":
        return { bg: "#fef3c7", color: "#92400e", border: "#f59e0b" };
      default:
        return { bg: "#f3f4f6", color: "#374151", border: "#9ca3af" };
    }
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const handleTakeInterview = useCallback(
    (id: number) => {
      router.push(`/mock-interview/${id}/take`);
    },
    [router]
  );

  const handleViewResult = useCallback(
    (id: number) => {
      router.push(`/mock-interview/${id}/result`);
    },
    [router]
  );

  if (interviews.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 6,
          textAlign: "center",
          borderRadius: 2,
          border: "1px solid #e5e7eb",
        }}
      >
        <IconWrapper
          icon="mdi:calendar-remove"
          size={64}
          color="#9ca3af"
          style={{ marginBottom: 16 }}
        />
        <Typography variant="h6" sx={{ color: "#6b7280", mb: 1 }}>
          No interviews found
        </Typography>
        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
          Start a new interview to see it here
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "1px solid #e5e7eb", borderRadius: 2 }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f9fafb" }}>
            <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
              Job Role
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
              Experience Level
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
              Interview Type
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
              Status
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
              Date
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "#374151" }}>
              Score
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "#374151" }} align="right">
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {interviews.map((interview) => {
            const statusColors = getStatusColor(interview.status);
            return (
              <TableRow
                key={interview.id}
                sx={{
                  "&:hover": { backgroundColor: "#f9fafb" },
                  transition: "background-color 0.2s ease",
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {interview.job_role}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    {interview.experience_level}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={interview.interview_type}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: "#6366f1",
                      color: "#6366f1",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={interview.status.replace("_", " ").toUpperCase()}
                    size="small"
                    sx={{
                      backgroundColor: statusColors.bg,
                      color: statusColors.color,
                      border: `1px solid ${statusColors.border}`,
                      fontWeight: 600,
                      fontSize: "0.7rem",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280", fontSize: "0.875rem" }}
                  >
                    {formatDate(
                      interview.scheduled_date_time || interview.created_at
                    )}
                  </Typography>
                </TableCell>
                <TableCell>
                  {interview.score !== undefined && interview.score !== null ? (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: "#10b981" }}
                      >
                        {interview.score}%
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.5,
                      justifyContent: "flex-end",
                    }}
                  >
                    {interview.status === "completed" && (
                      <Tooltip title="View Result" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleViewResult(interview.id)}
                          sx={{
                            color: "#6366f1",
                            "&:hover": {
                              backgroundColor: "rgba(99, 102, 241, 0.08)",
                            },
                          }}
                        >
                          <IconWrapper
                            icon="mdi:file-document-outline"
                            size={20}
                          />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(interview.status === "pending" ||
                      interview.status === "scheduled") && (
                      <Tooltip title="Start Interview" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleTakeInterview(interview.id)}
                          sx={{
                            color: "#10b981",
                            "&:hover": {
                              backgroundColor: "rgba(16, 185, 129, 0.08)",
                            },
                          }}
                        >
                          <IconWrapper icon="mdi:play-circle" size={20} />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="View Details" arrow>
                      <IconButton
                        size="small"
                        onClick={() => onViewDetails(interview.id)}
                        sx={{
                          color: "#6b7280",
                          "&:hover": {
                            backgroundColor: "rgba(107, 114, 128, 0.08)",
                          },
                        }}
                      >
                        <IconWrapper icon="mdi:eye-outline" size={20} />
                      </IconButton>
                    </Tooltip>
                    {onDelete && (
                      <Tooltip title="Delete" arrow>
                        <IconButton
                          size="small"
                          onClick={() => onDelete(interview.id)}
                          sx={{
                            color: "#ef4444",
                            "&:hover": {
                              backgroundColor: "rgba(239, 68, 68, 0.08)",
                            },
                          }}
                        >
                          <IconWrapper icon="mdi:delete-outline" size={20} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const InterviewTable = memo(
  InterviewTableComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.interviews.length === nextProps.interviews.length &&
      prevProps.interviews.every(
        (interview, index) =>
          interview.id === nextProps.interviews[index]?.id &&
          interview.status === nextProps.interviews[index]?.status
      )
    );
  }
);
InterviewTable.displayName = "InterviewTable";
