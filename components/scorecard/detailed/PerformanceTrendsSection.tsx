"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Typography, Paper, CircularProgress, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import { PerformanceTrends } from "@/lib/types/scorecard.types";
import { scorecardService, PerformanceTrendsGranularity } from "@/lib/services/scorecard.service";
import { SkillBarChart, PerformanceLineChart } from "@/components/charts";

const GRANULARITY_OPTIONS: PerformanceTrendsGranularity[] = ["weekly", "bimonthly", "monthly"];

interface PerformanceTrendsSectionProps {
  initialData: PerformanceTrends;
}

export function PerformanceTrendsSection({ initialData }: PerformanceTrendsSectionProps) {
  const { t } = useTranslation("common");
  const [granularity, setGranularity] = useState<PerformanceTrendsGranularity>("weekly");
  const [data, setData] = useState<PerformanceTrends>(initialData);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Partial<Record<PerformanceTrendsGranularity, PerformanceTrends>>>({ weekly: initialData });
  const fetchIdRef = useRef(0);

  useEffect(() => {
    setData(initialData);
    cacheRef.current.weekly = initialData;
  }, [initialData]);

  const handleGranularityChange = async (g: PerformanceTrendsGranularity) => {
    if (g === granularity || loading) return;
    const cached = cacheRef.current[g];
    if (cached) {
      setGranularity(g);
      setData(cached);
      return;
    }
    const id = ++fetchIdRef.current;
    setGranularity(g);
    setLoading(true);
    try {
      const trends = await scorecardService.getPerformanceTrends(g);
      if (id === fetchIdRef.current) {
        cacheRef.current[g] = trends;
        setData(trends);
      }
    } catch (error) {
      console.error("Failed to load performance trends:", error);
      if (id === fetchIdRef.current) {
        setGranularity(granularity);
      }
    } finally {
      if (id === fetchIdRef.current) {
        setLoading(false);
      }
    }
  };

  const hasWeeklyData = data.weeklyData.length > 0;
  const hasSkillData = data.skillWiseAccuracy.length > 0;
  const isEmpty = !hasWeeklyData && !hasSkillData;

  const chartTitle =
    granularity === "monthly"
      ? "Performance (Last 30 Days)"
      : granularity === "bimonthly"
      ? "Performance (Last 15 Days)"
      : "Performance (Last 7 Days)";

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
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: "#000000",
            fontSize: { xs: "1.25rem", sm: "1.5rem" },
          }}
        >
          Accuracy & Performance Trends
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <ToggleButtonGroup
            value={granularity}
            exclusive
            onChange={(_, value) => value && handleGranularityChange(value)}
            disabled={loading}
            sx={{
              "& .MuiToggleButtonGroup-grouped": {
                border: "1px solid #e5e7eb",
                textTransform: "capitalize",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                px: 2,
                py: 1,
                "&.Mui-selected": {
                  backgroundColor: "#6366f1",
                  color: "#ffffff",
                  borderColor: "#6366f1",
                  "&:hover": {
                    backgroundColor: "#6366f1",
                  },
                },
                "&:hover": {
                  backgroundColor: "rgba(99, 102, 241, 0.08)",
                },
              },
            }}
          >
            {GRANULARITY_OPTIONS.map((period) => (
              <ToggleButton key={period} value={period} aria-label={period}>
                {t(`admin.dashboard.${period}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Box sx={{ width: 28, height: 28, ml: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {loading && <CircularProgress size={20} />}
          </Box>
        </Box>
      </Box>

      {isEmpty ? (
        <Box
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 2,
            backgroundColor: "#f9fafb",
            border: "1px dashed rgba(0,0,0,0.08)",
          }}
        >
          <IconWrapper icon="mdi:chart-line" size={48} color="#9ca3af" />
          <Typography variant="body1" sx={{ color: "#666666", mt: 2 }}>
            No performance data yet. Complete quizzes, assessments, and interviews to see your trends.
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 4 }}>
            <PerformanceLineChart
              data={data.weeklyData}
              dataKeys={[
                { key: "mcqAccuracy", label: "MCQ Accuracy", color: "#0a66c2" },
                { key: "subjectiveScore", label: "Subjective Score", color: "#10b981" },
                { key: "assessmentScore", label: "Assessment Score", color: "#f59e0b" },
                { key: "interviewScore", label: "Interview Score", color: "#6366f1" },
              ]}
              title={chartTitle}
            />
          </Box>

          <Box>
            <SkillBarChart
              data={data.skillWiseAccuracy}
              title="Skill-wise Accuracy"
              dataKey="accuracy"
              showInfoTooltip
              infoTooltipTitle="Accuracy = proficiency from quizzes, assessments, videos, coding, and interviews. Confidence = min(100, √(attempt count) × 20). See Skill Scorecard for full breakdown per skill."
            />
          </Box>
        </>
      )}
    </Paper>
  );
}
