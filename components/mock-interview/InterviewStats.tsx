"use client";

import { Box, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo } from "react";
import { useTranslation } from "react-i18next";

interface InterviewStatsProps {
  totalInterviews: number;
  completedInterviews: number;
  scheduledInterviews: number;
  averageScore: number;
}

const InterviewStatsComponent = ({
  totalInterviews,
  completedInterviews,
  scheduledInterviews,
  averageScore,
}: InterviewStatsProps) => {
  const { t } = useTranslation("common");
  const stats = [
    {
      label: t("mockInterview.totalInterviews"),
      value: totalInterviews,
      icon: "mdi:briefcase-outline",
      color: "var(--accent-indigo)",
      bgColor: "color-mix(in srgb, var(--accent-indigo) 14%, transparent)",
    },
    {
      label: "Completed",
      value: completedInterviews,
      icon: "mdi:check-circle",
      color: "var(--success-500)",
      bgColor: "color-mix(in srgb, var(--success-500) 14%, transparent)",
    },
    {
      label: t("mockInterview.scheduled"),
      value: scheduledInterviews,
      icon: "mdi:calendar-clock",
      color: "var(--warning-500)",
      bgColor: "color-mix(in srgb, var(--warning-500) 16%, transparent)",
    },
    {
      label: t("mockInterview.averageScore"),
      value: `${averageScore}%`,
      icon: "mdi:chart-line",
      color: "var(--accent-purple)",
      bgColor: "color-mix(in srgb, var(--accent-purple) 14%, transparent)",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          md: "repeat(4, 1fr)",
        },
        gap: 3,
      }}
    >
      {stats.map((stat, index) => (
        <Box key={index}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "var(--border-default)",
              backgroundColor: "var(--card-bg)",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow:
                  "0 4px 12px color-mix(in srgb, var(--font-primary) 12%, transparent)",
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  backgroundColor: stat.bgColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconWrapper icon={stat.icon} size={24} color={stat.color} />
              </Box>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: "var(--font-primary)", mb: 0.5 }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "var(--font-secondary)", fontSize: "0.875rem" }}
                >
                  {stat.label}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      ))}
    </Box>
  );
};

export const InterviewStats = memo(
  InterviewStatsComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.totalInterviews === nextProps.totalInterviews &&
      prevProps.completedInterviews === nextProps.completedInterviews &&
      prevProps.scheduledInterviews === nextProps.scheduledInterviews &&
      prevProps.averageScore === nextProps.averageScore
    );
  }
);
InterviewStats.displayName = "InterviewStats";
