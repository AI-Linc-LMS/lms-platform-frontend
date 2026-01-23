"use client";

import { Box, Typography, Paper } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MiniBarChartProps {
  title: string;
  data: Array<{ name: string; value: number }>;
  color?: string;
  height?: number;
}

export function MiniBarChart({
  title,
  data,
  color = "#0a66c2",
  height = 180,
}: MiniBarChartProps) {
  const getColor = (value: number) => {
    if (value >= 80) return "#10b981";
    if (value >= 60) return "#0a66c2";
    if (value >= 40) return "#f59e0b";
    return "#ef4444";
  };

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
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {showTitle && (
        <Typography
          variant="body2"
          sx={{
            color: "#666666",
            fontSize: "0.875rem",
            mb: 1.5,
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>
      )}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, bottom: 10, left: -20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#666666", fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#666666", fontSize: 11 }}
              domain={[0, 100]}
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
              formatter={(value: number) => [`${value}%`, "Proficiency"]}
              labelStyle={{ fontSize: "0.75rem", fontWeight: 600, marginBottom: "4px" }}
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
            />
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
              isAnimationActive={true}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
}
