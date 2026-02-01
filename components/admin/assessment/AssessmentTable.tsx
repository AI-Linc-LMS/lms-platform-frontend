"use client";

import Link from "next/link";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Assessment } from "@/lib/services/admin/admin-assessment.service";

export interface AssessmentEmailJobInfo {
  task_id: string;
  status: string;
}

interface AssessmentTableProps {
  assessments: Assessment[];
  assessmentEmailJobMap?: Record<number, AssessmentEmailJobInfo>;
  onEdit?: (assessmentId: number) => void;
  onDelete?: (assessment: Assessment) => void;
  onTriggerEmailJob?: (assessment: Assessment) => Promise<void>;
  onExportSubmissions: (assessment: Assessment) => Promise<void>;
  onExportQuestions: (assessment: Assessment) => Promise<void>;
  exportingSubmissionsId?: number | null;
  exportingQuestionsId?: number | null;
  deletingId?: number | null;
  triggeringEmailJobId?: number | null;
}

const isFailedStatus = (status: string) => {
  const s = (status || "").toLowerCase();
  return s === "failed" || s === "error";
};

export function AssessmentTable({
  assessments,
  assessmentEmailJobMap = {},
  onEdit,
  onDelete,
  onTriggerEmailJob,
  onExportSubmissions,
  onExportQuestions,
  exportingSubmissionsId = null,
  exportingQuestionsId = null,
  deletingId = null,
  triggeringEmailJobId = null,
}: AssessmentTableProps) {

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <>
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table size="small" sx={{ minWidth: 640 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#f9fafb" }}>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                minWidth: 120,
                py: 1.5,
              }}
            >
              Title
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                display: { xs: "none", md: "table-cell" },
                whiteSpace: "nowrap",
                width: 90,
                py: 1.5,
              }}
            >
              Duration
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                display: { xs: "none", sm: "table-cell" },
                whiteSpace: "nowrap",
                width: 90,
                py: 1.5,
              }}
            >
              Questions
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                display: { xs: "none", lg: "table-cell" },
                whiteSpace: "nowrap",
                width: 90,
                py: 1.5,
              }}
            >
              Status
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                display: { xs: "none", md: "table-cell" },
                whiteSpace: "nowrap",
                minWidth: 100,
                py: 1.5,
              }}
            >
              Created
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 600,
                color: "#374151",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                whiteSpace: "nowrap",
                minWidth: 130,
                width: 130,
                py: 1.5,
              }}
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assessments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No assessments found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            assessments.map((assessment) => (
              <TableRow
                key={assessment.id}
                sx={{
                  "&:hover": { backgroundColor: "#f9fafb" },
                }}
              >
                <TableCell sx={{ py: 1.5 }}>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: "#111827",
                        fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                      }}
                    >
                      {assessment.title}
                    </Typography>
                    {assessment.is_paid && assessment.price && (
                      <Chip
                        label={`₹${assessment.price}`}
                        size="small"
                        sx={{
                          mt: 0.5,
                          bgcolor: "#fef3c7",
                          color: "#92400e",
                          fontSize: "0.7rem",
                          height: 20,
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    display: { xs: "none", md: "table-cell" },
                    whiteSpace: "nowrap",
                    py: 1.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                    }}
                  >
                    {formatDuration(assessment.duration_minutes)}
                  </Typography>
                </TableCell>
                <TableCell
                  sx={{
                    display: { xs: "none", sm: "table-cell" },
                    whiteSpace: "nowrap",
                    py: 1.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                    }}
                  >
                    {assessment.total_questions}
                  </Typography>
                </TableCell>
                <TableCell sx={{ display: { xs: "none", lg: "table-cell" }, py: 1.5 }}>
                  <Chip
                    label={assessment.is_active ? "Active" : "Inactive"}
                    size="small"
                    sx={{
                      bgcolor: assessment.is_active ? "#d1fae5" : "#fee2e2",
                      color: assessment.is_active ? "#065f46" : "#991b1b",
                      fontWeight: 600,
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      height: { xs: 20, sm: 24 },
                    }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    display: { xs: "none", md: "table-cell" },
                    whiteSpace: "nowrap",
                    py: 1.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#6b7280",
                      fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                    }}
                  >
                    {formatDate(assessment.created_at)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", minWidth: 130, py: 1.5 }}>
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "nowrap" }}>
                    {onEdit && (
                      <Tooltip title="View / Edit">
                        <IconButton
                          size="small"
                          onClick={() => onEdit(assessment.id)}
                          sx={{ color: "#6366f1" }}
                          aria-label="View or edit assessment"
                        >
                          <IconWrapper icon="mdi:eye-outline" size={18} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {onTriggerEmailJob && (() => {
                      const job = assessmentEmailJobMap[assessment.id];
                      const isTriggering = triggeringEmailJobId === assessment.id;
                      if (job) {
                        if (isFailedStatus(job.status)) {
                          return (
                            <Tooltip title="Email job failed. Go to Emails page to retry.">
                              <Link href="/admin/emails?tab=assessment" passHref legacyBehavior>
                                <Button
                                  size="small"
                                  component="a"
                                  variant="outlined"
                                  color="warning"
                                  sx={{ minWidth: 90, textDecoration: "none" }}
                                >
                                  Retry in Emails
                                </Button>
                              </Link>
                            </Tooltip>
                          );
                        }
                        return (
                          <Tooltip title="View email job status">
                            <Link
                              href={`/admin/emails/assessment/${encodeURIComponent(job.task_id)}`}
                              passHref
                              legacyBehavior
                            >
                              <Button
                                size="small"
                                component="a"
                                variant="outlined"
                                sx={{ minWidth: 70, textDecoration: "none" }}
                              >
                                View Job
                              </Button>
                            </Link>
                          </Tooltip>
                        );
                      }
                      return (
                        <Tooltip title="Trigger email job">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => onTriggerEmailJob(assessment)}
                              disabled={isTriggering}
                              sx={{ color: "#059669" }}
                              aria-label="Trigger email job for assessment"
                            >
                              {isTriggering ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <IconWrapper icon="mdi:email-send-outline" size={18} />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      );
                    })()}
                    <Tooltip title="Download questions (CSV)">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onExportQuestions(assessment)}
                          disabled={exportingQuestionsId === assessment.id}
                          sx={{ color: "#6366f1" }}
                          aria-label="Download questions CSV"
                        >
                          {exportingQuestionsId === assessment.id ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <IconWrapper
                              icon="mdi:help-circle-outline"
                              size={18}
                            />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Download submissions (CSV)">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onExportSubmissions(assessment)}
                          disabled={exportingSubmissionsId === assessment.id}
                          sx={{ color: "#059669" }}
                          aria-label="Download submissions CSV"
                        >
                          {exportingSubmissionsId === assessment.id ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <IconWrapper
                              icon="mdi:file-delimited-outline"
                              size={18}
                            />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    {onDelete && (
                      <Tooltip title="Delete">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onDelete(assessment)}
                            disabled={deletingId === assessment.id}
                            sx={{ color: "#dc2626" }}
                            aria-label="Delete assessment"
                          >
                            {deletingId === assessment.id ? (
                              <CircularProgress size={18} color="inherit" />
                            ) : (
                              <IconWrapper icon="mdi:delete-outline" size={18} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
    </>
  );
}
