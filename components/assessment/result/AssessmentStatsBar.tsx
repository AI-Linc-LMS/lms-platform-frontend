"use client";

import { Box, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface AssessmentStatsBarProps {
  score: number;
  totalQuestions: number;
  answeredQuestions: number;
  duration: number; // in minutes
  accuracy: number;
  maximumMarks?: number;
}

export function AssessmentStatsBar({
  score,
  totalQuestions,
  answeredQuestions,
  duration,
  accuracy,
  maximumMarks,
}: AssessmentStatsBarProps) {
  const stats = [
    {
      icon: "mdi:star",
      label: "Score",
      value: `${(score || 0).toFixed(1)}/${maximumMarks || totalQuestions * 10}`,
      color: "var(--accent-indigo)",
      bgColor: "color-mix(in srgb, var(--accent-indigo) 12%, transparent)",
    },
    {
      icon: "mdi:clock-outline",
      label: "Duration",
      value: duration < 60 ? `${duration || 0} min` : `${Math.floor((duration || 0) / 60)}h ${(duration || 0) % 60}m`,
      color: "var(--assessment-chart-violet)",
      bgColor: "color-mix(in srgb, var(--accent-purple) 12%, transparent)",
    },
    {
      icon: "mdi:help-circle-outline",
      label: "Questions",
      value: `${answeredQuestions || 0}/${totalQuestions || 0}`,
      color: "var(--accent-blue-light)",
      bgColor: "color-mix(in srgb, var(--accent-blue-light) 12%, transparent)",
    },
    {
      icon: "mdi:target",
      label: "Accuracy",
      value: `${(accuracy || 0).toFixed(1)}%`,
      color: "var(--course-cta)",
      bgColor: "color-mix(in srgb, var(--course-cta) 12%, transparent)",
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
            border: "1px solid var(--border-default)",
            borderRadius: 2,
            textAlign: "center",
            background: "linear-gradient(135deg, var(--font-light) 0%, var(--surface) 100%)",
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
              color: "var(--font-primary-dark)",
              mb: 0.5,
            }}
          >
            {stat.value}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-secondary)",
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

