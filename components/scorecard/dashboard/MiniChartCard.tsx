"use client";

import { Box, Typography, Paper } from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface MiniChartCardProps {
  title: string;
  data: Array<{ week: string; value: number }>;
  color?: string;
  height?: number;
}

export function MiniChartCard({
  title,
  data,
  color = "#0a66c2",
  height = 120,
}: MiniChartCardProps) {
  const showTitle = title && title.trim() !== "";
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: showTitle ? 2 : 0,
        borderRadius: 2,
        border: showTitle ? "1px solid rgba(0,0,0,0.08)" : "none",
        backgroundColor: showTitle ? "#ffffff" : "transparent",
        boxShadow: showTitle ? "0 0 0 1px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" : "none",
      }}
    >
      {showTitle && (
        <Typography
          variant="body2"
          sx={{
            color: "#666666",
            fontSize: "0.875rem",
            mb: 1.5,
            fontWeight: 500,
          }}
        >
          {title}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 11, fill: "#666666" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis 
            hide={!showTitle}
            tick={{ fontSize: 11, fill: "#666666" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(0,0,0,0.08)",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "0.75rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 4, strokeWidth: 2, stroke: "#ffffff" }}
            activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: "#ffffff" }}
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
