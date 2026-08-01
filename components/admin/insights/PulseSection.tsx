"use client";

import { Box, Chip, Skeleton, Tooltip, Typography } from "@mui/material";
import { IconWrapper } from "@/components/common/IconWrapper";
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
import type { PulsePayload, AtRiskRow } from "@/lib/services/admin/admin-insights.service";
import {
  Panel,
  EmptyState,
  INSIGHT,
} from "./primitives";

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
const EM = "—";

/** A small tinted stat under the trend chart. Fills the column and answers what the curve asks. */
function TrendStat({
  icon,
  accent,
  label,
  value,
  hint,
}: {
  icon: string;
  accent: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Box
      sx={{
        borderRadius: 2.5,
        px: 1.5,
        py: 1.25,
        minWidth: 0,
        border: `1px solid color-mix(in srgb, ${accent} 22%, transparent)`,
        background: `linear-gradient(150deg, color-mix(in srgb, ${accent} 10%, transparent) 0%, transparent 70%)`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, color: accent, mb: 0.35 }}>
        <IconWrapper icon={icon} size={14} />
        <Typography
          sx={{
            fontSize: "0.62rem",
            fontWeight: 800,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
          }}
        >
          {label}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--font-primary)", lineHeight: 1.2 }}>
        {value}
      </Typography>
      {hint && (
        <Typography sx={{ fontSize: "0.68rem", color: "var(--font-secondary)" }}>{hint}</Typography>
      )}
    </Box>
  );
}

/**
 * The activity trend, on its own.
 *
 * Split out of the old composite because the dashboard deck places the four KPI tiles in the
 * hero, the trend under "who is here", and the at-risk list under "who needs help". Mode flags
 * on one component would have been three components wearing a trench coat.
 */
export function PulseTrendPanel({ data, loading }: { data: PulsePayload | null; loading: boolean }) {
  if (loading) {
    return (
      <Skeleton
        variant="rounded"
        height={CHART_HEIGHT + 90}
        sx={{ borderRadius: 3, backgroundColor: "color-mix(in srgb, var(--border-default) 45%, transparent)" }}
      />
    );
  }
  if (!data) {
    return (
      <EmptyState
        icon="mdi:chart-box-outline"
        title="No activity yet"
        hint="Nothing was recorded for the selected range. Pick a wider range, or check back once students start working."
      />
    );
  }
  const { trend, range } = data;

  // The chart alone left a tall column half empty next to the leaderboard. These three read off
  // the same series, so they cost nothing and answer the questions the curve provokes: when was
  // the best day, when was the worst, and how much happened overall.
  const busiest = trend.reduce(
    (best, p) => (p.items_completed > (best?.items_completed ?? -1) ? p : best),
    null as (typeof trend)[number] | null
  );
  const quietest = trend
    .filter((p) => p.items_completed > 0)
    .reduce(
      (worst, p) => (p.items_completed < (worst?.items_completed ?? Infinity) ? p : worst),
      null as (typeof trend)[number] | null
    );
  const totalDone = trend.reduce((n, p) => n + p.items_completed, 0);
  const peakStudents = trend.reduce((n, p) => Math.max(n, p.active_students), 0);

  return (
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
                name="Activities completed"
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
                name="Students active"
                stroke={INSIGHT.green}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          <Typography sx={{ fontSize: "0.74rem", color: "var(--font-secondary)", mt: 1 }}>
            These two count different things, so each has its own scale. The purple area is how
            much work was finished; the green line is how many students showed up. Where they
            cross means nothing.
          </Typography>

          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
              gap: 1.25,
            }}
          >
            <TrendStat
              icon="mdi:trophy-outline"
              accent={INSIGHT.amber}
              label="Busiest day"
              value={busiest ? formatBucket(busiest.bucket, range.grain) : EM}
              hint={busiest ? `${busiest.items_completed.toLocaleString()} activities` : undefined}
            />
            <TrendStat
              icon="mdi:weather-night"
              accent={INSIGHT.blue}
              label="Quietest day"
              value={quietest ? formatBucket(quietest.bucket, range.grain) : EM}
              hint={
                quietest
                  ? `${quietest.items_completed.toLocaleString()} activities`
                  : "no activity yet"
              }
            />
            <TrendStat
              icon="mdi:check-all"
              accent={INSIGHT.indigo}
              label="Total finished"
              value={totalDone.toLocaleString()}
              hint={`over ${range.label}`}
            />
            <TrendStat
              icon="mdi:account-multiple-outline"
              accent={INSIGHT.green}
              label="Best turnout"
              value={peakStudents.toLocaleString()}
              hint="students in one day"
            />
          </Box>
        </>
      )}
    </Panel>
  );
}

/** The named list of students who need help. The one panel here that converts into action. */
export function AtRiskPanel({
  atRisk,
  loading,
}: {
  atRisk: { results: AtRiskRow[]; rules: Record<string, string> } | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <Skeleton
        variant="rounded"
        height={280}
        sx={{ borderRadius: 3, backgroundColor: "color-mix(in srgb, var(--border-default) 45%, transparent)" }}
      />
    );
  }
  const riskRows = atRisk?.results ?? [];
  const ruleLegend = Object.entries(atRisk?.rules ?? {});
  return (
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
  );
}
