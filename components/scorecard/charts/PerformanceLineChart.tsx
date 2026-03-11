"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Box, Typography, Paper } from "@mui/material";

interface DataPoint {
  week: number;
  weekLabel: string;
  mcqAccuracy?: number;
  subjectiveScore?: number;
  assessmentScore?: number;
  interviewScore?: number;
  [key: string]: any;
}

interface PerformanceLineChartProps {
  data: DataPoint[];
  dataKeys: Array<{
    key: string;
    label: string;
    color: string;
  }>;
  title?: string;
  height?: number;
}

export function PerformanceLineChart({
  data,
  dataKeys,
  title,
  height = 300,
}: PerformanceLineChartProps) {
  return (
    <Box>
      {title && (
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: 600,
            color: "#000000",
            fontSize: "1.125rem",
          }}
        >
          {title}
        </Typography>
      )}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: "1px solid rgba(0,0,0,0.08)",
          backgroundColor: "#ffffff",
        }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="weekLabel"
              stroke="#666666"
              fontSize={12}
              tick={{ fill: "#666666" }}
            />
            <YAxis
              stroke="#666666"
              fontSize={12}
              tick={{ fill: "#666666" }}
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "8px",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "#000000", fontWeight: 600 }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "16px" }}
              iconType="line"
              formatter={(value) => (
                <span style={{ color: "#666666", fontSize: "0.875rem" }}>{value}</span>
              )}
            />
            {dataKeys.map(({ key, label, color }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={label}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
