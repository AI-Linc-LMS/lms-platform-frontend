"use client";

import { useMemo, useState } from "react";
import { Activity, Calendar } from "lucide-react";
import { GlassCard, SectionHeader, EmptyState } from "@/components/scorecard/primitives";
import type { ActivityHeatmap, ActivityHeatmapDay } from "@/lib/types/scorecard.types";

interface ActivityHeatmapSectionProps {
  data?: ActivityHeatmap;
}

const CELL_SIZE = 12;
const CELL_GAP = 3;
const WEEKS = 53;
const DAYS_IN_WEEK = 7;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Cell {
  date: string;
  count: number;
  minutes: number;
  weekIndex: number;
  dayIndex: number;
}

function buildGrid(days: ActivityHeatmapDay[]): { cells: Cell[]; monthLabels: { weekIndex: number; label: string }[] } {
  if (days.length === 0) return { cells: [], monthLabels: [] };
  const cells: Cell[] = [];
  const monthLabels: { weekIndex: number; label: string }[] = [];
  let lastMonth = -1;
  const firstDate = new Date(days[0].date + "T00:00:00");
  const firstDayOfWeek = firstDate.getDay();

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const totalIndex = i + firstDayOfWeek;
    const weekIndex = Math.floor(totalIndex / DAYS_IN_WEEK);
    const dayIndex = totalIndex % DAYS_IN_WEEK;
    cells.push({ date: d.date, count: d.count, minutes: d.minutes, weekIndex, dayIndex });

    const dateObj = new Date(d.date + "T00:00:00");
    const m = dateObj.getMonth();
    if (m !== lastMonth && dateObj.getDate() <= 7) {
      monthLabels.push({ weekIndex, label: MONTHS[m] });
      lastMonth = m;
    }
  }
  return { cells, monthLabels };
}

function intensityClass(count: number, max: number): { bg: string; opacity: number } {
  if (count === 0) {
    return { bg: "var(--sc-bg-overlay)", opacity: 1 };
  }
  const ratio = max > 0 ? count / max : 0;
  if (ratio >= 0.75) return { bg: "var(--sc-accent-primary)", opacity: 1 };
  if (ratio >= 0.5) return { bg: "var(--sc-accent-primary)", opacity: 0.78 };
  if (ratio >= 0.25) return { bg: "var(--sc-accent-primary)", opacity: 0.55 };
  return { bg: "var(--sc-accent-primary)", opacity: 0.32 };
}

export function ActivityHeatmapSection({ data }: ActivityHeatmapSectionProps) {
  const [hover, setHover] = useState<Cell | null>(null);
  const grid = useMemo(() => buildGrid(data?.days ?? []), [data]);

  if (!data || data.days.length === 0) {
    return (
      <EmptyState
        icon={<Activity size={20} />}
        title="No activity yet"
        description="Once you start learning, your daily progress will show up here."
      />
    );
  }

  const maxCount = data.summary.maxCount || 1;
  const totalWeeks = grid.cells.length > 0 ? grid.cells[grid.cells.length - 1].weekIndex + 1 : WEEKS;
  const widthPx = totalWeeks * (CELL_SIZE + CELL_GAP);
  const heightPx = DAYS_IN_WEEK * (CELL_SIZE + CELL_GAP);

  return (
    <GlassCard padding="lg" radius="lg">
      <SectionHeader
        eyebrow="Activity"
        title="Daily learning rhythm"
        subtitle={`${data.summary.activeDays} active ${data.summary.activeDays === 1 ? "day" : "days"} · longest streak ${data.summary.longestStreak} · ${data.summary.totalActivities} total actions`}
        size="md"
      />
      <div style={{ overflowX: "auto", paddingBottom: 8 }}>
        <div style={{ position: "relative", width: widthPx + 24, minWidth: widthPx + 24 }}>
          {/* Month labels */}
          <div style={{ position: "relative", height: 14, marginLeft: 24, marginBottom: 6 }}>
            {grid.monthLabels.map((m) => (
              <span
                key={`${m.weekIndex}-${m.label}`}
                style={{
                  position: "absolute",
                  left: m.weekIndex * (CELL_SIZE + CELL_GAP),
                  fontSize: 10,
                  color: "var(--sc-text-muted)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", gap: 4 }}>
            {/* Day-of-week labels */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: CELL_GAP,
                paddingTop: 0,
                fontSize: 9,
                color: "var(--sc-text-muted)",
                width: 20,
              }}
              aria-hidden
            >
              {["", "Mon", "", "Wed", "", "Fri", ""].map((d, i) => (
                <span key={i} style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px` }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Grid */}
            <svg width={widthPx} height={heightPx} style={{ display: "block" }} role="img" aria-label="Activity heatmap">
              {grid.cells.map((cell) => {
                const x = cell.weekIndex * (CELL_SIZE + CELL_GAP);
                const y = cell.dayIndex * (CELL_SIZE + CELL_GAP);
                const intensity = intensityClass(cell.count, maxCount);
                return (
                  <rect
                    key={cell.date}
                    x={x}
                    y={y}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={2.5}
                    ry={2.5}
                    fill={intensity.bg}
                    opacity={intensity.opacity}
                    style={{
                      transition: "opacity 150ms ease, transform 150ms ease",
                      cursor: cell.count > 0 ? "pointer" : "default",
                    }}
                    onMouseEnter={() => setHover(cell)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <title>{`${cell.date} · ${cell.count} ${cell.count === 1 ? "action" : "actions"}${cell.minutes ? ` · ${cell.minutes}m` : ""}`}</title>
                  </rect>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Legend + hover hint */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--sc-text-muted)" }}>
          <span>Less</span>
          {[0.2, 0.4, 0.6, 0.8, 1].map((op) => (
            <span
              key={op}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                borderRadius: 3,
                background: op === 0.2 ? "var(--sc-bg-overlay)" : "var(--sc-accent-primary)",
                opacity: op === 0.2 ? 1 : op,
              }}
              aria-hidden
            />
          ))}
          <span>More</span>
        </div>
        {hover ? (
          <span style={{ fontSize: 12, color: "var(--sc-text-secondary)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Calendar size={12} />
            {hover.date} · {hover.count} {hover.count === 1 ? "action" : "actions"}
            {hover.minutes > 0 ? ` · ${hover.minutes}m` : ""}
          </span>
        ) : null}
      </div>
    </GlassCard>
  );
}
