"use client";

import { useMemo } from "react";
import { Box, Typography, Chip, LinearProgress } from "@mui/material";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { StudentAnalytics, RiskSeverity } from "@/lib/services/admin/admin-adaptive-course.service";
import { ACTIVITY_LABEL, MASTERY_LADDER, sequentialStep, useVizPalette, VizPalette } from "./vizPalette";
import { ChartCard, EmptyState, tooltipStyles } from "./ChartCard";

const axisProps = (p: VizPalette) => ({
  tick: { fill: p.inkMuted, fontSize: 11 },
  stroke: p.axis,
  tickLine: false,
});

const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/* ------------------------------------------------------------------ KPI rail */

export function KpiRail({ k }: { k: StudentAnalytics["kpis"] }) {
  const p = useVizPalette();
  const tiles = [
    { label: "Completion", value: `${Math.round(k.completion_pct)}%`, sub: `${k.completed}/${k.total} items`, icon: "mdi:progress-check", accent: p.series.quiz },
    { label: "Mastery", value: `${Math.round(k.mastery_pct)}%`, sub: "can actually do it", icon: "mdi:brain", accent: p.series.coding },
    { label: "Points", value: k.points.toLocaleString(), sub: k.points_tier || "—", icon: "mdi:trophy-outline", accent: p.series.video },
    { label: "Streak", value: `${k.streak_current}d`, sub: `best ${k.streak_longest}d`, icon: "mdi:fire", accent: p.status.serious },
    { label: "Time on task", value: `${Math.round(k.time_on_task_minutes)}m`, sub: `${k.active_days} active days`, icon: "mdi:clock-outline", accent: p.series.article },
  ];
  return (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "repeat(2,1fr)", md: "repeat(5,1fr)" } }}>
      {tiles.map((t) => (
        <Box
          key={t.label}
          sx={{
            p: 1.75, borderRadius: 3,
            bgcolor: "var(--card-bg,#fff)",
            border: "1px solid var(--border-default,#ececf1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75 }}>
            <IconWrapper icon={t.icon} size={15} color={t.accent} />
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--font-tertiary,#8b8b98)", textTransform: "uppercase", letterSpacing: 0.4 }}>
              {t.label}
            </Typography>
          </Box>
          {/* Hero figures use proportional figures, never tabular-nums. */}
          <Typography sx={{ fontSize: "1.6rem", fontWeight: 700, lineHeight: 1.1, color: "var(--font-primary)" }}>
            {t.value}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: "var(--font-tertiary,#8b8b98)" }}>{t.sub}</Typography>
        </Box>
      ))}
    </Box>
  );
}

/* ------------------------------------------------- Risk panel (status colors) */

const SEVERITY_ICON: Record<RiskSeverity, string> = {
  warning: "mdi:alert-outline",
  serious: "mdi:alert-circle-outline",
  critical: "mdi:alert-octagon-outline",
};

