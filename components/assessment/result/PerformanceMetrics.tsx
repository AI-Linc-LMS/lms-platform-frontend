"use client";

import { Box, Paper, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";

interface PerformanceMetricsProps {
  overallAccuracy: number;
  testDuration: number; // in minutes
  performancePercentile: number;
}

export function PerformanceMetrics({
  overallAccuracy,
  testDuration,
  performancePercentile,
}: PerformanceMetricsProps) {
  // Cap values at 100 for circular progress display
  const cappedAccuracy = Math.min(overallAccuracy || 0, 100);
  const cappedPercentile = Math.min(performancePercentile || 0, 100);

  const metrics = [
    {
      label: "Overall Accuracy",
      value: overallAccuracy || 0,
      displayValue: cappedAccuracy,
      unit: "%",
      icon: "mdi:bullseye-arrow",
      color: "#6366f1",
      gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    },
    {
      label: "Test Duration",
      value: testDuration || 0,
      displayValue: testDuration || 0,
      unit: " mins",
      icon: "mdi:timer-outline",
      color: "#8b5cf6",
      gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    },
    {
      label: "Performance Percentile",
      value: performancePercentile || 0,
      displayValue: cappedPercentile,
      unit: "%",
      icon: "mdi:chart-line-variant",
      color: "#10b981",
      gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    },
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        border: "1px solid #e5e7eb",
        borderRadius: 3,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 3,
        }}
      >
        <IconWrapper icon="mdi:chart-box-outline" size={24} color="#6366f1" />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "#1f2937",
          }}
        >
          Performance Metrics
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
        }}
      >
        {metrics.map((metric, index) => (
          <Box
            key={index}
            sx={{
              textAlign: "center",
              p: 3,
              borderRadius: 2,
              background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
              border: "1px solid #e5e7eb",
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: 120,
                height: 120,
                mx: "auto",
                mb: 2,
              }}
            >
              {/* Circular progress */}
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: "50%",
                  background: `conic-gradient(
                    ${metric.color} 0%,
                    ${metric.color} ${metric.displayValue}%,
                    #e5e7eb ${metric.displayValue}%,
                    #e5e7eb 100%
                  )`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 0 6px #ffffff",
                  }}
                >
                  <IconWrapper
                    icon={metric.icon}
                    size={28}
                    color={metric.color}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: metric.color,
                      mt: 0.5,
                    }}
                  >
                    {metric.value}
                    <Typography
                      component="span"
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {metric.unit}
                    </Typography>
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
                fontWeight: 600,
              }}
            >
              {metric.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

