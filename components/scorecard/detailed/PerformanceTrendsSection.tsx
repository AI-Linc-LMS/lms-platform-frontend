"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, CircularProgress, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  CountUp,
  KpiRail,
  Reveal,
  SectionHero,
  SectionShell,
  fadeRise,
  gridStagger,
  useStaticRender,
  useViewportEntrance,
} from "@/components/scorecard/shared";
import { scorecardService, type PerformanceTrendsGranularity } from "@/lib/services/scorecard.service";
import type { PerformanceTrends } from "@/lib/types/scorecard.types";
import { proficiencyBandColor } from "@/lib/utils/scorecard-visual";

interface PerformanceTrendsSectionProps {
  initialData: PerformanceTrends;
  readOnly?: boolean;
}

const GRANULARITY_OPTIONS: PerformanceTrendsGranularity[] = ["weekly", "bimonthly", "monthly"];

const SERIES = [
  { key: "mcqAccuracy", label: "MCQ", color: "var(--accent-indigo)" },
  { key: "subjectiveScore", label: "Subjective", color: "#10b981" },
  { key: "assessmentScore", label: "Assessment", color: "#f59e0b" },
  { key: "interviewScore", label: "Interview", color: "#a855f7" },
];

// Custom chart tooltip - same elevated card style used by LearningConsumptionSection.
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number; color?: string; name?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderRadius: 2,
        backgroundColor: "var(--card-bg)",
        backdropFilter: "blur(12px)",
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        boxShadow: "0 20px 50px -20px rgba(15, 23, 42, 0.35)",
        minWidth: 180,
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "var(--font-secondary)",
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          display: "block",
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {payload.map((p) => (
          <Box key={String(p.dataKey)} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
            <Typography variant="body2" sx={{ color: "var(--font-primary)", fontWeight: 600, fontSize: "0.8rem" }}>
              {p.name} ·{" "}
              <Box component="span" sx={{ color: p.color, fontWeight: 800 }}>
                {Number(p.value ?? 0).toFixed(0)}%
              </Box>
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function DeltaPill({ value, label }: { value: number; label: string }) {
  const positive = value >= 0;
  const accent = positive ? "#10b981" : "#ef4444";
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.4,
        borderRadius: 999,
        bgcolor: `color-mix(in srgb, ${accent} 14%, transparent)`,
        color: accent,
        fontSize: "0.7rem",
        fontWeight: 800,
        letterSpacing: "0.02em",
      }}
      aria-label={`${label}: ${positive ? "up" : "down"} ${Math.abs(value).toFixed(1)} points`}
    >
      <IconWrapper icon={positive ? "mdi:trending-up" : "mdi:trending-down"} size={12} />
      {positive ? "+" : ""}
      {value.toFixed(1)}p
    </Box>
  );
}

