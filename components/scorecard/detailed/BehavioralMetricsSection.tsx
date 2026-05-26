"use client";

import { useMemo } from "react";
import { Box, LinearProgress, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import { IconWrapper } from "@/components/common/IconWrapper";
import { CountUp, Reveal, gridStagger } from "@/components/scorecard/shared";
import type { BehavioralMetrics, StudyTimeDistribution } from "@/lib/types/scorecard.types";

interface BehavioralMetricsSectionProps {
  data: BehavioralMetrics;
}

function formatWeekLabel(iso: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const ms = Date.now() - d.getTime();
    if (ms < 0) return "today";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "—";
  }
}

function MiniBarChart({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (!data.length) {
    return (
      <Box
        sx={{
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--font-secondary)",
          fontSize: "0.78rem",
          borderRadius: 2,
          border: "1px dashed color-mix(in srgb, var(--border-default) 80%, transparent)",
        }}
      >
        No data yet
      </Box>
    );
  }
  return (
    <Box sx={{ height: 140, width: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 4"
            stroke="color-mix(in srgb, var(--border-default) 70%, transparent)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--font-secondary)", fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: "color-mix(in srgb, var(--border-default) 60%, transparent)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "var(--font-secondary)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <RechartsTooltip
            contentStyle={{
              background: "var(--card-bg)",
              border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
              borderRadius: 8,
              fontSize: 11,
              boxShadow: "0 12px 32px -16px rgba(15, 23, 42, 0.18)",
            }}
            labelStyle={{ color: "var(--font-primary)", fontWeight: 700 }}
          />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}

function StudyTimeDistributionBars({ data }: { data: StudyTimeDistribution[] }) {
  const max = useMemo(() => data.reduce((acc, d) => Math.max(acc, d.hours), 0), [data]);
  if (!data.length) return null;
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      {data.map((row) => {
        const pct = max > 0 ? (row.hours / max) * 100 : 0;
        return (
          <Box key={row.day}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 0.25,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.7rem" }}>
                {row.day}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: "var(--accent-indigo-dark)",
                  fontVariantNumeric: "tabular-nums",
                  fontSize: "0.7rem",
                }}
              >
                {row.hours.toFixed(1)}h
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, Math.min(100, pct))}
              sx={{
                height: 5,
                borderRadius: 3,
                bgcolor: "color-mix(in srgb, var(--border-default) 45%, transparent)",
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                  background: "linear-gradient(90deg, var(--accent-indigo) 0%, var(--accent-indigo-dark) 100%)",
                },
              }}
            />
          </Box>
        );
      })}
    </Box>
  );
}

export function BehavioralMetricsSection({ data }: BehavioralMetricsSectionProps) {
  const consistencyAccent =
    data.consistencyScore >= 80
      ? "#10b981"
      : data.consistencyScore >= 60
      ? "var(--accent-indigo)"
      : data.consistencyScore >= 40
      ? "#f59e0b"
      : "#ef4444";

  const loginChartData = useMemo(
    () =>
      data.loginFrequency.map((d) => ({
        label: formatWeekLabel(d.week),
        active: d.loginCount,
      })),
    [data.loginFrequency],
  );

  const studyChartData = useMemo(
    () =>
      data.studyTimeByWeek.map((d) => ({
        label: formatWeekLabel(d.week),
        hours: d.hours,
      })),
    [data.studyTimeByWeek],
  );

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
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            opacity: 0.4,
            backgroundImage: [
              "radial-gradient(55% 70% at 0% 0%, color-mix(in srgb, var(--accent-cyan) 16%, transparent), transparent 60%)",
              "radial-gradient(45% 60% at 100% 100%, color-mix(in srgb, var(--accent-indigo) 12%, transparent), transparent 60%)",
            ].join(", "),
            pointerEvents: "none",
          }}
        />

        <Box sx={{ position: "relative", p: { xs: 2.5, sm: 3.5, md: 4.5 } }}>
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
                  background: "linear-gradient(135deg, var(--accent-cyan, #06b6d4) 0%, #0891b2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow:
                    "0 12px 24px -12px color-mix(in srgb, var(--accent-cyan, #06b6d4) 60%, transparent)",
                  flexShrink: 0,
                }}
              >
                <IconWrapper icon="mdi:calendar-clock-outline" size={22} color="#fff" />
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
                  Behavioral & Consistency
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.85rem", mt: 0.25 }}>
                  Activity rhythm, study-time patterns, and consistency index.
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, auto)" },
                gap: { xs: 1, sm: 1.5 },
              }}
            >
              {[
                {
                  label: "Consistency",
                  value: `${Math.round(data.consistencyScore)}%`,
                  color: consistencyAccent,
                  numeric: true,
                  numericValue: data.consistencyScore,
                },
                {
                  label: "Last active",
                  value: formatRelative(data.lastActiveDate),
                  color: "var(--accent-cyan, #06b6d4)",
                },
                {
                  label: "Missed",
                  value: data.missedDeadlinesCount,
                  color: data.missedDeadlinesCount > 0 ? "#ef4444" : "var(--font-secondary)",
                  numeric: true,
                  numericValue: data.missedDeadlinesCount,
                },
              ].map((stat) => (
                <Box
                  key={stat.label}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 2,
                    bgcolor:
                      "color-mix(in srgb, var(--border-default) 30%, transparent)",
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 78,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase", fontSize: "0.65rem" }}
                  >
                    {stat.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: stat.color,
                      fontSize: "1.05rem",
                      lineHeight: 1.2,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {stat.numeric && typeof stat.numericValue === "number" ? (
                      <CountUp value={stat.numericValue} duration={0.8} />
                    ) : (
                      stat.value
                    )}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <motion.div
            variants={gridStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            style={{
              display: "grid",
              gap: 16,
              gridTemplateColumns: "1fr",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              }}
            >
              <Box
                sx={{
                  p: { xs: 1.75, sm: 2 },
                  borderRadius: 2.5,
                  border:
                    "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                  bgcolor: "var(--card-bg)",
                }}
              >
                <Tooltip
                  title="Distinct days you opened content per week — proxy for login frequency."
                  arrow
                  placement="top"
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 800,
                      color: "var(--font-primary)",
                      mb: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    Active days / week
                    <IconWrapper icon="mdi:information-outline" size={14} color="var(--font-secondary)" />
                  </Typography>
                </Tooltip>
                <MiniBarChart data={loginChartData} dataKey="active" color="var(--accent-cyan, #06b6d4)" />
              </Box>
              <Box
                sx={{
                  p: { xs: 1.75, sm: 2 },
                  borderRadius: 2.5,
                  border:
                    "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                  bgcolor: "var(--card-bg)",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", mb: 1 }}>
                  Study hours / week
                </Typography>
                <MiniBarChart data={studyChartData} dataKey="hours" color="var(--accent-indigo)" />
              </Box>
            </Box>

            {data.studyTimeDistribution.length > 0 && (
              <Box
                sx={{
                  p: { xs: 1.75, sm: 2 },
                  borderRadius: 2.5,
                  border:
                    "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                  bgcolor: "var(--card-bg)",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", mb: 1 }}>
                  When you study — by day of week
                </Typography>
                <StudyTimeDistributionBars data={data.studyTimeDistribution} />
              </Box>
            )}
          </motion.div>
        </Box>
      </Box>
    </Reveal>
  );
}
