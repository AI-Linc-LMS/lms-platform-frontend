"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup, Typography, CircularProgress } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import { Reveal, useStaticRender } from "@/components/scorecard/shared";
import { scorecardService, type PerformanceTrendsGranularity } from "@/lib/services/scorecard.service";
import type { PerformanceTrends } from "@/lib/types/scorecard.types";
import { PerformanceLineChart } from "@/components/scorecard/charts/PerformanceLineChart";
import { SkillAccuracyBars } from "@/components/scorecard/charts/SkillAccuracyBars";

interface PerformanceTrendsSectionProps {
  initialData: PerformanceTrends;
  /**
   * When true (admin view / PDF render) granularity switching is disabled.
   * Avoids client-side fetches that wouldn't carry the admin's user_id
   * context, and keeps PDFs deterministic.
   */
  readOnly?: boolean;
}

const GRANULARITY_OPTIONS: PerformanceTrendsGranularity[] = ["weekly", "bimonthly", "monthly"];

const SERIES = [
  { key: "mcqAccuracy", label: "MCQ accuracy", color: "var(--accent-indigo)" },
  { key: "subjectiveScore", label: "Subjective", color: "#10b981" },
  { key: "assessmentScore", label: "Assessment", color: "#f59e0b" },
  { key: "interviewScore", label: "Interview", color: "#a855f7" },
];

export function PerformanceTrendsSection({
  initialData,
  readOnly = false,
}: PerformanceTrendsSectionProps) {
  const staticRender = useStaticRender();
  const [granularity, setGranularity] = useState<PerformanceTrendsGranularity>(
    initialData.granularity ?? "weekly",
  );
  const [data, setData] = useState<PerformanceTrends>(initialData);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Partial<Record<PerformanceTrendsGranularity, PerformanceTrends>>>({});
  const fetchIdRef = useRef(0);

  useEffect(() => {
    setData(initialData);
    if (initialData.granularity) {
      cacheRef.current[initialData.granularity] = initialData;
    }
  }, [initialData]);

  const handleGranularityChange = useCallback(
    async (next: PerformanceTrendsGranularity) => {
      if (next === granularity || loading || readOnly || staticRender) return;
      const cached = cacheRef.current[next];
      if (cached) {
        setGranularity(next);
        setData(cached);
        return;
      }
      const fetchId = ++fetchIdRef.current;
      setGranularity(next);
      setLoading(true);
      try {
        const fresh = await scorecardService.getPerformanceTrends(next);
        if (fetchId === fetchIdRef.current) {
          cacheRef.current[next] = fresh;
          setData(fresh);
        }
      } catch (err) {
        console.warn("PerformanceTrends fetch failed:", err);
      } finally {
        if (fetchId === fetchIdRef.current) {
          setLoading(false);
        }
      }
    },
    [granularity, loading, readOnly, staticRender],
  );

  const hasWeekly = data.weeklyData.length > 0;
  const hasSkill = data.skillWiseAccuracy.length > 0;
  const isEmpty = !hasWeekly && !hasSkill;

  return (
    <Reveal as="section">
      <Box
        sx={{
          position: "relative",
          borderRadius: 4,
          overflow: "hidden",
          border:
            "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
          backgroundColor: "var(--card-bg)",
          boxShadow:
            "0 1px 0 color-mix(in srgb, var(--border-default) 60%, transparent), 0 30px 60px -30px rgba(15, 23, 42, 0.18)",
          backdropFilter: "blur(6px)",
        }}
      >
        {/* Decorative radial gradient mesh — matches StudentOverviewSection accent style. */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.45,
            backgroundImage: [
              "radial-gradient(55% 70% at 0% 0%, color-mix(in srgb, var(--accent-indigo) 18%, transparent), transparent 60%)",
              "radial-gradient(45% 60% at 100% 0%, color-mix(in srgb, var(--accent-cyan) 14%, transparent), transparent 60%)",
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        <Box sx={{ position: "relative", p: { xs: 2.5, sm: 3.5, md: 4.5 } }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: { xs: "flex-start", sm: "center" },
              justifyContent: "space-between",
              pb: { xs: 2.5, md: 3 },
              mb: { xs: 2.5, md: 3 },
              borderBottom:
                "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  background:
                    "linear-gradient(135deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 12px 24px -12px color-mix(in srgb, var(--accent-indigo) 60%, transparent)",
                  flexShrink: 0,
                }}
              >
                <IconWrapper icon="mdi:chart-line" size={22} color="#fff" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: "var(--font-primary)",
                    fontSize: { xs: "1.05rem", sm: "1.2rem" },
                    lineHeight: 1.25,
                  }}
                >
                  Accuracy & Performance Trends
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.85rem", mt: 0.25 }}
                >
                  Track how your scores evolve across quizzes, assessments, and interviews.
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ToggleButtonGroup
                value={granularity}
                exclusive
                onChange={(_, value) => value && handleGranularityChange(value)}
                disabled={loading || readOnly || staticRender}
                size="small"
                sx={{
                  bgcolor:
                    "color-mix(in srgb, var(--border-default) 35%, transparent)",
                  borderRadius: 999,
                  p: 0.5,
                  "& .MuiToggleButtonGroup-grouped": {
                    border: 0,
                    borderRadius: 999,
                    px: 1.5,
                    py: 0.5,
                    textTransform: "capitalize",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: "var(--font-secondary)",
                    "&.Mui-selected": {
                      bgcolor: "var(--card-bg)",
                      color: "var(--font-primary)",
                      boxShadow:
                        "0 4px 12px -6px color-mix(in srgb, var(--accent-indigo) 35%, transparent)",
                      "&:hover": { bgcolor: "var(--card-bg)" },
                    },
                    "&:hover": {
                      bgcolor:
                        "color-mix(in srgb, var(--accent-indigo) 6%, transparent)",
                    },
                  },
                }}
              >
                {GRANULARITY_OPTIONS.map((opt) => (
                  <ToggleButton key={opt} value={opt} aria-label={opt}>
                    {opt}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Box sx={{ width: 22, display: "flex", justifyContent: "center" }}>
                {loading && <CircularProgress size={16} thickness={5} />}
              </Box>
            </Box>
          </Box>

          {isEmpty ? (
            <Box
              sx={{
                py: { xs: 4, sm: 6 },
                textAlign: "center",
                borderRadius: 2,
                border:
                  "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
                color: "var(--font-secondary)",
              }}
            >
              <IconWrapper icon="mdi:chart-timeline-variant" size={40} color="var(--font-secondary)" />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                No performance data yet. Complete quizzes, assessments, and interviews to start the trend.
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gap: { xs: 3, md: 4 },
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0, 1.4fr) minmax(0, 1fr)",
                },
              }}
            >
              <PerformanceLineChart
                data={data.weeklyData as unknown as Record<string, unknown>[]}
                xKey="weekLabel"
                series={SERIES}
                title="Score over time"
                emptyHint="Once you attempt content over multiple weeks, the lines populate here."
              />
              <SkillAccuracyBars
                data={data.skillWiseAccuracy}
                title="Skill-wise accuracy"
                emptyHint="Skill bars appear once mapped MCQs / coding problems have ≥3 attempts."
              />
            </Box>
          )}
        </Box>
      </Box>
    </Reveal>
  );
}
