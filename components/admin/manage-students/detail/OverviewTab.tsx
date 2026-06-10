"use client";

import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { StudentLearningJourney } from "@/lib/services/admin/admin-student.service";
import {
  ADAPTIVE,
  CHART_COLORS,
  EmptyState,
  formatDate,
} from "./shared";

function ChartCard({
  title,
  children,
  height = 280,
}: {
  title: string;
  children: React.ReactNode;
  height?: number;
}) {
  return (
    <Box
      sx={{
        flex: "1 1 320px",
        minWidth: 0,
        p: { xs: 2, md: 2.5 },
        borderRadius: 3,
        border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--card-bg) 70%, transparent)",
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          color: "var(--font-primary)",
          mb: 2,
          fontSize: "0.95rem",
        }}
      >
        {title}
      </Typography>
      <Box sx={{ width: "100%", height }}>{children}</Box>
    </Box>
  );
}

export function OverviewTab({ journey }: { journey: StudentLearningJourney }) {
  const activityData = useMemo(
    () =>
      (journey.activity_pattern_30_days || []).map((d) => ({
        label: formatDate(d.date).replace(/, \d{4}$/, ""),
        activities: d.activity_count,
        minutes: Math.round(d.time_spent_hours * 60),
      })),
    [journey.activity_pattern_30_days]
  );

  const breakdownData = useMemo(
    () =>
      Object.entries(journey.activity_breakdown || {})
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    [journey.activity_breakdown]
  );

  const completion = journey.summary.overall_completion_pct ?? 0;
  const completionData = [
    { name: "Completed", value: completion },
    { name: "Remaining", value: Math.max(0, 100 - completion) },
  ];

  const hasActivity = activityData.some((d) => d.activities > 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5 }}>
        <ChartCard title="Activity — last 30 days" height={280}>
          {hasActivity ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="actFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ADAPTIVE.indigo} stopOpacity={0.45} />
                    <stop offset="100%" stopColor={ADAPTIVE.indigo} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in srgb, var(--border-default) 70%, transparent)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="activities"
                  stroke={ADAPTIVE.indigo}
                  strokeWidth={2}
                  fill="url(#actFill)"
                  name="Activities"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="mdi:chart-line" title="No activity in the last 30 days" />
          )}
        </ChartCard>

        <ChartCard title="Overall content completion" height={280}>
          <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionData}
                  dataKey="value"
                  innerRadius={70}
                  outerRadius={100}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  <Cell fill={ADAPTIVE.indigo} />
                  <Cell fill="color-mix(in srgb, var(--border-default) 60%, transparent)" />
                </Pie>
                <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label overlaid on the donut hole */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "1.8rem",
                  color: "var(--font-primary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {completion.toFixed(0)}%
              </Typography>
            </Box>
          </Box>
        </ChartCard>
      </Box>

      <ChartCard title="Activity by type" height={260}>
        {breakdownData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={breakdownData}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label={(e) => `${e.name}: ${e.value}`}
                labelLine={false}
              >
                {breakdownData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon="mdi:shape-outline" title="No content activity recorded yet" />
        )}
      </ChartCard>
    </Box>
  );
}
