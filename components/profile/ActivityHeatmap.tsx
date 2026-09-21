"use client";

import {
  Box,
  ButtonBase,
  Paper,
  Typography,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  alpha,
} from "@mui/material";
import { HeatmapData } from "@/lib/services/profile.service";
import { IconWrapper } from "@/components/common/IconWrapper";
import { ScrollRow } from "@/components/common/mobile/ScrollRow";
import { phoneText } from "@/components/common/mobile/phoneText";
import { useState, useMemo } from "react";
import { buildYearDates, localDateKey } from "./heatmapDates";
import { HEAT_SCALE, PANEL_BORDER, PANEL_RADIUS, PANEL_SHADOW, PROFILE, TILE_GRADIENT } from "./theme/profileTokens";

interface ActivityHeatmapProps {
  heatmapData: HeatmapData;
  /** Override subtitle, e.g. "Learning activity this year" for admin view */
  subtitle?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Mon-first, so the phone grid and the desktop columns start on the same weekday. */
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const ACTIVITY_LABELS: Record<string, string> = {
  Quiz: "Quizzes",
  Article: "Articles",
  Assignment: "Assignments",
  CodingProblem: "Coding Problems",
  DevCodingProblem: "Dev Coding Problems",
  VideoTutorial: "Video Tutorials",
};

/** Violet intensity ladder from profileTokens.HEAT_SCALE. */
const getColor = (level: number) => HEAT_SCALE[Math.min(Math.max(level, 0), 4)];

/** The day number has to stay readable once the tile goes dark at the top of the ladder. */
const getInkOn = (level: number) => (level >= 3 ? "#ffffff" : level === 0 ? PROFILE.inkFaint : PROFILE.ink);

export function ActivityHeatmap({ heatmapData, subtitle = "Your learning activity this year" }: ActivityHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  /**
   * Phone only. A 53-week wall is a desktop object: at 17px a column it is ~1000px wide, so on a
   * 390px screen it became a sideways drag with "Mon" and "Jan" floating off the edge. The phone
   * reads one month at a time instead - same data, same ladder, no dragging.
   */
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const years = Array.from({ length: 3 }, (_, i) => currentYear - 2 + i);

  /** Built from local calendar components; see heatmapDates.localDateKey for why not toISOString. */
  const allDates = useMemo(() => buildYearDates(selectedYear, heatmapData), [selectedYear, heatmapData]);

  /** Parse YYYY-MM-DD as local date to avoid timezone shifting getDay() */
  const parseLocal = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const stats = useMemo(() => {
    const totalActivities = allDates.reduce((s, d) => s + d.count, 0);
    const daysActive = allDates.filter((d) => d.count > 0).length;
    return { totalActivities, daysActive };
  }, [allDates]);

  const emptyDay = {
    date: "",
    count: 0,
    level: -1,
    activities: {
      Quiz: 0,
      Article: 0,
      Assignment: 0,
      CodingProblem: 0,
      DevCodingProblem: 0,
      VideoTutorial: 0,
    },
  };

  /** Build weeks: Mon–Sun (ISO), pad start so Jan 1 falls in correct column */
  const weeks: (typeof allDates)[] = [];
  let currentWeek: typeof allDates = [];
  const firstDate = parseLocal(allDates[0].date);
  const firstWeekday = firstDate.getDay();
  const isoMondayOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  for (let i = 0; i < isoMondayOffset; i++) {
    currentWeek.push({ ...emptyDay, activities: { ...emptyDay.activities } });
  }

  const activityLabels = ACTIVITY_LABELS;

  const todayStr = localDateKey(new Date());
  const isCurrentYear = selectedYear === currentYear;

  allDates.forEach((date) => {
    currentWeek.push(date);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ ...emptyDay, activities: { ...emptyDay.activities } });
    }
    weeks.push(currentWeek);
  }

  const months = MONTHS;

  /** One label per month: place at the week containing the 1st. Compute via day-of-year to avoid duplicates. */
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const firstOfMonth = new Date(selectedYear, m, 1);
      const dayOfYear = Math.floor((firstOfMonth.getTime() - new Date(selectedYear, 0, 0).getTime()) / 86400000);
      const weekIndex = Math.floor((dayOfYear + isoMondayOffset) / 7);
      if (weekIndex >= 0 && weekIndex < weeks.length) {
        labels.push({ month: months[m], weekIndex });
      }
    }
    return labels;
  }, [weeks.length, selectedYear, isoMondayOffset]);

  /**
   * The phone month: the selected month's days, preceded by blanks so the 1st lands under its
   * real weekday. Seven fluid columns, so this is 326px wide on a 390px screen with nothing to
   * drag, and each tile is a ~43px tap target rather than a 16px square.
   */
  const monthCells = useMemo(() => {
    const prefix = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-`;
    const days = allDates.filter((d) => d.date.startsWith(prefix));
    if (days.length === 0) return [];
    const firstDow = parseLocal(days[0].date).getDay();
    const pad = firstDow === 0 ? 6 : firstDow - 1;
    const cells: (typeof allDates[number] | null)[] = Array.from({ length: pad }, () => null);
    return cells.concat(days);
  }, [allDates, selectedMonth, selectedYear]);

  const monthTotal = useMemo(
    () => monthCells.reduce((s, d) => s + (d?.count ?? 0), 0),
    [monthCells],
  );

  const selected = selectedDay ? allDates.find((d) => d.date === selectedDay) ?? null : null;

  /** Changing the year or the month invalidates whatever day was being inspected. */
  const pickMonth = (m: number) => {
    setSelectedMonth(m);
    setSelectedDay(null);
  };

  const cellSize = 16;
  const cellGap = 1;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 2.75 },
        border: PANEL_BORDER,
        borderRadius: PANEL_RADIUS,
        boxShadow: PANEL_SHADOW,
        backgroundColor: "var(--card-bg)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0, flex: 1 }}>
          {/* Was a 56px green gradient slab with an inset highlight and a drop-shadowed icon.
              Every other card on this page opens with the same 30px indigo→violet tile, so
              this one now does too: one icon-tile language, not two. */}
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 2,
              flexShrink: 0,
              background: TILE_GRADIENT,
              display: "grid",
              placeItems: "center",
              color: "#fff",
            }}
          >
            <IconWrapper icon="mdi:chart-box-outline" size={17} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h3"
              sx={{
                fontWeight: 800,
                color: PROFILE.ink,
                fontSize: "0.95rem",
                lineHeight: 1.2,
                letterSpacing: "-0.2px",
              }}
            >
              Activity
            </Typography>
            <Typography sx={{ color: PROFILE.inkFaint, fontSize: phoneText(0.72), mt: "1px" }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <Select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setSelectedDay(null);
            }}
            inputProps={{ "aria-label": "Year" }}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              fontSize: "0.9375rem",
              bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
              // A 32px select is a desktop control. On a phone it is the only thing to hit in
              // this header, so it gets a full thumb target.
              // Scoped by media query so the desktop Select keeps MUI's own min-height untouched.
              "@media (max-width:599.95px)": {
                // border-box + zero vertical padding: the old content-box min-height of 44 plus
                // MUI's 8.5px padding each side rendered a 61px control. This is 44 exactly, and
                // the whole 44 is the clickable select element, not dead input-root padding.
                "& .MuiSelect-select": {
                  boxSizing: "border-box",
                  height: 44,
                  minHeight: "0 !important",
                  py: 0,
                  display: "flex",
                  alignItems: "center",
                },
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "divider",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.main",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.main",
                borderWidth: 2,
              },
            }}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Summary stats */}
      <Box
        sx={{
          display: "flex",
          gap: { xs: 1.5, sm: 2 },
          flexWrap: "wrap",
          mb: 2.5,
          pb: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1,
            borderRadius: 2,
            // Was success-green, the only green on the page. The two pills now read as one
            // pair (violet + indigo) instead of a traffic light.
            bgcolor: PROFILE.violetSoft,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconWrapper icon="mdi:calendar-check" size={18} color={PROFILE.violet} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: PROFILE.violet }}>
            {stats.daysActive}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
            days active
          </Typography>
        </Box>
        <Box
          sx={{
            px: 2,
            py: 1,
            borderRadius: 2,
            bgcolor: (t) => alpha(t.palette.primary.main, 0.08),
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconWrapper icon="mdi:layers" size={18} color="var(--accent-indigo)" />
          <Typography variant="body2" sx={{ fontWeight: 600, color: "var(--accent-indigo)" }}>
            {stats.totalActivities}
          </Typography>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)" }}>
            activities
          </Typography>
        </Box>
      </Box>

      {/* ------------------------------------------------------------------
          Phone: one month, seven fluid columns, tap a day to read it.
          Chosen by CSS rather than by useMediaQuery so the server and the
          first client render agree.
         ------------------------------------------------------------------ */}
      <Box data-testid="heatmap-month-view" sx={{ display: { xs: "block", sm: "none" } }}>
        <ScrollRow gutter={2} gap={0.75} ariaLabel="Month">
          {months.map((m, i) => (
            <ButtonBase
              key={m}
              onClick={() => pickMonth(i)}
              aria-pressed={i === selectedMonth}
              sx={{
                px: 1.75,
                minHeight: 40,
                borderRadius: 999,
                fontSize: "0.8125rem",
                fontWeight: 700,
                whiteSpace: "nowrap",
                border: `1px solid ${i === selectedMonth ? PROFILE.violet : PROFILE.hairline}`,
                bgcolor: i === selectedMonth ? PROFILE.violet : "transparent",
                color: i === selectedMonth ? "#fff" : PROFILE.inkMuted,
                "&:focus-visible": { outline: `2px solid ${PROFILE.violet}`, outlineOffset: 2 },
              }}
            >
              {m}
            </ButtonBase>
          ))}
        </ScrollRow>

        <Box
          sx={{
            mt: 2,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: PROFILE.ink }}>
            {MONTHS_LONG[selectedMonth]} {selectedYear}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: PROFILE.inkFaint }}>
            {monthTotal} {monthTotal === 1 ? "activity" : "activities"}
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 0.5,
            // A grid child defaults to min-width:auto, which is how a wide cell pushes the
            // whole row past the screen. minmax(0,1fr) plus this is the belt and braces.
            "& > *": { minWidth: 0 },
          }}
        >
          {WEEKDAYS.map((w, i) => (
            <Typography
              key={`${w}-${i}`}
              sx={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: PROFILE.inkFaint,
                textAlign: "center",
                pb: 0.5,
              }}
            >
              {w}
            </Typography>
          ))}

          {monthCells.map((day, i) =>
            day === null ? (
              <Box key={`pad-${i}`} aria-hidden sx={{ aspectRatio: "1 / 1" }} />
            ) : (
              <ButtonBase
                key={day.date}
                onClick={() => setSelectedDay((prev) => (prev === day.date ? null : day.date))}
                aria-pressed={selectedDay === day.date}
                aria-label={`${day.date}, ${day.count} ${day.count === 1 ? "activity" : "activities"}`}
                sx={{
                  aspectRatio: "1 / 1",
                  width: "100%",
                  borderRadius: 2,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  backgroundColor: getColor(day.level),
                  color: getInkOn(day.level),
                  ...(day.date === todayStr && isCurrentYear
                    ? { boxShadow: `inset 0 0 0 2px ${PROFILE.ink}` }
                    : {}),
                  ...(selectedDay === day.date
                    ? { boxShadow: `inset 0 0 0 2px ${PROFILE.violet}` }
                    : {}),
                  "&:focus-visible": { outline: `2px solid ${PROFILE.violet}`, outlineOffset: 2 },
                }}
              >
                {Number(day.date.slice(8))}
              </ButtonBase>
            ),
          )}
        </Box>

        {/* The desktop reads a day by hovering it. A thumb cannot hover, so the same detail
            lands here instead of in a tooltip a phone will never show. */}
        <Box
          data-testid="heatmap-day-detail"
          sx={{
            mt: 1.75,
            px: 1.75,
            py: 1.5,
            borderRadius: 3,
            border: `1px solid ${PROFILE.hairlineSoft}`,
            bgcolor: PROFILE.violetSoft,
            minHeight: 64,
          }}
        >
          {selected ? (
            <>
              <Typography sx={{ fontSize: "0.8125rem", fontWeight: 800, color: PROFILE.ink }}>
                {selected.date} · {selected.count} {selected.count === 1 ? "activity" : "activities"}
              </Typography>
              {selected.count === 0 ? (
                <Typography sx={{ fontSize: "0.75rem", color: PROFILE.inkFaint, mt: 0.5 }}>
                  Nothing logged on this day.
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                  {Object.entries(selected.activities)
                    .filter(([, c]) => c > 0)
                    .map(([key, count]) => (
                      <Box
                        key={key}
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 999,
                          bgcolor: "#fff",
                          border: `1px solid ${PROFILE.violetBorder}`,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: PROFILE.violet,
                        }}
                      >
                        {activityLabels[key] ?? key}: {count}
                      </Box>
                    ))}
                </Box>
              )}
            </>
          ) : (
            <Typography sx={{ fontSize: "0.8125rem", color: PROFILE.inkFaint }}>
              Tap a day to see what you did.
            </Typography>
          )}
        </Box>
      </Box>

      {/* Heatmap - Full width, centered. Desktop only: see the month view above. */}
      <Box
        data-testid="heatmap-year-view"
        sx={{ display: { xs: "none", sm: "flex" }, overflowX: "auto", pb: 1, width: "100%", justifyContent: "center" }}
      >
        <Box sx={{ display: "flex", gap: 2, minWidth: "fit-content" }}>
          {/* Day labels */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
              pr: 1,
            }}
          >
            {["Mon", "Wed", "Fri"].map((day, index) => (
              <Typography
                key={day}
                variant="caption"
                sx={{
                  fontSize: "0.6875rem", // sm-up only: heatmap-year-view is display:none on xs
                  color: "var(--font-secondary)",
                  fontWeight: 500,
                  lineHeight: `${cellSize + cellGap}px`,
                  height: index === 0 ? cellSize + cellGap : (cellSize + cellGap) * 2,
                  display: "flex",
                  alignItems: index === 0 ? "flex-start" : "center",
                }}
              >
                {day}
              </Typography>
            ))}
          </Box>

          {/* Heatmap grid - larger cells for better visibility */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                gap: `${cellGap}px`,
                mb: 0.5,
                minWidth: "fit-content",
              }}
            >
              {weeks.map((_, weekIndex) => {
                const monthLabel = monthLabels.find((l) => l.weekIndex === weekIndex);
                return (
                  <Box
                    key={weekIndex}
                    sx={{
                      width: cellSize + cellGap,
                      height: 16,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {monthLabel && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.6875rem", // sm-up only: heatmap-year-view is display:none on xs
                          color: "var(--font-secondary)",
                          fontWeight: 600,
                        }}
                      >
                        {monthLabel.month}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: `${cellGap}px`,
                minWidth: "fit-content",
              }}
            >
              {weeks.map((week, weekIndex) => (
                <Box
                  key={weekIndex}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: `${cellGap}px`,
                  }}
                >
                  {week.map((day, dayIndex) => {
                    const isTodayCell = day.date === todayStr && isCurrentYear;
                    return day.level === -1 ? (
                      <Box key={dayIndex} sx={{ width: cellSize, height: cellSize, display: "flex", alignItems: "center", justifyContent: "center" }} />
                    ) : (
                      <Tooltip
                        key={dayIndex}
                        title={
                          <Box sx={{ py: 0.5, px: 0.5, maxWidth: 220 }}>
                            <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 1, color: "var(--font-light)" }}>
                              {day.date}
                            </Typography>
                            {day.count === 0 ? (
                              <Typography variant="caption" sx={{ color: "color-mix(in srgb, var(--font-light) 70%, transparent)" }}>No activities</Typography>
                            ) : (
                              <>
                                <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600, color: "var(--font-light)" }}>
                                  {day.count} {day.count === 1 ? "activity" : "activities"}
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                                  {Object.entries(day.activities)
                                    .filter(([, c]) => c > 0)
                                    .map(([key, count]) => (
                                      <Typography key={key} variant="caption" sx={{ color: "color-mix(in srgb, var(--font-light) 85%, transparent)" }}>
                                        {activityLabels[key] ?? key}: {count}
                                      </Typography>
                                    ))}
                                </Box>
                              </>
                            )}
                          </Box>
                        }
                        arrow
                        slotProps={{
                          tooltip: {
                            sx: {
                              bgcolor: "color-mix(in srgb, var(--font-primary) 92%, var(--background))",
                              "& .MuiTooltip-arrow": { color: "color-mix(in srgb, var(--font-primary) 92%, var(--background))" },
                            },
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: cellSize,
                            height: cellSize,
                            borderRadius: "4px",
                            backgroundColor: getColor(day.level),
                            cursor: "pointer",
                            transition: "transform 0.2s ease, box-shadow 0.2s ease",
                            // Inset ring stays inside the cell so Paper overflow:hidden / tight grids do not clip it (outline draws outside the box).
                            ...(isTodayCell
                              ? {
                                  boxShadow: "inset 0 0 0 2px var(--font-primary)",
                                  position: "relative",
                                  zIndex: 1,
                                }
                              : {}),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            "&:hover": {
                              transform: "scale(1.2)",
                              boxShadow: isTodayCell
                                ? "inset 0 0 0 2px var(--font-primary), 0 3px 10px color-mix(in srgb, var(--font-primary) 25%, transparent)"
                                : "0 3px 10px color-mix(in srgb, var(--font-primary) 22%, transparent)",
                              zIndex: 2,
                            },
                          }}
                        />
                      </Tooltip>
                    );
                  })}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Legend */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          mt: 2.5,
          pt: 2,
          borderTop: "1px solid",
          borderColor: "divider",
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, justifyContent: "center" }}>
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem", fontWeight: 500 }}>
            Less
          </Typography>
          {[0, 1, 2, 3, 4].map((level) => (
            <Box
              key={level}
              sx={{
                width: cellSize,
                height: cellSize,
                borderRadius: "4px",
                backgroundColor: getColor(level),
              }}
            />
          ))}
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", fontSize: "0.8125rem", fontWeight: 500 }}>
            More
          </Typography>
        </Box>
        {isCurrentYear && (
          <Typography variant="caption" sx={{ color: "var(--font-tertiary)", fontSize: "0.75rem" }}>
            Today highlighted
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
