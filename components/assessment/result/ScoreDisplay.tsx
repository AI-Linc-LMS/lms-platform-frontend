"use client";

import { Box, Typography, Paper } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface ScoreDisplayProps {
  score?: number | null;
  maximumMarks?: number | null;
  accuracy?: number | null;
  percentile?: number | null;
}

function n(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function ScoreDisplay({
  score,
  maximumMarks,
  accuracy,
  percentile,
}: ScoreDisplayProps) {
  const safeScore = n(score, 0);
  const safeMax = n(maximumMarks, 0);
  const safeAccuracy = n(accuracy, 0);
  const safePercentile = n(percentile, 0);
  const percentage = safeMax > 0 ? (safeScore / safeMax) * 100 : 0;
  
  // Determine performance level and colors
  const getPerformanceLevel = () => {
    if (percentage >= 80) {
      return {
        level: "Excellent",
        color: "var(--course-cta)",
        bgGradient: "linear-gradient(135deg, var(--course-cta) 0%, var(--assessment-success-strong) 100%)",
        icon: "mdi:trophy",
        textColor: "color-mix(in srgb, var(--course-cta) 75%, var(--font-dark))",
      };
    } else if (percentage >= 60) {
      return {
        level: "Good",
        color: "var(--accent-blue-light)",
        bgGradient: "linear-gradient(135deg, var(--accent-blue-light) 0%, var(--assessment-chart-blue) 100%)",
        icon: "mdi:medal",
        textColor: "color-mix(in srgb, var(--accent-blue) 82%, var(--font-dark))",
      };
    } else if (percentage >= 40) {
      return {
        level: "Average",
        color: "var(--warning-500)",
        bgGradient: "linear-gradient(135deg, var(--warning-500) 0%, var(--ats-warning-muted) 100%)",
        icon: "mdi:chart-line",
        textColor: "color-mix(in srgb, var(--accent-orange) 55%, var(--font-dark))",
      };
    } else {
      return {
        level: "Needs Improvement",
        color: "var(--error-500)",
        bgGradient: "linear-gradient(135deg, var(--error-500) 0%, var(--error-600) 100%)",
        icon: "mdi:alert-circle",
        textColor: "color-mix(in srgb, var(--error-600) 88%, var(--font-dark))",
      };
    }
  };

  const performance = getPerformanceLevel();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 4,
        mb: 3,
        borderRadius: 4,
        background: performance.bgGradient,
        color: "var(--font-light)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "color-mix(in srgb, var(--font-light) 12%, transparent)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: "color-mix(in srgb, var(--font-light) 10%, transparent)",
        },
      }}
    >
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 3,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 600,
                opacity: 0.9,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                mb: 1,
                display: "block",
              }}
            >
              Your Score
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: { xs: "3rem", sm: "4rem", md: "5rem" },
                  lineHeight: 1,
                  color: "var(--font-light)",
                }}
              >
                {safeScore.toFixed(1)}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  opacity: 0.8,
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                }}
              >
                / {safeMax > 0 ? safeMax : "—"}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1,
                borderRadius: 2,
                backgroundColor: "color-mix(in srgb, var(--font-light) 22%, transparent)",
                backdropFilter: "blur(10px)",
              }}
            >
              <IconWrapper icon={performance.icon} size={24} color="var(--font-light)" />
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.9375rem",
                }}
              >
                {performance.level}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              width: "100%",
              height: 12,
              borderRadius: 6,
              backgroundColor: "color-mix(in srgb, var(--font-light) 22%, transparent)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                width: `${Math.min(percentage, 100)}%`,
                height: "100%",
                backgroundColor: "var(--font-light)",
                borderRadius: 6,
                transition: "width 0.6s ease-in-out",
                boxShadow: "0 0 10px color-mix(in srgb, var(--font-light) 52%, transparent)",
              }}
            />
          </Box>
          <Typography
            variant="caption"
            sx={{
              mt: 1,
              display: "block",
              textAlign: "right",
              fontWeight: 600,
              opacity: 0.9,
            }}
          >
            {percentage.toFixed(1)}%
          </Typography>
        </Box>

        {/* Quick Stats */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.75rem",
                opacity: 0.8,
                display: "block",
                mb: 0.5,
              }}
            >
              Accuracy
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: "1.25rem",
              }}
            >
              {safeAccuracy.toFixed(1)}%
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.75rem",
                opacity: 0.8,
                display: "block",
                mb: 0.5,
              }}
            >
              Percentile
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: "1.25rem",
              }}
            >
              {safePercentile.toFixed(1)}%
            </Typography>
          </Box>
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.75rem",
                opacity: 0.8,
                display: "block",
                mb: 0.5,
              }}
            >
              Performance
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: "1.25rem",
              }}
            >
              {performance.level}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

