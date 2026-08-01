"use client";

import { useMemo } from "react";
import { Box, Chip, LinearProgress, Skeleton, Tooltip, Typography } from "@mui/material";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { EngagementPayload } from "@/lib/services/admin/admin-insights.service";
import {
  DefinitionMark,
  EmptyState,
  HourHeatmap,
  INSIGHT,
  Panel,
  SERIES_COLORS,
} from "./primitives";

/**
 * Engagement tab: what students touch, when they touch it, and how many of them keep coming back.
 *
 * The four panels answer four separate questions, so they get four different forms rather than
 * four variants of the same bar chart. Each one falls back to its own `EmptyState`, because a
 * brand-new tenant has activity in none of these and a half-drawn axis reads as a broken page.
 */

const CHART_TOOLTIP = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--border-default)",
  borderRadius: "10px",
  color: "var(--font-primary)",
  fontSize: "0.8rem",
};

/**
 * Date-only ISO strings ("2026-03-01") parse as UTC, which renders as the previous day for anyone
 * west of Greenwich. Build the date from its parts so the bucket label matches the bucket.
 */
function parseBucket(raw: string | number): Date | null {
  const s = String(raw);
  const parts = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (parts) return new Date(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3]));
  const loose = new Date(s);
  return Number.isNaN(loose.getTime()) ? null : loose;
}

