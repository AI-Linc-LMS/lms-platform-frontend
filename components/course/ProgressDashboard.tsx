"use client";

import { Box, Typography, Paper, LinearProgress, Chip } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CourseDashboard } from "@/lib/services/courses.service";

interface ProgressDashboardProps {
  dashboard: CourseDashboard;
}

interface ContentProgressItem {
  label: string;
  value: number | undefined;
  icon: string;
  color: string;
}

export function ProgressDashboard({ dashboard }: ProgressDashboardProps) {
  // Use completion_percentage for overall progress
  const overallProgressPercentage = dashboard.total_progress ?? 0;

  const contentProgressItems: ContentProgressItem[] = [
    {
      label: "Videos",
      value: dashboard.video_progress,
      icon: "mdi:video-outline",
      color: "#ef4444",
    },
    {
      label: "Quizzes",
      value: dashboard.quiz_progress,
      icon: "mdi:star-outline",
      color: "#f59e0b",
    },
    {
      label: "Articles",
      value: dashboard.article_progress,
      icon: "mdi:file-document-outline",
      color: "#3b82f6",
    },
    {
      label: "Assignments",
      value: dashboard.assignment_progress,
      icon: "mdi:file-check-outline",
      color: "#8b5cf6",
    },
    {
      label: "Coding",
      value: dashboard.coding_problem_progress,
      icon: "mdi:code-tags",
      color: "#10b981",
    },
  ].filter((item) => item.value !== undefined && item.value > 0);

  const hasContentProgress = contentProgressItems.length > 0;

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: 2,
        p: 3,
        background: "linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper
            icon="mdi:chart-line-variant"
            size={32}
            color="#ffffff"
          />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#1a1f2e", fontSize: "1.125rem" }}
          >
            Your Progress
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#6b7280", fontSize: "0.75rem" }}
          >
            Track your learning journey
          </Typography>
        </Box>
      </Box>

      {/* Overall Progress Card */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
          borderRadius: 2,
          p: 2.5,
          mb: 3,
          color: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Overall Completion
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: "#ffffff",
              fontSize: "1.75rem",
              fontWeight: 700,
            }}
          >
            {overallProgressPercentage.toFixed(0)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={overallProgressPercentage}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 5,
              backgroundColor: "#ffffff",
            },
          }}
        />
      </Box>

      {/* Content Type Progress */}
      {hasContentProgress && (
        <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid #e5e7eb" }}>
          <Typography
            variant="body2"
            sx={{
              color: "#1a1f2e",
              fontSize: "0.875rem",
              fontWeight: 600,
              mb: 2,
            }}
          >
            Content Breakdown
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {contentProgressItems.map((item) => (
              <Box
                key={item.label}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 1.5,
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor: "#f3f4f6",
                    borderColor: "#d1d5db",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    backgroundColor: `${item.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <IconWrapper
                    icon={item.icon}
                    size={28}
                    color={item.color}
                  />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#1a1f2e",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                      mb: 0.25,
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
                <Chip
                  label={`${item.value}%`}
                  size="small"
                  sx={{
                    backgroundColor: `${item.color}15`,
                    color: item.color,
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    height: 24,
                    "& .MuiChip-label": {
                      px: 1.5,
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Paper>
  );
}
