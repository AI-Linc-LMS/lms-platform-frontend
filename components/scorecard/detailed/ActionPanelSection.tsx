"use client";

import { Box, Typography, Paper, Button, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  ActionPanel,
  PriorityAction,
  RecommendedContent,
  PendingTask,
  UpcomingAssessment,
} from "@/lib/types/scorecard.types";
import { useRouter } from "next/navigation";

interface ActionPanelSectionProps {
  data: ActionPanel;
  /** When true (e.g. admin view), hide Take Action and View Content buttons */
  readOnly?: boolean;
}

const hasAnyData = (data: ActionPanel) =>
  (data.priorityActions?.length ?? 0) > 0 ||
  (data.recommendedContent?.length ?? 0) > 0 ||
  (data.pendingTasks?.length ?? 0) > 0 ||
  (data.upcomingAssessments?.length ?? 0) > 0;

const getActionIcon = (type: string) => {
  switch (type) {
    case "assessment":
      return "mdi:clipboard-check";
    case "video":
      return "mdi:play-circle";
    case "article":
      return "mdi:book-open-variant";
    case "mcq":
      return "mdi:checkbox-multiple-marked";
    case "interview":
      return "mdi:account-tie";
    default:
      return "mdi:rocket-launch";
  }
};

const getActionColor = (type: string) => {
  switch (type) {
    case "assessment":
      return { main: "#2563eb", bg: "rgba(37, 99, 235, 0.1)", border: "rgba(37, 99, 235, 0.25)" };
    case "video":
      return { main: "#059669", bg: "rgba(5, 150, 105, 0.1)", border: "rgba(5, 150, 105, 0.25)" };
    case "article":
      return { main: "#d97706", bg: "rgba(217, 119, 6, 0.1)", border: "rgba(217, 119, 6, 0.25)" };
    case "mcq":
      return { main: "#7c3aed", bg: "rgba(124, 58, 237, 0.1)", border: "rgba(124, 58, 237, 0.25)" };
    case "interview":
      return { main: "#dc2626", bg: "rgba(220, 38, 38, 0.1)", border: "rgba(220, 38, 38, 0.25)" };
    default:
      return { main: "#6b7280", bg: "rgba(107, 114, 128, 0.1)", border: "rgba(107, 114, 128, 0.2)" };
  }
};

const getContentTypeIcon = (type: string) => {
  switch (type) {
    case "video":
      return "mdi:play-circle-outline";
    case "article":
      return "mdi:book-open-page-variant";
    case "assessment":
      return "mdi:clipboard-text";
    default:
      return "mdi:file-document-outline";
  }
};

const getContentTypeColor = (type: string) => {
  switch (type) {
    case "video":
      return "#059669";
    case "article":
      return "#d97706";
    case "assessment":
      return "#2563eb";
    default:
      return "#6b7280";
  }
};

const getTaskTypeIcon = (type: string) => {
  switch (type) {
    case "assignment":
      return "mdi:file-edit-outline";
    case "assessment":
      return "mdi:clipboard-check-outline";
    case "project":
      return "mdi:folder-edit-outline";
    default:
      return "mdi:checkbox-marked-circle-outline";
  }
};