export function RiskPanel({ signals }: { signals: StudentAnalytics["risk_signals"] }) {
  const p = useVizPalette();
  if (!signals.length) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1.75, borderRadius: 3, border: `1px solid ${p.status.good}33`, bgcolor: `${p.status.good}0f` }}>
        <IconWrapper icon="mdi:check-circle-outline" size={18} color={p.status.good} />
        <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)" }}>
          No risk signals — this student is on track.
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(auto-fit,minmax(280px,1fr))" } }}>
      {signals.map((s) => {
        const color = p.status[s.severity];
        return (
          <Box key={s.code} sx={{ display: "flex", gap: 1.25, p: 1.5, borderRadius: 2.5, border: `1px solid ${color}40`, bgcolor: `${color}0f` }}>
            {/* Status color never carries meaning alone — icon + label always. */}
            <IconWrapper icon={SEVERITY_ICON[s.severity]} size={18} color={color} />
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.83rem", fontWeight: 700, color: "var(--font-primary)" }}>{s.title}</Typography>
              <Typography sx={{ fontSize: "0.75rem", color: "var(--font-secondary)", lineHeight: 1.45 }}>{s.detail}</Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/* ------------------------------------- Mastery vs completion (the headline) */

function Ring({ value, color, label, sub, surface }: { value: number; color: string; label: string; sub: string; surface: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <Box sx={{ textAlign: "center" }}>
      <Box sx={{ position: "relative", width: 116, height: 116, mx: "auto" }}>
        <svg width={116} height={116} role="img" aria-label={`${label} ${Math.round(value)}%`}>
          <circle cx={58} cy={58} r={r} fill="none" stroke={surface === "#ffffff" ? "#eceaf3" : "#2c2c2a"} strokeWidth={9} />
          <circle
            cx={58} cy={58} r={r} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round"
            strokeDasharray={`${dash} ${c - dash}`} transform="rotate(-90 58 58)"
          />
        </svg>
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
          <Typography sx={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--font-primary)" }}>{Math.round(value)}%</Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--font-primary)", mt: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontSize: "0.72rem", color: "var(--font-tertiary,#8b8b98)" }}>{sub}</Typography>
    </Box>
  );
}

export function MasteryVsCompletion({ d }: { d: StudentAnalytics["mastery_vs_completion"] }) {
  const p = useVizPalette();
  const total = MASTERY_LADDER.reduce((n, l) => n + (d.levels[l.key as keyof typeof d.levels] || 0), 0);
  const gap = Math.round(d.completion_pct - d.mastery_pct);

  return (
    <ChartCard
      title="Mastery vs completion"
      icon="mdi:scale-balance"
      subtitle="Completion says they clicked through it. Mastery says they can do it. The gap is what a completion-only view hides."
      height={220}
      table={{
        head: ["Mastery level", "Skills"],
        rows: MASTERY_LADDER.map((l) => [l.label, d.levels[l.key as keyof typeof d.levels] || 0]),
      }}
    >
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 4, pt: 1 }}>
        <Ring value={d.completion_pct} color={p.series.quiz} label="Completion" sub="items finished" surface={p.surface} />
        <Ring value={d.mastery_pct} color={p.series.coding} label="Mastery" sub="skill strength" surface={p.surface} />
        <Box sx={{ minWidth: 190, flex: 1, maxWidth: 300 }}>
          {gap > 5 && (
            <Typography sx={{ fontSize: "0.78rem", color: "var(--font-secondary)", mb: 1.25 }}>
              Completion runs <strong>{gap} points</strong> ahead of mastery — content is being consumed faster than it&apos;s being learned.
            </Typography>
          )}
          {total === 0 ? (
            <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary,#8b8b98)" }}>No skills assessed yet.</Typography>
          ) : (
            MASTERY_LADDER.slice().reverse().map((l, i) => {
              const n = d.levels[l.key as keyof typeof d.levels] || 0;
              // Ordered ladder -> ordinal ramp, darkest = most mastered.
              const shade = p.sequential[Math.max(0, p.sequential.length - 1 - i)];
              return (
                <Box key={l.key} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.4 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: shade, flexShrink: 0 }} />
                  <Typography sx={{ fontSize: "0.75rem", color: "var(--font-secondary)", flex: 1 }}>{l.label}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--font-primary)", fontVariantNumeric: "tabular-nums" }}>{n}</Typography>
                </Box>
              );
            })
          )}
        </Box>
      </Box>
    </ChartCard>
  );
}

/* ----------------------------------------------------- Progress over time */

export function ProgressOverTime({ rows }: { rows: StudentAnalytics["progress_over_time"] }) {
  const p = useVizPalette();
  return (
    <ChartCard
      title="Progress over time"
      icon="mdi:chart-areaspline"
      subtitle="Cumulative items completed. A flat stretch is a stall."
      table={{ head: ["Date", "Items that day", "Cumulative"], rows: rows.map((r) => [r.date, r.items, r.cum_items]) }}
    >
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: -18 }}>
            <defs>
              <linearGradient id="pot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={p.series.quiz} stopOpacity={0.28} />
                <stop offset="100%" stopColor={p.series.quiz} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={p.grid} vertical={false} />
            <XAxis dataKey="date" tickFormatter={fmtDay} {...axisProps(p)} minTickGap={28} />
            <YAxis {...axisProps(p)} allowDecimals={false} />
            <Tooltip {...tooltipStyles} labelFormatter={(v) => fmtDay(String(v))} />
            <Area
              type="monotone" dataKey="cum_items" name="Items completed"
              stroke={p.series.quiz} strokeWidth={2} fill="url(#pot)"
              dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: p.surface }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* ------------------------------------------------------- Activity heatmap */

