"use client";

import { Box, Typography, Paper } from "@mui/material";
import { PerformanceTrends } from "@/lib/types/scorecard.types";
import { PerformanceLineChart } from "../charts/PerformanceLineChart";
import { SkillBarChart } from "../charts/SkillBarChart";

interface PerformanceTrendsSectionProps {
  data: PerformanceTrends;
}

export function PerformanceTrendsSection({ data }: PerformanceTrendsSectionProps) {
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
        Accuracy & Performance Trends
      </Typography>

      <Box sx={{ mb: 4 }}>
        <PerformanceLineChart
          data={data.weeklyData}
          dataKeys={[
            { key: "mcqAccuracy", label: "MCQ Accuracy", color: "#0a66c2" },
            { key: "subjectiveScore", label: "Subjective Score", color: "#10b981" },
            { key: "assessmentScore", label: "Assessment Score", color: "#f59e0b" },
            { key: "interviewScore", label: "Interview Score", color: "#6366f1" },
          ]}
          title="Week-by-Week Performance"
        />
      </Box>

      <Box>
        <SkillBarChart
          data={data.skillWiseAccuracy}
          title="Skill-wise Accuracy"
          dataKey="accuracy"
        />
      </Box>
    </Paper>
  );
}
