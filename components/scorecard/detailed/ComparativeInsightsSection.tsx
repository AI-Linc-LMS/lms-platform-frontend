"use client";

import { Box, Typography, Paper } from "@mui/material";
import { ComparativeInsights } from "@/lib/types/scorecard.types";
import { ComparisonChart } from "../charts/ComparisonChart";

interface ComparativeInsightsSectionProps {
  data: ComparativeInsights;
}

export function ComparativeInsightsSection({ data }: ComparativeInsightsSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 2,
        border: "1px solid rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
      }}
    >
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: "#000000",
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
          mb: 3,
        }}
      >
        Comparative Insights
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#f9fafb",
            border: "1px solid rgba(0,0,0,0.08)",
            mb: 2,
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            Your Percentile Rank: {data.percentileRank}%
          </Typography>
          <Typography variant="body2" sx={{ color: "#666666" }}>
            You are performing better than {data.percentileRank}% of your batch
          </Typography>
        </Box>
      </Box>

      <ComparisonChart data={data.comparisons} title="Performance Comparison" />
    </Paper>
  );
}
