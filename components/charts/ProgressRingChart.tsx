"use client";

import { Box, Typography } from "@mui/material";
import { proficiencyBandColor } from "@/lib/utils/scorecard-visual";

interface ProgressRingChartProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
  label?: string;
  fontSize?: number;
}

const DEFAULT_RING_COLOR = "#0a66c2";

export function ProgressRingChart({
  value,
  size = 120,
  strokeWidth = 8,
  color = DEFAULT_RING_COLOR,
  showLabel = true,
  label,
  fontSize = 24,
}: ProgressRingChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const finalColor = color === DEFAULT_RING_COLOR ? proficiencyBandColor(value) : color;

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
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
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
          style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
        />
      </svg>
      {showLabel && (
        <Box sx={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Typography variant="h6" sx={{ fontSize: `${fontSize}px`, fontWeight: 700, color: "#000", lineHeight: 1 }}>
            {Math.round(value)}%
          </Typography>
          {label && (
            <Typography variant="caption" sx={{ fontSize: "0.75rem", color: "#666", mt: 0.5, textAlign: "center" }}>
              {label}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
