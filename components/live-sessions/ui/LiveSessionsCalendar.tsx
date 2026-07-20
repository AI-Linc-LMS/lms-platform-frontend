"use client";

import { useMemo, useState } from "react";
import { Box, ButtonBase, Chip, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { LiveActivity } from "@/lib/services/admin/admin-live-activities.service";

type Status = "scheduled" | "live" | "ended" | "expired" | "cancelled";

const STATUS_COLOR: Record<Status, string> = {
  scheduled: "var(--accent-indigo)",
  live: "var(--success-500)",
  ended: "var(--font-tertiary)",
  expired: "var(--warning-500)",
  cancelled: "var(--error-500)",
};

interface DayEntry {
  session: LiveActivity;
  when: Date;
  status: Status;
  recurring: boolean;
}

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Explode a session into one calendar entry per date — per occurrence for a recurring series,
 * otherwise a single entry on its class_datetime. */
function entriesFor(session: LiveActivity): DayEntry[] {
  if (session.occurrences && session.occurrences.length) {
    return session.occurrences
      .filter((o) => o.status !== "cancelled")
      .map((o) => ({
        session,
        when: new Date(o.occurrence_datetime),
        status: (o.meeting_status as Status) || "scheduled",
        recurring: true,
      }));
  }
  return [{
    session,
    when: new Date(session.class_datetime),
    status: (session.meeting_status as Status) || "scheduled",
    recurring: false,
  }];
}

interface LiveSessionsCalendarProps {
  sessions: LiveActivity[];
  onOpen: (session: LiveActivity) => void;
}

export function LiveSessionsCalendar({ sessions, onOpen }: LiveSessionsCalendarProps) {
  const { t } = useTranslation("common");
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Bucket all entries by day.
  const byDay = useMemo(() => {
    const map = new Map<string, DayEntry[]>();
    for (const s of sessions) {
      for (const e of entriesFor(s)) {
        if (isNaN(e.when.getTime())) continue;
        const k = dayKey(e.when);
        let list = map.get(k);
        if (!list) { list = []; map.set(k, list); }
        list.push(e);
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.when.getTime() - b.when.getTime());
    return map;
  }, [sessions]);

  // 6x7 grid of dates starting on the Sunday on/before the 1st.
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = new Date(first);
    gridStart.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const selectedEntries = selectedKey ? byDay.get(selectedKey) ?? [] : [];

  const navBtn = (icon: string, onClick: () => void) => (
    <ButtonBase onClick={onClick} sx={{
      width: 34, height: 34, borderRadius: "10px", border: "1px solid var(--border-default)",
      color: "var(--font-secondary)", "&:hover": { bgcolor: "var(--surface)" },
    }}>
      <IconWrapper icon={icon} size={18} />
    </ButtonBase>
  );

  return (
    <Box sx={{
      p: { xs: 1.5, md: 2.5 }, borderRadius: "18px", border: "1px solid var(--border-default)",
      bgcolor: "var(--card-bg)",
    }}>
      {/* Month header */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2, flexWrap: "wrap", gap: 1 }}>
        <Typography sx={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--font-primary)" }}>{monthLabel}</Typography>
        <Box sx={{ display: "flex", gap: 0.75, alignItems: "center" }}>
          <ButtonBase onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); }}
            sx={{ px: 1.75, py: 0.75, borderRadius: 999, fontSize: "0.8rem", fontWeight: 700,
              border: "1px solid var(--border-default)", color: "var(--font-secondary)",
              "&:hover": { bgcolor: "var(--surface)" } }}>
            {t("adminLiveSessions.today", "Today")}
          </ButtonBase>
          {navBtn("mdi:chevron-left", () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)))}
          {navBtn("mdi:chevron-right", () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)))}
        </Box>
      </Box>

      {/* Weekday header */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5, mb: 0.5 }}>
        {weekdays.map((w) => (
          <Typography key={w} sx={{ textAlign: "center", fontSize: "0.72rem", fontWeight: 700,
            letterSpacing: "0.04em", color: "var(--font-tertiary)", textTransform: "uppercase" }}>{w}</Typography>
        ))}
      </Box>

      {/* Day grid */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
        {cells.map((d, i) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = dayKey(d) === dayKey(today);
          const k = dayKey(d);
          const entries = byDay.get(k) ?? [];
          const selected = selectedKey === k;
          return (
            <ButtonBase
              key={i}
              onClick={() => setSelectedKey(entries.length ? k : null)}
              sx={{
                display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start",
                minHeight: { xs: 62, md: 92 }, p: 0.75, borderRadius: "10px", textAlign: "left",
                border: selected ? "1.5px solid var(--accent-indigo)" : "1px solid transparent",
                bgcolor: isToday ? "color-mix(in srgb, var(--accent-indigo) 8%, transparent)" : "transparent",
                opacity: inMonth ? 1 : 0.38,
                cursor: entries.length ? "pointer" : "default",
                "&:hover": { bgcolor: entries.length ? "var(--surface)" : undefined },
              }}
            >
              <Typography sx={{
                fontSize: "0.78rem", fontWeight: isToday ? 800 : 600, mb: 0.4,
                color: isToday ? "var(--accent-indigo)" : "var(--font-secondary)",
                fontVariantNumeric: "tabular-nums",
              }}>{d.getDate()}</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.3, overflow: "hidden" }}>
                {entries.slice(0, 3).map((e, j) => (
                  <Box key={j} onClick={(ev) => { ev.stopPropagation(); onOpen(e.session); }}
                    sx={{
                      display: "flex", alignItems: "center", gap: 0.4, px: 0.5, py: 0.15, borderRadius: "5px",
                      bgcolor: `color-mix(in srgb, ${STATUS_COLOR[e.status]} 14%, transparent)`,
                      "&:hover": { bgcolor: `color-mix(in srgb, ${STATUS_COLOR[e.status]} 24%, transparent)` },
                    }}>
                    <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: STATUS_COLOR[e.status], flexShrink: 0 }} />
                    <Typography sx={{ fontSize: "0.66rem", fontWeight: 600, color: "var(--font-primary)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {e.session.topic_name}
                    </Typography>
                  </Box>
                ))}
                {entries.length > 3 && (
                  <Typography sx={{ fontSize: "0.64rem", fontWeight: 700, color: "var(--font-tertiary)", pl: 0.5 }}>
                    +{entries.length - 3} {t("adminLiveSessions.more", "more")}
                  </Typography>
                )}
              </Box>
            </ButtonBase>
          );
        })}
      </Box>

      {/* Selected-day panel */}
      {selectedKey && selectedEntries.length > 0 && (
        <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid var(--border-default)", display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography sx={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--font-primary)" }}>
            {new Date(selectedEntries[0].when).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </Typography>
          {selectedEntries.map((e, j) => (
            <ButtonBase key={j} onClick={() => onOpen(e.session)}
              sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, width: "100%",
                p: 1.25, borderRadius: "12px", border: "1px solid var(--border-default)", textAlign: "left",
                "&:hover": { bgcolor: "var(--surface)" } }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: STATUS_COLOR[e.status], flexShrink: 0 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--font-primary)",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.session.topic_name}</Typography>
                  <Typography sx={{ fontSize: "0.76rem", color: "var(--font-tertiary)" }}>
                    {e.when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {e.session.duration_minutes} {t("liveSessions.minShort", "min")}
                  </Typography>
                </Box>
              </Box>
              {e.recurring && (
                <Chip size="small" icon={<IconWrapper icon="mdi:calendar-refresh" size={13} />} label={t("adminLiveSessions.recurring", "Recurring")}
                  sx={{ fontSize: "0.68rem", fontWeight: 700, bgcolor: "var(--surface-indigo-light)", color: "var(--accent-indigo)" }} />
              )}
            </ButtonBase>
          ))}
        </Box>
      )}
    </Box>
  );
}
