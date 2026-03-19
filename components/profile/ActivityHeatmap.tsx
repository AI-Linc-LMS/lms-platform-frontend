"use client";

import {
  Box,
  Paper,
  Typography,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { HeatmapData } from "@/lib/services/profile.service";
import { useState, useMemo } from "react";

interface ActivityHeatmapProps {
  heatmapData: HeatmapData;
}

export function ActivityHeatmap({ heatmapData }: ActivityHeatmapProps) {
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

  const weeks: (typeof allDates)[] = [];
  let currentWeek: typeof allDates = [];

  const formatTooltipContent = (day: (typeof allDates)[0]) => {
    if (day.count === 0) return `${day.date}: No activities`;

    const activityLabels: Record<string, string> = {
      Quiz: "Quizzes",
      Article: "Articles",
      Assignment: "Assignments",
      CodingProblem: "Coding Problems",
      DevCodingProblem: "Dev Coding Problems",
      VideoTutorial: "Video Tutorials",
    };

    const activitiesList = Object.entries(day.activities)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `${activityLabels[key]}: ${count}`)
      .join("\n");

    return `${day.date}\nTotal: ${day.count}\n\n${activitiesList}`;
  };

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

  const firstDay = new Date(allDates[0].date).getDay();
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push({ ...emptyDay, activities: { ...emptyDay.activities } });
  }

  allDates.forEach((date, index) => {
    const dayOfWeek = new Date(date.date).getDay();

    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(date);

    if (index === allDates.length - 1 && currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ ...emptyDay, activities: { ...emptyDay.activities } });
      }
      weeks.push(currentWeek);
    }
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstValidDate = week.find((day) => day.date !== "");
      if (firstValidDate) {
        const month = new Date(firstValidDate.date).getMonth();
        if (month !== lastMonth) {
          labels.push({ month: months[month], weekIndex });
          lastMonth = month;
        }
      }
    });
    return labels;
  }, [weeks]);

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

  const cellSize = 14;
  const cellGap = 4;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 3,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        backgroundColor: "#ffffff",
      }}
    >
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
              width: 48,
              height: 48,
              borderRadius: 2,
              background: "linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.06) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Box
              component="span"
              sx={{
                fontSize: 24,
                lineHeight: 1,
              }}
            >
              📊
            </Box>
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
              Your learning activity this year
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
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#e5e7eb",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#0a66c2",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#0a66c2",
                borderWidth: "2px",
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

      {/* Heatmap - Full width */}
      <Box sx={{ overflowX: "auto", pb: 1, width: "100%" }}>
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
                  {week.map((day, dayIndex) =>
                    day.level === -1 ? (
                      <Box key={dayIndex} sx={{ width: cellSize, height: cellSize }} />
                    ) : (
                      <Tooltip
                        key={dayIndex}
                        title={
                          <Box sx={{ whiteSpace: "pre-line", py: 0.5, px: 0.5 }}>
                            {formatTooltipContent(day)}
                          </Box>
                        }
                        arrow
                      >
                        <Box
                          sx={{
                            width: cellSize,
                            height: cellSize,
                            borderRadius: "3px",
                            backgroundColor: getColor(day.level),
                            cursor: "pointer",
                            transition: "all 0.2s",
                            "&:hover": {
                              transform: "scale(1.25)",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                            },
                          }}
                        />
                      </Tooltip>
                    )
                  )}
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
          justifyContent: "flex-end",
          gap: 1.5,
          mt: 2.5,
        }}
      >
        <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.8125rem", fontWeight: 500 }}>
          Less
        </Typography>
        {[0, 1, 2, 3, 4].map((level) => (
          <Box
            key={level}
            sx={{
              width: cellSize,
              height: cellSize,
              borderRadius: "3px",
              backgroundColor: getColor(level),
            }}
          />
        ))}
        <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.8125rem", fontWeight: 500 }}>
          More
        </Typography>
      </Box>
    </Paper>
  );
}
