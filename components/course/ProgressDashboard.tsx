"use client";

import { Box, Typography, Paper, LinearProgress, Chip } from "@mui/material";
import { useTranslation } from "react-i18next";
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
  tint: string;
}

export function ProgressDashboard({ dashboard }: ProgressDashboardProps) {
  const { t } = useTranslation("common");
  const overallProgressPercentage = dashboard.total_progress ?? 0;

  const contentProgressItems: ContentProgressItem[] = [
    { label: t("courses.videos"), value: dashboard.video_progress, icon: "mdi:video-outline", color: "var(--error-500)", tint: "color-mix(in srgb, var(--error-500) 16%, transparent)" },
    { label: t("courses.quizzes"), value: dashboard.quiz_progress, icon: "mdi:star-outline", color: "var(--warning-500)", tint: "color-mix(in srgb, var(--warning-500) 16%, transparent)" },
    { label: t("courses.articles"), value: dashboard.article_progress, icon: "mdi:file-document-outline", color: "var(--accent-indigo)", tint: "color-mix(in srgb, var(--accent-indigo) 16%, transparent)" },
    { label: t("courses.assignments"), value: dashboard.assignment_progress, icon: "mdi:file-check-outline", color: "var(--accent-purple)", tint: "color-mix(in srgb, var(--accent-purple) 16%, transparent)" },
    { label: t("courses.coding"), value: dashboard.coding_problem_progress, icon: "mdi:code-tags", color: "var(--success-500)", tint: "color-mix(in srgb, var(--success-500) 16%, transparent)" },
    {
      label: t("courses.subjectiveProgressShort"),
      value: dashboard.subjective_question_progress,
      icon: "mdi:text-box-outline",
      color: "var(--accent-indigo-dark)",
      tint: "color-mix(in srgb, var(--accent-indigo-dark) 16%, transparent)",
    },
  ].filter((item) => item.value !== undefined && item.value > 0);

  const hasContentProgress = contentProgressItems.length > 0;

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid var(--border-default)",
        borderRadius: 2,
        p: 3,
        background:
          "linear-gradient(to bottom, var(--card-bg) 0%, var(--surface) 100%)",
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
            background:
              "linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-indigo) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper
            icon="mdi:chart-line-variant"
            size={32}
            color="var(--font-light)"
          />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary)",
              fontSize: "1.125rem",
            }}
          >
            {t("courses.yourProgress")}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "var(--font-secondary)", fontSize: "0.75rem" }}
          >
            {t("courses.trackYourLearning")}
          </Typography>
        </Box>
      </Box>

      {/* Overall Progress Card */}
      <Box
        sx={{
          background:
            "linear-gradient(135deg, var(--accent-purple) 0%, var(--accent-indigo) 100%)",
          borderRadius: 2,
          p: 2.5,
          mb: 3,
          color: "var(--font-light)",
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
              color:
                "color-mix(in srgb, var(--font-light) 90%, transparent 10%)",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            {t("courses.overallCompletion")}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: "var(--font-light)",
              fontSize: "1.75rem",
              fontWeight: 700,
            }}
          >
            {overallProgressPercentage.toFixed(2)}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={overallProgressPercentage}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor:
              "color-mix(in srgb, var(--font-light) 22%, transparent)",
            "& .MuiLinearProgress-bar": {
              borderRadius: 5,
              backgroundColor: "var(--font-light)",
            },
          }}
        />
      </Box>

      {/* Content Type Progress */}
      {hasContentProgress && (
        <Box sx={{ mt: 3, pt: 3, borderTop: "1px solid var(--border-default)" }}>
          <Typography
            variant="body2"
            sx={{
              color: "var(--font-primary)",
              fontSize: "0.875rem",
              fontWeight: 600,
              mb: 2,
            }}
          >
            {t("courses.contentBreakdown")}
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {contentProgressItems.map((item) => (
              <Box
                key={item.icon}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: 1.5,
                  backgroundColor: "var(--surface)",
                  border: "1px solid var(--border-default)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    backgroundColor:
                      "color-mix(in srgb, var(--surface) 80%, var(--background) 20%)",
                    borderColor:
                      "color-mix(in srgb, var(--border-default) 70%, var(--font-secondary) 30%)",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    backgroundColor: item.tint,
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
                      color: "var(--font-primary)",
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
                    backgroundColor: item.tint,
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
