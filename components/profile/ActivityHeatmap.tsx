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

  // Generate years from last 2 years to current year
  const years = Array.from({ length: 3 }, (_, i) => currentYear - 2 + i);

  // Calculate level based on activity count
  const calculateLevel = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 10) return 3;
    return 4;
  };

  // Generate a full year of dates
  const generateYearDates = () => {
    const dates: {
      date: string;
      count: number;
      level: number;
      activities: {
        Quiz: number;
        Article: number;
        Assignment: number;
        CodingProblem: number;
        DevCodingProblem: number;
        VideoTutorial: number;
      };
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
        count: count,
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

  // Group dates by week
  const weeks: (typeof allDates)[] = [];
  let currentWeek: typeof allDates = [];

  // Helper function to format tooltip content
  const formatTooltipContent = (day: (typeof allDates)[0]) => {
    if (day.count === 0) {
      return `${day.date}: No activities`;
    }

    const activityLabels: { [key: string]: string } = {
      Quiz: "Quizzes",
      Article: "Articles",
      Assignment: "Assignments",
      CodingProblem: "Coding Problems",
      DevCodingProblem: "Dev Coding Problems",
      VideoTutorial: "Video Tutorials",
    };

    const activitiesList = Object.entries(day.activities)
      .filter(([_, count]) => count > 0)
      .map(([key, count]) => `${activityLabels[key]}: ${count}`)
      .join("\n");

    return `${day.date}\nTotal: ${day.count}\n\n${activitiesList}`;
  };

  // Pad the start to align with Sunday
  const firstDay = new Date(allDates[0].date).getDay();
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push({
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
    });
  }

  allDates.forEach((date, index) => {
    const dayOfWeek = new Date(date.date).getDay();

    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(date);

    if (index === allDates.length - 1 && currentWeek.length > 0) {
      // Pad the end to complete the week
      while (currentWeek.length < 7) {
        currentWeek.push({
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
        });
      }
      weeks.push(currentWeek);
    }
  });

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  // Calculate month labels positions
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      const firstValidDate = week.find((day) => day.date !== "");
      if (firstValidDate) {
        const date = new Date(firstValidDate.date);
        const month = date.getMonth();
        if (month !== lastMonth) {
          labels.push({
            month: months[month],
            weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return labels;
  }, [weeks]);

  // Color scheme based on level (0-4)
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

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: { xs: 1, sm: 2 },
        mb: { xs: 2, sm: 3 },
        boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.08)",
        backgroundColor: "#ffffff",
        transition: "box-shadow 0.2s ease",
        "&:hover": {
          boxShadow: "0 0 0 1px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.12)",
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: "#000000",
            fontSize: "1.25rem",
          }}
        >
          Activity
        </Typography>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            sx={{
              borderRadius: 1.5,
              fontWeight: 600,
              fontSize: "0.875rem",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#e5e7eb",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#d1d5db",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#6366f1",
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

      {/* Heatmap */}
      <Box
        sx={{
          overflowX: "auto",
          pb: 1,
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
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
                  fontSize: "0.625rem",
                  color: "#6b7280",
                  lineHeight: "12px",
                  height: index === 0 ? "24px" : "36px",
                  display: "flex",
                  alignItems: index === 0 ? "flex-start" : "center",
                }}
              >
                {day}
              </Typography>
            ))}
          </Box>

          {/* Heatmap grid */}
          <Box>
            {/* Month labels */}
            <Box
              sx={{
                display: "flex",
                gap: "3px",
                mb: 0.5,
                minWidth: "fit-content",
              }}
            >
              {weeks.map((_, weekIndex) => {
                const monthLabel = monthLabels.find(
                  (label) => label.weekIndex === weekIndex
                );
                return (
                  <Box
                    key={weekIndex}
                    sx={{
                      width: 12,
                      height: 14,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {monthLabel && (
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: "0.625rem",
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

            {/* Weeks grid */}
            <Box
              sx={{
                display: "flex",
                gap: "3px",
                minWidth: "fit-content",
              }}
            >
              {weeks.map((week, weekIndex) => (
                <Box
                  key={weekIndex}
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  {week.map((day, dayIndex) =>
                    day.level === -1 ? (
                      <Box
                        key={dayIndex}
                        sx={{
                          width: 12,
                          height: 12,
                        }}
                      />
                    ) : (
                      <Tooltip
                        key={dayIndex}
                        title={
                          <Box sx={{ whiteSpace: "pre-line" }}>
                            {formatTooltipContent(day)}
                          </Box>
                        }
                        arrow
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "2px",
                            backgroundColor: getColor(day.level),
                            cursor: "pointer",
                            transition: "all 0.2s",
                            "&:hover": {
                              transform: "scale(1.2)",
                              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
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
          gap: 1,
          mt: 2,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: "#6b7280",
            fontSize: "0.75rem",
            mr: 0.5,
          }}
        >
          Less
        </Typography>
        {[0, 1, 2, 3, 4].map((level) => (
          <Box
            key={level}
            sx={{
              width: 12,
              height: 12,
              borderRadius: "2px",
              backgroundColor: getColor(level),
            }}
          />
        ))}
        <Typography
          variant="caption"
          sx={{
            color: "#6b7280",
            fontSize: "0.75rem",
            ml: 0.5,
          }}
        >
          More
        </Typography>
      </Box>
    </Paper>
  );
}