export function ActivityHeatmap({ cells }: { cells: StudentAnalytics["activity_heatmap"] }) {
  const p = useVizPalette();
  const { weeks, max } = useMemo(() => {
    const map = new Map(cells.map((c) => [c.date, c]));
    const max = cells.reduce((m, c) => Math.max(m, c.count), 0);
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 181);
    start.setDate(start.getDate() - start.getDay()); // align to Sunday
    const weeks: { date: string; count: number; minutes: number }[][] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const week: { date: string; count: number; minutes: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const iso = cur.toISOString().slice(0, 10);
        const hit = map.get(iso);
        week.push({ date: iso, count: hit?.count ?? 0, minutes: hit?.minutes ?? 0 });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }
    return { weeks, max };
  }, [cells]);

  const CELL = 11, GAP = 3;
  return (
    <ChartCard
      title="Activity"
      icon="mdi:calendar-heart"
      subtitle="Consistency beats intensity — look for gaps, not peaks."
      height={190}
      table={{ head: ["Date", "Activities", "Minutes"], rows: cells.map((c) => [c.date, c.count, c.minutes]) }}
    >
      {cells.length === 0 ? (
        <EmptyState message="No activity in the last 6 months." />
      ) : (
        <Box sx={{ overflowX: "auto", pb: 1 }}>
          <svg width={weeks.length * (CELL + GAP)} height={7 * (CELL + GAP) + 4} role="img" aria-label="Activity calendar heatmap">
            {weeks.map((week, wi) =>
              week.map((day, di) => (
                <rect
                  key={day.date}
                  x={wi * (CELL + GAP)} y={di * (CELL + GAP)}
                  width={CELL} height={CELL} rx={2.5}
                  fill={sequentialStep(p, day.count, max)}
                >
                  <title>{`${day.date}: ${day.count} activities · ${day.minutes} min`}</title>
                </rect>
              )),
            )}
          </svg>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
            <Typography sx={{ fontSize: "0.68rem", color: "var(--font-tertiary,#8b8b98)", mr: 0.5 }}>Less</Typography>
            {p.sequential.map((c) => (
              <Box key={c} sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: c }} />
            ))}
            <Typography sx={{ fontSize: "0.68rem", color: "var(--font-tertiary,#8b8b98)", ml: 0.5 }}>More</Typography>
          </Box>
        </Box>
      )}
    </ChartCard>
  );
}

/* --------------------------------------- Skill mastery + forgetting curve */