function formatDueDate(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Overdue (${d.toLocaleDateString()})`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  if (diffDays <= 7) return `Due in ${diffDays} days`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function ActionPanelSection({ data, readOnly }: ActionPanelSectionProps) {
  const router = useRouter();
  const isEmpty = !hasAnyData(data);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3.5, md: 4 },
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "#fafbfc",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid rgba(37, 99, 235, 0.2)",
          }}
        >
          <IconWrapper icon="mdi:rocket-launch-outline" size={24} color="#2563eb" />
        </Box>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "#111827",
              fontSize: { xs: "1.25rem", sm: "1.375rem" },
              letterSpacing: "-0.02em",
            }}
          >
            Action Panel
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25, fontSize: "0.875rem" }}>
            Your next steps and recommended content
          </Typography>
        </Box>
      </Box>

      {isEmpty ? (
        <Box
          sx={{
            py: 6,
            px: 3,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
            borderRadius: 2,
            border: "1px solid rgba(148, 163, 184, 0.2)",
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "rgba(148, 163, 184, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper icon="mdi:check-all" size={32} color="#94a3b8" />
          </Box>
          <Typography
            variant="h6"
            sx={{ mt: 2, fontWeight: 600, color: "#475569", fontSize: "1.0625rem" }}
          >
            All caught up
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 1, color: "#64748b", fontSize: "0.9375rem" }}
          >
            No actions or tasks at this time. Keep learning!
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Priority Actions */}
          {(data.priorityActions?.length ?? 0) > 0 && (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9375rem",
                  mb: 1.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Priority Actions
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                  gap: 1.5,
                }}
              >
                {data.priorityActions.map((action: PriorityAction) => {
                  const colors = getActionColor(action.type);
                  return (
                    <Box
                      key={action.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#ffffff",
                        border: "1px solid",
                        borderColor: colors.border,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        transition: "all 0.2s ease",
                        display: "flex",
                        flexDirection: "column",
                        height: "100%",
                        minHeight: 180,
                        "&:hover": {
                          boxShadow: `0 4px 12px ${colors.main}20`,
                          borderColor: colors.main,
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, flexShrink: 0 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 1.5,
                            backgroundColor: colors.bg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <IconWrapper icon={getActionIcon(action.type)} size={20} color={colors.main} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Chip
                            label={`#${action.priority}`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "0.6875rem",
                              fontWeight: 700,
                              mb: 0.5,
                              backgroundColor: colors.bg,
                              color: colors.main,
                              "& .MuiChip-label": { px: 0.75 },
                            }}
                          />
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: "#111827",
                              fontSize: "0.9375rem",
                              lineHeight: 1.35,
                            }}
                          >
                            {action.title}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          color: "#6b7280",
                          fontSize: "0.8125rem",
                          lineHeight: 1.5,
                          flex: 1,
                          mt: 1,
                          mb: 1.5,
                          minHeight: 40,
                        }}
                      >
                        {action.description}
                      </Typography>
                      {action.actionUrl && !readOnly && (
                        <Button
                          variant="outlined"
                          size="small"
                          fullWidth
                          endIcon={<IconWrapper icon="mdi:arrow-right" size={14} />}
                          onClick={() => router.push(action.actionUrl!)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.8125rem",
                            borderColor: colors.main,
                            color: colors.main,
                            borderRadius: 1.5,
                            flexShrink: 0,
                            mt: "auto",
                            "&:hover": {
                              borderColor: colors.main,
                              backgroundColor: colors.bg,
                            },
                          }}
                        >
                          Take Action
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Recommended Content */}
          {(data.recommendedContent?.length ?? 0) > 0 && (
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9375rem",
                  mb: 1.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Recommended Content
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {data.recommendedContent.map((content: RecommendedContent) => {
                  const typeColor = getContentTypeColor(content.type);
                  return (
                    <Box
                      key={content.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#ffffff",
                        border: "1px solid",
                        borderColor: "rgba(0,0,0,0.06)",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "rgba(0,0,0,0.12)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 1.5,
                          backgroundColor: `${typeColor}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <IconWrapper icon={getContentTypeIcon(content.type)} size={20} color={typeColor} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: "#111827",
                            fontSize: "0.9375rem",
                          }}
                        >
                          {content.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#6b7280",
                            fontSize: "0.8125rem",
                            mt: 0.25,
                          }}
                        >
                          {content.reason}
                        </Typography>
                      </Box>
                      {content.url && !readOnly && (
                        <Button
                          variant="text"
                          size="small"
                          endIcon={<IconWrapper icon="mdi:arrow-right" size={16} />}
                          onClick={() => router.push(content.url)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.8125rem",
                            color: typeColor,
                            flexShrink: 0,
                            "&:hover": {
                              backgroundColor: `${typeColor}15`,
                            },
                          }}
                        >
                          View
                        </Button>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Pending Tasks & Upcoming Assessments - side by side */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
            }}
          >
            {/* Pending Tasks */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9375rem",
                  mb: 1.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Pending Tasks
              </Typography>
              {(!data.pendingTasks || data.pendingTasks.length === 0) ? (
                <Box
                  sx={{
                    py: 3,
                    px: 2,
                    borderRadius: 2,
                    backgroundColor: "#f8fafc",
                    border: "1px dashed rgba(148, 163, 184, 0.4)",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                    No pending tasks
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {data.pendingTasks.map((task: PendingTask) => (
                    <Box
                      key={task.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#ffffff",
                        border: "1px solid",
                        borderColor: "rgba(0,0,0,0.06)",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "rgba(0,0,0,0.12)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: 1.5,
                          backgroundColor: "rgba(99, 102, 241, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <IconWrapper
                          icon={getTaskTypeIcon(task.type)}
                          size={18}
                          color="#6366f1"
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            color: "#111827",
                            fontSize: "0.9375rem",
                          }}
                        >
                          {task.title}
                        </Typography>
                        {task.dueDate && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#6b7280",
                              fontSize: "0.75rem",
                              display: "block",
                              mt: 0.25,
                            }}
                          >
                            {formatDueDate(task.dueDate)}
                          </Typography>
                        )}
                      </Box>
                      {task.url && !readOnly && (
                        <Button
                          variant="text"
                          size="small"
                          endIcon={<IconWrapper icon="mdi:arrow-right" size={14} />}
                          onClick={() => router.push(task.url)}
                          sx={{
                            textTransform: "none",
                            fontWeight: 600,
                            fontSize: "0.8125rem",
                            color: "#6366f1",
                            flexShrink: 0,
                            "&:hover": {
                              backgroundColor: "rgba(99, 102, 241, 0.1)",
                            },
                          }}
                        >
                          View
                        </Button>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Upcoming Assessments */}
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: "0.9375rem",
                  mb: 1.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Upcoming Assessments
              </Typography>
              {(!data.upcomingAssessments || data.upcomingAssessments.length === 0) ? (
                <Box
                  sx={{
                    py: 3,
                    px: 2,
                    borderRadius: 2,
                    backgroundColor: "#f8fafc",
                    border: "1px dashed rgba(148, 163, 184, 0.4)",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.875rem" }}>
                    No upcoming assessments
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {data.upcomingAssessments.map((assessment: UpcomingAssessment) => (
                    <Box
                      key={assessment.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: "#ffffff",
                        border: "1px solid",
                        borderColor: "rgba(37, 99, 235, 0.2)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "rgba(37, 99, 235, 0.4)",
                          boxShadow: "0 2px 8px rgba(37, 99, 235, 0.08)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            backgroundColor: "rgba(37, 99, 235, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <IconWrapper icon="mdi:clipboard-clock-outline" size={18} color="#2563eb" />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 600,
                              color: "#111827",
                              fontSize: "0.9375rem",
                            }}
                          >
                            {assessment.name}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 1,
                              mt: 0.5,
                            }}
                          >
                            {assessment.date && (
                              <Chip
                                label={new Date(assessment.date).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: "0.75rem",
                                  backgroundColor: "rgba(37, 99, 235, 0.08)",
                                  color: "#2563eb",
                                  "& .MuiChip-label": { px: 1 },
                                }}
                              />
                            )}
                            <Chip
                              label={`${assessment.duration} min`}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: "0.75rem",
                                backgroundColor: "rgba(107, 114, 128, 0.08)",
                                color: "#6b7280",
                                "& .MuiChip-label": { px: 1 },
                              }}
                            />
                          </Box>
                        </Box>
                        {assessment.url && !readOnly && (
                          <Button
                            variant="contained"
                            size="small"
                            endIcon={<IconWrapper icon="mdi:play" size={14} />}
                            onClick={() => router.push(assessment.url)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 600,
                              fontSize: "0.8125rem",
                              backgroundColor: "#2563eb",
                              borderRadius: 1.5,
                              flexShrink: 0,
                              "&:hover": {
                                backgroundColor: "#1d4ed8",
                              },
                            }}
                          >
                            Take
                          </Button>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
