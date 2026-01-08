"use client";

import { Box, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo } from "react";

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
  const stats = [
    {
      label: "Total Interviews",
      value: totalInterviews,
      icon: "mdi:briefcase-outline",
      color: "#6366f1",
      bgColor: "#eff6ff",
    },
    {
      label: "Completed",
      value: completedInterviews,
      icon: "mdi:check-circle",
      color: "#10b981",
      bgColor: "#ecfdf5",
    },
    {
      label: "Scheduled",
      value: scheduledInterviews,
      icon: "mdi:calendar-clock",
      color: "#f59e0b",
      bgColor: "#fef3c7",
    },
    {
      label: "Average Score",
      value: `${averageScore}%`,
      icon: "mdi:chart-line",
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
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
              borderColor: "#e5e7eb",
              backgroundColor: "#ffffff",
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
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
                  sx={{ fontWeight: 700, color: "#1f2937", mb: 0.5 }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#6b7280", fontSize: "0.875rem" }}
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
