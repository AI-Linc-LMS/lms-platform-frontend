"use client";

import { useMemo } from "react";
import { Box, Chip, LinearProgress, Skeleton, Typography } from "@mui/material";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { LearningPayload } from "@/lib/services/admin/admin-insights.service";
import { DefinitionMark, EmptyState, INSIGHT, Panel, SERIES_COLORS } from "./primitives";

/**
 * Learning block of the admin insights dashboard.
 *
 * Two questions, two surfaces. "Which courses are healthy?" is a comparison across a short
 * list, so it is a table — a bar chart of eight courses would take three times the space and
 * still not let anyone read an exact number off it. "Where do students stop?" is a shape over
 * time, which a table cannot show at all, so it is a line chart.
 */

type Course = LearningPayload["courses"][number];

const FALLBACK_DEFINITIONS: Record<string, string> = {
  activation_pct: "Share of enrolled students who have finished at least one node.",
  completion_pct: "Journey nodes completed, divided by the nodes available to enrolled students.",
};

const pct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function LearningSection({
  data,
  loading,
}: {
  data: LearningPayload | null;
  loading: boolean;
}) {
  const courses = useMemo(() => {
    if (!data?.courses?.length) return [] as Course[];
    // Biggest enrolments first: a 400-student course at 12% activation is the problem worth
    // this admin's afternoon, and it should not be sorted below a 3-student pilot.
    return [...data.courses].sort((a, b) => b.enrolled - a.enrolled);
  }, [data]);

  /**
   * Recharts wants one object per X value with a key per series, but the API returns a flat
   * triple list. Pivot here rather than in the render so the sort and the series list are
   * computed once.
   *
   * Series are named by course title, deduplicated with the id, because two courses may
   * legitimately share a title and a colliding key would silently overwrite one line.
   */
  const { rows, series } = useMemo(() => {
    const points = data?.dropoff ?? [];
    if (!points.length) return { rows: [] as Array<Record<string, number>>, series: [] };

    const perCourse = new Map<number, number>();
    points.forEach((p) => perCourse.set(p.course_id, (perCourse.get(p.course_id) ?? 0) + 1));

    // A course with one dropoff week cannot draw a line — Recharts renders it as an invisible
    // segment and it still eats a legend slot and a colour.
    const eligible = points.filter((p) => (perCourse.get(p.course_id) ?? 0) >= 2);
    if (!eligible.length) return { rows: [] as Array<Record<string, number>>, series: [] };

    const titleById = new Map<number, string>();
    (data?.courses ?? []).forEach((c) => titleById.set(c.course_id, c.title));

    const used = new Set<string>();
    const keyById = new Map<number, string>();
    const ordered = [...new Set(eligible.map((p) => p.course_id))];
    ordered.forEach((id) => {
      const base = titleById.get(id) ?? `Course ${id}`;
      const key = used.has(base) ? `${base} (#${id})` : base;
      used.add(key);
      keyById.set(id, key);
    });

    const byWeek = new Map<number, Record<string, number>>();
    eligible.forEach((p) => {
      const row = byWeek.get(p.week) ?? { week: p.week };
      row[keyById.get(p.course_id) as string] = p.students;
      byWeek.set(p.week, row);
    });

    return {
      rows: [...byWeek.values()].sort((a, b) => a.week - b.week),
      series: ordered.map((id, i) => ({
        key: keyById.get(id) as string,
        color: SERIES_COLORS[i % SERIES_COLORS.length],
      })),
    };
  }, [data]);

  if (loading) return <LearningSkeleton />;

  // An empty tenant gets the API's own sentence. A zeroed axis reads as a broken dashboard,
  // and admins file bugs against it.
  if (data?.note) {
    return (
      <Panel title="Learning" icon="mdi:school-outline" accent={INSIGHT.indigo}>
        <EmptyState icon="mdi:book-open-page-variant-outline" title="No learning data yet" hint={data.note} />
      </Panel>
    );
  }

  const definitions = { ...FALLBACK_DEFINITIONS, ...(data?.definitions ?? {}) };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
      <Panel
        title="Course health"
        // Enrolment and node progress are stocks, not range-filtered, so this must not be
        // labelled with the selected period — that would claim a filter the server never applies.
        subtitle="Enrolment and progress as of now"
        icon="mdi:clipboard-pulse-outline"
        accent={INSIGHT.indigo}
      >
        {courses.length === 0 ? (
          <EmptyState
            icon="mdi:book-outline"
            title="No courses to report on"
            hint="Publish a course and enrol a student — health figures appear on the first completed node."
          />
        ) : (
          <Box>
            <CourseHealthHeader definitions={definitions} />
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {courses.map((c) => (
                <CourseRow key={c.course_id} course={c} />
              ))}
            </Box>
          </Box>
        )}
      </Panel>

      <Panel
        title="Where students stop"
        subtitle="Students who have finished at least one activity in each course week"
        icon="mdi:chart-line-variant"
        accent={INSIGHT.amber}
      >
        {rows.length === 0 || series.length === 0 ? (
          <EmptyState
            icon="mdi:chart-line"
            title="Not enough history for a retention curve"
            hint="A course needs at least two weeks of activity before its drop-off can be plotted."
          />
        ) : (
          <>
            {/*
              A retention curve, not a completion percentage, is the thing that tells an admin
              WHICH week to go fix. "38% completion" is one number that could mean anything;
              a cliff between week 2 and week 3 names the module to rewrite. Lines rather than
              stacked areas because the comparison is between courses, and stacking would make
              each course's shape depend on the ones drawn under it.
            */}
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={rows} margin={{ top: 6, right: 12, left: -12, bottom: 4 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="color-mix(in srgb, var(--border-default) 60%, transparent)"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tickFormatter={(w: number) => `W${w}`}
                  tick={{ fill: "var(--font-secondary)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: "color-mix(in srgb, var(--border-default) 70%, transparent)" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "var(--font-secondary)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <RTooltip
                  labelFormatter={(w) => `Week ${w}`}
                  formatter={(v, name) => [`${Number(v).toLocaleString()} students`, String(name)]}
                  contentStyle={{
                    backgroundColor: "var(--card-bg)",
                    border: "1px solid var(--border-default)",
                    borderRadius: 10,
                    color: "var(--font-primary)",
                    fontSize: "0.8rem",
                  }}
                  labelStyle={{ color: "var(--font-primary)", fontWeight: 700 }}
                  itemStyle={{ color: "var(--font-secondary)" }}
                />
                <Legend wrapperStyle={{ fontSize: "0.75rem", color: "var(--font-secondary)" }} />
                {series.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.key}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 0, fill: s.color }}
                    activeDot={{ r: 5 }}
                    // Gaps are real here: a course with no data in week 4 did not drop to zero,
                    // it simply had nobody at that age yet. Joining across it would invent a cliff.
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <Typography sx={{ mt: 1, fontSize: "0.76rem", color: "var(--font-secondary)" }}>
              Weeks are the course&apos;s own weeks, not calendar weeks, so students who started on
              different dates are still comparable.
            </Typography>
          </>
        )}
      </Panel>
    </Box>
  );
}

const GRID_COLUMNS = {
  xs: "1fr",
  md: "minmax(0, 1.7fr) 92px minmax(150px, 1fr) minmax(150px, 1fr)",
};

function CourseHealthHeader({ definitions }: { definitions: Record<string, string> }) {
  const label = {
    fontSize: "0.68rem",
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    color: "var(--font-secondary)",
  };

  return (
    <Box
      sx={{
        display: { xs: "none", md: "grid" },
        gridTemplateColumns: GRID_COLUMNS,
        alignItems: "center",
        gap: 2,
        pb: 1,
        borderBottom: "1px solid color-mix(in srgb, var(--border-default) 70%, transparent)",
      }}
    >
      <Typography sx={label}>Course</Typography>
      <Typography sx={{ ...label, textAlign: "right" }}>Enrolled</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography sx={label}>Started</Typography>
        <DefinitionMark text={definitions.activation_pct} />
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Typography sx={label}>Completion</Typography>
        <DefinitionMark text={definitions.completion_pct} />
      </Box>
    </Box>
  );
}

function CourseRow({ course }: { course: Course }) {
  /*
   * Started and completed are deliberately shown side by side, because the pair is what
   * carries the diagnosis. Low activation with respectable completion means the people who
   * open the course finish it fine and the problem is upstream — nobody is being pointed at
   * the course. That is a distribution fix (enrolment emails, cohort assignment, a link on the
   * dashboard), not a rewrite of the content. Showing completion alone hides that entirely,
   * since completion is measured over students who actually started.
   */
  const stalled = course.activation_pct < 25 && course.enrolled >= 5;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: GRID_COLUMNS,
        alignItems: "center",
        gap: { xs: 1, md: 2 },
        py: 1.5,
        borderBottom: "1px solid color-mix(in srgb, var(--border-default) 45%, transparent)",
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "0.9rem",
              color: "var(--font-primary)",
              lineHeight: 1.3,
            }}
          >
            {course.title}
          </Typography>
          {!course.is_published && (
            <Chip
              size="small"
              label="Draft"
              sx={{
                height: 20,
                fontSize: "0.65rem",
                fontWeight: 800,
                letterSpacing: "0.04em",
                color: "var(--font-secondary)",
                backgroundColor: "color-mix(in srgb, var(--border-default) 55%, transparent)",
              }}
            />
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--font-secondary)" }}>
            {course.nodes.toLocaleString()} nodes · {course.started.toLocaleString()} started
          </Typography>
          {stalled && (
            <Chip
              size="small"
              icon={<IconWrapper icon="mdi:alert-outline" size={13} />}
              label={`${course.never_started.toLocaleString()} never opened it`}
              sx={{
                height: 22,
                fontSize: "0.68rem",
                fontWeight: 700,
                color: INSIGHT.amber,
                backgroundColor: `color-mix(in srgb, ${INSIGHT.amber} 14%, transparent)`,
                border: `1px solid color-mix(in srgb, ${INSIGHT.amber} 35%, transparent)`,
                "& .MuiChip-icon": { color: INSIGHT.amber, ml: 0.75 },
              }}
            />
          )}
        </Box>
      </Box>

      <Typography
        sx={{
          fontWeight: 800,
          fontSize: "0.95rem",
          color: "var(--font-primary)",
          textAlign: { xs: "left", md: "right" },
        }}
      >
        {course.enrolled.toLocaleString()}
        <Box
          component="span"
          sx={{
            display: { xs: "inline", md: "none" },
            ml: 0.75,
            fontSize: "0.72rem",
            fontWeight: 600,
            color: "var(--font-secondary)",
          }}
        >
          enrolled
        </Box>
      </Typography>

      <MetricBar label="Started" value={course.activation_pct} color={INSIGHT.blue} />
      <MetricBar label="Completion" value={course.completion_pct} color={INSIGHT.green} />
    </Box>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  const v = pct(value);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
      {/* The column header carries this label on desktop; on narrow screens the header row is
          hidden, so each bar names itself rather than becoming an anonymous stripe. */}
      <Typography
        sx={{
          display: { xs: "block", md: "none" },
          width: 76,
          flexShrink: 0,
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "var(--font-secondary)",
        }}
      >
        {label}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={v}
        sx={{
          flex: 1,
          minWidth: 0,
          height: 6,
          borderRadius: 3,
          backgroundColor: "color-mix(in srgb, var(--border-default) 55%, transparent)",
          "& .MuiLinearProgress-bar": { borderRadius: 3, backgroundColor: color },
        }}
      />
      <Typography
        sx={{
          width: 38,
          flexShrink: 0,
          textAlign: "right",
          fontSize: "0.8rem",
          fontWeight: 800,
          color: "var(--font-primary)",
        }}
      >
        {v}%
      </Typography>
    </Box>
  );
}

function LearningSkeleton() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 2.5 } }}>
      {[0, 1].map((panel) => (
        <Box
          key={panel}
          sx={{
            borderRadius: 3,
            border: "1px solid color-mix(in srgb, var(--border-default) 80%, transparent)",
            backgroundColor: "var(--card-bg)",
            p: { xs: 2, md: 2.5 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Skeleton variant="rounded" width={34} height={34} />
            <Skeleton variant="text" width={180} height={26} />
          </Box>
          {panel === 0 ? (
            [0, 1, 2, 3].map((row) => (
              <Skeleton key={row} variant="rounded" height={34} sx={{ mb: 1.25 }} />
            ))
          ) : (
            <Skeleton variant="rounded" height={280} />
          )}
        </Box>
      ))}
    </Box>
  );
}
