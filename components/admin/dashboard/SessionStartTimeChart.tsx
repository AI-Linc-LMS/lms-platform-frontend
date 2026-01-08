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

interface SessionStartTimeChartProps {
  data: Array<{
    date: string;
    activity_created_time: string;
    has_activity: boolean;
  }>;
}

export function SessionStartTimeChart({ data }: SessionStartTimeChartProps) {
  const formattedData = (data || []).map((item) => {
    const date = new Date(item.date);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    
    // Parse time string (HH:MM:SS) to hours for display
    let timeInHours = 0;
    if (item.has_activity && item.activity_created_time && item.activity_created_time !== "00:00:00") {
      const [hours, minutes] = item.activity_created_time.split(":").map(Number);
      timeInHours = hours + minutes / 60;
    }
    
    // Format for display (e.g., "10:30 PM")
    const dateObj = new Date();
    dateObj.setHours(Math.floor(timeInHours), Math.round((timeInHours - Math.floor(timeInHours)) * 60), 0);
    const timeLabel = timeInHours > 0 
      ? dateObj.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      : "";

    return {
      date: item.date,
      label: `${month}/${day} ${dayName}`,
      time: timeInHours,
      timeLabel,
    };
  });

  // Format Y-axis to show time in 12-hour format
  const formatYAxis = (value: number) => {
    const hours = Math.floor(value);
    const minutes = Math.round((value - hours) * 60);
    const dateObj = new Date();
    dateObj.setHours(hours, minutes, 0);
    return dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

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
        Session Start Time Trend
      </Typography>
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
            tickFormatter={formatYAxis}
            label={{ value: "Time", angle: -90, position: "insideLeft" }}
            domain={[0, 24]}
          />
          <Tooltip
            formatter={(value: number | undefined) => {
              if (value === undefined || value === 0) return "0";
              const hours = Math.floor(value);
              const minutes = Math.round((value - hours) * 60);
              const dateObj = new Date();
              dateObj.setHours(hours, minutes, 0);
              return dateObj.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
            }}
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="time"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="Session Start Time"
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}