export function SkillMastery({ rows }: { rows: StudentAnalytics["skill_mastery"] }) {
  const p = useVizPalette();
  const top = rows.slice(0, 8);
  return (
    <ChartCard
      title="Skill mastery & retention"
      icon="mdi:radar"
      subtitle="Retention decays since last practice (p = mastery · 2^−Δ/h). Weakest retention first — this is the revision queue."
      height={300}
      table={{
        head: ["Skill", "Mastery %", "Retention %", "Days since"],
        rows: rows.map((r) => [r.skill, r.mastery_pct, r.retention_pct, r.days_since ?? "—"]),
      }}
    >
      {top.length === 0 ? (
        <EmptyState message="No skills assessed yet." />
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(220, top.length * 34)}>
          <BarChart data={top} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 8 }} barCategoryGap="28%">
            <CartesianGrid stroke={p.grid} horizontal={false} />
            <XAxis type="number" domain={[0, 100]} {...axisProps(p)} />
            <YAxis type="category" dataKey="skill" width={120} {...axisProps(p)} />
            <Tooltip {...tooltipStyles} formatter={(value) => `${value}%`} />
            <Legend wrapperStyle={{ fontSize: 11, color: p.inkSecondary }} />
            {/* Two series -> legend required. 2px surface ring keeps overlapping marks separate. */}
            <Bar dataKey="mastery_pct" name="Mastery" fill={p.series.coding} radius={[0, 4, 4, 0]} stroke={p.surface} strokeWidth={2} />
            <Bar dataKey="retention_pct" name="Retained now" fill={p.series.video} radius={[0, 4, 4, 0]} stroke={p.surface} strokeWidth={2} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* --------------------------------------------- Difficulty mix (ordinal ramp) */

export function DifficultyMix({ rows }: { rows: StudentAnalytics["difficulty"] }) {
  const p = useVizPalette();
  const data = rows.map((r) => ({ ...r, incorrect: Math.max(0, r.attempted - r.correct) }));
  return (
    <ChartCard
      title="Difficulty mix"
      icon="mdi:stairs"
      subtitle="Correct vs missed at each tier. Accuracy collapsing at Hard is normal; collapsing at Easy is not."
      table={{ head: ["Difficulty", "Attempted", "Correct", "Accuracy %"], rows: rows.map((r) => [r.difficulty, r.attempted, r.correct, r.accuracy]) }}
    >
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }} barCategoryGap="30%">
            <CartesianGrid stroke={p.grid} vertical={false} />
            <XAxis dataKey="difficulty" {...axisProps(p)} />
            <YAxis {...axisProps(p)} allowDecimals={false} />
            <Tooltip {...tooltipStyles} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {/* Difficulty is ORDERED -> one-hue ordinal ramp, not categorical hues.
                2px surface stroke = the required gap between stacked segments. */}
            <Bar dataKey="correct" name="Correct" stackId="d" fill={p.ordinal[2]} stroke={p.surface} strokeWidth={2} />
            <Bar dataKey="incorrect" name="Missed" stackId="d" fill={p.ordinal[0]} stroke={p.surface} strokeWidth={2} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* ------------------------------------------- Confidence calibration (novel) */

const CONF_LABEL = ["", "Guessing", "Unsure", "Fairly sure", "Certain"];

export function ConfidenceCalibration({ rows }: { rows: StudentAnalytics["quiz"]["confidence_calibration"] }) {
  const p = useVizPalette();
  const data = rows.map((r) => ({ ...r, label: CONF_LABEL[r.confidence] || `L${r.confidence}` }));
  const overconfident = data.find((r) => r.confidence >= 3 && r.accuracy < 60);

  return (
    <ChartCard
      title="Confidence calibration"
      icon="mdi:scale-unbalanced"
      subtitle="Self-reported confidence vs actual accuracy. High confidence + low accuracy is dangerous — they don't know they're wrong."
      table={{ head: ["Confidence", "Answered", "Correct", "Accuracy %"], rows: data.map((r) => [r.label, r.answered, r.correct, r.accuracy]) }}
    >
      {data.length === 0 ? (
        <EmptyState message="No confidence data yet." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -18 }} barCategoryGap="34%">
              <CartesianGrid stroke={p.grid} vertical={false} />
              <XAxis dataKey="label" {...axisProps(p)} />
              <YAxis domain={[0, 100]} {...axisProps(p)} />
              <Tooltip {...tooltipStyles} formatter={(value) => `${value}%`} />
              {/* Single series -> no legend box; the title names it. */}
              <ReferenceLine y={60} stroke={p.axis} strokeWidth={1} label={{ value: "60%", fill: p.inkMuted, fontSize: 10, position: "right" }} />
              <Bar dataKey="accuracy" name="Accuracy" radius={[4, 4, 0, 0]} stroke={p.surface} strokeWidth={2}>
                {data.map((r) => (
                  // Emphasis, not a value-ramp: only the miscalibrated bars get the status hue.
                  <Cell key={r.confidence} fill={r.confidence >= 3 && r.accuracy < 60 ? p.status.critical : p.series.quiz} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {overconfident && (
            <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", mt: 0.5 }}>
              <IconWrapper icon="mdi:alert-circle-outline" size={15} color={p.status.critical} />
              <Typography sx={{ fontSize: "0.74rem", color: "var(--font-secondary)" }}>
                Overconfident at &ldquo;{overconfident.label}&rdquo; — {overconfident.accuracy}% correct.
              </Typography>
            </Box>
          )}
        </>
      )}
    </ChartCard>
  );
}

/* ------------------------------------------- Effort vs outcome (quadrant) */

export function EffortVsOutcome({ points }: { points: StudentAnalytics["effort_vs_outcome"] }) {
  const p = useVizPalette();
  const medianMin = useMemo(() => {
    if (!points.length) return 0;
    const s = points.map((x) => x.minutes).sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  }, [points]);

  const byType = useMemo(() => {
    const g: Record<string, typeof points> = {};
    points.forEach((pt) => { (g[pt.activity_type] ||= []).push(pt); });
    return g;
  }, [points]);

  return (
    <ChartCard
      title="Effort vs outcome"
      icon="mdi:chart-scatter-plot"
      subtitle="Bottom-right = lots of time, little correctness: grinding, not learning. That's where to intervene."
      table={{ head: ["Type", "Minutes", "Correctness %"], rows: points.slice(0, 60).map((r) => [ACTIVITY_LABEL[r.activity_type] ?? r.activity_type, r.minutes, r.correctness]) }}
    >
      {points.length === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 12, left: -18 }}>
            <CartesianGrid stroke={p.grid} />
            <XAxis type="number" dataKey="minutes" name="Minutes" unit="m" {...axisProps(p)}
              label={{ value: "Time spent", position: "insideBottom", offset: -6, fill: p.inkMuted, fontSize: 11 }} />
            <YAxis type="number" dataKey="correctness" name="Correctness" unit="%" domain={[0, 100]} {...axisProps(p)} />
            <ZAxis range={[70, 70]} />
            <Tooltip {...tooltipStyles} cursor={{ strokeDasharray: "0", stroke: p.axis }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {/* Quadrant dividers: median effort, and the 60% correctness line. */}
            <ReferenceLine x={medianMin} stroke={p.axis} strokeWidth={1} />
            <ReferenceLine y={60} stroke={p.axis} strokeWidth={1} />
            {Object.entries(byType).map(([type, pts]) => (
              <Scatter
                key={type}
                name={ACTIVITY_LABEL[type] ?? type}
                data={pts}
                fill={p.series[type as keyof typeof p.series] ?? p.series.quiz}
                stroke={p.surface}
                strokeWidth={2}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* --------------------------------------------------------- Study pattern */

export function StudyPattern({ pattern }: { pattern: StudentAnalytics["study_pattern"] }) {
  const p = useVizPalette();
  const data = pattern.by_hour.map((count, hour) => ({ hour: `${hour}`, count }));
  const total = pattern.by_hour.reduce((a, b) => a + b, 0);
  return (
    <ChartCard
      title="When they study"
      icon="mdi:clock-time-four-outline"
      subtitle="Activity by hour of day."
      height={200}
      table={{ head: ["Hour", "Activities"], rows: data.map((r) => [`${r.hour}:00`, r.count]) }}
    >
      {total === 0 ? (
        <EmptyState />
      ) : (
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -22 }} barCategoryGap="18%">
            <CartesianGrid stroke={p.grid} vertical={false} />
            <XAxis dataKey="hour" {...axisProps(p)} interval={2} />
            <YAxis {...axisProps(p)} allowDecimals={false} />
            <Tooltip {...tooltipStyles} labelFormatter={(v) => `${v}:00`} />
            <Bar dataKey="count" name="Activities" fill={p.series.video} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* --------------------------------------------------- Mock interview trend */

export function MockInterviewTrend({ rows }: { rows: StudentAnalytics["mock_interviews"] }) {
  const p = useVizPalette();
  const data = rows.filter((r) => r.date).map((r) => ({ ...r, date: r.date as string }));
  return (
    <ChartCard
      title="Mock interview scores"
      icon="mdi:account-voice"
      subtitle="Every completed interview, in order."
      height={200}
      table={{ head: ["Date", "Interview", "Score %"], rows: data.map((r) => [fmtDay(r.date), r.title, r.score]) }}
    >
      {data.length === 0 ? (
        <EmptyState message="No completed mock interviews." />
      ) : (
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -20 }}>
            <CartesianGrid stroke={p.grid} vertical={false} />
            <XAxis dataKey="date" tickFormatter={fmtDay} {...axisProps(p)} minTickGap={24} />
            <YAxis domain={[0, 100]} {...axisProps(p)} />
            <Tooltip {...tooltipStyles} labelFormatter={(v) => fmtDay(String(v))} />
            <Line type="monotone" dataKey="score" name="Score" stroke={p.series.coding} strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2, stroke: p.surface }} activeDot={{ r: 5.5 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
}

/* ------------------------------------ Coding insights (misconceptions etc.) */

export function CodingInsights({ c }: { c: StudentAnalytics["coding"] }) {
  const p = useVizPalette();
  return (
    <ChartCard
      title="Coding performance"
      icon="mdi:code-braces"
      subtitle="Acceptance, persistence, and the misconceptions behind the failures."
      height={300}
      table={{ head: ["Misconception", "Occurrences"], rows: c.top_misconceptions.map((m) => [m.gap, m.count]) }}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1.25, mb: 2 }}>
        {[
          { l: "Solved", v: `${c.problems_solved}/${c.problems_attempted}` },
          { l: "Acceptance", v: `${Math.round(c.acceptance_rate)}%` },
          { l: "Attempts/solve", v: c.avg_attempts_to_solve || "—" },
        ].map((s) => (
          <Box key={s.l} sx={{ textAlign: "center", p: 1, borderRadius: 2, bgcolor: "color-mix(in srgb, var(--border-default) 25%, transparent)" }}>
            <Typography sx={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--font-primary)" }}>{s.v}</Typography>
            <Typography sx={{ fontSize: "0.68rem", color: "var(--font-tertiary,#8b8b98)" }}>{s.l}</Typography>
          </Box>
        ))}
      </Box>

      <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--font-secondary)", mb: 1 }}>
        Top misconceptions
      </Typography>
      {c.top_misconceptions.length === 0 ? (
        <EmptyState message="No failed submissions to diagnose." />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {c.top_misconceptions.map((m) => {
            const max = c.top_misconceptions[0].count || 1;
            return (
              <Box key={m.gap}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
                  <Typography sx={{ fontSize: "0.75rem", color: "var(--font-secondary)" }}>{m.gap.replace(/_/g, " ")}</Typography>
                  <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--font-primary)", fontVariantNumeric: "tabular-nums" }}>{m.count}</Typography>
                </Box>
                <LinearProgress
                  variant="determinate" value={(m.count / max) * 100}
                  sx={{ height: 6, borderRadius: 999, bgcolor: "color-mix(in srgb, var(--border-default) 40%, transparent)",
                    "& .MuiLinearProgress-bar": { bgcolor: p.series.coding, borderRadius: 999 } }}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </ChartCard>
  );
}

/* ------------------------------------------------------ Struggle + timeline */

export function StruggleItems({ rows }: { rows: StudentAnalytics["struggle_items"] }) {
  const p = useVizPalette();
  return (
    <ChartCard
      title="Stuck here"
      icon="mdi:lifebuoy"
      subtitle="Attempted repeatedly, never solved."
      height={200}
      table={{ head: ["Item", "Type", "Attempts", "Best %"], rows: rows.map((r) => [r.content_key, r.activity_type, r.attempts, r.best_correctness]) }}
    >
      {rows.length === 0 ? (
        <EmptyState message="Nothing they're stuck on. 🎉" />
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {rows.slice(0, 6).map((r) => (
            <Box key={r.content_key} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <IconWrapper icon="mdi:alert-circle-outline" size={16} color={p.status.serious} />
              <Typography sx={{ fontSize: "0.78rem", color: "var(--font-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.content_key}
              </Typography>
              <Chip size="small" label={`${r.attempts} attempts`} sx={{ height: 20, fontSize: "0.68rem", bgcolor: `${p.status.serious}1a`, color: p.status.serious }} />
            </Box>
          ))}
        </Box>
      )}
    </ChartCard>
  );
}

export function ActivityTimeline({ rows }: { rows: StudentAnalytics["timeline"] }) {
  const p = useVizPalette();
  return (
    <ChartCard
      title="Recent activity"
      icon="mdi:timeline-clock-outline"
      height={320}
      table={{ head: ["When", "Type", "Item", "Correct %", "Points"], rows: rows.map((r) => [new Date(r.at).toLocaleString(), r.activity_type, r.content_key, r.correctness, r.earned]) }}
    >
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <Box sx={{ maxHeight: 300, overflowY: "auto", pr: 0.5 }}>
          {rows.map((r, i) => (
            <Box key={`${r.at}-${i}`} sx={{ display: "flex", gap: 1.25, alignItems: "center", py: 0.9, borderBottom: i < rows.length - 1 ? "1px solid var(--border-default,#ececf1)" : "none" }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: p.series[r.activity_type as keyof typeof p.series] ?? p.inkMuted }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontSize: "0.78rem", color: "var(--font-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {ACTIVITY_LABEL[r.activity_type] ?? r.activity_type}
                  {r.content_key ? ` · ${r.content_key}` : ""}
                </Typography>
                <Typography sx={{ fontSize: "0.7rem", color: "var(--font-tertiary,#8b8b98)" }}>
                  {new Date(r.at).toLocaleString()} {r.difficulty ? `· ${r.difficulty}` : ""} {r.attempt_no > 1 ? `· attempt ${r.attempt_no}` : ""}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--font-secondary)", fontVariantNumeric: "tabular-nums" }}>
                {Math.round(r.correctness)}%
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </ChartCard>
  );
}

/* ------------------------------------------------------ Cohort comparison */

export function CohortComparison({
  c,
  completion,
  points,
}: {
  c: StudentAnalytics["cohort"];
  completion: number;
  points: number;
}) {
  const p = useVizPalette();
  if (c.cohort_size < 2) {
    return (
      <ChartCard title="Vs cohort" icon="mdi:account-group-outline" height={150}>
        <EmptyState message="Needs at least 2 enrolled students to compare." />
      </ChartCard>
    );
  }
  const rows = [
    { label: "Completion", me: Math.round(completion), avg: Math.round(c.avg_completion), pct: c.completion_percentile, unit: "%" },
    { label: "Points", me: points, avg: c.avg_points, pct: c.points_percentile, unit: "" },
  ];
  return (
    <ChartCard
      title="Vs cohort"
      icon="mdi:account-group-outline"
      subtitle={`Percentile among ${c.cohort_size} enrolled students.`}
      height={160}
      table={{
        head: ["Metric", "This student", "Cohort avg", "Percentile"],
        rows: rows.map((r) => [r.label, `${r.me}${r.unit}`, `${r.avg}${r.unit}`, `${r.pct}th`]),
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
        {rows.map((r) => (
          <Box key={r.label}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography sx={{ fontSize: "0.78rem", color: "var(--font-secondary)" }}>{r.label}</Typography>
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--font-primary)" }}>
                {r.pct}th percentile
              </Typography>
            </Box>
            <Box sx={{ position: "relative", height: 8, borderRadius: 999, bgcolor: "color-mix(in srgb, var(--border-default) 40%, transparent)" }}>
              <Box sx={{ position: "absolute", inset: 0, width: `${r.pct}%`, borderRadius: 999, bgcolor: p.series.quiz }} />
            </Box>
            {/* Direct labels, not a tooltip-only value — the relief rule. */}
            <Typography sx={{ fontSize: "0.7rem", color: "var(--font-tertiary,#8b8b98)", mt: 0.4 }}>
              This student <strong>{r.me}{r.unit}</strong> · cohort average {r.avg}{r.unit}
            </Typography>
          </Box>
        ))}
      </Box>
    </ChartCard>
  );
}
