"use client";

import { useEffect, useState } from "react";
import { Box, Chip, LinearProgress, Skeleton, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { PeoplePayload } from "@/lib/services/admin/admin-insights.service";
import { DefinitionMark, EmptyState, INSIGHT, Panel, SERIES_COLORS } from "./primitives";

/**
 * People: cohorts, support load, instructor feedback.
 *
 * The three panels answer three different questions and deliberately use three different
 * shapes. Cohorts are a roster — a list, because an admin reads them by name, not by rank.
 * Support is a rate plus a breakdown. Instructor feedback is a small table of scores that
 * only means anything once enough people have answered.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EM_DASH = "—";

/**
 * How many cohorts show before "view all".
 *
 * A tenant with thirty cohorts turned this panel into the whole page, pushing support load and
 * instructor feedback below the fold for a list nobody reads past the top of. The server orders
 * by size, so the five shown are the five that matter.
 */
const COHORT_PREVIEW = 5;

/**
 * Cohort dates arrive as plain calendar dates ("2026-03-12"). `new Date(iso)` parses those as
 * UTC midnight, so any viewer behind UTC sees the day before — a cohort that starts on the 1st
 * renders as starting the previous month. Read the parts off the string instead.
 */
function formatDay(iso: string): string {
  const [, month, day] = iso.slice(0, 10).split("-").map(Number);
  if (!month || !day || month < 1 || month > 12) return iso.slice(0, 10);
  return `${day} ${MONTHS[month - 1]}`;
}

function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start && !end) return null;
  if (start && end) return `${formatDay(start)} - ${formatDay(end)}`;
  return start ? `From ${formatDay(start)}` : `Until ${formatDay(end as string)}`;
}

/**
 * Hours read badly past a couple of days: "97.4h" makes a reader do division before they can
 * react to it. Past two days the useful precision is "how many days", not the decimal.
 */
function formatHours(hours: number): string {
  if (hours > 48) {
    const days = Math.round(hours / 24);
    return `${days} days`;
  }
  return `${hours.toFixed(1)}h`;
}

const STATUS_TONE: Record<string, string> = {
  active: INSIGHT.green,
  running: INSIGHT.green,
  ongoing: INSIGHT.green,
  upcoming: INSIGHT.blue,
  scheduled: INSIGHT.blue,
  planned: INSIGHT.blue,
  draft: INSIGHT.amber,
  paused: INSIGHT.amber,
  completed: INSIGHT.indigo,
  ended: INSIGHT.indigo,
  archived: INSIGHT.red,
  cancelled: INSIGHT.red,
};

/**
 * Recharts writes axis colours as SVG presentation attributes, where `var(--font-secondary)`
 * does not resolve — the ticks would quietly fall back to black and vanish in dark mode. Read
 * the same theme tokens off the document and hand recharts the resolved values.
 */
function useChartInk() {
  const [ink, setInk] = useState({ text: "#7a7a7a", grid: "#d9d9d9" });

  useEffect(() => {
    const read = () => {
      const cs = getComputedStyle(document.documentElement);
      setInk({
        text: cs.getPropertyValue("--font-secondary").trim() || "#7a7a7a",
        grid: cs.getPropertyValue("--border-default").trim() || "#d9d9d9",
      });
    };
    read();
    // Theme switches flip an attribute on <html>; re-read so the axes follow the surface.
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });
    return () => observer.disconnect();
  }, []);

  return ink;
}

const tooltipStyles = {
  contentStyle: {
    backgroundColor: "var(--card-bg)",
    border: "1px solid var(--border-default)",
    borderRadius: 10,
    fontSize: "0.8rem",
    color: "var(--font-primary)",
  },
  labelStyle: { color: "var(--font-secondary)", fontWeight: 700 },
  itemStyle: { color: "var(--font-primary)" },
};

/* ------------------------------------------------------------------ small parts */

