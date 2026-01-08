"use client";

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
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        height: "100%",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: "#111827",
          mb: 3,
          fontSize: { xs: "1rem", sm: "1.25rem" },
        }}
      >
        Attendance Trend
      </Typography>
      {formattedData.length === 0 ? (
        <Box
          sx={{
            height: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6b7280",
          }}
        >
          <Typography variant="body2">No attendance data available</Typography>
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#6b7280" }}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#6b7280" }}
              label={{ value: "Total Attendance", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total_attendance_count"
              stroke="#6366f1"
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

