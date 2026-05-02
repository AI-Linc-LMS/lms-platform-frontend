"use client";

import { Box, Paper, Typography, LinearProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface EnhancedStatsBarProps {
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeTakenMinutes: number;
  totalTimeMinutes: number;
}

export function EnhancedStatsBar({
  totalQuestions,
  attemptedQuestions,
  correctAnswers,
  incorrectAnswers,
  timeTakenMinutes,
  totalTimeMinutes,
}: EnhancedStatsBarProps) {
  const attemptRate = totalQuestions > 0 ? (attemptedQuestions / totalQuestions) * 100 : 0;
  const correctRate = attemptedQuestions > 0 ? (correctAnswers / attemptedQuestions) * 100 : 0;
  // Cap time utilization at 100% to handle edge cases where time_taken > total_time
  const timeUtilization = totalTimeMinutes > 0 
    ? Math.min((timeTakenMinutes / totalTimeMinutes) * 100, 100) 
    : 0;
  
  // Format time display - handle edge cases
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const stats = [
    {
      icon: "mdi:check-circle",
      label: "Correct Answers",
      value: correctAnswers,
      total: attemptedQuestions,
      color: "var(--course-cta)",
      bgColor: "color-mix(in srgb, var(--course-cta) 12%, transparent)",
      progress: correctRate,
    },
    {
      icon: "mdi:close-circle",
      label: "Incorrect Answers",
      value: incorrectAnswers,
      total: attemptedQuestions,
      color: "var(--error-500)",
      bgColor: "color-mix(in srgb, var(--error-500) 12%, transparent)",
      progress: attemptedQuestions > 0 ? (incorrectAnswers / attemptedQuestions) * 100 : 0,
    },
    {
      icon: "mdi:help-circle",
      label: "Attempted",
      value: attemptedQuestions,
      total: totalQuestions,
      color: "var(--accent-blue-light)",
      bgColor: "color-mix(in srgb, var(--accent-blue-light) 12%, transparent)",
      progress: attemptRate,
    },
    {
      icon: "mdi:clock-time-four",
      label: "Time Used",
      value: formatTime(timeTakenMinutes),
      total: formatTime(totalTimeMinutes),
      color: "var(--assessment-chart-violet)",
      bgColor: "color-mix(in srgb, var(--accent-purple) 12%, transparent)",
      progress: timeUtilization,
      isTime: true,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
        gap: 2.5,
        mb: 3,
      }}
    >
      {stats.map((stat, index) => (
        <Paper
          key={index}
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid var(--border-default)",
            borderRadius: 3,
            background: "var(--card-bg)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 10px 25px color-mix(in srgb, var(--font-dark) 10%, transparent)",
              borderColor: stat.color,
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mb: 2,
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: stat.bgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IconWrapper icon={stat.icon} size={24} color={stat.color} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  display: "block",
                  mb: 0.5,
                }}
              >
                {stat.label}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, flexWrap: "wrap" }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "var(--font-primary)",
                    fontSize: "1.5rem",
                  }}
                >
                  {stat.value}
                </Typography>
                {!stat.isTime && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: "var(--font-tertiary)",
                      fontWeight: 500,
                    }}
                  >
                    / {stat.total}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>

          {/* Progress Bar */}
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 0.5,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "var(--font-secondary)",
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                }}
              >
                Progress
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                {stat.isTime && timeTakenMinutes > totalTimeMinutes && (
                  <IconWrapper
                    icon="mdi:alert"
                    size={14}
                    color="var(--error-500)"
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: stat.isTime && timeTakenMinutes > totalTimeMinutes ? "var(--error-500)" : stat.color,
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                  }}
                >
                  {stat.progress.toFixed(1)}%
                  {stat.isTime && timeTakenMinutes > totalTimeMinutes && " (Exceeded)"}
                </Typography>
              </Box>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(stat.progress, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "var(--surface)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 4,
                  backgroundColor: stat.isTime && timeTakenMinutes > totalTimeMinutes ? "var(--error-500)" : stat.color,
                },
              }}
            />
          </Box>
        </Paper>
      ))}
    </Box>
  );
}

