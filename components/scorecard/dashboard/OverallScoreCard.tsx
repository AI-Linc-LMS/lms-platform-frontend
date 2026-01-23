"use client";

import { Box, Typography, Chip } from "@mui/material";
import { ProgressRingChart } from "../charts/ProgressRingChart";
import { PerformanceLevel } from "@/lib/types/scorecard.types";

interface OverallScoreCardProps {
  score: number;
  grade: PerformanceLevel;
}

export function OverallScoreCard({ score, grade }: OverallScoreCardProps) {
  const getGradeColor = () => {
    switch (grade) {
      case "Interview-Ready":
        return "#10b981";
      case "Advanced":
        return "#0a66c2";
      case "Intermediate":
        return "#f59e0b";
      default:
        return "#9ca3af";
    }
  };

  const getGradeGradient = () => {
    switch (grade) {
      case "Interview-Ready":
        return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      case "Advanced":
        return "linear-gradient(135deg, #0a66c2 0%, #004182 100%)";
      case "Intermediate":
        return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
      default:
        return "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)";
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2.5,
        p: 4,
        borderRadius: 3,
        backgroundColor: "#ffffff",
        border: `2px solid ${getGradeColor()}30`,
        background: `linear-gradient(135deg, ${getGradeColor()}08 0%, ${getGradeColor()}02 100%)`,
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: `0 8px 24px ${getGradeColor()}30`,
          transform: "translateY(-4px)",
          borderColor: `${getGradeColor()}50`,
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: getGradeGradient(),
        },
      }}
    >
      <ProgressRingChart value={score} size={160} fontSize={32} color={getGradeColor()} />
      <Box sx={{ textAlign: "center" }}>
        <Typography
          variant="body2"
          sx={{
            color: "#666666",
            fontSize: "0.875rem",
            mb: 1.5,
            fontWeight: 500,
          }}
        >
          Overall Performance
        </Typography>
        <Chip
          label={grade}
          sx={{
            background: getGradeGradient(),
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "0.9375rem",
            height: 32,
            px: 1,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        />
      </Box>
    </Box>
  );
}
