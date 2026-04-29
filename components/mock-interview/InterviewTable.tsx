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
        return {
          bg: "color-mix(in srgb, var(--success-500) 16%, transparent)",
          color: "var(--success-500)",
          border: "var(--success-500)",
        };
      case "in_progress":
        return {
          bg: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)",
          color: "var(--accent-indigo)",
          border: "var(--accent-indigo)",
        };
      case "scheduled":
        return {
          bg: "color-mix(in srgb, var(--warning-500) 16%, transparent)",
          color: "var(--warning-500)",
          border: "var(--warning-500)",
        };
      default:
        return {
          bg: "var(--surface)",
          color: "var(--font-secondary)",
          border: "var(--border-default)",
        };
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
          border: "1px solid var(--border-default)",
        }}
      >
        <IconWrapper
          icon="mdi:calendar-remove"
          size={64}
          color="var(--font-tertiary)"
          style={{ marginBottom: 16 }}
        />
        <Typography variant="h6" sx={{ color: "var(--font-secondary)", mb: 1 }}>
          No interviews found
        </Typography>
        <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
          Start a new interview to see it here
        </Typography>
      </Paper>
    );
  }

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{ border: "1px solid var(--border-default)", borderRadius: 2, backgroundColor: "var(--card-bg)" }}
    >
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "var(--surface)" }}>
            <TableCell sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              Job Role
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              Experience Level
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              Interview Type
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              Status
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              Date
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "var(--font-primary)" }}>
              Score
            </TableCell>
            <TableCell sx={{ fontWeight: 600, color: "var(--font-primary)" }} align="right">
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
                  "&:hover": { backgroundColor: "var(--surface)" },
                  transition: "background-color 0.2s ease",
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {interview.job_role}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)" }}>
                    {interview.experience_level}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={interview.interview_type}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderColor: "var(--accent-indigo)",
                      color: "var(--accent-indigo)",
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
                    sx={{ color: "var(--font-secondary)", fontSize: "0.875rem" }}
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
                        sx={{ fontWeight: 700, color: "var(--success-500)" }}
                      >
                        {interview.score}%
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
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
                            color: "var(--accent-indigo)",
                            "&:hover": {
                              backgroundColor:
                                "color-mix(in srgb, var(--accent-indigo) 10%, transparent)",
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
                            color: "var(--success-500)",
                            "&:hover": {
                              backgroundColor:
                                "color-mix(in srgb, var(--success-500) 10%, transparent)",
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
                          color: "var(--font-secondary)",
                          "&:hover": {
                            backgroundColor:
                              "color-mix(in srgb, var(--font-secondary) 10%, transparent)",
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
                            color: "var(--error-500)",
                            "&:hover": {
                              backgroundColor:
                                "color-mix(in srgb, var(--error-500) 10%, transparent)",
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
