"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Tooltip as MuiTooltip,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
import {
  BehavioralMetrics,
  LoginFrequency,
  StudyTimeByWeek,
} from "@/lib/types/scorecard.types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type BehavioralGranularity = "weekly" | "bimonthly" | "monthly";

const BEHAVIORAL_GRANULARITY_OPTIONS: BehavioralGranularity[] = [
  "weekly",
  "bimonthly",
  "monthly",
];

function aggregateByGranularity<
  T extends { week: string; loginCount?: number; hours?: number }
>(
  items: T[],
  granularity: BehavioralGranularity,
  sumKey: "loginCount" | "hours"
): { week: string; loginCount?: number; hours?: number }[] {
  if (items.length === 0) return [];
  if (granularity === "weekly") return items.map((i) => ({ ...i }));
  const size = granularity === "bimonthly" ? 2 : 4;
  const result: {
    week: string;
    loginCount?: number;
    hours?: number;
  }[] = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    const first = chunk[0].week;
    const last = chunk[chunk.length - 1].week;
    const week = first === last ? first : `${first} – ${last}`;
    const loginCount =
      sumKey === "loginCount"
        ? chunk.reduce(
            (s, x) => s + ((x as LoginFrequency).loginCount ?? 0),
            0
          )
        : undefined;
    const hours =
      sumKey === "hours"
        ? chunk.reduce(
            (s, x) => s + ((x as StudyTimeByWeek).hours ?? 0),
            0
          )
        : undefined;
    result.push({
      week,
      ...(loginCount !== undefined && { loginCount }),
      ...(hours !== undefined && {
        hours: Math.round((hours ?? 0) * 10) / 10,
      }),
    });
  }
  return result;
}

interface BehavioralMetricsSectionProps {
  data: BehavioralMetrics;
}

