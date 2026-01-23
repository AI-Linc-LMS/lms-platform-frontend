"use client";

import { Box, Typography, Paper, Tooltip as MuiTooltip } from "@mui/material";

interface HeatmapCell {
  skill: string;
  value: number; // 0-100
}

interface HeatmapChartProps {
  data: HeatmapCell[];
  title?: string;
  rows?: number;
  cols?: number;
}

export function HeatmapChart({
  data,
  title,
  rows = 5,
  cols = 2,
}: HeatmapChartProps) {
  const getColor = (value: number) => {
    if (value >= 80) return "#10b981"; // Green
    if (value >= 60) return "#0a66c2"; // Blue
    if (value >= 40) return "#f59e0b"; // Amber
    return "#ef4444"; // Red
  };

  const getIntensity = (value: number) => {
    if (value >= 80) return 1;
    if (value >= 60) return 0.8;
    if (value >= 40) return 0.6;
    return 0.4;
  };

  return (
    <Box>
      {title && (
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: 600,
            color: "#000000",
            fontSize: "1.125rem",
          }}
        >
          {title}
        </Typography>
      )}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "#ffffff",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 1.5,
          }}
        >
          {data.map((cell, index) => (
            <MuiTooltip
              key={index}
              title={`${cell.skill}: ${cell.value}%`}
              arrow
            >
              <Box
                sx={{
                  p: 2,
                  borderRadius: 1.5,
                  backgroundColor: getColor(cell.value),
                  opacity: getIntensity(cell.value),
                  color: "#ffffff",
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "scale(1.05)",
                    opacity: 1,
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    mb: 0.5,
                  }}
                >
                  {cell.skill}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.75rem",
                    opacity: 0.9,
                  }}
                >
                  {cell.value}%
                </Typography>
              </Box>
            </MuiTooltip>
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
