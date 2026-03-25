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
import { BehavioralMetrics, LoginFrequency, StudyTimeByWeek } from "@/lib/types/scorecard.types";
import { VerticalGradientBarChart } from "@/components/charts";

export type BehavioralGranularity = "weekly" | "bimonthly" | "monthly";

const GRANULARITY_OPTIONS: BehavioralGranularity[] = ["weekly", "bimonthly", "monthly"];

function aggregateByGranularity<T extends { week: string; loginCount?: number; hours?: number }>(
  items: T[],
  granularity: BehavioralGranularity,
  sumKey: "loginCount" | "hours"
): { week: string; loginCount?: number; hours?: number }[] {
  if (items.length === 0) return [];
  if (granularity === "weekly") return items.map((i) => ({ ...i }));
  const size = granularity === "bimonthly" ? 2 : 4;
  const out: { week: string; loginCount?: number; hours?: number }[] = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    const first = chunk[0].week;
    const last = chunk[chunk.length - 1].week;
    const week = first === last ? first : `${first} – ${last}`;
    const loginCount =
      sumKey === "loginCount"
        ? chunk.reduce((s, x) => s + ((x as LoginFrequency).loginCount ?? 0), 0)
        : undefined;
    const hours =
      sumKey === "hours"
        ? chunk.reduce((s, x) => s + ((x as StudyTimeByWeek).hours ?? 0), 0)
        : undefined;
    out.push({
      week,
      ...(loginCount !== undefined && { loginCount }),
      ...(hours !== undefined && { hours: Math.round((hours ?? 0) * 10) / 10 }),
    });
  }
  return out;
}

function formatLastActive(dateStr: string): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? "Never" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const paperSx = {
  width: "100%",
  maxWidth: "100%",
  overflow: "hidden",
  borderRadius: 3,
  border: "1px solid rgba(0,0,0,0.06)",
  bgcolor: "#fff",
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
  boxSizing: "border-box" as const,
};

const metricBox = {
  px: { xs: 2, sm: 3 },
  py: 2.5,
  borderRight: { xs: "none", sm: "1px solid #f1f5f9" },
  borderBottom: { xs: "1px solid #f1f5f9", sm: "none" },
};

interface BehavioralMetricsSectionProps {
  data: BehavioralMetrics;
}

