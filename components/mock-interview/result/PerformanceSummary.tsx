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
            backgroundColor: "color-mix(in srgb, var(--course-cta) 8%, var(--card-bg))",
            border: "1px solid color-mix(in srgb, var(--course-cta) 28%, transparent)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <IconWrapper icon="mdi:check-circle" size={20} color="var(--course-cta)" />
            <Typography variant="caption" sx={{ color: "var(--course-cta)", fontWeight: 600 }}>
              Total Score
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--course-cta)" }}>
            {overall_score}/{max_possible_score}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "var(--info-surface)",
            border: "1px solid var(--info-border)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <IconWrapper icon="mdi:format-list-checks" size={20} color="var(--info-accent)" />
            <Typography variant="caption" sx={{ color: "var(--info-accent)", fontWeight: 600 }}>
              Questions
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--info-strong)" }}>
            {/*
             * For dynamic (turn-based) interviews the total isn't known up front - the AI
             * picks how many follow-ups to ask based on the candidate's pacing. In that
             * case `total_questions` arrives as 0 from the submit metadata, so showing
             * "7/0" is meaningless. Only render the fraction when we actually have a
             * non-zero target larger than what was completed; otherwise just show the
             * raw count of questions the candidate answered.
             */}
            {total_questions > 0 && total_questions >= completed_questions
              ? `${completed_questions}/${total_questions}`
              : completed_questions}
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "color-mix(in srgb, var(--warning-amber) 12%, var(--card-bg))",
            border: "1px solid color-mix(in srgb, var(--warning-amber) 32%, transparent)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <IconWrapper icon="mdi:chart-line" size={20} color="var(--warning-amber)" />
            <Typography variant="caption" sx={{ color: "var(--warning-amber)", fontWeight: 600 }}>
              Percentage
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--warning-strong)" }}>
            {overall_percentage}%
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "color-mix(in srgb, var(--accent-indigo) 8%, var(--card-bg))",
            border: "1px solid color-mix(in srgb, var(--accent-indigo) 24%, transparent)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <IconWrapper icon="mdi:trophy" size={20} color="var(--accent-indigo)" />
            <Typography variant="caption" sx={{ color: "var(--accent-indigo)", fontWeight: 600 }}>
              Grade
            </Typography>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: "var(--accent-indigo-dark)" }}>
            {performanceLabel}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export const PerformanceSummary = memo(PerformanceSummaryComponent);
PerformanceSummary.displayName = "PerformanceSummary";

