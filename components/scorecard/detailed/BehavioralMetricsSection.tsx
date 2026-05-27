"use client";

import { useMemo } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  AnimatedRing,
  CountUp,
  Reveal,
  SectionHero,
  SectionShell,
  fadeRise,
  gridStagger,
  useViewportEntrance,
} from "@/components/scorecard/shared";
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
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; color?: string; name?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        px: 1.75,
        py: 1.25,
        borderRadius: 2,
        backgroundColor: "var(--card-bg)",
        backdropFilter: "blur(12px)",
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        boxShadow: "0 20px 50px -20px rgba(15, 23, 42, 0.35)",
      }}
    >
      <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", display: "block", mb: 0.5 }}>
        {label}
      </Typography>
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <Typography variant="body2" sx={{ color: "var(--font-primary)", fontWeight: 700, fontSize: "0.8rem" }}>
            {p.name} ·{" "}
            <Box component="span" sx={{ color: p.color, fontWeight: 800 }}>
              {Number(p.value ?? 0)}
            </Box>
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

/** Mini activity calendar: 13 weeks × 7 days grid, GitHub-style intensity. */
function ActivityHeatmapMini({ calendar }: { calendar: Record<string, number> }) {
  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // 13 weeks worth of days, ending today.
    const days: Array<{ date: Date; level: number }> = [];
    for (let i = 13 * 7 - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: d, level: calendar[key] || 0 });
    }
    // Group into weeks (cols) — Mon..Sun.
    const cols: Array<Array<{ date: Date; level: number }>> = [];
    let cur: Array<{ date: Date; level: number }> = [];
    days.forEach((d, idx) => {
      cur.push(d);
      if (cur.length === 7 || idx === days.length - 1) {
        cols.push(cur);
        cur = [];
      }
    });
    return cols;
  }, [calendar]);

  const levelColor = (lvl: number) => {
    if (lvl >= 4) return "#10b981";
    if (lvl === 3) return "color-mix(in srgb, #10b981 70%, transparent)";
    if (lvl === 2) return "color-mix(in srgb, #10b981 45%, transparent)";
    if (lvl === 1) return "color-mix(in srgb, #10b981 22%, transparent)";
    return "color-mix(in srgb, var(--border-default) 35%, transparent)";
  };

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: 0.5, py: 0.5 }}>
      {weeks.map((week, wi) => (
        <Box key={wi} sx={{ display: "grid", gridTemplateRows: "repeat(7, 1fr)", gap: 0.5 }}>
          {week.map((day, di) => (
            <Tooltip
              key={di}
              title={`${day.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · activity ${day.level}/4`}
              arrow
              placement="top"
            >
              <Box
                sx={{
                  aspectRatio: "1 / 1",
                  borderRadius: 0.75,
                  background: levelColor(day.level),
                  cursor: "default",
                }}
              />
            </Tooltip>
          ))}
        </Box>
      ))}
    </Box>
  );
}

