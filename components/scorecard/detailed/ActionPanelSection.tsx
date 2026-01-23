"use client";

import { Box, Typography, Paper, Grid, Button } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ActionPanel } from "@/lib/types/scorecard.types";
import { useRouter } from "next/navigation";

interface ActionPanelSectionProps {
  data: ActionPanel;
}

export function ActionPanelSection({ data }: ActionPanelSectionProps) {
  const router = useRouter();

  const getActionIcon = (type: string) => {
    switch (type) {
      case "assessment":
        return "mdi:clipboard-check";
      case "video":
        return "mdi:play-circle";
      case "article":
        return "mdi:book-open";
      case "mcq":
        return "mdi:checkbox-multiple-marked";
      case "interview":
        return "mdi:account-tie";
      default:
        return "mdi:lightbulb";
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "assessment":
        return "#0a66c2";
      case "video":
        return "#10b981";
      case "article":
        return "#f59e0b";
      case "mcq":
        return "#6366f1";
      case "interview":
        return "#ef4444";
      default:
        return "#9ca3af";
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "#000000",
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
          mb: 3,
        }}
      >
        Action Panel
      </Typography>

      {/* Priority Actions */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: "1rem" }}>
          Priority Actions
        </Typography>
        <Grid container spacing={2}>
          {data.priorityActions.map((action) => (
            <Grid item xs={12} sm={6} md={4} key={action.id}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  backgroundColor: "#ffffff",
                  border: `2px solid ${getActionColor(action.type)}`,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    boxShadow: `0 4px 12px ${getActionColor(action.type)}40`,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      backgroundColor: `${getActionColor(action.type)}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconWrapper
                      icon={getActionIcon(action.type)}
                      size={20}
                      color={getActionColor(action.type)}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: "#666666", fontSize: "0.75rem" }}>
                      Priority {action.priority}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                      {action.title}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ color: "#666666", mb: 2, fontSize: "0.875rem" }}>
                  {action.description}
                </Typography>
                {action.actionUrl && (
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    endIcon={<IconWrapper icon="mdi:arrow-right" size={16} />}
                    onClick={() => router.push(action.actionUrl!)}
                    sx={{
                      textTransform: "none",
                      fontWeight: 600,
                      borderColor: getActionColor(action.type),
                      color: getActionColor(action.type),
                      borderRadius: "20px",
                      "&:hover": {
                        borderColor: getActionColor(action.type),
                        backgroundColor: `${getActionColor(action.type)}10`,
                      },
                    }}
                  >
                    Take Action
                  </Button>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Recommended Content */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: "1rem" }}>
          Recommended Content
        </Typography>
        <Grid container spacing={2}>
          {data.recommendedContent.map((content) => (
            <Grid item xs={12} sm={6} key={content.id}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#f9fafb",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {content.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "#666666", mb: 1, fontSize: "0.875rem" }}>
                  {content.reason}
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  endIcon={<IconWrapper icon="mdi:arrow-right" size={16} />}
                  onClick={() => router.push(content.url)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 600,
                    color: "#0a66c2",
                    "&:hover": {
                      backgroundColor: "rgba(10, 102, 194, 0.05)",
                    },
                  }}
                >
                  View Content
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Pending Tasks & Upcoming Assessments */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: "1rem" }}>
            Pending Tasks
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {data.pendingTasks.map((task) => (
              <Box
                key={task.id}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#f9fafb",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {task.title}
                </Typography>
                {task.dueDate && (
                  <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.8125rem" }}>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, fontSize: "1rem" }}>
            Upcoming Assessments
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {data.upcomingAssessments.map((assessment) => (
              <Box
                key={assessment.id}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: "#f9fafb",
                  border: "1px solid rgba(0,0,0,0.08)",
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {assessment.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "#666666", fontSize: "0.8125rem" }}>
                  Date: {new Date(assessment.date).toLocaleDateString()} | Duration: {assessment.duration} min
                </Typography>
              </Box>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}
