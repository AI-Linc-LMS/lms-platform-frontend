"use client";

import { Box, Chip, Skeleton, Tooltip, Typography } from "@mui/material";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { PulsePayload, AtRiskRow } from "@/lib/services/admin/admin-insights.service";
import {
  Panel,
  MetricTile,
  DefinitionMark,
  EmptyState,
  INSIGHT,
} from "./primitives";

interface PulseSectionProps {
  data: PulsePayload | null;
  atRisk: { results: AtRiskRow[]; rules: Record<string, string> } | null;
  loading: boolean;
}

/**
 * Bucket labels arrive as ISO dates ("2026-03-12").
 *
 * They are parsed field-by-field rather than handed to `new Date(str)`: the Date constructor
 * reads a bare "YYYY-MM-DD" as UTC midnight, so every admin west of UTC would see each bucket
 * labelled with the previous day. The chart would silently be off by one for half the world.
 */
function parseBucket(bucket: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(bucket);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const loose = new Date(bucket);
  return Number.isNaN(loose.getTime()) ? null : loose;
}

function formatBucket(bucket: string, grain: PulsePayload["range"]["grain"]): string {
  const d = parseBucket(bucket);
  if (!d) return bucket;
  // Month buckets only need the month: "1 Mar" invites the reader to think the bar covers a day.
  if (grain === "month") return d.toLocaleDateString("en-GB", { month: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatBucketLong(bucket: string, grain: PulsePayload["range"]["grain"]): string {
  const d = parseBucket(bucket);
  if (!d) return bucket;
  if (grain === "month") return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const day = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  // Week buckets are stamped with the week's first day, which reads as a single date unless said.
  return grain === "week" ? `Week of ${day}` : day;
}

function formatTimestamp(value: string): string | null {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** `gone_quiet` -> `Gone quiet`. The API owns the rule vocabulary; this only re-cases it. */
function prettifyRule(rule: string): string {
  const words = rule.replace(/[_-]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : rule;
}

/** 1 = watch, 2 = concerning, 3+ = urgent. Kept to three steps so the colour still means something. */
function severityColor(severity: number): string {
  if (severity >= 3) return INSIGHT.red;
  if (severity === 2) return INSIGHT.pink;
  return INSIGHT.amber;
}

const CHART_HEIGHT = 300;

export function PulseSection({ data, atRisk, loading }: PulseSectionProps) {
  if (loading) {
    // Skeletons in the real layout shape, not a spinner: the page keeps its geometry while it
    // loads, so nothing jumps once the numbers land.
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={148}
              sx={{ borderRadius: 3, backgroundColor: "color-mix(in srgb, var(--border-default) 45%, transparent)" }}
            />
          ))}
        </Box>
        <Skeleton
          variant="rounded"
          height={CHART_HEIGHT + 90}
          sx={{ borderRadius: 3, backgroundColor: "color-mix(in srgb, var(--border-default) 45%, transparent)" }}
        />
        <Skeleton
          variant="rounded"
          height={280}
          sx={{ borderRadius: 3, backgroundColor: "color-mix(in srgb, var(--border-default) 45%, transparent)" }}
        />
      </Box>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon="mdi:chart-box-outline"
        title="No pulse data yet"
        hint="This tenant has no recorded activity for the selected range. Pick a wider range, or check back once students start working."
      />
    );
  }

  const { tiles, trend, range, freshness } = data;
  const riskRows = atRisk?.results ?? [];
  const ruleLegend = Object.entries(atRisk?.rules ?? {});
  const perActive = tiles.items_completed.per_active_student;
  // Ticket age is measured at a different moment from the rest of the range, so it gets its own
  // stamp rather than being covered by the general freshness note.
  const ticketsAsOf = tiles.stale_tickets.as_of ? formatTimestamp(tiles.stale_tickets.as_of) : null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        <MetricTile
          label="Active students"
          value={tiles.active_students.value}
          definition={tiles.active_students.definition}
          delta={{ diff: tiles.active_students.diff, pct: tiles.active_students.pct }}
          denominator={tiles.active_students.denominator}
          accent={INSIGHT.indigo}
          icon="mdi:account-group-outline"
        />
        <MetricTile
          label="Items completed"
          value={tiles.items_completed.value}
          definition={tiles.items_completed.definition}
          delta={{ diff: tiles.items_completed.diff, pct: tiles.items_completed.pct }}
          accent={INSIGHT.green}
          icon="mdi:check-circle-outline"
        />
        <MetricTile
          label="Median study time"
          value={tiles.median_minutes.value}
          definition={tiles.median_minutes.definition}
          suffix="min"
          accent={INSIGHT.blue}
          icon="mdi:timer-outline"
        />
        <MetricTile
          label="Stale tickets"
          value={tiles.stale_tickets.value}
          definition={tiles.stale_tickets.definition}
          accent={INSIGHT.amber}
          icon="mdi:ticket-confirmation-outline"
        />
      </Box>

      {perActive !== undefined && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: -1, px: 0.5 }}>
          <Typography sx={{ fontSize: "0.8rem", color: "var(--font-secondary)" }}>
            That is {perActive.toLocaleString()} items per active student over this range.
          </Typography>
          {/* A ratio of two tiles above it, so it gets its own ⓘ — the denominator is the active
              cohort, not everyone enrolled, and the two read very differently in a meeting. */}
          <DefinitionMark text="Items completed divided by active students in the same range. The denominator counts only students who were active, so it does not fall when inactive students are added to the tenant." />
        </Box>
      )}

      <Panel
        title="Activity trend"
        subtitle={range.label}
        icon="mdi:chart-timeline-variant"
        accent={INSIGHT.indigo}
      >
        {trend.length === 0 ? (
          <EmptyState
            icon="mdi:chart-line"
            title="Nothing to plot for this range"
            hint="No completions or active sessions were recorded in the selected period."
          />
        ) : (
          <>
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              {/* Two Y axes on purpose. The series are different units — a headcount of people and
                  a count of activities — and a class of 40 students against 3,000 completions on a
                  shared scale pins the student line flat to the floor, which reads as "nobody is
                  active" when the opposite is true. Each axis is tinted to its series and both are
                  in the legend so it stays clear which line reads against which scale. */}
              <ComposedChart data={trend} margin={{ top: 8, right: 8, bottom: 4, left: -8 }}>
                <defs>
                  <linearGradient id="pulseItemsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={INSIGHT.indigo} stopOpacity={0.36} />
                    <stop offset="95%" stopColor={INSIGHT.indigo} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="color-mix(in srgb, var(--border-default) 70%, transparent)"
                />
                <XAxis
                  dataKey="bucket"
                  tickFormatter={(v: string) => formatBucket(v, range.grain)}
                  tick={{ fontSize: 11, fill: "var(--font-secondary)" }}
                  tickLine={false}
                  axisLine={{ stroke: "color-mix(in srgb, var(--border-default) 70%, transparent)" }}
                  minTickGap={16}
                />
                <YAxis
                  yAxisId="items"
                  tick={{ fontSize: 11, fill: INSIGHT.indigo }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="students"
                  orientation="right"
                  tick={{ fontSize: 11, fill: INSIGHT.green }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                  allowDecimals={false}
                />
                <RTooltip
                  cursor={{ stroke: "color-mix(in srgb, var(--border-default) 90%, transparent)" }}
                  labelFormatter={(v) => formatBucketLong(String(v), range.grain)}
                  formatter={(value, name) =>
                    [
                      typeof value === "number" ? value.toLocaleString() : String(value ?? ""),
                      String(name ?? ""),
                    ] as [string, string]
                  }
                  contentStyle={{
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 10,
                    color: "var(--font-primary)",
                    fontSize: "0.8rem",
                  }}
                  labelStyle={{ color: "var(--font-secondary)", fontWeight: 700 }}
                  itemStyle={{ color: "var(--font-primary)" }}
                />
                <Legend
                  verticalAlign="top"
                  height={28}
                  iconType="plainline"
                  wrapperStyle={{ fontSize: "0.78rem", color: "var(--font-secondary)" }}
                />
                {/* Completions are a volume, so they get the filled area — the eye reads "how much
                    work happened" from mass. Headcount is a level, not a volume, so it stays a
                    line; filling it would imply the two could be summed. */}
                <Area
                  yAxisId="items"
                  type="monotone"
                  dataKey="items_completed"
                  name="Items completed (left)"
                  stroke={INSIGHT.indigo}
                  strokeWidth={2}
                  fill="url(#pulseItemsFill)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
                <Line
                  yAxisId="students"
                  type="monotone"
                  dataKey="active_students"
                  name="Active students (right)"
                  stroke={INSIGHT.green}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>

            <Typography sx={{ fontSize: "0.74rem", color: "var(--font-secondary)", mt: 1 }}>
              Left axis counts completions, right axis counts students. The two scales are
              independent — where the lines cross means nothing.
            </Typography>
          </>
        )}
      </Panel>

      <Panel
        title="Needs attention"
        subtitle={
          riskRows.length > 0
            ? `${riskRows.length} student${riskRows.length === 1 ? "" : "s"} matched a risk rule`
            : undefined
        }
        icon="mdi:account-alert-outline"
        accent={INSIGHT.pink}
      >
        {!atRisk ? (
          <EmptyState
            icon="mdi:radar"
            title="Risk list unavailable"
            hint="The at-risk check did not return. Reload the page to try again."
          />
        ) : riskRows.length === 0 ? (
          <EmptyState
            icon="mdi:emoticon-happy-outline"
            title="Nobody is falling behind right now"
            hint="No student matched a risk rule in this range. This list fills itself as soon as one does."
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {riskRows.map((row, i) => (
              <Box
                key={row.student_id}
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1.5,
                  py: 1.5,
                  borderTop:
                    i === 0
                      ? "none"
                      : "1px solid color-mix(in srgb, var(--border-default) 60%, transparent)",
                }}
              >
                <Tooltip
                  arrow
                  enterTouchDelay={0}
                  title={`Severity ${row.severity} — ${row.rules.length} rule${
                    row.rules.length === 1 ? "" : "s"
                  } matched`}
                >
                  <Box
                    sx={{
                      mt: 0.75,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      flexShrink: 0,
                      backgroundColor: severityColor(row.severity),
                      boxShadow: `0 0 0 3px color-mix(in srgb, ${severityColor(
                        row.severity
                      )} 18%, transparent)`,
                      cursor: "help",
                    }}
                  />
                </Tooltip>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1,
                      flexWrap: "wrap",
                      rowGap: 0.25,
                    }}
                  >
                    <Typography
                      sx={{ fontWeight: 700, color: "var(--font-primary)", fontSize: "0.92rem" }}
                    >
                      {row.name || "Unnamed student"}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.78rem",
                        color: "var(--font-secondary)",
                        wordBreak: "break-all",
                      }}
                    >
                      {row.email}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{ fontSize: "0.82rem", color: "var(--font-secondary)", mt: 0.25 }}
                  >
                    {row.reason}
                  </Typography>

                  {row.rules.length > 0 && (
                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 0.85 }}>
                      {row.rules.map((rule) => (
                        <Chip
                          key={rule}
                          size="small"
                          label={prettifyRule(rule)}
                          // The rule text sits in the legend below rather than in a per-chip
                          // tooltip: on a touch screen a tooltip on a chip is unreachable.
                          sx={{
                            height: 22,
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "var(--font-primary)",
                            backgroundColor:
                              "color-mix(in srgb, var(--border-default) 45%, transparent)",
                            border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            ))}

            {ruleLegend.length > 0 && (
              <Box
                sx={{
                  mt: 2,
                  pt: 1.75,
                  borderTop: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: "var(--font-secondary)",
                    mb: 1,
                  }}
                >
                  What each rule means
                </Typography>
                {/* Shipped next to the list, not hidden behind a help link. An admin is about to
                    email these students; they need to know what triggered the flag before they do. */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  {ruleLegend.map(([rule, description]) => (
                    <Box
                      key={rule}
                      sx={{ display: "flex", alignItems: "flex-start", gap: 1, flexWrap: "wrap" }}
                    >
                      <Chip
                        size="small"
                        label={prettifyRule(rule)}
                        sx={{
                          height: 20,
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          color: "var(--font-primary)",
                          backgroundColor:
                            "color-mix(in srgb, var(--border-default) 45%, transparent)",
                          border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                        }}
                      />
                      <Typography
                        sx={{ fontSize: "0.78rem", color: "var(--font-secondary)", flex: 1, minWidth: 200 }}
                      >
                        {description}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Panel>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          color: "var(--font-secondary)",
          fontSize: "0.76rem",
          px: 0.5,
          flexWrap: "wrap",
        }}
      >
        <IconWrapper icon="mdi:clock-outline" size={14} />
        <Typography sx={{ fontSize: "inherit", color: "inherit" }}>
          {freshness.note}
          {ticketsAsOf ? ` Ticket ages measured at ${ticketsAsOf}.` : ""}
        </Typography>
      </Box>
    </Box>
  );
}
