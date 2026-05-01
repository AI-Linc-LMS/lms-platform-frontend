"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Assessment } from "@/lib/services/admin/admin-assessment.service";
import { isProctoredAssessmentInLiveWindow } from "@/lib/utils/assessment-live-window.utils";
import { useClientInfo } from "@/lib/contexts/ClientInfoContext";

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
  onDuplicate?: (assessment: Assessment) => Promise<void>;
  exportingSubmissionsId?: number | null;
  exportingQuestionsId?: number | null;
  deletingId?: number | null;
  triggeringEmailJobId?: number | null;
  duplicatingId?: number | null;
  /** When true, actions menu shows View and Download Submissions only (no email, questions export, duplicate, delete). */
  actionsReadOnly?: boolean;
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
  onDuplicate,
  exportingSubmissionsId = null,
  exportingQuestionsId = null,
  deletingId = null,
  triggeringEmailJobId = null,
  duplicatingId = null,
  actionsReadOnly = false,
}: AssessmentTableProps) {
  const { t } = useTranslation("common");
  const { clientInfo } = useClientInfo();
  const liveProctoringEnabled = clientInfo?.live_proctoring_enabled === true;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState<{ [key: number]: HTMLElement | null }>({});

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, assessmentId: number) => {
    setAnchorEl({ ...anchorEl, [assessmentId]: event.currentTarget });
  };

  const handleMenuClose = (assessmentId: number) => {
    setAnchorEl({ ...anchorEl, [assessmentId]: null });
  };


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

  const canAccessLiveMonitor = (assessment: Assessment): boolean =>
    liveProctoringEnabled &&
    assessment.live_streaming === true &&
    isProctoredAssessmentInLiveWindow(assessment);

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
              bgcolor: "var(--surface)",
            }}
          >
            <IconWrapper icon="mdi:file-document-outline" size={48} color="var(--font-tertiary)" />
            <Typography variant="body1" sx={{ color: "var(--font-secondary)", fontWeight: 500, mt: 2 }}>
              No assessments found
            </Typography>
            <Typography variant="body2" sx={{ color: "var(--font-tertiary)", mt: 1 }}>
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
                boxShadow:
                  "0 1px 3px color-mix(in srgb, var(--font-primary) 12%, transparent)",
                border: "1px solid var(--border-default)",
                "&:hover": {
                  boxShadow:
                    "0 4px 6px color-mix(in srgb, var(--font-primary) 16%, transparent)",
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
                      color: "var(--font-primary)",
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
                          bgcolor:
                            "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)",
                          color: "var(--warning-500)",
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
                          bgcolor:
                            "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                          color: "var(--accent-indigo)",
                          fontSize: "0.7rem",
                          height: 22,
                          fontWeight: 600,
                        }}
                      />
                    )}
                    {canAccessLiveMonitor(assessment) && (
                      <Chip
                        component={Link}
                        href={`/admin/assessment/${assessment.id}/live-monitor`}
                        onClick={(e) => e.stopPropagation()}
                        icon={<IconWrapper icon="mdi:video-account" size={14} />}
                        label="Live"
                        size="small"
                        clickable
                        sx={{
                          bgcolor:
                            "color-mix(in srgb, var(--accent-purple) 14%, var(--surface) 86%)",
                          color: "var(--accent-purple)",
                          fontSize: "0.7rem",
                          height: 22,
                          fontWeight: 600,
                          textDecoration: "none",
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
                        bgcolor: assessment.is_active
                          ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                          : "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
                        color: assessment.is_active ? "var(--success-500)" : "var(--error-500)",
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
                      bgcolor: "var(--surface)",
                      color: "var(--font-secondary)",
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
                  <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontSize: "0.7rem" }}>
                    Duration
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                    <IconWrapper icon="mdi:timer-outline" size={14} color="var(--font-secondary)" />
                    <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem", fontWeight: 500 }}>
                      {formatDuration(assessment.duration_minutes)}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontSize: "0.7rem" }}>
                    Questions
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.25 }}>
                    <IconWrapper icon="mdi:help-circle-outline" size={14} color="var(--font-secondary)" />
                    <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem", fontWeight: 600 }}>
                      {assessment.total_questions}
                    </Typography>
                  </Box>
                </Box>
                {assessment.courses && assessment.courses.length > 0 && (
                  <Box sx={{ gridColumn: "span 2" }}>
                    <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontSize: "0.7rem" }}>
                      Courses
                    </Typography>
                    <Tooltip title={formatCourses(assessment.courses).full || ""} arrow>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "var(--font-secondary)",
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
                <Box sx={{ gridColumn: "span 2" }}>
                  <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontSize: "0.7rem" }}>
                    Created
                  </Typography>
                  <Typography variant="body2" sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem", mt: 0.25 }}>
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
                            bgcolor:
                              "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                            color: "var(--accent-indigo)",
                          }}
                        >
                          <IconWrapper icon="mdi:play-circle" size={12} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontSize: "0.7rem" }}>
                            Start
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "var(--font-secondary)",
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
                            bgcolor:
                              "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
                            color: "var(--error-500)",
                          }}
                        >
                          <IconWrapper icon="mdi:stop-circle" size={12} />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontSize: "0.7rem" }}>
                            End
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "var(--font-secondary)",
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
              <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                <IconButton
                  size="small"
                  onClick={(e) => handleMenuOpen(e, assessment.id)}
                  sx={{
                    color: "var(--font-secondary)",
                    "&:hover": { bgcolor: "var(--surface)", color: "var(--font-primary)" },
                  }}
                >
                  <IconWrapper icon="mdi:dots-vertical" size={20} />
                </IconButton>
                <Menu
                  anchorEl={anchorEl[assessment.id]}
                  open={Boolean(anchorEl[assessment.id])}
                  onClose={() => handleMenuClose(assessment.id)}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "right",
                  }}
                  transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                  }}
                  PaperProps={{
                    sx: {
                      mt: 1,
                      minWidth: 200,
                      bgcolor: "var(--card-bg)",
                      color: "var(--font-primary)",
                      border: "1px solid var(--border-default)",
                      boxShadow:
                        "0 4px 6px color-mix(in srgb, var(--font-primary) 12%, transparent)",
                      borderRadius: 2,
                      "& .MuiMenuItem-root": {
                        color: "var(--font-primary)",
                      },
                      "& .MuiListItemIcon-root": {
                        color: "var(--font-secondary)",
                      },
                      "& .MuiMenuItem-root.Mui-disabled": {
                        color: "var(--font-secondary)",
                        opacity: 0.78,
                      },
                    },
                  }}
                >
                  {onEdit && (
                    <MenuItem
                      onClick={() => {
                        handleMenuClose(assessment.id);
                        onEdit(assessment.id);
                      }}
                    >
                      <ListItemIcon>
                        <IconWrapper icon="mdi:eye-outline" size={18} color="var(--accent-indigo)" />
                      </ListItemIcon>
                      <ListItemText>{actionsReadOnly ? "View" : "View / Edit"}</ListItemText>
                    </MenuItem>
                  )}
                  {canAccessLiveMonitor(assessment) && (
                    <MenuItem
                      component={Link}
                      href={`/admin/assessment/${assessment.id}/live-monitor`}
                      onClick={() => handleMenuClose(assessment.id)}
                    >
                      <ListItemIcon>
                        <IconWrapper icon="mdi:video-account" size={18} color="var(--accent-purple)" />
                      </ListItemIcon>
                      <ListItemText>Live monitor</ListItemText>
                    </MenuItem>
                  )}
                  {!actionsReadOnly && onTriggerEmailJob && (() => {
                    const job = assessmentEmailJobMap[assessment.id];
                    const isTriggering = triggeringEmailJobId === assessment.id;
                    if (job) {
                      if (isFailedStatus(job.status)) {
                        return (
                          <MenuItem
                            component={Link}
                            href="/admin/emails?tab=assessment"
                            onClick={() => handleMenuClose(assessment.id)}
                          >
                            <ListItemIcon>
                              <IconWrapper icon="mdi:alert-circle" size={18} color="var(--warning-500)" />
                            </ListItemIcon>
                            <ListItemText>Retry Email Job</ListItemText>
                          </MenuItem>
                        );
                      }
                      return (
                        <MenuItem
                          component={Link}
                          href={`/admin/emails/assessment/${encodeURIComponent(job.task_id)}`}
                          onClick={() => handleMenuClose(assessment.id)}
                        >
                          <ListItemIcon>
                            <IconWrapper icon="mdi:email-check" size={18} color="var(--success-500)" />
                          </ListItemIcon>
                          <ListItemText>View Email Job</ListItemText>
                        </MenuItem>
                      );
                    }
                    return (
                      <MenuItem
                        onClick={async () => {
                          handleMenuClose(assessment.id);
                          await onTriggerEmailJob(assessment);
                        }}
                        disabled={isTriggering}
                      >
                        <ListItemIcon>
                          {isTriggering ? (
                            <CircularProgress size={18} />
                          ) : (
                            <IconWrapper icon="mdi:email-send-outline" size={18} color="var(--success-500)" />
                          )}
                        </ListItemIcon>
                        <ListItemText>
                          {isTriggering ? "Triggering..." : "Trigger Email Job"}
                        </ListItemText>
                      </MenuItem>
                    );
                  })()}
                  {!actionsReadOnly && (
                    <MenuItem
                      onClick={() => {
                        handleMenuClose(assessment.id);
                        onExportQuestions(assessment);
                      }}
                      disabled={exportingQuestionsId === assessment.id}
                    >
                      <ListItemIcon>
                        {exportingQuestionsId === assessment.id ? (
                          <CircularProgress size={18} />
                        ) : (
                          <IconWrapper icon="mdi:help-circle-outline" size={18} color="var(--accent-indigo)" />
                        )}
                      </ListItemIcon>
                      <ListItemText>
                        {exportingQuestionsId === assessment.id ? "Exporting..." : "Download Questions"}
                      </ListItemText>
                    </MenuItem>
                  )}
                  <MenuItem
                    onClick={() => {
                      handleMenuClose(assessment.id);
                      onExportSubmissions(assessment);
                    }}
                    disabled={exportingSubmissionsId === assessment.id}
                  >
                    <ListItemIcon>
                      {exportingSubmissionsId === assessment.id ? (
                        <CircularProgress size={18} />
                      ) : (
                        <IconWrapper icon="mdi:file-delimited-outline" size={18} color="var(--success-500)" />
                      )}
                    </ListItemIcon>
                    <ListItemText>
                      {exportingSubmissionsId === assessment.id ? "Exporting..." : "Download Submissions"}
                    </ListItemText>
                  </MenuItem>
                  {!actionsReadOnly && onDuplicate && (
                    <MenuItem
                      onClick={() => {
                        handleMenuClose(assessment.id);
                        onDuplicate(assessment);
                      }}
                      disabled={duplicatingId === assessment.id}
                    >
                      <ListItemIcon>
                        {duplicatingId === assessment.id ? (
                          <CircularProgress size={18} />
                        ) : (
                          <IconWrapper icon="mdi:content-copy" size={18} color="var(--accent-purple)" />
                        )}
                      </ListItemIcon>
                      <ListItemText>
                        {duplicatingId === assessment.id ? "Duplicating..." : "Duplicate Assessment"}
                      </ListItemText>
                    </MenuItem>
                  )}
                  {!actionsReadOnly && onDelete && (
                    <MenuItem
                      onClick={() => {
                        handleMenuClose(assessment.id);
                        onDelete(assessment);
                      }}
                      disabled={deletingId === assessment.id}
                      sx={{
                        color: "var(--error-500)",
                        "&:hover": {
                          bgcolor:
                            "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
                        },
                      }}
                    >
                      <ListItemIcon>
                        {deletingId === assessment.id ? (
                          <CircularProgress size={18} />
                        ) : (
                          <IconWrapper icon="mdi:delete-outline" size={18} color="var(--error-500)" />
                        )}
                      </ListItemIcon>
                      <ListItemText>
                        {deletingId === assessment.id ? "Deleting..." : "Delete"}
                      </ListItemText>
                    </MenuItem>
                  )}
                </Menu>
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
    <TableContainer
      sx={{
        overflowX: "auto",
        maxWidth: "100%",
        bgcolor: "var(--card-bg)",
        color: "var(--font-primary)",
        "& .MuiTableCell-root": {
          color: "var(--font-primary)",
          borderColor: "var(--border-default)",
        },
      }}
    >
      <Table sx={{ minWidth: { md: 1000, lg: 1200 } }}>
        <TableHead>
          <TableRow
            sx={{
              backgroundColor:
                "color-mix(in srgb, var(--surface) 74%, var(--card-bg) 26%)",
              borderBottom: "2px solid var(--border-default)",
            }}
          >
            <TableCell
              sx={{
                fontWeight: 700,
                color: "var(--font-primary)",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                minWidth: 200,
              }}
            >
              {t("admin.assessment.columns.title")}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "var(--font-primary)",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                minWidth: 150,
                display: { xs: "none", lg: "table-cell" },
              }}
            >
              {t("admin.assessment.columns.courses")}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "var(--font-primary)",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                whiteSpace: "nowrap",
                display: { xs: "none", md: "table-cell" },
              }}
            >
              {t("admin.assessment.columns.duration")}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "var(--font-primary)",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                whiteSpace: "nowrap",
                display: { xs: "none", sm: "table-cell" },
              }}
            >
              {t("admin.assessment.columns.questions")}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "var(--font-primary)",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                whiteSpace: "nowrap",
                display: { xs: "none", lg: "table-cell" },
              }}
            >
              {t("admin.assessment.columns.status")}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "var(--font-primary)",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                whiteSpace: "nowrap",
                minWidth: 120,
                display: { xs: "none", md: "table-cell" },
              }}
            >
              {t("admin.assessment.columns.created")}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 700,
                color: "var(--font-primary)",
                fontSize: "0.875rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                py: 2,
                whiteSpace: "nowrap",
                minWidth: 140,
                textAlign: "center",
              }}
            >
              {t("admin.assessment.columns.actions")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {assessments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
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
                    color="var(--font-tertiary)"
                  />
                  <Typography
                    variant="body1"
                    sx={{ color: "var(--font-secondary)", fontWeight: 500 }}
                  >
                    No assessments found
                  </Typography>
                  <Typography variant="body2" sx={{ color: "var(--font-tertiary)" }}>
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
                    backgroundColor:
                      "color-mix(in srgb, var(--surface) 72%, var(--card-bg) 28%)",
                    transition: "background-color 0.2s ease",
                  },
                  borderBottom: "1px solid var(--border-default)",
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
                            color: "var(--font-primary)",
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
                            bgcolor:
                              "color-mix(in srgb, var(--surface) 85%, var(--card-bg) 15%)",
                            color: "var(--font-secondary)",
                            fontSize: "0.7rem",
                            height: 24,
                            fontWeight: 600,
                            border: "1px solid var(--border-default)",
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
                            bgcolor:
                              "color-mix(in srgb, var(--warning-500) 16%, var(--surface) 84%)",
                            color: "var(--warning-500)",
                            fontSize: "0.7rem",
                            height: 24,
                            fontWeight: 600,
                            border:
                              "1px solid color-mix(in srgb, var(--warning-500) 36%, var(--border-default) 64%)",
                          }}
                        />
                      )}
                      {assessment.proctoring_enabled && (
                        <Chip
                          icon={<IconWrapper icon="mdi:shield-check" size={14} />}
                          label="Proctored"
                          size="small"
                          sx={{
                            bgcolor:
                              "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                            color: "var(--accent-indigo)",
                            fontSize: "0.7rem",
                            height: 24,
                            fontWeight: 600,
                            border:
                              "1px solid color-mix(in srgb, var(--accent-indigo) 32%, var(--border-default) 68%)",
                          }}
                        />
                      )}
                      {canAccessLiveMonitor(assessment) && (
                        <Chip
                          component={Link}
                          href={`/admin/assessment/${assessment.id}/live-monitor`}
                          onClick={(e) => e.stopPropagation()}
                          icon={<IconWrapper icon="mdi:video-account" size={14} />}
                          label="Live"
                          size="small"
                          clickable
                          sx={{
                            bgcolor:
                              "color-mix(in srgb, var(--accent-purple) 14%, var(--surface) 86%)",
                            color: "var(--accent-purple)",
                            fontSize: "0.7rem",
                            height: 24,
                            fontWeight: 600,
                            border:
                              "1px solid color-mix(in srgb, var(--accent-purple) 32%, var(--border-default) 68%)",
                            textDecoration: "none",
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
                          borderTop: "1px solid var(--border-default)",
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
                                bgcolor:
                                  "color-mix(in srgb, var(--accent-indigo) 14%, var(--surface) 86%)",
                                color: "var(--accent-indigo)",
                              }}
                            >
                              <IconWrapper icon="mdi:play-circle" size={12} />
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "var(--font-secondary)",
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
                                bgcolor:
                                  "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
                                color: "var(--error-500)",
                              }}
                            >
                              <IconWrapper icon="mdi:stop-circle" size={12} />
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "var(--font-secondary)",
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
                            color: "var(--font-tertiary)",
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
                            color: "var(--font-secondary)",
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
                    <IconWrapper icon="mdi:timer-outline" size={16} color="var(--font-secondary)" />
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--font-secondary)",
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
                    <IconWrapper icon="mdi:help-circle-outline" size={16} color="var(--font-secondary)" />
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--font-secondary)",
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
                      bgcolor: assessment.is_active
                        ? "color-mix(in srgb, var(--success-500) 14%, var(--surface) 86%)"
                        : "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
                      color: assessment.is_active ? "var(--success-500)" : "var(--error-500)",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                      height: 26,
                      border: `1px solid ${
                        assessment.is_active
                          ? "color-mix(in srgb, var(--success-500) 34%, var(--border-default) 66%)"
                          : "color-mix(in srgb, var(--error-500) 34%, var(--border-default) 66%)"
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
                      color: "var(--font-secondary)",
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
                      justifyContent: "center",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, assessment.id)}
                      sx={{
                        color: "var(--font-secondary)",
                        "&:hover": {
                          bgcolor:
                            "color-mix(in srgb, var(--surface) 82%, var(--card-bg) 18%)",
                          color: "var(--font-primary)",
                        },
                        transition: "all 0.2s ease",
                      }}
                      aria-label="More actions"
                    >
                      <IconWrapper icon="mdi:dots-vertical" size={18} />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl[assessment.id]}
                      open={Boolean(anchorEl[assessment.id])}
                      onClose={() => handleMenuClose(assessment.id)}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "right",
                      }}
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      PaperProps={{
                        sx: {
                          mt: 1,
                          minWidth: 200,
                          bgcolor: "var(--card-bg)",
                          color: "var(--font-primary)",
                          border: "1px solid var(--border-default)",
                          boxShadow:
                            "0 4px 6px color-mix(in srgb, var(--font-primary) 12%, transparent)",
                          borderRadius: 2,
                          "& .MuiMenuItem-root": {
                            color: "var(--font-primary)",
                          },
                          "& .MuiListItemIcon-root": {
                            color: "var(--font-secondary)",
                          },
                          "& .MuiMenuItem-root.Mui-disabled": {
                            color: "var(--font-secondary)",
                            opacity: 0.78,
                          },
                        },
                      }}
                    >
                      {onEdit && (
                        <MenuItem
                          onClick={() => {
                            handleMenuClose(assessment.id);
                            onEdit(assessment.id);
                          }}
                        >
                          <ListItemIcon>
                            <IconWrapper icon="mdi:eye-outline" size={18} color="var(--accent-indigo)" />
                          </ListItemIcon>
                          <ListItemText>{actionsReadOnly ? "View" : "View / Edit"}</ListItemText>
                        </MenuItem>
                      )}
                      {canAccessLiveMonitor(assessment) && (
                        <MenuItem
                          component={Link}
                          href={`/admin/assessment/${assessment.id}/live-monitor`}
                          onClick={() => handleMenuClose(assessment.id)}
                        >
                          <ListItemIcon>
                            <IconWrapper icon="mdi:video-account" size={18} color="var(--accent-purple)" />
                          </ListItemIcon>
                          <ListItemText>Live monitor</ListItemText>
                        </MenuItem>
                      )}
                      {!actionsReadOnly && onTriggerEmailJob && (() => {
                        const job = assessmentEmailJobMap[assessment.id];
                        const isTriggering = triggeringEmailJobId === assessment.id;
                        if (job) {
                          if (isFailedStatus(job.status)) {
                            return (
                              <MenuItem
                                component={Link}
                                href="/admin/emails?tab=assessment"
                                onClick={() => handleMenuClose(assessment.id)}
                              >
                                <ListItemIcon>
                              <IconWrapper icon="mdi:alert-circle" size={18} color="var(--warning-500)" />
                                </ListItemIcon>
                                <ListItemText>Retry Email Job</ListItemText>
                              </MenuItem>
                            );
                          }
                          return (
                            <MenuItem
                              component={Link}
                              href={`/admin/emails/assessment/${encodeURIComponent(job.task_id)}`}
                              onClick={() => handleMenuClose(assessment.id)}
                            >
                              <ListItemIcon>
                            <IconWrapper icon="mdi:email-check" size={18} color="var(--success-500)" />
                              </ListItemIcon>
                              <ListItemText>View Email Job</ListItemText>
                            </MenuItem>
                          );
                        }
                        return (
                          <MenuItem
                            onClick={async () => {
                              handleMenuClose(assessment.id);
                              await onTriggerEmailJob(assessment);
                            }}
                            disabled={isTriggering}
                          >
                            <ListItemIcon>
                              {isTriggering ? (
                                <CircularProgress size={18} />
                              ) : (
                            <IconWrapper icon="mdi:email-send-outline" size={18} color="var(--success-500)" />
                              )}
                            </ListItemIcon>
                            <ListItemText>
                              {isTriggering ? "Triggering..." : "Trigger Email Job"}
                            </ListItemText>
                          </MenuItem>
                        );
                      })()}
                      {!actionsReadOnly && (
                        <MenuItem
                          onClick={() => {
                            handleMenuClose(assessment.id);
                            onExportQuestions(assessment);
                          }}
                          disabled={exportingQuestionsId === assessment.id}
                        >
                          <ListItemIcon>
                            {exportingQuestionsId === assessment.id ? (
                              <CircularProgress size={18} />
                            ) : (
                          <IconWrapper icon="mdi:help-circle-outline" size={18} color="var(--accent-indigo)" />
                            )}
                          </ListItemIcon>
                          <ListItemText>
                            {exportingQuestionsId === assessment.id ? "Exporting..." : "Download Questions"}
                          </ListItemText>
                        </MenuItem>
                      )}
                      <MenuItem
                        onClick={() => {
                          handleMenuClose(assessment.id);
                          onExportSubmissions(assessment);
                        }}
                        disabled={exportingSubmissionsId === assessment.id}
                      >
                        <ListItemIcon>
                          {exportingSubmissionsId === assessment.id ? (
                            <CircularProgress size={18} />
                          ) : (
                        <IconWrapper icon="mdi:file-delimited-outline" size={18} color="var(--success-500)" />
                          )}
                        </ListItemIcon>
                        <ListItemText>
                          {exportingSubmissionsId === assessment.id ? "Exporting..." : "Download Submissions"}
                        </ListItemText>
                      </MenuItem>
                      {!actionsReadOnly && onDuplicate && (
                        <MenuItem
                          onClick={() => {
                            handleMenuClose(assessment.id);
                            onDuplicate(assessment);
                          }}
                          disabled={duplicatingId === assessment.id}
                        >
                          <ListItemIcon>
                            {duplicatingId === assessment.id ? (
                              <CircularProgress size={18} />
                            ) : (
                          <IconWrapper icon="mdi:content-copy" size={18} color="var(--accent-purple)" />
                            )}
                          </ListItemIcon>
                          <ListItemText>
                            {duplicatingId === assessment.id ? "Duplicating..." : "Duplicate Assessment"}
                          </ListItemText>
                        </MenuItem>
                      )}
                      {!actionsReadOnly && onDelete && (
                        <MenuItem
                          onClick={() => {
                            handleMenuClose(assessment.id);
                            onDelete(assessment);
                          }}
                          disabled={deletingId === assessment.id}
                          sx={{
                        color: "var(--error-500)",
                        "&:hover": {
                          bgcolor:
                            "color-mix(in srgb, var(--error-500) 14%, var(--surface) 86%)",
                        },
                          }}
                        >
                          <ListItemIcon>
                            {deletingId === assessment.id ? (
                              <CircularProgress size={18} />
                            ) : (
                          <IconWrapper icon="mdi:delete-outline" size={18} color="var(--error-500)" />
                            )}
                          </ListItemIcon>
                          <ListItemText>
                            {deletingId === assessment.id ? "Deleting..." : "Delete"}
                          </ListItemText>
                        </MenuItem>
                      )}
                    </Menu>
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