function formatLastActive(dateStr: string): string {
  if (!dateStr || typeof dateStr !== "string") return "Never";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Never";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


export function BehavioralMetricsSection({ data }: BehavioralMetricsSectionProps) {
  const [granularity, setGranularity] =
    useState<BehavioralGranularity>("weekly");

  const hasLoginData = data.loginFrequency.length > 0;
  const hasStudyByWeek = (data.studyTimeByWeek?.length ?? 0) > 0;
  const hasStudyByWeekday =
    data.studyTimeDistribution.length > 0 &&
    !data.studyTimeDistribution.every((s) => s.hours === 0);
  const hasNoActivityData =
    !hasLoginData &&
    !hasStudyByWeek &&
    (data.studyTimeDistribution.length === 0 ||
      data.studyTimeDistribution.every((s) => s.hours === 0));

  const aggregatedLogin = aggregateByGranularity(
    data.loginFrequency,
    granularity,
    "loginCount"
  ) as { week: string; loginCount: number }[];
  const aggregatedStudyByWeek =
    hasStudyByWeek && data.studyTimeByWeek
      ? (aggregateByGranularity(
          data.studyTimeByWeek,
          granularity,
          "hours"
        ) as { week: string; hours: number }[])
      : [];

  const granularityLabel =
    granularity === "monthly"
      ? "Last 2 months"
      : granularity === "bimonthly"
      ? "Last 4 bi-weeks"
      : "Last 8 weeks";

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        borderRadius: 3,
        border: "1px solid rgba(0,0,0,0.06)",
        backgroundColor: "#ffffff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        boxSizing: "border-box",
      }}
    >
      {/* Header: title + subtitle */}
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          pt: 3,
          pb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconWrapper
              icon="mdi:chart-timeline-variant"
              size={22}
              color="#ffffff"
            />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#111827",
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
                lineHeight: 1.2,
              }}
            >
              Behavioral & Consistency
            </Typography>
            <Typography
              variant="caption"
              sx={{ color: "#6b7280", fontSize: "0.8125rem" }}
            >
              Study habits and activity patterns
            </Typography>
          </Box>
        </Box>
      </Box>

      {hasNoActivityData ? (
        <Box
          sx={{
            px: { xs: 2, sm: 3 },
            pb: 5,
            pt: 1,
          }}
        >
          <Box
            sx={{
              py: 6,
              px: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              borderRadius: 2,
              backgroundColor: "#f8fafc",
              border: "1px dashed #e2e8f0",
            }}
          >
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "#e0e7ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <IconWrapper
                icon="mdi:chart-timeline-variant"
                size={28}
                color="#6366f1"
              />
            </Box>
            <Typography
              variant="body1"
              sx={{ color: "#374151", fontWeight: 600, fontSize: "1rem" }}
            >
              No activity data yet
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 0.75, color: "#6b7280", maxWidth: 300, fontSize: "0.875rem" }}
            >
              Complete videos, quizzes, or assessments to see your consistency
              and study time here.
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          {/* Key metrics strip */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, 1fr)",
              },
              gap: 0,
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: 2.5,
                borderRight: { xs: "none", sm: "1px solid #f1f5f9" },
                borderBottom: { xs: "1px solid #f1f5f9", sm: "none" },
                "&:last-of-type": {
                  borderRight: "none",
                  borderBottom: "none",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "#64748b",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Consistency
                </Typography>
                <MuiTooltip
                  title={
                    <Box component="span" sx={{ display: "block", maxWidth: 260 }}>
                      <strong>What it means:</strong> How regularly you engage
                      over the last 30 days.
                      <br />
                      <strong>Calculation:</strong> (Days with activity ÷ 30) ×
                      100.
                    </Box>
                  }
                  placement="top"
                  arrow
                >
                  <IconButton
                    size="small"
                    sx={{
                      p: 0.25,
                      color: "#94a3b8",
                      "&:hover": {
                        color: "#6366f1",
                        backgroundColor: "rgba(99, 102, 241, 0.08)",
                      },
                    }}
                    aria-label="Consistency info"
                  >
                    <IconWrapper icon="mdi:information-outline" size={16} />
                  </IconButton>
                </MuiTooltip>
              </Box>
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: "#6366f1",
                    fontSize: "1.75rem",
                    lineHeight: 1.2,
                  }}
                >
                  {data.consistencyScore}%
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#94a3b8", fontSize: "0.75rem" }}
                >
                  of days active
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: 2.5,
                borderRight: { xs: "none", sm: "1px solid #f1f5f9" },
                borderBottom: { xs: "1px solid #f1f5f9", sm: "none" },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  display: "block",
                  mb: 0.5,
                }}
              >
                Last active
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: "#111827",
                  fontSize: "1rem",
                }}
              >
                {formatLastActive(data.lastActiveDate)}
              </Typography>
            </Box>

            <Box
              sx={{
                px: { xs: 2, sm: 3 },
                py: 2.5,
                borderBottom: { xs: "1px solid #f1f5f9", sm: "none" },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "#64748b",
                  fontWeight: 500,
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  display: "block",
                  mb: 0.5,
                }}
              >
                Missed deadlines
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color:
                      data.missedDeadlinesCount > 0 ? "#dc2626" : "#111827",
                    fontSize: "1rem",
                  }}
                >
                  {data.missedDeadlinesCount}
                </Typography>
                {data.missedDeadlinesCount > 0 && (
                  <Chip
                    size="small"
                    label="Overdue"
                    sx={{
                      height: 20,
                      fontSize: "0.7rem",
                      backgroundColor: "#fef2f2",
                      color: "#dc2626",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Charts section - full width */}
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: 3,
              width: "100%",
              minWidth: 0,
              boxSizing: "border-box",
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                mb: 2.5,
              }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "#334155",
                  fontSize: "0.9375rem",
                }}
              >
                Activity over time
              </Typography>
              <ToggleButtonGroup
                value={granularity}
                exclusive
                onChange={(_, value) => value && setGranularity(value)}
                size="small"
                sx={{
                  "& .MuiToggleButtonGroup-grouped": {
                    border: "1px solid #e2e8f0",
                    textTransform: "capitalize",
                    fontSize: "0.8125rem",
                    px: 1.5,
                    py: 0.5,
                    "&.Mui-selected": {
                      backgroundColor: "#6366f1",
                      color: "#fff",
                      borderColor: "#6366f1",
                      "&:hover": { backgroundColor: "#4f46e5" },
                    },
                    "&:hover": {
                      backgroundColor: "rgba(99, 102, 241, 0.06)",
                    },
                  },
                }}
              >
                {BEHAVIORAL_GRANULARITY_OPTIONS.map((g) => (
                  <ToggleButton key={g} value={g} aria-label={g}>
                    {g === "bimonthly"
                      ? "Bi-monthly"
                      : g.charAt(0).toUpperCase() + g.slice(1)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* Two charts side by side */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" },
                gap: 3,
                width: "100%",
              }}
            >
              {/* Active days chart */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  backgroundColor: "#fafafa",
                  border: "1px solid #f1f5f9",
                  flex: { xs: "0 0 auto", md: 1 },
                  minWidth: 0,
                  boxSizing: "border-box",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#334155",
                      fontSize: "0.875rem",
                    }}
                  >
                    Active days
                  </Typography>
                  <MuiTooltip
                    title={
                      <Box component="span" sx={{ display: "block", maxWidth: 300 }}>
                        <Typography component="span" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
                          What it is
                        </Typography>
                        Number of distinct days in each period when you had any learning activity (videos, quizzes, assessments, etc.). Based on platform activity, not literal logins.
                        <Typography component="span" sx={{ fontWeight: 600, display: "block", mt: 1, mb: 0.5 }}>
                          How it&apos;s calculated
                        </Typography>
                        For each week (or bi-week / month), we count the unique dates with at least one recorded activity. The bar shows that count per period.
                      </Box>
                    }
                    placement="top"
                    arrow
                  >
                    <IconButton
                      size="small"
                      sx={{
                        p: 0.25,
                        color: "#94a3b8",
                        "&:hover": { color: "#3b82f6", backgroundColor: "rgba(59, 130, 246, 0.08)" },
                      }}
                      aria-label="Active days info"
                    >
                      <IconWrapper icon="mdi:information-outline" size={18} />
                    </IconButton>
                  </MuiTooltip>
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontSize: "0.75rem" }}
                >
                  {granularityLabel} · distinct days with learning activity
                </Typography>
                <Box sx={{ mt: 1.5 }}>
                  <div
                    style={{
                      width: "100%",
                      height: 280,
                      display: "block",
                      position: "relative",
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={aggregatedLogin}
                        margin={{ top: 8, right: 8, bottom: 4, left: -8 }}
                      >
                        <defs>
                          <linearGradient
                            id="behavioralLoginGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#2563eb" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          axisLine={{ stroke: "#e2e8f0" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#64748b" }}
                          axisLine={false}
                          tickLine={false}
                          width={24}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: "8px 12px",
                            fontSize: "0.8125rem",
                          }}
                          formatter={(value: number | undefined) => [
                            `${value ?? 0} days`,
                            "Active",
                          ]}
                          labelStyle={{ color: "#334155", fontWeight: 600 }}
                        />
                        <Bar
                          dataKey="loginCount"
                          fill="url(#behavioralLoginGrad)"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={80}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Box>
              </Box>

              {/* Study time chart */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  backgroundColor: "#fafafa",
                  border: "1px solid #f1f5f9",
                  flex: { xs: "0 0 auto", md: 1 },
                  minWidth: 0,
                  boxSizing: "border-box",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#334155",
                      fontSize: "0.875rem",
                    }}
                  >
                    {hasStudyByWeek ? "Study time" : "Study time by weekday"}
                  </Typography>
                  <MuiTooltip
                    title={
                      <Box component="span" sx={{ display: "block", maxWidth: 300 }}>
                        <Typography component="span" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
                          What it is
                        </Typography>
                        {hasStudyByWeek
                          ? "Total time you spent on learning (tracked study time) in each period, in hours."
                          : "Total hours you spent studying on each day of the week (Mon–Sun) over the last 30 days."}
                        <Typography component="span" sx={{ fontWeight: 600, display: "block", mt: 1, mb: 0.5 }}>
                          How it&apos;s calculated
                        </Typography>
                        {hasStudyByWeek
                          ? "Sum of all tracked study time (e.g. from timers or session tracking) for each week (or bi-week / month). The bar shows total hours per period."
                          : "For each weekday, we sum your tracked study time on all Mondays, Tuesdays, etc. in the last 30 days. Helps you see which days you study most."}
                      </Box>
                    }
                    placement="top"
                    arrow
                  >
                    <IconButton
                      size="small"
                      sx={{
                        p: 0.25,
                        color: "#94a3b8",
                        "&:hover": { color: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.08)" },
                      }}
                      aria-label="Study time info"
                    >
                      <IconWrapper icon="mdi:information-outline" size={18} />
                    </IconButton>
                  </MuiTooltip>
                </Box>
                <Typography
                  variant="caption"
                  sx={{ color: "#64748b", fontSize: "0.75rem" }}
                >
                  {hasStudyByWeek
                    ? `${granularityLabel} · hours tracked`
                    : "Last 30 days · hours per day of week"}
                </Typography>
                <Box sx={{ mt: 1.5 }}>
                  <div
                    style={{
                      width: "100%",
                      height: 280,
                      display: "block",
                      position: "relative",
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      {hasStudyByWeek ? (
                        <BarChart
                          data={aggregatedStudyByWeek}
                          margin={{ top: 8, right: 8, bottom: 4, left: -8 }}
                        >
                          <defs>
                            <linearGradient
                              id="behavioralStudyGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="week"
                            tick={{ fontSize: 10, fill: "#64748b" }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                            width={24}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: 8,
                              padding: "8px 12px",
                              fontSize: "0.8125rem",
                            }}
                            formatter={(value: number | undefined) => [
                              `${value ?? 0} h`,
                              "Study time",
                            ]}
                            labelStyle={{ color: "#334155", fontWeight: 600 }}
                          />
                          <Bar
                            dataKey="hours"
                            fill="url(#behavioralStudyGrad)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={80}
                          />
                        </BarChart>
                      ) : (
                        <BarChart
                          data={data.studyTimeDistribution}
                          margin={{ top: 8, right: 8, bottom: 4, left: -8 }}
                        >
                          <defs>
                            <linearGradient
                              id="behavioralStudyGradWeekday"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="day"
                            tick={{ fontSize: 10, fill: "#64748b" }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 10, fill: "#64748b" }}
                            axisLine={false}
                            tickLine={false}
                            width={24}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#fff",
                              border: "1px solid #e2e8f0",
                              borderRadius: 8,
                              padding: "8px 12px",
                              fontSize: "0.8125rem",
                            }}
                            formatter={(value: number | undefined) => [
                              `${value ?? 0} h`,
                              "Study time",
                            ]}
                            labelStyle={{ color: "#334155", fontWeight: 600 }}
                          />
                          <Bar
                            dataKey="hours"
                            fill="url(#behavioralStudyGradWeekday)"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={80}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </Box>
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
}
