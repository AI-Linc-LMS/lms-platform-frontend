"use client";

import { Box, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AssessmentStatsBarProps {
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  duration: number; // in minutes
  accuracy: number;
}

export function AssessmentStatsBar({
  score,
  totalQuestions,
  answeredQuestions,
  duration,
  accuracy,
}: AssessmentStatsBarProps) {
  const stats = [
    {
      icon: "mdi:star",
      label: "Score",
      value: `${score || 0}/${totalQuestions * 10}`,
      color: "#6366f1",
      bgColor: "rgba(99, 102, 241, 0.1)",
    },
    {
      icon: "mdi:clock-outline",
      label: "Duration",
      value: duration < 60 ? `${duration || 0} min` : `${Math.floor((duration || 0) / 60)}h ${(duration || 0) % 60}m`,
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.1)",
    },
    {
      icon: "mdi:help-circle-outline",
      label: "Questions",
      value: `${answeredQuestions || 0}/${totalQuestions || 0}`,
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
    {
      icon: "mdi:target",
      label: "Accuracy",
      value: `${(accuracy || 0).toFixed(1)}%`,
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.1)",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
        gap: 2,
        mb: 3,
      }}
    >
      {stats.map((stat, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            p: 2.5,
            border: "1px solid #e5e7eb",
            borderRadius: 2,
            textAlign: "center",
            background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: stat.bgColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 1.5,
            }}
          >
            <IconWrapper icon={stat.icon} size={24} color={stat.color} />
          </Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: "#1f2937",
              mb: 0.5,
            }}
          >
            {stat.value}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#6b7280",
              fontSize: "0.8125rem",
              fontWeight: 500,
            }}
          >
            {stat.label}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}

