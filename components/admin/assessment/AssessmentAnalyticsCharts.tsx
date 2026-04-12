"use client";

import { useMemo } from "react";
import { Box, Paper, Typography } from "@mui/material";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from "recharts";
import type { AssessmentAnalyticsResponse } from "@/lib/services/admin/admin-assessment.service";

const C = {
  sky: "#0284c7",
  skyLight: "#38bdf8",
  deep: "#0369a1",
  indigo: "#6366f1",
  slate: "#64748b",
  grid: "#e2e8f0",
  pass: "#059669",
  warn: "#d97706",
  muted: "#94a3b8",
};

const STATUS_PIE_COLORS = ["#f59e0b", "#3b82f6", "#10b981"];

const tooltipSx = {
  backgroundColor: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 12,
};

type Props = {
  data: AssessmentAnalyticsResponse;
};

export function AssessmentAnalyticsCharts({ data }: Props) {
  const summary = data.summary;
  const threshold = summary.pass_threshold_percentage ?? 40;
  const completedWithScore = summary.completed_with_score ?? 0;
  const passCount = summary.pass_count ?? 0;
  const passRate = summary.pass_rate_percent;

  const scoreChartData = useMemo(
    () =>
      (data.charts?.score_distribution_percent ?? []).map((b) => ({
        name: b.label,
        count: b.count,
      })),
    [data.charts?.score_distribution_percent],
  );

  const timeChartData = useMemo(
    () =>
      (data.charts?.time_taken_minutes ?? []).map((b) => ({
        name: b.label,
        count: b.count,
      })),
    [data.charts?.time_taken_minutes],
  );

  const timelineData = useMemo(
    () =>
      (data.charts?.submissions_timeline ?? []).map((d) => {
        let short = d.date;
        try {
          const dt = new Date(d.date + "T12:00:00");
          if (!isNaN(dt.getTime())) {
            short = dt.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
          }
        } catch {
          /* keep raw */
        }
        return { date: d.date, label: short, submissions: d.count };
      }),
    [data.charts?.submissions_timeline],
  );

  const statusPieData = useMemo(() => {
    const sb = data.status_breakdown ?? {};
    return [
      { name: "In progress", value: sb.in_progress ?? 0 },
      { name: "Submitted", value: sb.submitted ?? 0 },
      { name: "Finalized", value: sb.finalized ?? 0 },
    ].filter((x) => x.value > 0);
  }, [data.status_breakdown]);

  const sectionBarData = useMemo(
    () =>
      (data.section_averages ?? []).map((s) => ({
        name:
          s.section_title.length > 28
            ? `${s.section_title.slice(0, 26)}…`
            : s.section_title,
        fullName: s.section_title,
        avgPct: Number(s.average_percentage?.toFixed(1)) || 0,
        avgScore: Number(s.average_score?.toFixed(1)) || 0,
      })),
    [data.section_averages],
  );

  const emptyMsg = (
    <Box
      sx={{
        height: 240,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: C.muted,
      }}
    >
      <Typography variant="body2">No data for this chart.</Typography>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper
        elevation={0}
        variant="outlined"
        sx={{
          p: 2.5,
          borderRadius: 2,
          borderLeft: 5,
          borderLeftColor: C.pass,
          bgcolor: "rgba(5, 150, 105, 0.04)",
        }}
      >
        <Typography variant="overline" color="text.secondary" fontWeight={700}>
          Pass rate
        </Typography>
        <Typography variant="h4" fontWeight={800} sx={{ color: C.pass, my: 0.5 }}>
          {passRate != null && Number.isFinite(passRate)
            ? `${passRate.toFixed(1)}%`
            : "—"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {passCount} of {completedWithScore} scored attempts passed. Pass means at
          least{" "}
          <Box component="span" fontWeight={700} color="text.primary">
            {threshold}%
          </Box>{" "}
          of maximum marks.
        </Typography>
      </Paper>

      <Typography variant="body2" color="text.secondary">
        Figures below combine all submissions returned by the analytics API.
        Histograms include a trend line across buckets; the timeline uses a
        smooth area chart.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr 320px" },
          gap: 2,
        }}
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Submission status
          </Typography>
          {statusPieData.length === 0 ? (
            emptyMsg
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={96}
                  paddingAngle={2}
                  label={false}
                >
                  {statusPieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={STATUS_PIE_COLORS[i % STATUS_PIE_COLORS.length]}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipSx} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Quick counts
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, pt: 1 }}>
            {[
              ["Total submissions", summary.total_submissions],
              ["Completed", summary.completed_submissions],
              ["With score", summary.completed_with_score],
              ["Score high / low", `${summary.highest_score?.toFixed(1)} / ${summary.lowest_score?.toFixed(1)}`],
              ["Median %", summary.median_percentage?.toFixed(1)],
            ].map(([k, v]) => (
              <Box
                key={String(k)}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  py: 0.75,
                  borderBottom: "1px solid #f1f5f9",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {k}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {v ?? "—"}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2,
        }}
      >
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Score distribution (count by % band)
          </Typography>
          {scoreChartData.length === 0 ? (
            emptyMsg
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={scoreChartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} />
                <YAxis tick={{ fontSize: 11, fill: C.slate }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipSx} />
                <Legend />
                <Bar dataKey="count" name="Learners" fill={C.sky} radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Trend"
                  stroke={C.deep}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: C.deep }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Time taken (minutes)
          </Typography>
          {timeChartData.length === 0 ? (
            emptyMsg
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={timeChartData} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.slate }} />
                <YAxis tick={{ fontSize: 11, fill: C.slate }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipSx} />
                <Legend />
                <Bar dataKey="count" name="Learners" fill={C.skyLight} radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Trend"
                  stroke={C.indigo}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: C.indigo }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Submissions over time
        </Typography>
        {timelineData.length === 0 ? (
          emptyMsg
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={timelineData} margin={{ top: 12, right: 12, left: 4, bottom: 8 }}>
              <defs>
                <linearGradient id="analyticsTimelineFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={C.indigo} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={C.indigo} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.slate }} />
              <YAxis tick={{ fontSize: 11, fill: C.slate }} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipSx}
                formatter={(v) => [v ?? 0, "Submissions"]}
                labelFormatter={(_label, payload) => {
                  const row = payload?.[0]?.payload as { date?: string } | undefined;
                  return row?.date ? String(row.date) : "";
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="submissions"
                name="Submissions"
                stroke={C.indigo}
                strokeWidth={2.5}
                fill="url(#analyticsTimelineFill)"
                dot={{ r: 3, fill: C.indigo, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </Paper>

      {sectionBarData.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
            Section average % (completed with response sheet)
          </Typography>
          <ResponsiveContainer width="100%" height={Math.max(220, sectionBarData.length * 44)}>
            <BarChart
              data={sectionBarData}
              layout="vertical"
              margin={{ left: 8, right: 16, top: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={C.grid} horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: C.slate }} unit="%" />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fontSize: 11, fill: C.slate }}
              />
              <Tooltip
                contentStyle={tooltipSx}
                formatter={(value) => [`${value ?? 0}%`, "Avg %"]}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as { fullName?: string } | undefined;
                  return row?.fullName ?? "";
                }}
              />
              <Bar dataKey="avgPct" name="Avg %" fill={C.sky} radius={[0, 6, 6, 0]} barSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}
    </Box>
  );
}