function StatBlock({
  label,
  value,
  hint,
  definition,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  definition?: string;
  accent: string;
  icon: string;
}) {
  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
        p: 1.75,
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        minWidth: 0,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
        <Box sx={{ color: accent, display: "grid", placeItems: "center", flexShrink: 0 }}>
          <IconWrapper icon={icon} size={15} />
        </Box>
        <Typography
          sx={{
            fontSize: "0.66rem",
            fontWeight: 800,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
            minWidth: 0,
          }}
        >
          {label}
        </Typography>
        {definition ? <DefinitionMark text={definition} /> : null}
      </Box>
      <Typography
        sx={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--font-primary)", lineHeight: 1.15 }}
      >
        {value}
      </Typography>
      {hint && (
        <Typography sx={{ fontSize: "0.7rem", color: "var(--font-secondary)", lineHeight: 1.3 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

/**
 * A single 0-5 rating. `null` means nobody answered that question, which is not the same as a
 * score of zero — rendering it as 0 would drag a good instructor's row down for a question the
 * survey never asked. Show a dash.
 */
function RatingCell({ label, value }: { label: string; value: number | null; }) {
  const missing = value === null;
  return (
    <Box sx={{ minWidth: 62 }}>
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
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.3 }}>
        <Typography
          sx={{
            fontSize: "0.98rem",
            fontWeight: 800,
            color: missing ? "var(--font-secondary)" : "var(--font-primary)",
          }}
        >
          {missing ? EM_DASH : (value as number).toFixed(1)}
        </Typography>
        {!missing && (
          <Typography sx={{ fontSize: "0.68rem", color: "var(--font-secondary)" }}>/5</Typography>
        )}
      </Box>
    </Box>
  );
}

function PanelSkeleton({ rows }: { rows: number }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} variant="rounded" height={i === 0 ? 62 : 52} sx={{ borderRadius: 2.5 }} />
      ))}
    </Box>
  );
}

/* ------------------------------------------------------------------ section */

