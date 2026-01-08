"use client";

import { Paper, Typography, Box } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { memo } from "react";

interface PerformanceSummaryProps {
  overall_score: number;
  max_possible_score: number;
  overall_percentage: number;
  completed_questions: number;
  total_questions: number;
  performanceLabel: string;
}

const PerformanceSummaryComponent = ({
  overall_score,
  max_possible_score,
  overall_percentage,
  completed_questions,
  total_questions,
  performanceLabel,
}: PerformanceSummaryProps) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: "1px solid #e5e7eb",
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
        Performance Summary
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <IconWrapper icon="mdi:check-circle" size={20} color="#16a34a" />
            <Typography variant="caption" sx={{ color: "#16a34a", fontWeight: 600 }}>
              Total Score
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#15803d" }}>
            {overall_score}/{max_possible_score}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <IconWrapper icon="mdi:format-list-checks" size={20} color="#2563eb" />
            <Typography variant="caption" sx={{ color: "#2563eb", fontWeight: 600 }}>
              Questions
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#1e40af" }}>
            {completed_questions}/{total_questions}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#fef3c7",
            border: "1px solid #fde68a",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <IconWrapper icon="mdi:chart-line" size={20} color="#d97706" />
            <Typography variant="caption" sx={{ color: "#d97706", fontWeight: 600 }}>
              Percentage
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#b45309" }}>
            {overall_percentage}%
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#fce7f3",
            border: "1px solid #fbcfe8",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <IconWrapper icon="mdi:trophy" size={20} color="#db2777" />
            <Typography variant="caption" sx={{ color: "#db2777", fontWeight: 600 }}>
              Grade
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "#be185d" }}>
            {performanceLabel}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export const PerformanceSummary = memo(PerformanceSummaryComponent);
PerformanceSummary.displayName = "PerformanceSummary";