function shortBucket(raw: string | number, grain: "day" | "week" | "month"): string {
  const d = parseBucket(raw);
  if (!d) return String(raw);
  if (grain === "month") return d.toLocaleDateString(undefined, { month: "short" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function longBucket(raw: string | number, grain: "day" | "week" | "month"): string {
  const d = parseBucket(raw);
  if (!d) return String(raw);
  if (grain === "month") return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const full = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return grain === "week" ? `Week of ${full}` : full;
}

function LoadingShape() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" } }}>
        <Skeleton variant="rounded" height={412} sx={{ borderRadius: 3 }} />
        <Skeleton variant="rounded" height={412} sx={{ borderRadius: 3 }} />
      </Box>
      <Skeleton variant="rounded" height={330} sx={{ borderRadius: 3 }} />
      <Skeleton variant="rounded" height={330} sx={{ borderRadius: 3 }} />
    </Box>
  );
}

export function EngagementSection({
  data,
  loading,
}: {
  data: EngagementPayload | null;
  loading: boolean;
}) {
  const grain = data?.range.grain ?? "day";

  /**
   * One colour per activity type, keyed off the *declared* key order rather than whatever order a
   * panel happens to iterate in. "Quizzes" has to be the same colour in the area chart and in the
   * donut, and it has to stay that colour when a type drops out of the range entirely — colour
   * follows the entity, never its position in the current list.
   */
  const colorFor = useMemo(() => {
    const map = new Map<string, string>();
    (data?.mix_over_time.keys ?? []).forEach((key, i) => {
      map.set(key, SERIES_COLORS[i % SERIES_COLORS.length]);
    });
    return (label: string, fallbackIndex: number) =>
      map.get(label) ?? SERIES_COLORS[fallbackIndex % SERIES_COLORS.length];
  }, [data?.mix_over_time.keys]);

  const series = data?.mix_over_time.series ?? [];
  /**
   * A type that is flat zero across the whole range still costs a legend row and a colour while
   * saying nothing, so drop it. The colour lookup above is unaffected by the filtering.
   */
  const activeKeys = (data?.mix_over_time.keys ?? []).filter((key) =>
    series.some((row) => Number(row[key] ?? 0) > 0)
  );
  const hasMixOverTime = series.length > 0 && activeKeys.length > 0;

  const mixTotal = (data?.mix_total ?? []).filter((slice) => slice.value > 0);
  const mixGrandTotal = mixTotal.reduce((sum, slice) => sum + slice.value, 0);
  const hasMixTotal = mixTotal.length > 0 && mixGrandTotal > 0;

  const heat = data?.hour_matrix;
  const hasHeat = !!heat && heat.matrix.length > 0 && heat.max > 0;

  const bins = data?.consistency.bins ?? [];
  const hasConsistency = bins.length > 0 && bins.some((b) => b.students > 0);
  const ofDays = data?.consistency.of_days ?? data?.range.days ?? 0;

  if (loading) return <LoadingShape />;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" } }}>
        <Panel
          title="What students are working on"
          subtitle="Activity by type over the selected range"
          icon="mdi:chart-areaspline"
          accent={INSIGHT.indigo}
          action={
            data ? (
              <Chip
                label={data.range.label}
                size="small"
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  color: "var(--font-secondary)",
                  backgroundColor: "color-mix(in srgb, var(--border-default) 45%, transparent)",
                }}
              />
            ) : undefined
          }
        >
          {hasMixOverTime ? (
            <ResponsiveContainer width="100%" height={320}>
              {/*
                Stacked areas, not a line per type. The question this panel answers is how the mix
                shifts — quizzes giving way to coding, articles fading out — and stacking makes the
                share of each band readable at a glance while the outline still carries the total.
                Separate lines would put every type on its own scale-free path and force the reader
                to do the mental addition that the stack does for them.
              */}
              <AreaChart data={series} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                <XAxis
                  dataKey="bucket"
                  tickFormatter={(v) => shortBucket(v, grain)}
                  stroke="var(--border-default)"
                  tick={{ fill: "var(--font-secondary)", fontSize: 11 }}
                  tickLine={false}
                  minTickGap={18}
                />
                <YAxis
                  stroke="var(--border-default)"
                  tick={{ fill: "var(--font-secondary)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={44}
                />
                <RTooltip
                  contentStyle={CHART_TOOLTIP}
                  labelStyle={{ color: "var(--font-primary)", fontWeight: 700 }}
                  labelFormatter={(v) => longBucket(v as string, grain)}
                  formatter={(value, name) =>
                    [Number(value ?? 0).toLocaleString(), String(name ?? "")] as [string, string]
                  }
                />
                <Legend
                  iconType="square"
                  iconSize={9}
                  wrapperStyle={{ paddingTop: 10, fontSize: "0.76rem" }}
                  formatter={(value: string) => (
                    <span style={{ color: "var(--font-secondary)" }}>{value}</span>
                  )}
                />
                {activeKeys.map((key, i) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={key}
                    stackId="1"
                    stroke={colorFor(key, i)}
                    strokeWidth={1.5}
                    fill={colorFor(key, i)}
                    fillOpacity={0.72}
                    isAnimationActive={false}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon="mdi:chart-areaspline"
              title="No activity in this range"
              hint="Once students start opening lessons, quizzes and problems, the mix will build up here."
            />
          )}
        </Panel>

        <Panel
          title="Activity mix"
          subtitle="Share of everything completed in the range"
          icon="mdi:chart-donut"
          accent={INSIGHT.purple}
        >
          {hasMixTotal ? (
            <Box>
              <Box sx={{ position: "relative" }}>
                <ResponsiveContainer width="100%" height={200}>
                  {/*
                    A donut works here only because this is a single whole split a handful of ways.
                    The hole earns its keep by holding the total, which is the number people ask for
                    first; the exact per-slice figures live in the legend below, where they can be
                    read rather than estimated from arc length.
                  */}
                  <PieChart>
                    <Pie
                      data={mixTotal}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      stroke="var(--card-bg)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {mixTotal.map((slice, i) => (
                        <Cell key={slice.label} fill={colorFor(slice.label, i)} />
                      ))}
                    </Pie>
                    <RTooltip
                      contentStyle={CHART_TOOLTIP}
                      formatter={(value, name) =>
                        [Number(value ?? 0).toLocaleString(), String(name ?? "")] as [string, string]
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>

                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      sx={{
                        fontSize: "1.35rem",
                        fontWeight: 800,
                        color: "var(--font-primary)",
                        lineHeight: 1.1,
                      }}
                    >
                      {mixGrandTotal.toLocaleString()}
                    </Typography>
                    <Typography sx={{ fontSize: "0.66rem", color: "var(--font-secondary)" }}>
                      activities
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mt: 1.5,
                  mb: 0.75,
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--font-secondary)",
                }}
              >
                <span>Breakdown</span>
                <DefinitionMark text="Share of every activity completed in this range, by type. Percentages are of the range total, not of the tenant's students, so a type used heavily by a handful of people can still lead." />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.1 }}>
                {mixTotal.map((slice, i) => (
                  <Tooltip
                    key={slice.label}
                    arrow
                    enterTouchDelay={0}
                    title={`${slice.value.toLocaleString()} of ${mixGrandTotal.toLocaleString()} activities`}
                  >
                    <Box sx={{ cursor: "default" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: 0.5,
                            backgroundColor: colorFor(slice.label, i),
                            flexShrink: 0,
                          }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "var(--font-primary)",
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {slice.label}
                        </Typography>
                        <Typography
                          sx={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--font-primary)" }}
                        >
                          {slice.value.toLocaleString()}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.76rem",
                            color: "var(--font-secondary)",
                            width: 42,
                            textAlign: "right",
                          }}
                        >
                          {slice.pct}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(100, Math.max(0, slice.pct))}
                        sx={{
                          mt: 0.5,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor:
                            "color-mix(in srgb, var(--border-default) 50%, transparent)",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 2,
                            backgroundColor: colorFor(slice.label, i),
                          },
                        }}
                      />
                    </Box>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          ) : (
            <EmptyState
              icon="mdi:chart-donut"
              title="Nothing completed yet"
              hint="The mix appears as soon as there is at least one completed activity in the range."
            />
          )}
        </Panel>
      </Box>

      <Panel
        title="When students study"
        subtitle="The chart for deciding when to schedule live sessions"
        icon="mdi:clock-outline"
        accent={INSIGHT.teal}
      >
        {hasHeat && heat ? (
          <Box>
            {heat.peak && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  border: `1px solid color-mix(in srgb, ${INSIGHT.teal} 35%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${INSIGHT.teal} 10%, transparent)`,
                }}
              >
                <Box sx={{ color: INSIGHT.teal, display: "flex" }}>
                  <IconWrapper icon="mdi:star-four-points" size={18} />
                </Box>
                <Typography sx={{ fontSize: "0.85rem", color: "var(--font-primary)" }}>
                  <strong>Busiest:</strong> {heat.peak.label} ({heat.peak.count.toLocaleString()}{" "}
                  activities)
                </Typography>
              </Box>
            )}
            <HourHeatmap matrix={heat.matrix} max={heat.max} timezone={heat.timezone} />
          </Box>
        ) : (
          <EmptyState
            icon="mdi:clock-outline"
            title="No study times recorded yet"
            hint="This grid fills in once activity is logged, and then it will show which hours are worth booking a session in."
          />
        )}
      </Panel>

      <Panel
        title="How consistently students show up"
        subtitle="Students grouped by how many days they were active"
        icon="mdi:calendar-check"
        accent={INSIGHT.green}
      >
        {hasConsistency && data ? (
          <Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                flexWrap: "wrap",
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: "0.95rem", color: "var(--font-primary)" }}>
                Median <strong>{data.consistency.median_active_days}</strong> active days out of{" "}
                <strong>{ofDays}</strong> across{" "}
                <strong>{data.consistency.students.toLocaleString()}</strong> students
              </Typography>
              <DefinitionMark text="Median, not mean, because the mean hides the shape. The same average comes out of 'everyone shows up twice a week' and 'a fifth of the tenant does everything and the rest have left' — the median plus the bars below tell those two apart." />
            </Box>

            <ResponsiveContainer width="100%" height={260}>
              {/*
                Bars over a distribution curve: the bins are already the buckets leadership talks in
                ("0 days", "1-2 days"), and a bar per bin can be read off the axis exactly, which a
                smoothed curve invites people to misread between the labelled points.
              */}
              <BarChart data={bins} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="var(--border-default)"
                  tick={{ fill: "var(--font-secondary)", fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  stroke="var(--border-default)"
                  tick={{ fill: "var(--font-secondary)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={44}
                />
                <RTooltip
                  cursor={{ fill: "color-mix(in srgb, var(--border-default) 35%, transparent)" }}
                  contentStyle={CHART_TOOLTIP}
                  labelStyle={{ color: "var(--font-primary)", fontWeight: 700 }}
                  formatter={(value) =>
                    [Number(value ?? 0).toLocaleString(), "Students"] as [string, string]
                  }
                />
                <Bar dataKey="students" name="Students" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                  {/*
                    The bins are ordered, not categorical, so one hue that deepens left to right
                    carries that order. Eight separate hues would imply eight unrelated groups.
                  */}
                  {bins.map((bin, i) => (
                    <Cell
                      key={bin.label}
                      fill={`color-mix(in srgb, ${INSIGHT.green} ${Math.round(
                        30 + (bins.length > 1 ? (i / (bins.length - 1)) * 65 : 65)
                      )}%, transparent)`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <EmptyState
            icon="mdi:calendar-check"
            title="Not enough attendance to plot"
            hint="This bar chart needs at least one student with a day of activity in the range."
          />
        )}
      </Panel>
    </Box>
  );
}
