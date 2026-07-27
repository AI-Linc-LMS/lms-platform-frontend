"use client";

import { useMemo, useState } from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { Icon } from "@iconify/react";

export type CalendarEventType = "live" | "deadline" | "assessment" | "interview";

export interface CalendarEvent {
  id: string;
  /** ISO datetime (or date) the event falls on. */
  date: string;
  title: string;
  type: CalendarEventType;
  /** Preformatted clock, e.g. "15:00". Falls back to the time in `date`. */
  time?: string;
  /** Secondary line, e.g. the course / subject. */
  subtitle?: string;
  /** Small status note, e.g. "live now" or "Due 23:59". */
  note?: string;
  onClick?: () => void;
}

export const CALENDAR_TYPE_META: Record<CalendarEventType, { label: string; color: string }> = {
  live: { label: "Live session", color: "#ef4444" },
  deadline: { label: "Deadline", color: "#f59e0b" },
  assessment: { label: "Assessment", color: "#6366f1" },
  interview: { label: "Interview", color: "#14b8a6" },
};

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Local YYYY-MM-DD key (avoids UTC off-by-one that toISOString would cause). */
function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function clock(ev: CalendarEvent): string {
  if (ev.time) return ev.time;
  const d = new Date(ev.date);
  return isNaN(d.getTime())
    ? ""
    : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

/**
 * A month calendar that aggregates live sessions, deadlines, assessments and interviews as
 * type-colored dots, with a day-agenda panel below. Pure: fed a normalized `CalendarEvent[]`, so
 * both the student and admin live-session pages share it. Theme-aware (CSS-var driven).
 */
export function ScheduleCalendar({
  events,
  title = "Your calendar",
}: {
  events: CalendarEvent[];
  title?: string;
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState(() => dayKey(today));

  // Bucket events by local day key.
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const d = new Date(ev.date);
      if (isNaN(d.getTime())) continue;
      const key = dayKey(d);
      (map.get(key) ?? map.set(key, []).get(key)!).push(ev);
    }
    for (const list of map.values()) list.sort((a, b) => clock(a).localeCompare(clock(b)));
    return map;
  }, [events]);

  // The 6x7 grid of the visible month (Monday-first), including trailing/leading blanks.
  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // Mon=0 … Sun=6
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < offset; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, month, d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [cursor]);

  const selectedEvents = byDay.get(selectedKey) ?? [];
  const selectedDate = useMemo(() => {
    const [y, m, d] = selectedKey.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [selectedKey]);
  const selectedIsToday = selectedKey === dayKey(today);

  const shiftMonth = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  return (
    <Box
      sx={{
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--border-default)",
        borderRadius: "20px",
        p: { xs: 2, sm: 2.5 },
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--font-tertiary)" }}>
          {title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <NavBtn icon="mdi:chevron-left" onClick={() => shiftMonth(-1)} label="Previous month" />
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", minWidth: 96, textAlign: "center", color: "var(--font-primary)" }}>
            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
          </Typography>
          <NavBtn icon="mdi:chevron-right" onClick={() => shiftMonth(1)} label="Next month" />
        </Box>
      </Box>

      {/* Weekday row */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 0.5 }}>
        {WEEKDAYS.map((w, i) => (
          <Typography key={i} sx={{ textAlign: "center", fontSize: "0.68rem", fontWeight: 700, color: "var(--font-tertiary)" }}>
            {w}
          </Typography>
        ))}
      </Box>

      {/* Month grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 0.5 }}>
        {cells.map((d, i) => {
          if (!d) return <Box key={i} sx={{ aspectRatio: "1 / 1" }} />;
          const key = dayKey(d);
          const dayEvents = byDay.get(key) ?? [];
          const isToday = key === dayKey(today);
          const isSelected = key === selectedKey;
          const dotTypes = Array.from(new Set(dayEvents.map((e) => e.type))).slice(0, 3);
          const cell = (
            <Box
              onClick={() => setSelectedKey(key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedKey(key); }}
              sx={{
                aspectRatio: "1 / 1",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.35,
                borderRadius: "12px",
                cursor: "pointer",
                position: "relative",
                border: isToday && !isSelected ? "1px solid color-mix(in srgb,#7c3aed 45%,transparent)" : "1px solid transparent",
                background: isSelected ? "linear-gradient(135deg,#7c3aed,#a855f7)" : "transparent",
                color: isSelected ? "#fff" : "var(--font-primary)",
                transition: "background .15s, border-color .15s",
                "&:hover": { background: isSelected ? undefined : "color-mix(in srgb,var(--border-default) 40%,transparent)" },
              }}
            >
              <Typography sx={{ fontSize: "0.86rem", fontWeight: isToday || isSelected ? 800 : 500, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                {d.getDate()}
              </Typography>
              <Box sx={{ display: "flex", gap: 0.3, height: 5, alignItems: "center" }}>
                {dotTypes.map((t) => (
                  <Box key={t} sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: isSelected ? "rgba(255,255,255,0.95)" : CALENDAR_TYPE_META[t].color }} />
                ))}
              </Box>
            </Box>
          );
          if (dayEvents.length === 0) return <Box key={i}>{cell}</Box>;
          return (
            <Tooltip
              key={i}
              arrow
              placement="top"
              title={
                <Box sx={{ py: 0.25 }}>
                  <Typography sx={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.08em", opacity: 0.7, textTransform: "uppercase" }}>
                    {MONTHS[d.getMonth()].toUpperCase()} {d.getDate()}
                  </Typography>
                  {dayEvents.slice(0, 3).map((ev) => (
                    <Box key={ev.id} sx={{ mt: 0.5 }}>
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, lineHeight: 1.2 }}>
                        <Box component="span" sx={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", bgcolor: CALENDAR_TYPE_META[ev.type].color, mr: 0.6 }} />
                        {ev.title}
                      </Typography>
                      <Typography sx={{ fontSize: "0.72rem", opacity: 0.75 }}>{clock(ev)}{ev.subtitle ? ` · ${ev.subtitle}` : ""}</Typography>
                    </Box>
                  ))}
                  {dayEvents.length > 3 && (
                    <Typography sx={{ fontSize: "0.68rem", opacity: 0.7, mt: 0.5 }}>+{dayEvents.length - 3} more</Typography>
                  )}
                </Box>
              }
            >
              {cell}
            </Tooltip>
          );
        })}
      </Box>

      {/* Selected-day agenda */}
      <Box sx={{ borderTop: "1px solid var(--border-default)", pt: 1.5, mt: 0.5 }}>
        <Typography sx={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.06em", color: "var(--font-secondary)", mb: 1 }}>
          {MONTHS[selectedDate.getMonth()].toUpperCase()} {selectedDate.getDate()}
          {selectedIsToday ? " · TODAY" : ""}
        </Typography>
        {selectedEvents.length === 0 ? (
          <Typography sx={{ fontSize: "0.82rem", color: "var(--font-tertiary)", py: 0.5 }}>
            Nothing scheduled.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {selectedEvents.map((ev) => {
              const meta = CALENDAR_TYPE_META[ev.type];
              return (
                <Box
                  key={ev.id}
                  onClick={ev.onClick}
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "flex-start",
                    p: 1.25,
                    borderRadius: "12px",
                    border: "1px solid var(--border-default)",
                    cursor: ev.onClick ? "pointer" : "default",
                    transition: "border-color .15s",
                    ...(ev.onClick && { "&:hover": { borderColor: meta.color } }),
                  }}
                >
                  <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: meta.color, mt: 0.5, flexShrink: 0 }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--font-primary)", lineHeight: 1.25 }}>
                      {ev.title}
                    </Typography>
                    <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary)" }}>
                      {[clock(ev), ev.note, ev.subtitle].filter(Boolean).join(" · ")}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Legend */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, pt: 0.5 }}>
        {(Object.keys(CALENDAR_TYPE_META) as CalendarEventType[]).map((t) => (
          <Box key={t} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: CALENDAR_TYPE_META[t].color }} />
            <Typography sx={{ fontSize: "0.74rem", color: "var(--font-secondary)", fontWeight: 500 }}>
              {CALENDAR_TYPE_META[t].label}
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography sx={{ fontSize: "0.74rem", color: "var(--font-tertiary)", fontStyle: "italic" }}>
        Click any dotted date to see what&apos;s on.
      </Typography>
    </Box>
  );
}

function NavBtn({ icon, onClick, label }: { icon: string; onClick: () => void; label: string }) {
  return (
    <Box
      component="button"
      aria-label={label}
      onClick={onClick}
      sx={{
        display: "grid",
        placeItems: "center",
        width: 30,
        height: 30,
        borderRadius: "10px",
        border: "1px solid var(--border-default)",
        bgcolor: "transparent",
        color: "var(--font-secondary)",
        cursor: "pointer",
        "&:hover": { borderColor: "#7c3aed", color: "#7c3aed" },
      }}
    >
      <Icon icon={icon} width={18} />
    </Box>
  );
}
