"use client";

import { Box, Typography } from "@mui/material";

interface ProgressRingChartProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
  fontSize?: number;
}

export function ProgressRingChart({
  value,
  size = 120,
  strokeWidth = 8,
  color = "#0a66c2",
  showLabel = true,
  label,
  fontSize = 24,
}: ProgressRingChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const getColor = () => {
    if (value >= 80) return "#10b981"; // Green
    if (value >= 60) return "#0a66c2"; // Blue
    if (value >= 40) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  const finalColor = color === "#0a66c2" ? getColor() : color;

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={finalColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 0.5s ease-in-out",
          }}
        />
      </svg>
      {showLabel && (
        <Box
          sx={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: `${fontSize}px`,
              fontWeight: 700,
              color: "#000000",
              lineHeight: 1,
            }}
          >
            {Math.round(value)}%
          </Typography>
          {label && (
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.75rem",
                color: "#666666",
                mt: 0.5,
                textAlign: "center",
              }}
            >
              {label}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
