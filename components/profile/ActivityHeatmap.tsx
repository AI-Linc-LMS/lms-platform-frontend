"use client";

import {
  Box,
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
import { useState, useMemo } from "react";

interface ActivityHeatmapProps {
  heatmapData: HeatmapData;
  /** Override subtitle, e.g. "Learning activity this year" for admin view */
  subtitle?: string;
}

export function ActivityHeatmap({ heatmapData, subtitle = "Your learning activity this year" }: ActivityHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = Array.from({ length: 3 }, (_, i) => currentYear - 2 + i);

  const calculateLevel = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 10) return 3;
    return 4;
  };

  const generateYearDates = () => {
    const dates: {
      date: string;
      count: number;
      level: number;
      activities: Record<string, number>;
    }[] = [];
    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split("T")[0];
      const activityData = heatmapData[dateStr];
      const count = activityData?.total || 0;
      dates.push({
        date: dateStr,
        count,
        level: calculateLevel(count),
        activities: {
          Quiz: activityData?.Quiz || 0,
          Article: activityData?.Article || 0,
          Assignment: activityData?.Assignment || 0,
          CodingProblem: activityData?.CodingProblem || 0,
          DevCodingProblem: activityData?.DevCodingProblem || 0,
          VideoTutorial: activityData?.VideoTutorial || 0,
        },
      });
    }
    return dates;
  };

  const allDates = generateYearDates();

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

  const activityLabels: Record<string, string> = {
    Quiz: "Quizzes",
    Article: "Articles",
    Assignment: "Assignments",
    CodingProblem: "Coding Problems",
    DevCodingProblem: "Dev Coding Problems",
    VideoTutorial: "Video Tutorials",
  };

  const todayStr = new Date().toISOString().split("T")[0];
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

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

  const getColor = (level: number) => {
    switch (level) {
      case 0:
        return "#ebedf0";
      case 1:
        return "#9be9a8";
      case 2:
        return "#40c463";
      case 3:
        return "#30a14e";
      case 4:
        return "#216e39";
      default:
        return "#ebedf0";
    }
  };

  const cellSize = 16;
  const cellGap = 1;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        backgroundColor: "#ffffff",
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2.5,
              background: "linear-gradient(145deg, #34d399 0%, #22c55e 50%, #16a34a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(34, 197, 94, 0.4), 0 0 0 1px rgba(255,255,255,0.2) inset",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)`,
                borderRadius: "inherit",
                pointerEvents: "none",
              },
            }}
          >
            <IconWrapper icon="mdi:chart-box-outline" size={28} color="#fff" style={{ position: "relative", zIndex: 1, filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#111827",
                fontSize: "1.25rem",
                letterSpacing: "-0.02em",
              }}
            >
              Activity
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", fontSize: "0.875rem", mt: 0.25 }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              fontSize: "0.9375rem",
              bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
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
            bgcolor: (t) => alpha(t.palette.success.main, 0.1),
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <IconWrapper icon="mdi:calendar-check" size={18} color="#16a34a" />
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#166534" }}>
            {stats.daysActive}
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280" }}>
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
          <IconWrapper icon="mdi:layers" size={18} color="#0a66c2" />
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#0a66c2" }}>
            {stats.totalActivities}
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280" }}>
            activities
          </Typography>
        </Box>
      </Box>

      {/* Heatmap - Full width, centered */}
      <Box sx={{ overflowX: "auto", pb: 1, width: "100%", display: "flex", justifyContent: "center" }}>
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
                  fontSize: "0.6875rem",
                  color: "#6b7280",
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
                          fontSize: "0.6875rem",
                          color: "#6b7280",
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
                            <Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 1, color: "#fff" }}>
                              {day.date}
                            </Typography>
                            {day.count === 0 ? (
                              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>No activities</Typography>
                            ) : (
                              <>
                                <Typography variant="caption" sx={{ display: "block", mb: 0.5, fontWeight: 600, color: "#fff" }}>
                                  {day.count} {day.count === 1 ? "activity" : "activities"}
                                </Typography>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
                                  {Object.entries(day.activities)
                                    .filter(([, c]) => c > 0)
                                    .map(([key, count]) => (
                                      <Typography key={key} variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
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
                              bgcolor: "grey.900",
                              "& .MuiTooltip-arrow": { color: "grey.900" },
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
                                  boxShadow: "inset 0 0 0 2px #111827",
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
                                ? "inset 0 0 0 2px #111827, 0 3px 10px rgba(0, 0, 0, 0.25)"
                                : "0 3px 10px rgba(0, 0, 0, 0.2)",
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
          <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.8125rem", fontWeight: 500 }}>
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
          <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.8125rem", fontWeight: 500 }}>
            More
          </Typography>
        </Box>
        {isCurrentYear && (
          <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.75rem" }}>
            Today highlighted
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