export function PerformanceTrendsSection({
  initialData,
  readOnly = false,
}: PerformanceTrendsSectionProps) {
  const staticRender = useStaticRender();
  const entrance = useViewportEntrance();
  const [granularity, setGranularity] = useState<PerformanceTrendsGranularity>(
    initialData.granularity ?? "weekly",
  );
  const [data, setData] = useState<PerformanceTrends>(initialData);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Partial<Record<PerformanceTrendsGranularity, PerformanceTrends>>>({});
  const fetchIdRef = useRef(0);
  // Stash the *content* fingerprint of the initialData we last absorbed. The
  // parent often re-renders with a fresh object reference even when the
  // underlying trend data is unchanged; we only want to reset state when the
  // actual payload changes, so the user's granularity selection isn't
  // stomped on every unrelated parent update.
  const initialDataKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = JSON.stringify({
      g: initialData.granularity,
      w: initialData.weeklyData?.length,
      s: initialData.skillWiseAccuracy?.length,
      first: initialData.weeklyData?.[0]?.weekLabel,
      last: initialData.weeklyData?.[initialData.weeklyData.length - 1]?.weekLabel,
    });
    if (initialDataKeyRef.current === key) return;
    initialDataKeyRef.current = key;
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
        if (fetchId === fetchIdRef.current) setLoading(false);
      }
    },
    [granularity, loading, readOnly, staticRender],
  );

  // KPI snapshot - latest bucket, with delta vs previous bucket.
  const latest = data.weeklyData[data.weeklyData.length - 1];
  const previous = data.weeklyData[data.weeklyData.length - 2];
  type WeeklyNumKey = "mcqAccuracy" | "subjectiveScore" | "assessmentScore" | "interviewScore";
  const delta = (key: WeeklyNumKey): number | null => {
    if (!latest || !previous) return null;
    const a = latest[key];
    const b = previous[key];
    if (a == null || b == null) return null;
    return Math.round((a - b) * 10) / 10;
  };

  const kpis = useMemo(() => {
    if (!latest) return [];
    return [
      {
        key: "mcqAccuracy" as const,
        label: "MCQ Accuracy",
        accent: "var(--accent-indigo)",
        value: latest.mcqAccuracy,
        delta: delta("mcqAccuracy"),
      },
      {
        key: "subjectiveScore" as const,
        label: "Subjective",
        accent: "#10b981",
        value: latest.subjectiveScore,
        delta: delta("subjectiveScore"),
      },
      {
        key: "assessmentScore" as const,
        label: "Assessment",
        accent: "#f59e0b",
        value: latest.assessmentScore,
        delta: delta("assessmentScore"),
      },
      {
        key: "interviewScore" as const,
        label: "Interview",
        accent: "#a855f7",
        value: latest.interviewScore,
        delta: delta("interviewScore"),
      },
    ];
  }, [latest, previous]);

  const hasWeekly = data.weeklyData.length > 0;
  const hasSkill = data.skillWiseAccuracy.length > 0;
  const isEmpty = !hasWeekly && !hasSkill;

  return (
    <Reveal as="section">
      <SectionShell
        radialMesh={[
          "radial-gradient(50% 60% at 0% 0%, color-mix(in srgb, var(--accent-indigo) 14%, transparent), transparent 60%)",
          "radial-gradient(45% 55% at 100% 0%, color-mix(in srgb, var(--accent-cyan) 12%, transparent), transparent 60%)",
        ]}
      >
        <SectionHero
          chapter="Chapter 03"
          title="Accuracy & Performance Trends"
          subtitle="Track how your scores evolve across quizzes, assessments, and interviews. Compare bucketed averages over time."
          accentTop="var(--accent-indigo)"
          accentBottom="var(--accent-cyan)"
          rightSlot={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ToggleButtonGroup
                value={granularity}
                exclusive
                onChange={(_, v) => v && handleGranularityChange(v)}
                disabled={loading || readOnly || staticRender}
                size="small"
                sx={{
                  bgcolor: "color-mix(in srgb, var(--border-default) 35%, transparent)",
                  borderRadius: 999,
                  p: 0.5,
                  "& .MuiToggleButtonGroup-grouped": {
                    border: 0,
                    borderRadius: 999,
                    px: 1.75,
                    py: 0.6,
                    textTransform: "capitalize",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    color: "var(--font-secondary)",
                    "&.Mui-selected": {
                      bgcolor: "var(--card-bg)",
                      color: "var(--font-primary)",
                      boxShadow:
                        "0 4px 12px -6px color-mix(in srgb, var(--accent-indigo) 40%, transparent)",
                      "&:hover": { bgcolor: "var(--card-bg)" },
                    },
                    "&:hover": {
                      bgcolor: "color-mix(in srgb, var(--accent-indigo) 8%, transparent)",
                    },
                  },
                }}
              >
                {GRANULARITY_OPTIONS.map((opt) => (
                  <ToggleButton key={opt} value={opt}>
                    {opt}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <Box sx={{ width: 22, display: "flex", justifyContent: "center" }}>
                {loading && <CircularProgress size={16} thickness={5} />}
              </Box>
            </Box>
          }
        />

        {isEmpty ? (
          <Box
            sx={{
              py: { xs: 5, sm: 7 },
              textAlign: "center",
              borderRadius: 3,
              border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
              color: "var(--font-secondary)",
            }}
          >
            <IconWrapper icon="mdi:chart-timeline-variant" size={48} color="var(--font-secondary)" />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              No performance data yet. Complete quizzes, assessments, and interviews to start the trend.
            </Typography>
          </Box>
        ) : (
          <>
            {/* Editorial KPI rail with delta pills underneath each big number */}
            {kpis.length > 0 && (
              <Box
                component={motion.div}
                variants={gridStagger}
                {...entrance}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
                  borderTop: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                  borderBottom: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                  mb: { xs: 3.5, md: 4.5 },
                }}
              >
                {kpis.map((kpi, idx) => (
                  <Box
                    key={kpi.key}
                    component={motion.div}
                    variants={{
                      hidden: { opacity: 0, y: 18 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as const } },
                    }}
                    sx={{
                      position: "relative",
                      py: { xs: 2.25, md: 2.75 },
                      px: { xs: 1.5, sm: 2 },
                      borderRight: {
                        xs: idx % 2 !== 1 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
                        md: idx !== kpis.length - 1 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
                      },
                      borderBottom: { xs: idx < 2 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none", md: "none" },
                      "&:hover": { backgroundColor: `color-mix(in srgb, ${kpi.accent} 6%, transparent)` },
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: 28,
                        height: 2,
                        background: kpi.accent,
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.25, flexWrap: "wrap" }}>
                      <Typography
                        sx={{
                          fontWeight: 800,
                          color: "var(--font-primary)",
                          fontSize: { xs: "1.7rem", sm: "2.1rem", md: "2.6rem" },
                          lineHeight: 1,
                          letterSpacing: "-0.04em",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {kpi.value == null ? (
                          <Box component="span" sx={{ color: "var(--font-secondary)" }}>-</Box>
                        ) : (
                          <>
                            <CountUp value={kpi.value} duration={1.2} />%
                          </>
                        )}
                      </Typography>
                      {previous && kpi.delta != null && <DeltaPill value={kpi.delta} label={kpi.label} />}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "var(--font-secondary)",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        display: "block",
                        mt: 1,
                      }}
                    >
                      {kpi.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}

            {/* Hero chart */}
            <Box
              component={motion.div}
              variants={fadeRise}
              {...entrance}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 3,
                border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                bgcolor: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
                mb: { xs: 3, md: 4 },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", letterSpacing: "-0.01em" }}>
                  Score over time
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.72rem" }}>
                  · {data.weeklyData.length} buckets · {granularity}
                </Typography>
              </Box>
              <Box sx={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.weeklyData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 4"
                      stroke="color-mix(in srgb, var(--border-default) 70%, transparent)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="weekLabel"
                      tick={{ fill: "var(--font-secondary)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={{ stroke: "color-mix(in srgb, var(--border-default) 60%, transparent)" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "var(--font-secondary)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={32}
                    />
                    <RTooltip content={<ChartTooltip />} cursor={{ stroke: "color-mix(in srgb, var(--accent-indigo) 30%, transparent)", strokeWidth: 1 }} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ paddingBottom: 6, fontSize: 11 }}
                    />
                    {SERIES.map((s) => (
                      <Line
                        key={s.key}
                        type="monotone"
                        dataKey={s.key}
                        name={s.label}
                        stroke={s.color}
                        strokeWidth={2.5}
                        dot={{ r: 3, strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        isAnimationActive
                        connectNulls={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            {/* Skill-wise accuracy panel */}
            {hasSkill && (
              <Box
                component={motion.div}
                variants={fadeRise}
                {...entrance}
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 3,
                  border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                  bgcolor: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", letterSpacing: "-0.01em" }}>
                    Skill-wise accuracy
                  </Typography>
                  <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.72rem" }}>
                    {data.skillWiseAccuracy.length} skills with ≥3 attempts
                  </Typography>
                </Box>
                <Box
                  component={motion.div}
                  variants={gridStagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.1 }}
                  sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}
                >
                  {data.skillWiseAccuracy.slice(0, 10).map((row) => {
                    const accent = proficiencyBandColor(row.accuracy);
                    return (
                      <motion.div
                        key={row.skillName}
                        variants={{
                          hidden: { opacity: 0, x: -12 },
                          visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const } },
                        }}
                      >
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                            bgcolor: "var(--card-bg)",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.85rem", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                              title={row.skillName}
                            >
                              {row.skillName}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                              <Typography
                                sx={{ fontWeight: 800, color: accent, fontVariantNumeric: "tabular-nums", fontSize: "1.05rem", letterSpacing: "-0.02em" }}
                              >
                                {row.accuracy.toFixed(0)}%
                              </Typography>
                              <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.65rem" }}>
                                · {row.attemptCount}×
                              </Typography>
                            </Box>
                          </Box>
                          <Box
                            sx={{
                              height: 6,
                              borderRadius: 999,
                              bgcolor: "color-mix(in srgb, var(--border-default) 45%, transparent)",
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                width: `${Math.max(0, Math.min(100, row.accuracy))}%`,
                                height: "100%",
                                borderRadius: 999,
                                background: `linear-gradient(90deg, ${accent} 0%, color-mix(in srgb, ${accent} 70%, transparent) 100%)`,
                              }}
                            />
                          </Box>
                        </Box>
                      </motion.div>
                    );
                  })}
                </Box>
              </Box>
            )}
          </>
        )}
      </SectionShell>
    </Reveal>
  );
}
