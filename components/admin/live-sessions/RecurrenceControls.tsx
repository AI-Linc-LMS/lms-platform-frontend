"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Chip, MenuItem, Radio, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { IconWrapper } from "@/components/common/IconWrapper";
import type { LiveSessionRecurrence } from "@/lib/services/admin/admin-live-activities.service";
import { expandRecurrence, summarizeRecurrence } from "@/lib/utils/live-session-recurrence";

type Freq = "none" | "daily" | "weekly" | "monthly";
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface RecurrenceControlsProps {
  /** The session's start (the wizard's classDatetime, `YYYY-MM-DDTHH:mm`). */
  startDatetime: string;
  onChange: (rule: LiveSessionRecurrence | null) => void;
}

/**
 * "Repeat" controls for the create wizard: frequency + interval + (weekly days | monthly day) +
 * end (after N / on date), with a live preview of the next dates. Emits the friendly
 * LiveSessionRecurrence the backend expects, or null for a one-off session.
 */
export function RecurrenceControls({ startDatetime, onChange }: RecurrenceControlsProps) {
  const { t } = useTranslation("common");
  const start = useMemo(() => new Date(startDatetime), [startDatetime]);
  const startDow = isNaN(start.getTime()) ? 1 : start.getDay();

  const [freq, setFreq] = useState<Freq>("none");
  const [interval, setInterval] = useState(1);
  const [weeklyDays, setWeeklyDays] = useState<number[]>([startDow]);
  const [endType, setEndType] = useState<"count" | "date">("count");
  const [endCount, setEndCount] = useState(10);
  const [endDate, setEndDate] = useState("");

  // Keep the weekly default aligned to the chosen start day until the user edits it.
  const touchedWeekly = useRef(false);
  useEffect(() => {
    if (!touchedWeekly.current) setWeeklyDays([startDow]);
  }, [startDow]);

  const rule: LiveSessionRecurrence | null = useMemo(() => {
    if (freq === "none") return null;
    const end =
      endType === "count"
        ? { type: "count" as const, count: Math.max(1, Math.min(50, endCount || 1)) }
        : { type: "date" as const, date: endDate };
    if (endType === "date" && !endDate) return null; // incomplete → treat as not-yet-valid
    const base = { interval: Math.max(1, interval), end };
    if (freq === "weekly")
      return { frequency: "weekly", weekly_days: weeklyDays.length ? weeklyDays : [startDow], ...base };
    if (freq === "monthly")
      return { frequency: "monthly", monthly_day: isNaN(start.getDate()) ? 1 : start.getDate(), ...base };
    return { frequency: "daily", ...base };
  }, [freq, interval, weeklyDays, endType, endCount, endDate, startDow, start]);

  // Emit upward without depending on onChange identity.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    onChangeRef.current(rule);
  }, [rule]);

  const preview = useMemo(() => (rule ? expandRecurrence(rule, start).slice(0, 4) : []), [rule, start]);
  const totalCount = useMemo(() => (rule ? expandRecurrence(rule, start).length : 0), [rule, start]);

  const unitLabel = freq === "daily" ? "day" : freq === "weekly" ? "week" : "month";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
      <TextField
        select size="small" label={t("adminLiveSessions.repeat", "Repeat")}
        value={freq} onChange={(e) => setFreq(e.target.value as Freq)}
        sx={{ maxWidth: 260 }}
      >
        <MenuItem value="none">{t("adminLiveSessions.repeatNone", "Does not repeat")}</MenuItem>
        <MenuItem value="daily">{t("adminLiveSessions.repeatDaily", "Daily")}</MenuItem>
        <MenuItem value="weekly">{t("adminLiveSessions.repeatWeekly", "Weekly")}</MenuItem>
        <MenuItem value="monthly">{t("adminLiveSessions.repeatMonthly", "Monthly")}</MenuItem>
      </TextField>

      {freq !== "none" && (
        <Box
          sx={{
            display: "flex", flexDirection: "column", gap: 1.75, p: 2, borderRadius: 3,
            border: "1px solid color-mix(in srgb, var(--accent-indigo) 22%, transparent)",
            bgcolor: "color-mix(in srgb, var(--accent-indigo) 5%, transparent)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", fontWeight: 600 }}>
              {t("adminLiveSessions.repeatEvery", "Repeat every")}
            </Typography>
            <TextField
              type="number" size="small" value={interval}
              onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value || "1", 10)))}
              inputProps={{ min: 1, max: freq === "daily" ? 90 : freq === "weekly" ? 12 : 3 }}
              sx={{ width: 84 }}
            />
            <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", fontWeight: 600 }}>
              {interval > 1 ? `${unitLabel}s` : unitLabel}
            </Typography>
          </Box>

          {freq === "weekly" && (
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
              {WEEKDAYS.map((label, dow) => {
                const on = weeklyDays.includes(dow);
                return (
                  <Chip
                    key={dow} label={label} size="small"
                    onClick={() => {
                      touchedWeekly.current = true;
                      setWeeklyDays((prev) =>
                        prev.includes(dow) ? prev.filter((d) => d !== dow) : [...prev, dow]
                      );
                    }}
                    sx={{
                      fontWeight: 700, cursor: "pointer",
                      bgcolor: on ? "var(--accent-indigo)" : "var(--surface)",
                      color: on ? "#fff" : "var(--font-secondary)",
                      border: "1px solid var(--border-default)",
                      "&:hover": { bgcolor: on ? "var(--accent-indigo-dark)" : "var(--surface-indigo-light)" },
                    }}
                  />
                );
              })}
            </Box>
          )}

          {freq === "monthly" && !isNaN(start.getDate()) && (
            <Typography sx={{ fontSize: "0.82rem", color: "var(--font-tertiary)" }}>
              {t("adminLiveSessions.repeatMonthlyOnDay", "On day")} {start.getDate()} {t("adminLiveSessions.ofEachMonth", "of each month")}
            </Typography>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)", fontWeight: 600 }}>
              {t("adminLiveSessions.repeatEnds", "Ends")}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Radio size="small" checked={endType === "count"} onChange={() => setEndType("count")} />
              <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)" }}>
                {t("adminLiveSessions.repeatAfter", "After")}
              </Typography>
              <TextField
                type="number" size="small" value={endCount} disabled={endType !== "count"}
                onChange={(e) => setEndCount(Math.max(1, Math.min(50, parseInt(e.target.value || "1", 10))))}
                inputProps={{ min: 1, max: 50 }} sx={{ width: 84 }}
              />
              <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)" }}>
                {t("adminLiveSessions.occurrences", "occurrences")}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Radio size="small" checked={endType === "date"} onChange={() => setEndType("date")} />
              <Typography sx={{ fontSize: "0.85rem", color: "var(--font-secondary)" }}>
                {t("adminLiveSessions.repeatOnDate", "On date")}
              </Typography>
              <TextField
                type="date" size="small" value={endDate} disabled={endType !== "date"}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }} sx={{ width: 180 }}
              />
            </Box>
          </Box>

          {rule && preview.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, pt: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <IconWrapper icon="mdi:calendar-refresh" size={16} color="var(--accent-indigo)" />
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--font-primary)" }}>
                  {summarizeRecurrence(rule)}{totalCount ? ` · ${totalCount} ${t("adminLiveSessions.sessions", "sessions")}` : ""}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: "0.78rem", color: "var(--font-tertiary)" }}>
                {t("adminLiveSessions.repeatNextDates", "Next")}: {preview.map((d) =>
                  d.toLocaleDateString(undefined, { month: "short", day: "numeric" })).join(" · ")}
                {totalCount > preview.length ? " …" : ""}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
