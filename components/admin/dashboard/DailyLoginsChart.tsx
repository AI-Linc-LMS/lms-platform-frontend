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

interface DailyLoginsChartProps {
  data: Array<{
    date: string;
    login_count: number;
  }>;
}

export function DailyLoginsChart({ data }: DailyLoginsChartProps) {
  const formattedData = (data || []).map((item) => {
    const date = new Date(item.date);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    return {
      ...item,
      label: `${month}/${day} ${dayName}`,
      login_count: item.login_count || 0,
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
        Student Daily Logins
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
          <Typography variant="body2">No login data available</Typography>
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
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tick={{ fill: "#6b7280" }}
              label={{ value: "No. of logins", angle: -90, position: "insideLeft" }}
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
              dataKey="login_count"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="No. of logins"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Paper>
  );
}