export function PeopleSection({ data, loading }: { data: PeoplePayload | null; loading: boolean }) {
  const ink = useChartInk();
  const [allCohorts, setAllCohorts] = useState(false);

  const gridSx = {
    display: "grid",
    gap: { xs: 2, md: 2.5 },
    gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
    alignItems: "start",
  } as const;

  if (loading || !data) {
    return (
      <Box sx={gridSx}>
        <Box sx={{ gridColumn: { lg: "1 / -1" } }}>
          <Panel title="Cohorts" icon="mdi:account-group-outline" accent={INSIGHT.indigo}>
            <PanelSkeleton rows={4} />
          </Panel>
        </Box>
        <Panel title="Support load" icon="mdi:lifebuoy" accent={INSIGHT.amber}>
          <PanelSkeleton rows={3} />
        </Panel>
        <Panel title="Instructor feedback" icon="mdi:comment-quote-outline" accent={INSIGHT.teal}>
          <PanelSkeleton rows={3} />
        </Panel>
      </Box>
    );
  }

  const { cohorts, tickets, instructors } = data;
  const visibleCohorts = allCohorts ? cohorts : cohorts.slice(0, COHORT_PREVIEW);
  const rangeLabel = data.range.label;

  const medianDef = tickets.definitions.median_resolution_hours;
  const openNowDef = tickets.definitions.open_now;

  const categories = tickets.by_category;
  // Horizontal bars: category names are written by admins and run long ("Course content /
  // video playback"). On a vertical layout those labels rotate or clip; on this layout they get
  // a full-width gutter and stay readable, and the comparison is still a length comparison.
  const categoryChartHeight = Math.max(180, categories.length * 40 + 32);

  return (
    <Box sx={gridSx}>
      {/* ------------------------------------------------------------ cohorts */}
      <Box sx={{ gridColumn: { lg: "1 / -1" } }}>
        <Panel
          title="Cohorts"
          // Membership is a stock. Appending the range would suggest these counts are filtered
          // by it, and an admin comparing them against a range-filtered panel would be misled.
          subtitle={
            cohorts.length > COHORT_PREVIEW
              ? `Largest ${COHORT_PREVIEW} of ${cohorts.length}, as of today`
              : "Membership as of today"
          }
          icon="mdi:account-group-outline"
          accent={INSIGHT.indigo}
        >
          {cohorts.length === 0 ? (
            <EmptyState
              icon="mdi:account-group-outline"
              title="No cohorts yet"
              hint="Cohorts group students for scheduling and reporting. Create one and its membership and fill will appear here."
            />
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {/* Server already ordered these. Re-sorting on the client would silently disagree
                  with the ordering the API documents. */}
              {visibleCohorts.map((c) => {
                const dates = formatDateRange(c.start_date, c.end_date);
                const tone = STATUS_TONE[c.status?.toLowerCase()] ?? INSIGHT.indigo;
                const over = c.fill_pct !== null && c.fill_pct > 100;
                return (
                  <Box
                    key={c.cohort_id}
                    sx={{
                      borderRadius: 2.5,
                      border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                      p: { xs: 1.5, md: 1.75 },
                      display: "flex",
                      flexDirection: { xs: "column", md: "row" },
                      alignItems: { xs: "stretch", md: "center" },
                      gap: { xs: 1, md: 2 },
                    }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.25 }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 800,
                            color: "var(--font-primary)",
                            fontSize: "0.95rem",
                            minWidth: 0,
                          }}
                        >
                          {c.name}
                        </Typography>
                        <Chip
                          label={c.status}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.66rem",
                            fontWeight: 800,
                            textTransform: "capitalize",
                            color: tone,
                            backgroundColor: `color-mix(in srgb, ${tone} 14%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${tone} 30%, transparent)`,
                          }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.25,
                          flexWrap: "wrap",
                          fontSize: "0.78rem",
                          color: "var(--font-secondary)",
                        }}
                      >
                        {/* Both dates null means an open-ended cohort; printing "— - —" would
                            read like missing data rather than a deliberate absence. */}
                        {dates && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                            <IconWrapper icon="mdi:calendar-blank-outline" size={14} />
                            <span>{dates}</span>
                          </Box>
                        )}
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                          <IconWrapper icon="mdi:account-check-outline" size={14} />
                          <span>
                            {c.active.toLocaleString()} of {c.members.toLocaleString()} still active
                          </span>
                        </Box>
                        {c.completed > 0 && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                            <IconWrapper icon="mdi:flag-checkered" size={14} />
                            <span>{c.completed.toLocaleString()} completed</span>
                          </Box>
                        )}
                      </Box>
                    </Box>

                    {/* fill_pct is null when the cohort has no capacity set. A bar at 0% would
                        claim the cohort is empty; leaving the slot blank says "not measured". */}
                    {c.fill_pct !== null && (
                      <Box sx={{ width: { xs: "100%", md: 220 }, flexShrink: 0 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.72rem",
                            color: "var(--font-secondary)",
                            mb: 0.5,
                          }}
                        >
                          <span>
                            {c.fill_pct}% of {c.capacity?.toLocaleString() ?? EM_DASH}
                          </span>
                          {over && (
                            <Typography
                              component="span"
                              sx={{ fontSize: "0.72rem", fontWeight: 800, color: INSIGHT.red }}
                            >
                              over capacity
                            </Typography>
                          )}
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          // Clamp the bar, not the label: MUI throws the track away past 100 and
                          // the real number still needs to be visible above it.
                          value={Math.min(100, Math.max(0, c.fill_pct))}
                          sx={{
                            height: 7,
                            borderRadius: 99,
                            backgroundColor:
                              "color-mix(in srgb, var(--border-default) 60%, transparent)",
                            "& .MuiLinearProgress-bar": {
                              borderRadius: 99,
                              backgroundColor: over ? INSIGHT.red : INSIGHT.indigo,
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                );
              })}
              {cohorts.length > COHORT_PREVIEW && (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setAllCohorts((v) => !v)}
                  sx={{
                    mt: 0.5,
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.5,
                    px: 1.5,
                    py: 0.75,
                    borderRadius: 999,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontWeight: 700,
                    fontSize: "0.78rem",
                    color: INSIGHT.indigo,
                    border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
                    backgroundColor: "transparent",
                    "&:hover": { backgroundColor: "color-mix(in srgb, var(--border-default) 28%, transparent)" },
                  }}
                >
                  <IconWrapper icon={allCohorts ? "mdi:chevron-up" : "mdi:chevron-down"} size={15} />
                  {allCohorts
                    ? "Show the largest 5"
                    : `View all ${cohorts.length} cohorts`}
                </Box>
              )}
            </Box>
          )}
        </Panel>
      </Box>

      {/* ------------------------------------------------------ support load */}
      <Panel
        title="Support load"
        subtitle={`Tickets in ${rangeLabel.toLowerCase()}`}
        icon="mdi:lifebuoy"
        accent={INSIGHT.amber}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, minmax(0,1fr))", sm: "repeat(4, minmax(0,1fr))" },
            gap: 1.25,
            mb: 2.5,
          }}
        >
          <StatBlock
            label="Opened"
            value={tickets.opened.toLocaleString()}
            accent={INSIGHT.blue}
            icon="mdi:ticket-outline"
          />
          <StatBlock
            label="Resolved"
            value={tickets.resolved.toLocaleString()}
            accent={INSIGHT.green}
            icon="mdi:ticket-confirmation-outline"
          />
          <StatBlock
            label="Open now"
            value={tickets.open_now.toLocaleString()}
            definition={openNowDef}
            accent={INSIGHT.amber}
            icon="mdi:inbox-arrow-down-outline"
          />
          {/* A null median means nothing closed in this window. Showing 0 would read as
              "we close tickets instantly" — the exact opposite of the truth. */}
          <StatBlock
            label="Median time to close"
            value={
              tickets.median_resolution_hours === null
                ? EM_DASH
                : formatHours(tickets.median_resolution_hours)
            }
            hint={
              tickets.median_resolution_hours === null
                ? "No tickets were closed in this range"
                : undefined
            }
            definition={medianDef}
            accent={INSIGHT.purple}
            icon="mdi:timer-outline"
          />
        </Box>

        <Typography
          sx={{
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "var(--font-secondary)",
            mb: 1,
          }}
        >
          What people are writing in about
        </Typography>

        {categories.length === 0 ? (
          <EmptyState
            icon="mdi:chart-bar"
            title="No tickets in this range"
            hint="Once students raise support tickets, the categories they pick will break down here."
          />
        ) : (
          <ResponsiveContainer width="100%" height={categoryChartHeight}>
            <BarChart
              data={categories}
              layout="vertical"
              margin={{ top: 4, right: 20, bottom: 4, left: 4 }}
            >
              {/* Only vertical gridlines: on a horizontal bar chart the value axis is the x
                  axis, so horizontal rules would sit between bars and measure nothing. */}
              <CartesianGrid horizontal={false} stroke={ink.grid} strokeDasharray="3 3" />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: ink.text, fontSize: 11 }}
                stroke={ink.grid}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={140}
                tick={{ fill: ink.text, fontSize: 11 }}
                stroke={ink.grid}
                tickLine={false}
                axisLine={false}
              />
              <RTooltip
                {...tooltipStyles}
                cursor={{ fill: `color-mix(in srgb, ${INSIGHT.indigo} 8%, transparent)` }}
                formatter={(value) => Number(value).toLocaleString()}
              />
              <Bar dataKey="value" name="Tickets" radius={[0, 6, 6, 0]} barSize={16}>
                {categories.map((c, i) => (
                  <Cell key={c.label} fill={SERIES_COLORS[i % SERIES_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>

      {/* ----------------------------------------------- instructor feedback */}
      <Panel
        title="Instructor feedback"
        subtitle={`Survey ratings from ${rangeLabel.toLowerCase()}`}
        icon="mdi:comment-quote-outline"
        accent={INSIGHT.teal}
      >
        {instructors.rows.length === 0 && instructors.suppressed === 0 ? (
          <EmptyState
            icon="mdi:comment-quote-outline"
            title="No feedback yet"
            hint="Ratings appear here once students submit session feedback for an instructor."
          />
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            {/* Server-ordered. */}
            {instructors.rows.map((r) => (
              <Box
                key={r.instructor_profile_id ?? r.instructor}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
                  p: { xs: 1.5, md: 1.75 },
                  display: "flex",
                  flexDirection: { xs: "column", md: "row" },
                  gap: { xs: 1.25, md: 2 },
                  alignItems: { xs: "stretch", md: "center" },
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{ fontWeight: 800, color: "var(--font-primary)", fontSize: "0.92rem" }}
                  >
                    {r.instructor}
                  </Typography>
                  <Typography sx={{ fontSize: "0.74rem", color: "var(--font-secondary)" }}>
                    {r.responses.toLocaleString()}{" "}
                    {r.responses === 1 ? "response" : "responses"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: { xs: 1.5, md: 2 }, flexWrap: "wrap" }}>
                  <RatingCell label="Instructor" value={r.instructor_rating} />
                  <RatingCell label="Content" value={r.content_rating} />
                  <RatingCell label="Pace" value={r.pace_rating} />
                  <RatingCell label="Overall" value={r.overall_rating} />
                </Box>
              </Box>
            ))}

            {/* Suppression is a feature, not an omission: a lone 5.0 is noise that would outrank
                an instructor with 40 solid responses. Say so, or the missing names read as a bug. */}
            {instructors.suppressed > 0 && (
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75, mt: 0.5 }}>
                <Box sx={{ color: "var(--font-secondary)", mt: "1px", flexShrink: 0 }}>
                  <IconWrapper icon="mdi:eye-off-outline" size={14} />
                </Box>
                <Typography
                  sx={{ fontSize: "0.76rem", color: "var(--font-secondary)", lineHeight: 1.45 }}
                >
                  {instructors.note}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </Panel>
    </Box>
  );
}
