"use client";

import { Box, Paper, Typography } from "@mui/material";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { IconWrapper } from "@/components/common/IconWrapper";

interface TimeUtilizationChartProps {
  timeTakenMinutes: number;
  totalTimeMinutes: number;
}

export function TimeUtilizationChart({
  timeTakenMinutes,
  totalTimeMinutes,
}: TimeUtilizationChartProps) {
  const percentageUsed = totalTimeMinutes > 0
    ? Math.min((timeTakenMinutes / totalTimeMinutes) * 100, 100)
    : 0;
  const remaining = Math.max(100 - percentageUsed, 0);

  const data = [
    {
      name: "Time Used",
      value: percentageUsed,
      fill: percentageUsed > 90 ? "var(--error-500)" : percentageUsed > 70 ? "var(--warning-500)" : "var(--course-cta)",
    },
    {
      name: "Time Remaining",
      value: remaining,
      fill: "var(--border-default)",
    },
  ];

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        border: "1px solid var(--border-default)",
        borderRadius: 3,
        background: "var(--font-light)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            backgroundColor: "color-mix(in srgb, var(--accent-purple) 12%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconWrapper icon="mdi:clock-time-four" size={24} color="var(--assessment-chart-violet)" />
        </Box>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "var(--font-primary-dark)",
              mb: 0.25,
            }}
          >
            Time Utilization
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "var(--font-secondary)",
              fontSize: "0.8125rem",
            }}
          >
            How you managed your time
          </Typography>
        </Box>
      </Box>

      <Box sx={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            barSize={20}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              label={{ position: "insideStart", fill: "var(--font-light)", fontSize: 12 }}
              background
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </RadialBar>
            <Legend
              iconSize={12}
              formatter={(value, entry: any) => (
                <span style={{ color: entry.color, fontWeight: 600 }}>
                  {value}: {entry.payload.value.toFixed(1)}%
                </span>
              )}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </Box>

      <Box
        sx={{
          mt: 3,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 2,
        }}
      >
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "color-mix(in srgb, var(--course-cta) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--course-cta) 24%, transparent)",
          }}
        >
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 0.5 }}>
            Time Used
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--course-cta)" }}>
            {formatTime(timeTakenMinutes)}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "color-mix(in srgb, var(--font-tertiary) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--font-tertiary) 22%, transparent)",
          }}
        >
          <Typography variant="caption" sx={{ color: "var(--font-secondary)", display: "block", mb: 0.5 }}>
            Time Remaining
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "var(--font-secondary)" }}>
            {formatTime(Math.max(totalTimeMinutes - timeTakenMinutes, 0))}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
