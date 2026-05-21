"use client";

import { useTranslation } from "react-i18next";
import { Box, Typography, Paper } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AttendanceTrendChartProps {
  data: Array<{
    date: string;
    total_attendance_count: number;
  }>;
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  const { t } = useTranslation("common");
  const formattedData = (data || []).map((item) => {
    const date = new Date(item.date);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const day = date.getDate();
    return {
      ...item,
      label: `${month} ${day}`,
      total_attendance_count: item.total_attendance_count || 0,
    };
  });

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
        border: "1px solid var(--border-default)",
        backgroundColor: "var(--card-bg)",
        boxShadow:
          "0 1px 3px color-mix(in srgb, var(--font-primary) 10%, transparent)",
        height: "100%",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: "var(--font-primary)",
          mb: 3,
          fontSize: { xs: "1rem", sm: "1.25rem" },
        }}
      >
        {t("admin.dashboard.attendanceTrend")}
      </Typography>
      {formattedData.length === 0 ? (
        <Box
          sx={{
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--font-secondary)",
          }}
        >
          <Typography variant="body2">{t("admin.dashboard.noAttendanceData")}</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
            <XAxis
              dataKey="label"
              stroke="var(--font-secondary)"
              fontSize={12}
              tick={{ fill: "var(--font-secondary)" }}
            />
            <YAxis
              stroke="var(--font-secondary)"
              fontSize={12}
              tick={{ fill: "var(--font-secondary)" }}
              label={{ value: "Total Attendance", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card-bg)",
                border: "1px solid var(--border-default)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total_attendance_count"
              stroke="var(--accent-indigo)"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Total Attendance"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