function StudyTimeDayBars({ data }: { data: StudyTimeDistribution[] }) {
  const max = useMemo(() => data.reduce((acc, d) => Math.max(acc, d.hours), 0), [data]);
  if (!data.length) return null;
  return (
    <Box sx={{ display: "grid", gap: 0.75 }}>
      {data.map((row) => {
        const pct = max > 0 ? (row.hours / max) * 100 : 0;
        return (
          <Box key={row.day}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.25 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.7rem" }}>
                {row.day}
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontWeight: 800, color: "var(--accent-cyan, #0891b2)", fontVariantNumeric: "tabular-nums", fontSize: "0.7rem" }}
              >
                {row.hours.toFixed(1)}h
              </Typography>
            </Box>
            <Box sx={{ height: 6, borderRadius: 999, bgcolor: "color-mix(in srgb, var(--border-default) 45%, transparent)", overflow: "hidden" }}>
              <Box
                sx={{
                  width: `${Math.max(0, Math.min(100, pct))}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, var(--accent-cyan, #06b6d4) 0%, color-mix(in srgb, var(--accent-cyan, #06b6d4) 70%, transparent) 100%)",
                  transition: "width 0.6s ease",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export function BehavioralMetricsSection({ data }: BehavioralMetricsSectionProps) {
  const entrance = useViewportEntrance();

  const loginChartData = useMemo(
    () => data.loginFrequency.map((d) => ({ label: formatWeekLabel(d.week), active: d.loginCount })),
    [data.loginFrequency],
  );

  const studyChartData = useMemo(
    () => data.studyTimeByWeek.map((d) => ({ label: formatWeekLabel(d.week), hours: d.hours })),
    [data.studyTimeByWeek],
  );

  const consistencyAccent =
    data.consistencyScore >= 80 ? "#10b981" : data.consistencyScore >= 60 ? "var(--accent-cyan, #06b6d4)" : data.consistencyScore >= 40 ? "#f59e0b" : "#ef4444";

  // Total active days in calendar (sum of any non-zero level)
  const totalActiveDays = useMemo(
    () => Object.values(data.activityCalendar).filter((v) => v > 0).length,
    [data.activityCalendar],
  );

  return (
    <Reveal as="section">
      <SectionShell
        radialMesh={[
          "radial-gradient(55% 70% at 0% 0%, color-mix(in srgb, var(--accent-cyan, #06b6d4) 14%, transparent), transparent 60%)",
          "radial-gradient(45% 60% at 100% 100%, color-mix(in srgb, var(--accent-indigo) 10%, transparent), transparent 60%)",
        ]}
      >
        <SectionHero
          chapter="Chapter 08"
          title="Behavioral & Consistency"
          subtitle="Activity rhythm, study-time patterns, and consistency index over the past 13 weeks."
          iconBadge={{
            icon: "mdi:calendar-clock-outline",
            gradient: "linear-gradient(135deg, var(--accent-cyan, #06b6d4) 0%, #0891b2 100%)",
          }}
        />

        {/* Hero: big consistency ring + activity calendar grid */}
        <Box
          component={motion.div}
          variants={fadeRise}
          {...entrance}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 280px) minmax(0, 1fr)" },
            gap: { xs: 2.5, md: 3 },
            alignItems: "stretch",
            mb: { xs: 3.5, md: 4.5 },
          }}
        >
          <Box
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: 3,
              background:
                "linear-gradient(160deg, color-mix(in srgb, var(--accent-cyan, #06b6d4) 14%, transparent) 0%, color-mix(in srgb, var(--accent-cyan, #06b6d4) 4%, transparent) 100%)",
              border: "1px solid color-mix(in srgb, var(--accent-cyan, #06b6d4) 22%, transparent)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              textAlign: "center",
              minHeight: 240,
            }}
          >
            <AnimatedRing
              value={data.consistencyScore}
              size={160}
              strokeWidth={12}
              color={consistencyAccent}
              colorEnd="color-mix(in srgb, var(--accent-cyan, #06b6d4) 80%, transparent)"
              caption=""
              valueFontSize={36}
            />
            <Typography
              variant="caption"
              sx={{ color: consistencyAccent, fontWeight: 800, letterSpacing: "0.18em", fontSize: "0.66rem", textTransform: "uppercase", mt: 1 }}
            >
              Consistency · last 30 days
            </Typography>
            <Typography sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.85rem" }}>
              Last active <Box component="span" sx={{ fontWeight: 800 }}>{formatRelative(data.lastActiveDate)}</Box>
            </Typography>
          </Box>

          <Box
            sx={{
              p: { xs: 2, md: 2.5 },
              borderRadius: 3,
              border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
              bgcolor: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
              display: "flex",
              flexDirection: "column",
              minHeight: 240,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.25, flexWrap: "wrap", gap: 1 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", letterSpacing: "-0.01em" }}>
                  Activity calendar
                </Typography>
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.72rem" }}>
                  Last 13 weeks · {totalActiveDays} active days
                </Typography>
              </Box>
              {/* Legend */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.65rem", mr: 0.5 }}>
                  less
                </Typography>
                {[0, 1, 2, 3, 4].map((lvl) => (
                  <Box
                    key={lvl}
                    sx={{
                      width: 11,
                      height: 11,
                      borderRadius: 0.5,
                      bgcolor:
                        lvl === 0
                          ? "color-mix(in srgb, var(--border-default) 35%, transparent)"
                          : `color-mix(in srgb, #10b981 ${22 + lvl * 17}%, transparent)`,
                    }}
                  />
                ))}
                <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.65rem", ml: 0.5 }}>
                  more
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center" }}>
              <Box sx={{ width: "100%" }}>
                <ActivityHeatmapMini calendar={data.activityCalendar} />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* KPI rail */}
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
          {[
            { label: "Consistency", value: Math.round(data.consistencyScore), suffix: "%", accent: consistencyAccent },
            { label: "Active days (year)", value: totalActiveDays, accent: "#10b981" },
            { label: "Total study hrs", value: Math.round(data.studyTimeByWeek.reduce((a, w) => a + w.hours, 0)), accent: "var(--accent-cyan, #0891b2)" },
            { label: "Missed deadlines", value: data.missedDeadlinesCount, accent: data.missedDeadlinesCount > 0 ? "#ef4444" : "var(--font-secondary)" },
          ].map((kpi, idx) => (
            <Box
              key={kpi.label}
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
                  md: idx !== 3 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none",
                },
                borderBottom: { xs: idx < 2 ? "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)" : "none", md: "none" },
                "&:hover": { backgroundColor: `color-mix(in srgb, ${kpi.accent} 6%, transparent)` },
                "&::before": { content: '""', position: "absolute", top: 0, left: 0, width: 28, height: 2, background: kpi.accent },
              }}
            >
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
                <CountUp value={kpi.value} duration={1.4} />
                {kpi.suffix}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "var(--font-secondary)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", display: "block", mt: 1 }}
              >
                {kpi.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Side-by-side bar charts + weekday distribution */}
        <Box
          component={motion.div}
          variants={fadeRise}
          {...entrance}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2,
            mb: data.studyTimeDistribution.length > 0 ? 2 : 0,
          }}
        >
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
              bgcolor: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", mb: 1, letterSpacing: "-0.01em" }}>
              Active days / week
            </Typography>
            <Box sx={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={loginChartData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 4" stroke="color-mix(in srgb, var(--border-default) 70%, transparent)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--font-secondary)", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "color-mix(in srgb, var(--border-default) 60%, transparent)" }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "var(--font-secondary)", fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                  <RTooltip content={<ChartTooltip />} />
                  <Bar dataKey="active" name="Days" fill="var(--accent-cyan, #06b6d4)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
              bgcolor: "color-mix(in srgb, var(--card-bg) 96%, transparent)",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", mb: 1, letterSpacing: "-0.01em" }}>
              Study hours / week
            </Typography>
            <Box sx={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studyChartData} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 4" stroke="color-mix(in srgb, var(--border-default) 70%, transparent)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "var(--font-secondary)", fontSize: 10 }} tickLine={false} axisLine={{ stroke: "color-mix(in srgb, var(--border-default) 60%, transparent)" }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: "var(--font-secondary)", fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                  <RTooltip content={<ChartTooltip />} />
                  <Bar dataKey="hours" name="Hours" fill="var(--accent-indigo)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Box>
        </Box>

        {data.studyTimeDistribution.length > 0 && (
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
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "var(--font-primary)", mb: 1, letterSpacing: "-0.01em" }}>
              When you study · day of week
            </Typography>
            <StudyTimeDayBars data={data.studyTimeDistribution} />
          </Box>
        )}
      </SectionShell>
    </Reveal>
  );
}
