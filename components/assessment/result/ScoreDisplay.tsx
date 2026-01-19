"use client";

import { Box, Typography, Paper } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface ScoreDisplayProps {
  score: number;
  maximumMarks: number;
  accuracy: number;
  percentile: number;
}

export function ScoreDisplay({
  score,
  maximumMarks,
  accuracy,
  percentile,
}: ScoreDisplayProps) {
  const percentage = maximumMarks > 0 ? (score / maximumMarks) * 100 : 0;
  
  // Determine performance level and colors
  const getPerformanceLevel = () => {
    if (percentage >= 80) {
      return {
        level: "Excellent",
        color: "#10b981",
        bgGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        icon: "mdi:trophy",
        textColor: "#065f46",
      };
    } else if (percentage >= 60) {
      return {
        level: "Good",
        color: "#3b82f6",
        bgGradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
        icon: "mdi:medal",
        textColor: "#1e40af",
      };
    } else if (percentage >= 40) {
      return {
        level: "Average",
        color: "#f59e0b",
        bgGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        icon: "mdi:chart-line",
        textColor: "#92400e",
      };
    } else {
      return {
        level: "Needs Improvement",
        color: "#ef4444",
        bgGradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        icon: "mdi:alert-circle",
        textColor: "#991b1b",
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
        color: "#ffffff",
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
          background: "rgba(255, 255, 255, 0.1)",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.08)",
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
                  color: "#ffffff",
                }}
              >
                {score.toFixed(1)}
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  opacity: 0.8,
                  fontSize: { xs: "1.25rem", sm: "1.5rem" },
                }}
              >
                / {maximumMarks}
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
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              <IconWrapper icon={performance.icon} size={24} color="#ffffff" />
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
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <Box
              sx={{
                width: `${Math.min(percentage, 100)}%`,
                height: "100%",
                backgroundColor: "#ffffff",
                borderRadius: 6,
                transition: "width 0.6s ease-in-out",
                boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
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
              {accuracy.toFixed(1)}%
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
              {percentile.toFixed(1)}%
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