export function BehavioralMetricsSection({ data }: BehavioralMetricsSectionProps) {
  const [granularity, setGranularity] = useState<BehavioralGranularity>("weekly");
  const hasLogin = data.loginFrequency.length > 0;
  const hasStudyByWeek = (data.studyTimeByWeek?.length ?? 0) > 0;
  const hasWeekday =
    data.studyTimeDistribution.length > 0 && !data.studyTimeDistribution.every((s) => s.hours === 0);
  const empty = !hasLogin && !hasStudyByWeek && !hasWeekday;

  const loginData = aggregateByGranularity(data.loginFrequency, granularity, "loginCount") as { week: string; loginCount: number }[];
  const studyData =
    hasStudyByWeek && data.studyTimeByWeek
      ? (aggregateByGranularity(data.studyTimeByWeek, granularity, "hours") as { week: string; hours: number }[])
      : [];

  const periodLabel =
    granularity === "monthly" ? "Last 2 months" : granularity === "bimonthly" ? "Last 4 bi-weeks" : "Last 8 weeks";

  const infoBtn = (title: React.ReactNode) => (
    <MuiTooltip title={title} placement="top" arrow>
      <IconButton size="small" sx={{ p: 0.25, color: "#94a3b8", "&:hover": { color: "#6366f1", bgcolor: "rgba(99,102,241,0.08)" } }}>
        <IconWrapper icon="mdi:information-outline" size={16} />
      </IconButton>
    </MuiTooltip>
  );

  return (
    <Paper elevation={0} sx={paperSx}>
      <Box sx={{ px: { xs: 2, sm: 3 }, pt: 3, pb: 2 }}>
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
            <IconWrapper icon="mdi:chart-timeline-variant" size={22} color="#fff" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827", fontSize: { xs: "1.125rem", sm: "1.25rem" } }}>
              Behavioral & Consistency
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Study habits and activity patterns
            </Typography>
          </Box>
        </Box>
      </Box>

      {empty ? (
        <Box sx={{ px: { xs: 2, sm: 3 }, pb: 5, pt: 1 }}>
          <Box
            sx={{
              py: 6,
              px: 2,
              textAlign: "center",
              borderRadius: 2,
              bgcolor: "#f8fafc",
              border: "1px dashed #e2e8f0",
            }}
          >
            <IconWrapper icon="mdi:chart-timeline-variant" size={28} color="#6366f1" />
            <Typography variant="body1" sx={{ mt: 2, fontWeight: 600 }}>
              No activity data yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 300, mx: "auto" }}>
              Complete videos, quizzes, or assessments to see consistency and study time here.
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <Box sx={{ ...metricBox, "&:last-of-type": { borderRight: "none", borderBottom: "none" } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Consistency
                </Typography>
                {infoBtn(
                  <>
                    <strong>What it means:</strong> How regularly you engage over the last 30 days.
                    <br />
                    <strong>Calculation:</strong> (Days with activity ÷ 30) × 100.
                  </>
                )}
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#6366f1" }}>
                {data.consistencyScore}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                of days active
              </Typography>
            </Box>
            <Box sx={metricBox}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, textTransform: "uppercase", display: "block", mb: 0.5 }}>
                Last active
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {formatLastActive(data.lastActiveDate)}
              </Typography>
            </Box>
            <Box sx={{ ...metricBox, borderBottom: { xs: "none", sm: "none" } }}>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 500, textTransform: "uppercase", display: "block", mb: 0.5 }}>
                Missed deadlines
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Typography variant="body1" fontWeight={600} color={data.missedDeadlinesCount > 0 ? "error.main" : "text.primary"}>
                  {data.missedDeadlinesCount}
                </Typography>
                {data.missedDeadlinesCount > 0 && <Chip size="small" label="Overdue" sx={{ height: 20, fontSize: "0.7rem", bgcolor: "#fef2f2", color: "#dc2626", fontWeight: 600 }} />}
              </Box>
            </Box>
          </Box>

          <Box sx={{ px: { xs: 2, sm: 3 }, py: 3 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={600} color="#334155">
                Activity over time
              </Typography>
              <ToggleButtonGroup
                value={granularity}
                exclusive
                onChange={(_, v) => v && setGranularity(v)}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    textTransform: "capitalize",
                    fontSize: "0.8125rem",
                    px: 1.5,
                    "&.Mui-selected": { bgcolor: "#6366f1", color: "#fff", borderColor: "#6366f1" },
                  },
                }}
              >
                {GRANULARITY_OPTIONS.map((g) => (
                  <ToggleButton key={g} value={g}>
                    {g === "bimonthly" ? "Bi-monthly" : g.charAt(0).toUpperCase() + g.slice(1)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 3 }}>
              <ChartPanel
                title="Active days"
                subtitle={`${periodLabel} · distinct days with learning activity`}
                info={infoBtn(
                  <>
                    <strong>What it is</strong>
                    <br />
                    Distinct days with learning activity per period.
                    <br />
                    <strong>How it&apos;s calculated</strong>
                    <br />
                    Unique dates with activity per week (or grouped period).
                  </>
                )}
              >
                <VerticalGradientBarChart
                  data={loginData as unknown as Record<string, string | number>[]}
                  xDataKey="week"
                  yDataKey="loginCount"
                  gradientId="behavioralLoginGrad"
                  colorFrom="#3b82f6"
                  colorTo="#2563eb"
                  formatTooltip={(v) => ({ primary: `${v} days active` })}
                />
              </ChartPanel>

              <ChartPanel
                title={hasStudyByWeek ? "Study time" : "Study time by weekday"}
                subtitle={hasStudyByWeek ? `${periodLabel} · hours tracked` : "Last 30 days · hours per day of week"}
                info={infoBtn(
                  <>
                    <strong>What it is</strong>
                    <br />
                    {hasStudyByWeek
                      ? "Tracked study hours per period."
                      : "Hours per weekday (Mon–Sun) over the last 30 days."}
                  </>
                )}
              >
                {hasStudyByWeek ? (
                  <VerticalGradientBarChart
                    data={studyData as unknown as Record<string, string | number>[]}
                    xDataKey="week"
                    yDataKey="hours"
                    gradientId="behavioralStudyGrad"
                    colorFrom="#10b981"
                    colorTo="#059669"
                    formatTooltip={(v) => ({ primary: `${v} h study time` })}
                  />
                ) : (
                  <VerticalGradientBarChart
                    data={data.studyTimeDistribution as unknown as Record<string, string | number>[]}
                    xDataKey="day"
                    yDataKey="hours"
                    gradientId="behavioralStudyGradWd"
                    colorFrom="#10b981"
                    colorTo="#059669"
                    formatTooltip={(v) => ({ primary: `${v} h study time` })}
                  />
                )}
              </ChartPanel>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
}

function ChartPanel({
  title,
  subtitle,
  info,
  children,
}: {
  title: string;
  subtitle: string;
  info: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: "#fafafa", border: "1px solid #f1f5f9", flex: { md: 1 }, minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
        <Typography variant="subtitle2" fontWeight={600} color="#334155">
          {title}
        </Typography>
        {info}
      </Box>
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
      <Box sx={{ mt: 1.5 }}>{children}</Box>
    </Box>
  );
}
