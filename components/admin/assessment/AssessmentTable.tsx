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
  Stack,
  Paper,
  Divider,
  useMediaQuery,
  useTheme,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatCourses = (courses?: Array<{ id: number; title: string }>) => {
    if (!courses || courses.length === 0) return { display: "—", full: "" };
    const titles = courses.map((c) => c.title);
    const full = titles.join(", ");
    if (titles.length <= 2) {
      return { display: full, full };
    }
    const display = titles.slice(0, 2).join(", ") + "...";
    return { display, full };
  };

  const formatColleges = (colleges?: string[]) => {
    if (!colleges || colleges.length === 0) return { display: "—", full: "" };
    const full = colleges.join(", ");
    if (colleges.length <= 2) {
      return { display: full, full };
    }
    const display = colleges.slice(0, 2).join(", ") + "...";
    return { display, full };
  };

  // Mobile Card View
  if (isMobile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: { xs: 1, sm: 0 } }}>
        {assessments.length === 0 ? (
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "#f8fafc",
            }}
          >
            <IconWrapper icon="mdi:file-document-outline" size={48} color="#94a3b8" />
            <Typography variant="body1" sx={{ color: "#64748b", fontWeight: 500, mt: 2 }}>
              No assessments found
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", mt: 1 }}>
              Create your first assessment to get started
            </Typography>
          </Paper>
        ) : (
          assessments.map((assessment) => (
            <Paper
              key={assessment.id}
              sx={{
                p: 2,
                borderRadius: 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e2e8f0",
                "&:hover": {
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  transition: "box-shadow 0.2s ease",
                },
              }}
            >
              {/* Header */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "#0f172a",
                      fontSize: "1rem",
                      mb: 0.5,
                      lineHeight: 1.3,
                    }}
                  >
                    {assessment.title}
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
                    {assessment.is_paid && assessment.price && (
                      <Chip
                        icon={<IconWrapper icon="mdi:currency-inr" size={14} />}
                        label={`₹${assessment.price}`}
                        size="small"
                        sx={{
                          bgcolor: "#fef3c7",
                          color: "#92400e",
                          fontSize: "0.7rem",
                          height: 22,
                          fontWeight: 600,
                        }}
                      />
                    )}
                    {assessment.proctoring_enabled && (
                      <Chip
                        icon={<IconWrapper icon="mdi:shield-check" size={14} />}
                        label="Proctored"
                        size="small"
                        sx={{
                          bgcolor: "#dbeafe",
                          color: "#1e40af",
                          fontSize: "0.7rem",
                          height: 22,
                          fontWeight: 600,
                        }}
                      />
                    )}
                    <Chip
                      label={assessment.is_active ? "Active" : "Inactive"}
                      size="small"
                      icon={
                        <IconWrapper
                          icon={assessment.is_active ? "mdi:check-circle" : "mdi:close-circle"}
                          size={14}
                        />
                      }
                      sx={{
                        bgcolor: assessment.is_active ? "#d1fae5" : "#fee2e2",
                        color: assessment.is_active ? "#065f46" : "#991b1b",
                        fontSize: "0.7rem",
                        height: 22,
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                </Box>
                {assessment.submissions_count !== undefined && assessment.submissions_count > 0 && (
                  <Chip
                    icon={<IconWrapper icon="mdi:account-multiple" size={14} />}
                    label={assessment.submissions_count}
                    size="small"
                    sx={{
                      bgcolor: "#f1f5f9",
                      color: "#475569",
                      fontSize: "0.7rem",
                      height: 24,
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* Details Grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                    Duration
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                    <IconWrapper icon="mdi:timer-outline" size={14} color="#64748b" />
                    <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.8125rem", fontWeight: 500 }}>
                      {formatDuration(assessment.duration_minutes)}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                    Questions
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                    <IconWrapper icon="mdi:help-circle-outline" size={14} color="#64748b" />
                    <Typography variant="body2" sx={{ color: "#475569", fontSize: "0.8125rem", fontWeight: 600 }}>
                      {assessment.total_questions}
                    </Typography>
                  </Box>
                </Box>
                {assessment.courses && assessment.courses.length > 0 && (
                  <Box sx={{ gridColumn: "span 2" }}>
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                      Courses
                    </Typography>
                    <Tooltip title={formatCourses(assessment.courses).full || ""} arrow>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#475569",
                          fontSize: "0.8125rem",
                          mt: 0.25,
                          fontWeight: 500,
                        }}
                      >
                        {formatCourses(assessment.courses).display}
                      </Typography>
                    </Tooltip>
                  </Box>
                )}
                {assessment.colleges && assessment.colleges.length > 0 && (
                  <Box sx={{ gridColumn: "span 2" }}>
                    <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                      Colleges
                    </Typography>
                    <Tooltip title={formatColleges(assessment.colleges).full || ""} arrow>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#475569",
                          fontSize: "0.8125rem",
                          mt: 0.25,
                          fontWeight: 500,
                        }}
                      >
                        {formatColleges(assessment.colleges).display}
                      </Typography>
                    </Tooltip>
                  </Box>
                )}
                <Box sx={{ gridColumn: "span 2" }}>
                  <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                    Created
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.8125rem", mt: 0.25 }}>
                    {formatDate(assessment.created_at)}
                  </Typography>
                </Box>
              </Box>

              {/* Time Information */}
              {(assessment.start_time || assessment.end_time) && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                    {assessment.start_time && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            bgcolor: "#dbeafe",
                            color: "#1e40af",
                          }}
                        >
                          <IconWrapper icon="mdi:play-circle" size={12} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                            Start
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#475569",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                            }}
                          >
                            {formatDateTime(assessment.start_time) || "—"}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    {assessment.end_time && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            bgcolor: "#fee2e2",
                            color: "#991b1b",
                          }}
                        >
                          <IconWrapper icon="mdi:stop-circle" size={12} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: "#94a3b8", fontSize: "0.7rem" }}>
                            End
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#475569",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                            }}
                          >
                            {formatDateTime(assessment.end_time) || "—"}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>
                </>
              )}

              {/* Actions */}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {onEdit && (
                  <IconButton
                    size="small"
                    onClick={() => onEdit(assessment.id)}
                    sx={{
                      color: "#6366f1",
                      "&:hover": { bgcolor: "#eef2ff" },
                    }}
                  >
                    <IconWrapper icon="mdi:eye-outline" size={20} />
                  </IconButton>
                )}
                <Box sx={{ display: "flex", gap: 0.5 }}>
                  <Tooltip title="Download questions" arrow>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onExportQuestions(assessment)}
                        disabled={exportingQuestionsId === assessment.id}
                        sx={{
                          color: "#6366f1",
                          "&:hover": { bgcolor: "#eef2ff" },
                          "&:disabled": { color: "#cbd5e1" },
                        }}
                      >
                        {exportingQuestionsId === assessment.id ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <IconWrapper icon="mdi:help-circle-outline" size={18} />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Download submissions" arrow>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onExportSubmissions(assessment)}
                        disabled={exportingSubmissionsId === assessment.id}
                        sx={{
                          color: "#059669",
                          "&:hover": { bgcolor: "#d1fae5" },
                          "&:disabled": { color: "#cbd5e1" },
                        }}
                      >
                        {exportingSubmissionsId === assessment.id ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <IconWrapper icon="mdi:file-delimited-outline" size={18} />
                        )}
                      </IconButton>
                    </span>
                  </Tooltip>
                  {onDelete && (
                    <Tooltip title="Delete" arrow>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onDelete(assessment)}
                          disabled={deletingId === assessment.id}
                          sx={{
                            color: "#dc2626",
                            "&:hover": { bgcolor: "#fee2e2" },
                            "&:disabled": { color: "#cbd5e1" },
                          }}
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
              </Box>
            </Paper>
          ))
        )}
      </Box>
    );
  }

  // Desktop Table View
  return (
    <>
    <TableContainer sx={{ overflowX: "auto", maxWidth: "100%" }}>
      <Table sx={{ minWidth: { md: 1000, lg: 1200 } }}>
        <TableHead>
          <TableRow
            sx={{
              backgroundColor: "#f8fafc",
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            <TableCell
              sx={{
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                minWidth: 200,
              }}
            >
              Title
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                minWidth: 150,
                display: { xs: "none", lg: "table-cell" },
              }}
            >
              Courses
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                minWidth: 150,
                display: { xs: "none", lg: "table-cell" },
              }}
            >
              Colleges
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                whiteSpace: "nowrap",
                display: { xs: "none", md: "table-cell" },
              }}
            >
              Duration
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                whiteSpace: "nowrap",
                display: { xs: "none", sm: "table-cell" },
              }}
            >
              Questions
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                whiteSpace: "nowrap",
                display: { xs: "none", lg: "table-cell" },
              }}
            >
              Status
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                whiteSpace: "nowrap",
                minWidth: 120,
                display: { xs: "none", md: "table-cell" },
              }}
            >
              Created
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "#1e293b",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                whiteSpace: "nowrap",
                minWidth: 140,
                textAlign: "center",
              }}
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assessments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <IconWrapper
                    icon="mdi:file-document-outline"
                    size={48}
                    color="#94a3b8"
                  />
                  <Typography
                    variant="body1"
                    sx={{ color: "#64748b", fontWeight: 500 }}
                  >
                    No assessments found
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                    Create your first assessment to get started
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            assessments.map((assessment) => (
              <TableRow
                key={assessment.id}
                sx={{
                  "&:hover": {
                    backgroundColor: "#f8fafc",
                    transition: "background-color 0.2s ease",
                  },
                  borderBottom: "1px solid #e2e8f0",
                  transition: "all 0.2s ease",
                }}
              >
                <TableCell sx={{ py: 2.5 }}>
                  <Box>
                    {/* Title */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mb: 1 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 700,
                            color: "#0f172a",
                            fontSize: "1rem",
                            lineHeight: 1.4,
                            mb: 0.25,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {assessment.title}
                        </Typography>
                      </Box>
                      {assessment.submissions_count !== undefined && assessment.submissions_count > 0 && (
                        <Chip
                          icon={<IconWrapper icon="mdi:account-multiple" size={14} />}
                          label={assessment.submissions_count}
                          size="small"
                          sx={{
                            bgcolor: "#f1f5f9",
                            color: "#475569",
                            fontSize: "0.7rem",
                            height: 24,
                            fontWeight: 600,
                            border: "1px solid #e2e8f0",
                          }}
                        />
                      )}
                    </Box>

                    {/* Tags Row */}
                    <Stack direction="row" spacing={0.75} sx={{ mb: 1, flexWrap: "wrap", gap: 0.75 }}>
                      {assessment.is_paid && assessment.price && (
                        <Chip
                          icon={<IconWrapper icon="mdi:currency-inr" size={14} />}
                          label={`₹${assessment.price}`}
                          size="small"
                          sx={{
                            bgcolor: "#fef3c7",
                            color: "#92400e",
                            fontSize: "0.7rem",
                            height: 24,
                            fontWeight: 600,
                            border: "1px solid #fde68a",
                          }}
                        />
                      )}
                      {assessment.proctoring_enabled && (
                        <Chip
                          icon={<IconWrapper icon="mdi:shield-check" size={14} />}
                          label="Proctored"
                          size="small"
                          sx={{
                            bgcolor: "#dbeafe",
                            color: "#1e40af",
                            fontSize: "0.7rem",
                            height: 24,
                            fontWeight: 600,
                            border: "1px solid #bfdbfe",
                          }}
                        />
                      )}
                    </Stack>

                    {/* Time Information */}
                    {(assessment.start_time || assessment.end_time) && (
                      <Box
                        sx={{
                          mt: 1,
                          pt: 1,
                          borderTop: "1px solid #e2e8f0",
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        {assessment.start_time && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                bgcolor: "#dbeafe",
                                color: "#1e40af",
                              }}
                            >
                              <IconWrapper icon="mdi:play-circle" size={12} />
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#475569",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                              }}
                            >
                              {formatDateTime(assessment.start_time) || "—"}
                            </Typography>
                          </Box>
                        )}
                        {assessment.end_time && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.75,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                bgcolor: "#fee2e2",
                                color: "#991b1b",
                              }}
                            >
                              <IconWrapper icon="mdi:stop-circle" size={12} />
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#475569",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                              }}
                            >
                              {formatDateTime(assessment.end_time) || "—"}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    display: { xs: "none", lg: "table-cell" },
                    py: 2.5,
                    maxWidth: 200,
                  }}
                >
                  {(() => {
                    const { display, full } = formatCourses(assessment.courses);
                    if (!full) {
                      return (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#94a3b8",
                            fontSize: "0.8125rem",
                            fontStyle: "italic",
                          }}
                        >
                          {display}
                        </Typography>
                      );
                    }
                    return (
                      <Tooltip title={full} arrow placement="top">
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#475569",
                            fontSize: "0.8125rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "help",
                            fontWeight: 500,
                          }}
                        >
                          {display}
                        </Typography>
                      </Tooltip>
                    );
                  })()}
                </TableCell>
                <TableCell
                  sx={{
                    display: { xs: "none", lg: "table-cell" },
                    py: 2.5,
                    maxWidth: 200,
                  }}
                >
                  {(() => {
                    const { display, full } = formatColleges(assessment.colleges);
                    if (!full) {
                      return (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#94a3b8",
                            fontSize: "0.8125rem",
                            fontStyle: "italic",
                          }}
                        >
                          {display}
                        </Typography>
                      );
                    }
                    return (
                      <Tooltip title={full} arrow placement="top">
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#475569",
                            fontSize: "0.8125rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "help",
                            fontWeight: 500,
                          }}
                        >
                          {display}
                        </Typography>
                      </Tooltip>
                    );
                  })()}
                </TableCell>
                <TableCell
                  sx={{
                    display: { xs: "none", md: "table-cell" },
                    whiteSpace: "nowrap",
                    py: 2.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconWrapper icon="mdi:timer-outline" size={16} color="#64748b" />
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#475569",
                        fontSize: "0.8125rem",
                        fontWeight: 500,
                      }}
                    >
                      {formatDuration(assessment.duration_minutes)}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    display: { xs: "none", sm: "table-cell" },
                    whiteSpace: "nowrap",
                    py: 2.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconWrapper icon="mdi:help-circle-outline" size={16} color="#64748b" />
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#475569",
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                      }}
                    >
                      {assessment.total_questions}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: "none", lg: "table-cell" }, py: 2.5 }}>
                  <Chip
                    label={assessment.is_active ? "Active" : "Inactive"}
                    size="small"
                    icon={
                      <IconWrapper
                        icon={
                          assessment.is_active
                            ? "mdi:check-circle"
                            : "mdi:close-circle"
                        }
                        size={14}
                      />
                    }
                    sx={{
                      bgcolor: assessment.is_active ? "#d1fae5" : "#fee2e2",
                      color: assessment.is_active ? "#065f46" : "#991b1b",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      height: 26,
                      border: `1px solid ${
                        assessment.is_active ? "#a7f3d0" : "#fecaca"
                      }`,
                    }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    display: { xs: "none", md: "table-cell" },
                    whiteSpace: "nowrap",
                    py: 2.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#64748b",
                      fontSize: "0.8125rem",
                    }}
                  >
                    {formatDate(assessment.created_at)}
                  </Typography>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", py: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 0.5,
                      flexWrap: "nowrap",
                      justifyContent: "center",
                    }}
                  >
                    {onEdit && (
                      <Tooltip title="View / Edit" arrow>
                        <IconButton
                          size="small"
                          onClick={() => onEdit(assessment.id)}
                          sx={{
                            color: "#6366f1",
                            "&:hover": {
                              bgcolor: "#eef2ff",
                              color: "#4f46e5",
                            },
                            transition: "all 0.2s ease",
                          }}
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
                    <Tooltip title="Download questions (CSV)" arrow>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onExportQuestions(assessment)}
                          disabled={exportingQuestionsId === assessment.id}
                          sx={{
                            color: "#6366f1",
                            "&:hover": {
                              bgcolor: "#eef2ff",
                              color: "#4f46e5",
                            },
                            "&:disabled": {
                              color: "#cbd5e1",
                            },
                            transition: "all 0.2s ease",
                          }}
                          aria-label="Download questions CSV"
                        >
                          {exportingQuestionsId === assessment.id ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <IconWrapper icon="mdi:help-circle-outline" size={18} />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Download submissions (CSV)" arrow>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => onExportSubmissions(assessment)}
                          disabled={exportingSubmissionsId === assessment.id}
                          sx={{
                            color: "#059669",
                            "&:hover": {
                              bgcolor: "#d1fae5",
                              color: "#047857",
                            },
                            "&:disabled": {
                              color: "#cbd5e1",
                            },
                            transition: "all 0.2s ease",
                          }}
                          aria-label="Download submissions CSV"
                        >
                          {exportingSubmissionsId === assessment.id ? (
                            <CircularProgress size={18} color="inherit" />
                          ) : (
                            <IconWrapper icon="mdi:file-delimited-outline" size={18} />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                    {onDelete && (
                      <Tooltip title="Delete" arrow>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onDelete(assessment)}
                            disabled={deletingId === assessment.id}
                            sx={{
                              color: "#dc2626",
                              "&:hover": {
                                bgcolor: "#fee2e2",
                                color: "#b91c1c",
                              },
                            "&:disabled": {
                              color: "#cbd5e1",
                            },
                              transition: "all 0.2s ease",
                            }}
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
